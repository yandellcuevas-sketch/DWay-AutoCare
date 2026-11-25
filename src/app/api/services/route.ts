import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const serviceCreateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(10).max(800),
  price: z.coerce.number().min(0),
  homePrice: z.coerce.number().min(0).optional().nullable(),
  estimatedDuration: z.coerce.number().int().min(10).max(480),
  isAvailableWorkshop: z.boolean().default(true),
  isAvailableHome: z.boolean().default(false),
  requiresLift: z.boolean().default(false),
  isActive: z.boolean().default(true),
  conditions: z.string().trim().max(500).optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  iconName: z.string().trim().optional().nullable(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  let allowInactive = false;
  if (includeInactive) {
    const session = await getAuthSession();
    allowInactive = isAdminOrReceptionist(session?.user?.role);
  }

  const services = await prisma.service.findMany({
    where: allowInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    services: services.map((s) => ({
      ...s,
      price: Number(s.price),
      homePrice: s.homePrice !== null ? Number(s.homePrice) : null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = serviceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de servicio inválidos." },
      { status: 400 }
    );
  }

  const slug =
    parsed.data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString().slice(-4);

  const service = await prisma.service.create({
    data: {
      slug,
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description,
      price: parsed.data.price,
      homePrice: parsed.data.isAvailableHome ? parsed.data.homePrice ?? parsed.data.price : null,
      estimatedDuration: parsed.data.estimatedDuration,
      isAvailableWorkshop: parsed.data.isAvailableWorkshop,
      isAvailableHome: parsed.data.isAvailableHome,
      requiresLift: parsed.data.requiresLift,
      isActive: parsed.data.isActive,
      conditions: parsed.data.conditions ?? null,
      imageUrl: parsed.data.imageUrl || "/images/hero-workshop.jpg",
      iconName: parsed.data.iconName || "Wrench",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SERVICE_CREATED",
      entityType: "Service",
      entityId: service.id,
      details: `Servicio creado: ${service.name}`,
    },
  });

  return NextResponse.json({ service }, { status: 201 });
}
