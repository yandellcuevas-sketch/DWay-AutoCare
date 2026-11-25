import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRDDateTime } from "@/lib/constants";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const [
    technicians,
    resources,
    mobileUnits,
    holidays,
    blockedSlots,
    zones,
    promotions,
    configs,
    payments,
  ] = await Promise.all([
    prisma.technician.findMany({
      include: {
        user: { select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true } },
        workSchedules: { orderBy: { dayOfWeek: "asc" } },
      },
    }),
    prisma.workshopResource.findMany({ orderBy: { name: "asc" } }),
    prisma.mobileUnit.findMany({ orderBy: { name: "asc" } }),
    prisma.holiday.findMany({ orderBy: { date: "asc" } }),
    prisma.blockedSlot.findMany({
      include: {
        technician: { include: { user: { select: { name: true } } } },
        resource: true,
        mobileUnit: true,
      },
      orderBy: { date: "desc" },
      take: 30,
    }),
    prisma.coverageZone.findMany({ orderBy: { sector: "asc" } }),
    prisma.promotion.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.systemConfig.findMany({ orderBy: { key: "asc" } }),
    prisma.payment.findMany({
      include: { client: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    technicians,
    resources,
    mobileUnits,
    holidays,
    blockedSlots,
    zones: zones.map((z) => ({ ...z, surchargeFee: Number(z.surchargeFee) })),
    promotions,
    configs,
    payments: payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      taxAmount: Number(p.taxAmount),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const body = await request.json();
  const kind = String(body.kind || "");

  if (kind === "BLOCK_SLOT") {
    const date = parseRDDateTime(String(body.date), "12:00");
    const block = await prisma.blockedSlot.create({
      data: {
        date,
        startTime: String(body.startTime),
        endTime: String(body.endTime),
        technicianId: body.technicianId || null,
        resourceId: body.resourceId || null,
        mobileUnitId: body.mobileUnitId || null,
        reason: body.reason || "Bloqueo operativo",
      },
    });
    return NextResponse.json({ block }, { status: 201 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo administradores pueden modificar configuración operativa." },
      { status: 403 }
    );
  }

  if (kind === "HOLIDAY") {
    const holiday = await prisma.holiday.create({
      data: {
        date: parseRDDateTime(String(body.date), "12:00"),
        name: String(body.name).trim(),
        isRecurring: Boolean(body.isRecurring),
      },
    });
    return NextResponse.json({ holiday }, { status: 201 });
  }

  if (kind === "PROMOTION") {
    const promo = await prisma.promotion.create({
      data: {
        code: String(body.code).trim().toUpperCase(),
        name: String(body.name).trim(),
        description: String(body.description || "").trim(),
        discountPercent: Math.min(50, Math.max(1, Number(body.discountPercent || 5))),
        isActive: true,
      },
    });
    return NextResponse.json({ promo }, { status: 201 });
  }

  if (kind === "TECHNICIAN") {
    const rawPass = body.password
      ? String(body.password)
      : crypto.randomBytes(12).toString("base64url");
    if (rawPass.length < 8) {
      return NextResponse.json(
        { error: "La contraseña inicial del técnico debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(rawPass, 10);
    const firstName = String(body.firstName).trim();
    const lastName = String(body.lastName).trim();
    const user = await prisma.user.create({
      data: {
        email: String(body.email).trim().toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone: body.phone ? String(body.phone) : null,
        role: "TECHNICIAN",
        termsAcceptedAt: new Date(),
      },
    });
    const tech = await prisma.technician.create({
      data: {
        userId: user.id,
        specializations: JSON.stringify(
          Array.isArray(body.specializations)
            ? body.specializations
            : ["Mantenimiento preventivo"]
        ),
        canDriveMobileUnit: Boolean(body.canDriveMobileUnit),
        isActive: true,
        workSchedules: {
          create: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            dayOfWeek,
            startTime: "08:00",
            endTime: dayOfWeek === 6 ? "13:00" : "17:00",
            isActive: true,
          })),
        },
      },
    });
    return NextResponse.json({ technician: tech }, { status: 201 });
  }

  if (kind === "SYSTEM_CONFIG") {
    const updated = await prisma.systemConfig.upsert({
      where: { key: String(body.key) },
      update: { value: String(body.value) },
      create: {
        key: String(body.key),
        value: String(body.value),
        description: body.description ? String(body.description) : null,
      },
    });
    return NextResponse.json({ config: updated });
  }

  if (kind === "TOGGLE_RESOURCE") {
    const resource = await prisma.workshopResource.update({
      where: { id: String(body.id) },
      data: { isActive: Boolean(body.isActive) },
    });
    return NextResponse.json({ resource });
  }

  if (kind === "TOGGLE_MOBILE_UNIT") {
    const unit = await prisma.mobileUnit.update({
      where: { id: String(body.id) },
      data: { isActive: Boolean(body.isActive) },
    });
    return NextResponse.json({ unit });
  }

  if (kind === "TOGGLE_TECHNICIAN") {
    const tech = await prisma.technician.update({
      where: { id: String(body.id) },
      data: { isActive: Boolean(body.isActive) },
    });
    return NextResponse.json({ technician: tech });
  }

  if (kind === "UPDATE_SCHEDULE") {
    const schedule = await prisma.workSchedule.update({
      where: { id: String(body.id) },
      data: {
        startTime: String(body.startTime),
        endTime: String(body.endTime),
        isActive: Boolean(body.isActive),
      },
    });
    return NextResponse.json({ schedule });
  }

  return NextResponse.json({ error: "Operación no reconocida." }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requerido." }, { status: 400 });

  if (kind === "BLOCK_SLOT") {
    await prisma.blockedSlot.delete({ where: { id } });
  } else if (kind === "HOLIDAY") {
    await prisma.holiday.delete({ where: { id } });
  } else if (kind === "PROMOTION") {
    await prisma.promotion.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
