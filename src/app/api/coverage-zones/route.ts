import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const zones = await prisma.coverageZone.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ province: "asc" }, { sector: "asc" }],
  });

  return NextResponse.json({
    zones: zones.map((z) => ({
      ...z,
      surchargeFee: Number(z.surchargeFee),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const body = await request.json();
  const zone = await prisma.coverageZone.create({
    data: {
      province: String(body.province || "Distrito Nacional"),
      municipality: String(body.municipality || "Santo Domingo de Guzmán"),
      sector: String(body.sector).trim(),
      travelTimeMinutes: Number(body.travelTimeMinutes || 30),
      surchargeFee: Number(body.surchargeFee || 0),
      isActive: body.isActive !== false,
    },
  });

  return NextResponse.json({ zone }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const body = await request.json();
  const zone = await prisma.coverageZone.update({
    where: { id: String(body.id) },
    data: {
      isActive: Boolean(body.isActive),
      travelTimeMinutes:
        body.travelTimeMinutes !== undefined ? Number(body.travelTimeMinutes) : undefined,
      surchargeFee:
        body.surchargeFee !== undefined ? Number(body.surchargeFee) : undefined,
    },
  });

  return NextResponse.json({ zone });
}
