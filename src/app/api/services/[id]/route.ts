import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const body = await request.json();

  const updated = await prisma.service.update({
    where: { id: params.id },
    data: {
      name: body.name !== undefined ? String(body.name).trim() : undefined,
      category: body.category !== undefined ? String(body.category).trim() : undefined,
      description: body.description !== undefined ? String(body.description).trim() : undefined,
      price: body.price !== undefined ? Number(body.price) : undefined,
      homePrice:
        body.isAvailableHome === false
          ? null
          : body.homePrice !== undefined
          ? body.homePrice === null || body.homePrice === ""
            ? null
            : Number(body.homePrice)
          : undefined,
      estimatedDuration:
        body.estimatedDuration !== undefined ? Number(body.estimatedDuration) : undefined,
      isAvailableWorkshop:
        body.isAvailableWorkshop !== undefined ? Boolean(body.isAvailableWorkshop) : undefined,
      isAvailableHome:
        body.isAvailableHome !== undefined ? Boolean(body.isAvailableHome) : undefined,
      requiresLift: body.requiresLift !== undefined ? Boolean(body.requiresLift) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      conditions: body.conditions !== undefined ? body.conditions : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SERVICE_UPDATED",
      entityType: "Service",
      entityId: updated.id,
      details: `Servicio actualizado: ${updated.name} (RD$${updated.price})`,
    },
  });

  return NextResponse.json({
    service: {
      ...updated,
      price: Number(updated.price),
      homePrice: updated.homePrice !== null ? Number(updated.homePrice) : null,
    },
  });
}
