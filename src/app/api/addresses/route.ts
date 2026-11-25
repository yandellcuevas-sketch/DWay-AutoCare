import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientIdParam = searchParams.get("clientId");

  const targetUserId =
    isAdminOrReceptionist(session.user.role) && clientIdParam
      ? clientIdParam
      : session.user.id;

  const [addresses, zones] = await Promise.all([
    prisma.address.findMany({
      where: { userId: targetUserId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.coverageZone.findMany({ where: { isActive: true } }),
  ]);

  const enriched = addresses.map((addr) => {
    const matchedZone = zones.find(
      (z) =>
        z.province.toLowerCase() === addr.province.toLowerCase() &&
        z.sector.toLowerCase() === addr.sector.toLowerCase()
    );
    return {
      ...addr,
      isCovered: Boolean(matchedZone),
      zoneSurcharge: matchedZone ? Number(matchedZone.surchargeFee) : 0,
      travelTimeMinutes: matchedZone?.travelTimeMinutes ?? null,
    };
  });

  return NextResponse.json({ addresses: enriched });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Dirección inválida.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const targetUserId =
      isAdminOrReceptionist(session.user.role) && body.userId
        ? String(body.userId)
        : session.user.id;

    // Verificar cobertura
    const zones = await prisma.coverageZone.findMany({ where: { isActive: true } });
    const matchedZone = zones.find(
      (z) =>
        z.province.toLowerCase() === parsed.data.province.toLowerCase() &&
        z.sector.toLowerCase() === parsed.data.sector.toLowerCase()
    );

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: targetUserId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: targetUserId,
        label: parsed.data.label,
        province: parsed.data.province,
        municipality: parsed.data.municipality,
        sector: parsed.data.sector,
        street: parsed.data.street,
        number: parsed.data.number,
        reference: parsed.data.reference ?? null,
        additionalInstructions: parsed.data.additionalInstructions ?? null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        isDefault: Boolean(parsed.data.isDefault),
      },
    });

    return NextResponse.json(
      {
        address: {
          ...address,
          isCovered: Boolean(matchedZone),
          zoneSurcharge: matchedZone ? Number(matchedZone.surchargeFee) : 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/addresses:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la dirección." },
      { status: 500 }
    );
  }
}
