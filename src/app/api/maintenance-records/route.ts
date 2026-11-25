import { NextResponse } from "next/server";
import { getAuthSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maintenanceRecordSchema } from "@/lib/validations";
import { createSystemNotification } from "@/lib/notifications";
import { formatDateRD } from "@/lib/constants";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");

  const where = isStaffRole(session.user.role)
    ? vehicleId
      ? { vehicleId }
      : {}
    : {
        clientId: session.user.id,
        ...(vehicleId ? { vehicleId } : {}),
      };

  const records = await prisma.maintenanceRecord.findMany({
    where,
    include: {
      vehicle: true,
      client: { select: { id: true, name: true, email: true, phone: true } },
      technician: { include: { user: { select: { name: true } } } },
      appointment: { select: { bookingCode: true, mode: true } },
    },
    orderBy: { serviceDate: "desc" },
  });

  return NextResponse.json({
    records: records.map((r) => ({
      ...r,
      totalCost: Number(r.totalCost),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    return NextResponse.json(
      { error: "Solo técnicos o personal autorizado pueden registrar mantenimientos." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = maintenanceRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos de mantenimiento inválidos." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const appt = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: { vehicle: true, maintenanceRecord: true },
    });

    if (!appt) {
      return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
    }
    if (appt.maintenanceRecord) {
      return NextResponse.json(
        { error: "Esta cita ya tiene un registro de mantenimiento completado." },
        { status: 409 }
      );
    }

    let technicianId = appt.technicianId;
    if (!technicianId && session.user.technicianId) {
      technicianId = session.user.technicianId;
    }
    if (!technicianId) {
      const firstTech = await prisma.technician.findFirst({ where: { isActive: true } });
      technicianId = firstTech?.id ?? null;
    }
    if (!technicianId) {
      return NextResponse.json(
        { error: "Debe haber un técnico asignado para completar el mantenimiento." },
        { status: 400 }
      );
    }

    const now = new Date();
    const warrantyExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const receiptNumber = `COMP-${appt.bookingCode}`;

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceRecord.create({
        data: {
          appointmentId: appt.id,
          vehicleId: appt.vehicleId,
          clientId: appt.clientId,
          technicianId,
          receiptNumber,
          serviceDate: now,
          mileageAtService: data.mileageAtService,
          servicesPerformed: JSON.stringify(data.servicesPerformed),
          productsUsed: JSON.stringify(data.productsUsed ?? []),
          checklistJson: JSON.stringify(
            data.checklist ?? {
              fugasRevisadas: true,
              nivelesVerificados: true,
              taponesAjustados: true,
              areaLimpia: true,
              piezasMostradas: true,
            }
          ),
          totalCost: data.totalCost,
          observations: data.observations ?? null,
          recommendations: data.recommendations ?? null,
          nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : null,
          nextServiceMileage: data.nextServiceMileage ?? null,
          warrantyExpiresAt,
        },
        include: {
          vehicle: true,
          technician: { include: { user: { select: { name: true } } } },
        },
      });

      await tx.appointment.update({
        where: { id: appt.id },
        data: {
          status: "COMPLETED",
          technicianId,
          statusHistory: {
            create: {
              status: "COMPLETED",
              changedById: session.user.id,
              notes: `Mantenimiento completado. Comprobante ${receiptNumber}.`,
            },
          },
        },
      });

      await tx.vehicle.update({
        where: { id: appt.vehicleId },
        data: {
          mileage: Math.max(appt.vehicle.mileage, data.mileageAtService),
          lastMaintenanceDate: now,
        },
      });

      // Registrar pago si aún no existe para esta cita
      const existingPay = await tx.payment.findFirst({ where: { appointmentId: appt.id } });
      if (!existingPay && data.totalCost > 0) {
        await tx.payment.create({
          data: {
            appointmentId: appt.id,
            clientId: appt.clientId,
            amount: data.totalCost,
            taxAmount: Number(appt.taxAmount),
            status: "PAID",
            method: "DEMO",
            reference: `PAY-${appt.bookingCode}`,
            isDemoPayment: true,
            notes: "Pago registrado al completar orden de servicio.",
          },
        });
      }

      return created;
    });

    await createSystemNotification({
      userId: appt.clientId,
      type: "SERVICE_COMPLETED",
      title: `Servicio completado (${appt.bookingCode})`,
      body: `Tu ${appt.vehicle.brand} ${appt.vehicle.model} está listo. Ya puedes descargar tu comprobante ${receiptNumber} con garantía de 30 días en mano de obra.`,
      dedupeKey: `maint-done-${appt.id}`,
      dispatchExternal: true,
    });

    if (record.nextServiceDate || record.nextServiceMileage) {
      await createSystemNotification({
        userId: appt.clientId,
        type: "MAINTENANCE_DUE",
        title: `Próximo mantenimiento programado — ${appt.vehicle.plate}`,
        body: `Recomendación técnica: ${
          record.nextServiceDate ? `Fecha sugerida ${formatDateRD(record.nextServiceDate)}` : ""
        }${record.nextServiceMileage ? ` o a los ${record.nextServiceMileage.toLocaleString()} km` : ""}.`,
        dedupeKey: `maint-next-${record.id}`,
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "MAINTENANCE_COMPLETED",
        entityType: "MaintenanceRecord",
        entityId: record.id,
        details: `Mantenimiento registrado para cita ${appt.bookingCode} (${receiptNumber})`,
      },
    });

    return NextResponse.json(
      { record: { ...record, totalCost: Number(record.totalCost) } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/maintenance-records:", error);
    return NextResponse.json(
      { error: "No se pudo registrar el mantenimiento." },
      { status: 500 }
    );
  }
}
