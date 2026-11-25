import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const client = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      internalNotes: true,
      createdAt: true,
      vehicles: true,
      addresses: true,
      clientAppointments: {
        include: {
          vehicle: true,
          appointmentServices: { include: { service: true } },
          technician: { include: { user: { select: { name: true } } } },
        },
        orderBy: { appointmentDate: "desc" },
      },
      maintenanceRecordsClient: {
        include: {
          vehicle: true,
          technician: { include: { user: { select: { name: true } } } },
        },
        orderBy: { serviceDate: "desc" },
      },
      subscriptions: {
        include: { plan: true, vehicle: true },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    client: {
      ...client,
      clientAppointments: client.clientAppointments.map((a) => ({
        ...a,
        totalAmount: Number(a.totalAmount),
      })),
      maintenanceRecordsClient: client.maintenanceRecordsClient.map((m) => ({
        ...m,
        totalCost: Number(m.totalCost),
      })),
      payments: client.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        taxAmount: Number(p.taxAmount),
      })),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const body = await request.json();
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      internalNotes:
        body.internalNotes !== undefined ? String(body.internalNotes) : undefined,
      isActive:
        body.isActive !== undefined && session.user.role === "ADMIN"
          ? Boolean(body.isActive)
          : undefined,
    },
    select: { id: true, internalNotes: true, isActive: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CLIENT_DOSSIER_UPDATED",
      entityType: "User",
      entityId: params.id,
      details: "Observaciones internas o estado de cliente actualizado.",
    },
  });

  return NextResponse.json({ client: updated });
}
