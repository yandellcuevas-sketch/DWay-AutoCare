import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  APPOINTMENT_STATUS_LABELS,
  formatDateTimeRD,
  parseRDDateTime,
  STATUSES_BY_MODE,
} from "@/lib/constants";
import { acquireBookingLock, findAssignableResources } from "@/lib/availability";
import { createSystemNotification } from "@/lib/notifications";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const appt = await prisma.appointment.findUnique({
    where: { id: params.id },
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
  });

  if (!appt) {
    return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
  }

  if (appt.clientId !== session.user.id && !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  return NextResponse.json({
    appointment: {
      ...appt,
      subtotalAmount: Number(appt.subtotalAmount),
      discountAmount: Number(appt.discountAmount),
      travelFee: Number(appt.travelFee),
      taxAmount: Number(appt.taxAmount),
      totalAmount: Number(appt.totalAmount),
      appointmentServices: appt.appointmentServices.map((as) => ({
        ...as,
        price: Number(as.price),
        service: {
          ...as.service,
          price: Number(as.service.price),
          homePrice: as.service.homePrice !== null ? Number(as.service.homePrice) : null,
        },
      })),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const existing = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      vehicle: true,
      appointmentServices: { include: { service: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
  }

  const isStaff = isStaffRole(session.user.role);
  const isOwner = existing.clientId === session.user.id;
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const action = String(body.action || "UPDATE_STATUS");

    if (action === "CANCEL") {
      if (["COMPLETED", "CANCELLED"].includes(existing.status)) {
        return NextResponse.json(
          { error: "No se puede cancelar una cita completada o ya cancelada." },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointment.update({
          where: { id: existing.id },
          data: {
            status: "CANCELLED",
            statusHistory: {
              create: {
                status: "CANCELLED",
                changedById: session.user.id,
                notes:
                  body.notes ||
                  (isStaff ? "Cancelada por personal DWay." : "Cancelada por el cliente."),
              },
            },
          },
        });

        // Restaurar beneficio de membresía si fue descontado
        if (existing.subscriptionId && existing.membershipBenefitUsed) {
          const fieldMap: Record<string, string> = {
            REVIEW: "reviewsUsed",
            BATTERY_TEST: "batteryTestsUsed",
            DIAGNOSTIC: "diagnosticsUsed",
            OIL_CHANGE: "oilChangesUsed",
          };
          const fieldName = fieldMap[existing.membershipBenefitUsed];
          if (fieldName) {
            const sub = await tx.subscription.findUnique({
              where: { id: existing.subscriptionId },
            });
            if (sub && Number((sub as Record<string, unknown>)[fieldName]) > 0) {
              await tx.subscription.update({
                where: { id: sub.id },
                data: { [fieldName]: { decrement: 1 } },
              });
            }
          }
        }

        return appt;
      });

      await Promise.all([
        createSystemNotification({
          userId: existing.clientId,
          type: "APPOINTMENT_CANCELLED",
          title: `Cita ${existing.bookingCode} cancelada`,
          body: `La cita para tu ${existing.vehicle.brand} ${existing.vehicle.model} ha sido cancelada.`,
          dedupeKey: `appt-cancel-${existing.id}-${Date.now()}`,
          dispatchExternal: true,
        }),
        prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "APPOINTMENT_CANCELLED",
            entityType: "Appointment",
            entityId: existing.id,
            details: `Cita ${existing.bookingCode} cancelada.`,
          },
        }),
      ]);

      return NextResponse.json({ appointment: updated });
    }

    if (action === "RESCHEDULE") {
      if (["COMPLETED", "CANCELLED"].includes(existing.status)) {
        return NextResponse.json(
          { error: "No se puede reprogramar una cita completada o cancelada." },
          { status: 400 }
        );
      }
      if (!body.date || !body.time) {
        return NextResponse.json(
          { error: "Indica nueva fecha y hora para reprogramar." },
          { status: 400 }
        );
      }

      const newStart = parseRDDateTime(String(body.date), String(body.time));
      const newEnd = new Date(newStart.getTime() + existing.estimatedDuration * 60_000);
      const requiresLift = existing.appointmentServices.some((s) => s.service.requiresLift);

      const updated = await prisma.$transaction(async (tx) => {
        await acquireBookingLock(tx);

        const check = await findAssignableResources({
          startDate: newStart,
          durationMinutes: existing.estimatedDuration,
          mode: existing.mode as "WORKSHOP" | "HOME_SERVICE",
          requiresLift,
          excludeAppointmentId: existing.id,
          preferredTechnicianId: existing.technicianId,
          db: tx,
        });

        if (!check.available) {
          throw new Error(`CONFLICT:${check.reason ?? "Horario no disponible."}`);
        }

        return tx.appointment.update({
          where: { id: existing.id },
          data: {
            appointmentDate: newStart,
            endDate: newEnd,
            status: "RESCHEDULED",
            technicianId: check.technicianId,
            resourceId: check.resourceId,
            mobileUnitId: check.mobileUnitId,
            statusHistory: {
              create: {
                status: "RESCHEDULED",
                changedById: session.user.id,
                notes:
                  body.notes ||
                  `Reprogramada para ${formatDateTimeRD(newStart)}.`,
              },
            },
          },
        });
      });

      await Promise.all([
        createSystemNotification({
          userId: existing.clientId,
          type: "APPOINTMENT_RESCHEDULED",
          title: `Cita ${existing.bookingCode} reprogramada`,
          body: `Tu cita fue reprogramada para el ${formatDateTimeRD(newStart)}.`,
          dedupeKey: `appt-resched-${existing.id}-${newStart.getTime()}`,
          dispatchExternal: true,
        }),
        prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "APPOINTMENT_RESCHEDULED",
            entityType: "Appointment",
            entityId: existing.id,
            details: `Cita ${existing.bookingCode} movida a ${formatDateTimeRD(newStart)}.`,
          },
        }),
      ]);

      return NextResponse.json({ appointment: updated });
    }

    // UPDATE_STATUS / ASSIGN_TECHNICIAN -> Solo staff
    if (!isStaff) {
      return NextResponse.json(
        { error: "Solo el personal autorizado puede actualizar el estado operativo." },
        { status: 403 }
      );
    }

    const nextStatus = body.status ? String(body.status) : existing.status;
    const modeKey = existing.mode === "HOME_SERVICE" ? "HOME_SERVICE" : "WORKSHOP";
    const allowedStatuses = STATUSES_BY_MODE[modeKey];

    if (!allowedStatuses.includes(nextStatus)) {
      return NextResponse.json(
        {
          error: `El estado "${APPOINTMENT_STATUS_LABELS[nextStatus] ?? nextStatus}" no corresponde a la modalidad ${modeKey === "HOME_SERVICE" ? "a domicilio" : "en taller"}.`,
        },
        { status: 400 }
      );
    }

    const nextTechnicianId =
      body.technicianId !== undefined && isAdminOrReceptionist(session.user.role)
        ? body.technicianId || null
        : existing.technicianId;

    const updated = await prisma.appointment.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        technicianId: nextTechnicianId,
        statusHistory: {
          create: {
            status: nextStatus,
            changedById: session.user.id,
            notes:
              body.notes ||
              `Estado actualizado a ${APPOINTMENT_STATUS_LABELS[nextStatus] ?? nextStatus}.`,
          },
        },
      },
    });

    if (nextStatus !== existing.status) {
      await createSystemNotification({
        userId: existing.clientId,
        type: "STATUS_CHANGE",
        title: `Actualización en cita ${existing.bookingCode}`,
        body: `El estado de tu cita ahora es: ${APPOINTMENT_STATUS_LABELS[nextStatus] ?? nextStatus}.`,
        dedupeKey: `appt-status-${existing.id}-${nextStatus}-${Date.now()}`,
        dispatchExternal: true,
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "APPOINTMENT_STATUS_UPDATED",
        entityType: "Appointment",
        entityId: existing.id,
        details: `Cita ${existing.bookingCode}: ${existing.status} -> ${nextStatus}`,
      },
    });

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al actualizar la cita.";
    if (msg.startsWith("CONFLICT:")) {
      return NextResponse.json({ error: msg.replace("CONFLICT:", "") }, { status: 409 });
    }
    console.error("Error en PATCH /api/appointments/[id]:", error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
