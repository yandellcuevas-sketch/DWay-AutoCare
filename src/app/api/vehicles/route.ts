import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientIdParam = searchParams.get("clientId");

  const where = isStaffRole(session.user.role)
    ? clientIdParam
      ? { clientId: clientIdParam }
      : {}
    : { clientId: session.user.id };

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { appointments: true, maintenanceRecords: true } },
      subscriptions: {
        where: { status: "ACTIVE", endDate: { gte: new Date() } },
        include: { plan: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Datos del vehículo inválidos.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const targetClientId =
      isAdminOrReceptionist(session.user.role) && body.clientId
        ? String(body.clientId)
        : session.user.id;

    const existingPlate = await prisma.vehicle.findUnique({
      where: { plate: parsed.data.plate },
      select: { id: true },
    });

    if (existingPlate) {
      return NextResponse.json(
        { error: `Ya existe un vehículo registrado con la placa ${parsed.data.plate}.` },
        { status: 409 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        clientId: targetClientId,
        companyId:
          isAdminOrReceptionist(session.user.role) && body.companyId
            ? String(body.companyId)
            : null,
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
        action: "VEHICLE_CREATED",
        entityType: "Vehicle",
        entityId: vehicle.id,
        details: `Vehículo registrado: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`,
      },
    });

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/vehicles:", error);
    return NextResponse.json(
      { error: "No se pudo registrar el vehículo." },
      { status: 500 }
    );
  }
}
