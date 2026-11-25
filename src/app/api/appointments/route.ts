import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { containsFilter } from "@/lib/db-helpers";
import { createAppointmentSchema } from "@/lib/validations";
import {
  acquireBookingLock,
  calculateAppointmentQuote,
  findAssignableResources,
  OCCUPYING_STATUSES,
} from "@/lib/availability";
import { parseRDDateTime, formatDateTimeRD } from "@/lib/constants";
import { createSystemNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const mode = searchParams.get("mode");
  const technicianId = searchParams.get("technicianId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search")?.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (!isStaffRole(session.user.role)) {
    where.clientId = session.user.id;
  } else if (session.user.role === "TECHNICIAN" && session.user.technicianId) {
    if (searchParams.get("scope") !== "all") {
      where.technicianId = session.user.technicianId;
    }
  }

  if (status && status !== "ALL") where.status = status;
  if (mode && mode !== "ALL") where.mode = mode;
  if (technicianId && technicianId !== "ALL" && isAdminOrReceptionist(session.user.role)) {
    where.technicianId = technicianId;
  }
  if (from || to) {
    where.appointmentDate = {};
    if (from) where.appointmentDate.gte = new Date(from);
    if (to) where.appointmentDate.lte = new Date(to);
  }
  if (search && isStaffRole(session.user.role)) {
    where.OR = [
      { bookingCode: containsFilter(search) },
      { client: { name: containsFilter(search) } },
      { vehicle: { plate: containsFilter(search) } },
    ];
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true } },
      vehicle: true,
      address: true,
      technician: { include: { user: { select: { id: true, name: true, phone: true } } } },
      resource: true,
      mobileUnit: true,
      appointmentServices: { include: { service: true } },
      statusHistory: {
        orderBy: { changedAt: "desc" },
        include: { changedBy: { select: { name: true, role: true } } },
      },
      maintenanceRecord: true,
    },
    orderBy: { appointmentDate: "desc" },
  });

  return NextResponse.json({
    appointments: appointments.map((a) => ({
      ...a,
      subtotalAmount: Number(a.subtotalAmount),
      discountAmount: Number(a.discountAmount),
      travelFee: Number(a.travelFee),
      taxAmount: Number(a.taxAmount),
      totalAmount: Number(a.totalAmount),
      appointmentServices: a.appointmentServices.map((as) => ({
        ...as,
        price: Number(as.price),
        service: {
          ...as.service,
          price: Number(as.service.price),
          homePrice: as.service.homePrice !== null ? Number(as.service.homePrice) : null,
        },
      })),
      maintenanceRecord: a.maintenanceRecord
        ? { ...a.maintenanceRecord, totalCost: Number(a.maintenanceRecord.totalCost) }
        : null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Datos de reserva inválidos.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const isStaff = isAdminOrReceptionist(session.user.role);
    const targetClientId =
      isStaff && data.clientIdOverride ? data.clientIdOverride : session.user.id;

    // Verificar propiedad del vehículo
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehículo no encontrado." }, { status: 404 });
    }
    if (vehicle.clientId !== targetClientId && !isStaff) {
      return NextResponse.json(
        { error: "El vehículo seleccionado no pertenece a tu cuenta." },
        { status: 403 }
      );
    }

    let zoneSurcharge = 0;
    if (data.mode === "HOME_SERVICE") {
      if (!data.addressId) {
        return NextResponse.json(
          { error: "Selecciona o registra una dirección para el servicio a domicilio." },
          { status: 400 }
        );
      }
      const address = await prisma.address.findUnique({ where: { id: data.addressId } });
      if (!address || (address.userId !== targetClientId && !isStaff)) {
        return NextResponse.json(
          { error: "La dirección seleccionada no es válida." },
          { status: 400 }
        );
      }
      const zone = await prisma.coverageZone.findFirst({
        where: {
          isActive: true,
          province: address.province,
          sector: address.sector,
        },
      });
      if (!zone) {
        return NextResponse.json(
          {
            error: `El sector "${address.sector}" (${address.province}) aún no se encuentra dentro de nuestra zona de cobertura móvil.`,
          },
          { status: 400 }
        );
      }
      zoneSurcharge = Number(zone.surchargeFee);
    }

    const startDate = parseRDDateTime(data.date, data.time);

    // Transacción atómica con mutex de escritura (advisory lock PostgreSQL / mutex SQLite)
    const createdAppointment = await prisma.$transaction(async (tx) => {
      await acquireBookingLock(tx);

      const quote = await calculateAppointmentQuote({
        clientId: targetClientId,
        vehicleId: vehicle.id,
        serviceIds: data.serviceIds,
        mode: data.mode,
        zoneSurcharge,
        useMembershipBenefit: Boolean(data.useMembershipBenefit),
        promotionCode: data.promotionCode ?? null,
        db: tx,
      });

      const endDate = new Date(startDate.getTime() + quote.estimatedDuration * 60_000);

      // Evitar doble cita para el mismo vehículo en horarios superpuestos
      const vehicleOverlap = await tx.appointment.findFirst({
        where: {
          vehicleId: vehicle.id,
          status: { in: OCCUPYING_STATUSES },
          appointmentDate: { lt: endDate },
          endDate: { gt: startDate },
        },
      });
      if (vehicleOverlap) {
        throw new Error(
          `CONFLICT:Este vehículo ya tiene una cita programada en ese horario (${vehicleOverlap.bookingCode}).`
        );
      }

      const services = await tx.service.findMany({
        where: { id: { in: data.serviceIds } },
      });
      const requiresLift = services.some((s) => s.requiresLift);

      const resourceCheck = await findAssignableResources({
        startDate,
        durationMinutes: quote.estimatedDuration,
        mode: data.mode,
        requiresLift,
        preferredTechnicianId:
          isStaff && body.technicianId ? String(body.technicianId) : null,
        db: tx,
      });

      if (!resourceCheck.available) {
        throw new Error(
          `CONFLICT:${resourceCheck.reason ?? "El horario seleccionado ya no está disponible."}`
        );
      }

      // Generar código único DWA-YYYY-XXXXXX
      const currentYear = startDate.getUTCFullYear();
      const prefix = `DWA-${currentYear}-`;
      const lastAppt = await tx.appointment.findFirst({
        where: { bookingCode: { startsWith: prefix } },
        orderBy: { bookingCode: "desc" },
        select: { bookingCode: true },
      });
      const lastNum = lastAppt
        ? parseInt(lastAppt.bookingCode.replace(prefix, ""), 10) || 0
        : 0;
      const bookingCode = `${prefix}${String(lastNum + 1).padStart(6, "0")}`;

      const initialStatus = isStaff ? "CONFIRMED" : "PENDING_CONFIRMATION";

      const appt = await tx.appointment.create({
        data: {
          bookingCode,
          clientId: targetClientId,
          vehicleId: vehicle.id,
          addressId: data.mode === "HOME_SERVICE" ? data.addressId ?? null : null,
          companyId: vehicle.companyId ?? null,
          mode: data.mode,
          appointmentDate: startDate,
          endDate,
          estimatedDuration: quote.estimatedDuration,
          status: initialStatus,
          notes: data.notes ?? null,
          technicianId: resourceCheck.technicianId,
          resourceId: resourceCheck.resourceId,
          mobileUnitId: resourceCheck.mobileUnitId,
          subscriptionId: quote.subscriptionId,
          membershipBenefitUsed: quote.appliedBenefitType,
          promotionCode: data.promotionCode ? data.promotionCode.toUpperCase() : null,
          subtotalAmount: quote.subtotalAmount,
          discountAmount: quote.discountAmount,
          travelFee: quote.travelFee,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
          appointmentServices: {
            create: quote.lineItems.map((item) => ({
              serviceId: item.serviceId,
              price: item.basePrice,
              duration: item.duration,
              usedMembershipBenefit: item.usedMembershipBenefit,
            })),
          },
          statusHistory: {
            create: {
              status: initialStatus,
              changedById: session.user.id,
              notes: isStaff
                ? "Cita creada y confirmada desde el panel administrativo."
                : "Reserva solicitada por el cliente desde la plataforma web.",
            },
          },
        },
        include: {
          client: { select: { id: true, name: true, email: true, phone: true } },
          vehicle: true,
          address: true,
          technician: { include: { user: { select: { name: true } } } },
          resource: true,
          mobileUnit: true,
          appointmentServices: { include: { service: true } },
        },
      });

      // Actualizar contador de beneficios de membresía si aplicó
      if (quote.subscriptionId && quote.appliedBenefitType) {
        const fieldMap: Record<string, string> = {
          REVIEW: "reviewsUsed",
          BATTERY_TEST: "batteryTestsUsed",
          DIAGNOSTIC: "diagnosticsUsed",
          OIL_CHANGE: "oilChangesUsed",
        };
        const fieldName = fieldMap[quote.appliedBenefitType];
        if (fieldName) {
          await tx.subscription.update({
            where: { id: quote.subscriptionId },
            data: { [fieldName]: { increment: 1 } },
          });
        }
      }

      if (data.promotionCode) {
        await tx.promotion.updateMany({
          where: { code: data.promotionCode.trim().toUpperCase(), isActive: true },
          data: { currentUses: { increment: 1 } },
        });
      }

      return appt;
    });

    await Promise.all([
      createSystemNotification({
        userId: targetClientId,
        type: "APPOINTMENT_CONFIRMED",
        title: `Reserva registrada: ${createdAppointment.bookingCode}`,
        body: `Tu cita para ${createdAppointment.vehicle.brand} ${createdAppointment.vehicle.model} (${createdAppointment.vehicle.plate}) quedó agendada para el ${formatDateTimeRD(createdAppointment.appointmentDate)}.`,
        dedupeKey: `appt-created-${createdAppointment.id}`,
        dispatchExternal: true,
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "APPOINTMENT_CREATED",
          entityType: "Appointment",
          entityId: createdAppointment.id,
          details: `Cita ${createdAppointment.bookingCode} (${createdAppointment.mode}) por RD$${Number(createdAppointment.totalAmount).toFixed(2)}`,
        },
      }),
    ]);

    return NextResponse.json(
      {
        appointment: {
          ...createdAppointment,
          subtotalAmount: Number(createdAppointment.subtotalAmount),
          discountAmount: Number(createdAppointment.discountAmount),
          travelFee: Number(createdAppointment.travelFee),
          taxAmount: Number(createdAppointment.taxAmount),
          totalAmount: Number(createdAppointment.totalAmount),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al crear la cita.";
    if (msg.startsWith("CONFLICT:")) {
      return NextResponse.json({ error: msg.replace("CONFLICT:", "") }, { status: 409 });
    }
    console.error("Error en POST /api/appointments:", error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
