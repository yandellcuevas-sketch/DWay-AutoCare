import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id },
    include: {
      maintenanceRecords: {
        orderBy: { serviceDate: "desc" },
        include: { technician: { include: { user: { select: { name: true } } } } },
      },
      appointments: {
        orderBy: { appointmentDate: "desc" },
        include: { appointmentServices: { include: { service: true } } },
      },
    },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vehículo no encontrado." }, { status: 404 });
  }

  if (vehicle.clientId !== session.user.id && !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  return NextResponse.json({ vehicle });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const existing = await prisma.vehicle.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Vehículo no encontrado." }, { status: 404 });
  }
  if (existing.clientId !== session.user.id && !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = vehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  if (parsed.data.plate !== existing.plate) {
    const dup = await prisma.vehicle.findUnique({
      where: { plate: parsed.data.plate },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { error: `La placa ${parsed.data.plate} ya está registrada en otro vehículo.` },
        { status: 409 }
      );
    }
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: params.id },
    data: {
      brand: parsed.data.brand,
      model: parsed.data.model,
      year: parsed.data.year,
      plate: parsed.data.plate,
      color: parsed.data.color,
      fuelType: parsed.data.fuelType,
      mileage: parsed.data.mileage,
      lastMaintenanceDate: parsed.data.lastMaintenanceDate
        ? new Date(parsed.data.lastMaintenanceDate)
        : null,
      notes: parsed.data.notes ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "VEHICLE_UPDATED",
      entityType: "Vehicle",
      entityId: vehicle.id,
      details: `Vehículo actualizado: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`,
    },
  });

  return NextResponse.json({ vehicle });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const existing = await prisma.vehicle.findUnique({
    where: { id: params.id },
    include: { _count: { select: { appointments: true, maintenanceRecords: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Vehículo no encontrado." }, { status: 404 });
  }
  if (existing.clientId !== session.user.id && !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  if (existing._count.appointments > 0 || existing._count.maintenanceRecords > 0) {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar un vehículo que tiene citas o historial de mantenimiento asociado.",
      },
      { status: 409 }
    );
  }

  await prisma.vehicle.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Vehículo eliminado correctamente." });
}
