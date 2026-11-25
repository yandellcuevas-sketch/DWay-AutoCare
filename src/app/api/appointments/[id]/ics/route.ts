import { NextResponse } from "next/server";
import { getAuthSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAppointmentIcs } from "@/lib/ics";

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
      client: { select: { name: true } },
      vehicle: true,
      address: true,
      appointmentServices: { include: { service: true } },
    },
  });

  if (!appt) {
    return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
  }

  if (appt.clientId !== session.user.id && !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const locationText =
    appt.mode === "HOME_SERVICE" && appt.address
      ? `${appt.address.street} #${appt.address.number}, ${appt.address.sector}, ${appt.address.province}`
      : "Centro de Servicio DWay AutoCare — Distrito Nacional (Naco / Piantini), Santo Domingo";

  const icsContent = buildAppointmentIcs({
    bookingCode: appt.bookingCode,
    startDate: appt.appointmentDate,
    endDate: appt.endDate,
    servicesSummary: appt.appointmentServices.map((s) => s.service.name).join(", "),
    vehicleLabel: `${appt.vehicle.brand} ${appt.vehicle.model} (${appt.vehicle.plate})`,
    mode: appt.mode === "HOME_SERVICE" ? "HOME_SERVICE" : "WORKSHOP",
    locationText,
    clientName: appt.client.name,
  });

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="DWay-AutoCare-${appt.bookingCode}.ics"`,
    },
  });
}
