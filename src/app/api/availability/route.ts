import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import {
  calculateAppointmentQuote,
  getAvailableSlotsForDate,
} from "@/lib/availability";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const serviceIdsParam = searchParams.get("serviceIds");
  const mode = searchParams.get("mode") as "WORKSHOP" | "HOME_SERVICE" | null;
  const excludeAppointmentId = searchParams.get("excludeAppointmentId") ?? undefined;

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: "Parámetro date requerido en formato AAAA-MM-DD." },
      { status: 400 }
    );
  }
  if (!serviceIdsParam) {
    return NextResponse.json(
      { error: "Selecciona al menos un servicio." },
      { status: 400 }
    );
  }
  if (mode !== "WORKSHOP" && mode !== "HOME_SERVICE") {
    return NextResponse.json(
      { error: "Modalidad inválida (WORKSHOP o HOME_SERVICE)." },
      { status: 400 }
    );
  }

  const serviceIds = serviceIdsParam.split(",").filter(Boolean);
  const result = await getAvailableSlotsForDate({
    dateStr,
    serviceIds,
    mode,
    excludeAppointmentId,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const serviceIds: string[] = Array.isArray(body.serviceIds) ? body.serviceIds : [];
    const mode: "WORKSHOP" | "HOME_SERVICE" =
      body.mode === "HOME_SERVICE" ? "HOME_SERVICE" : "WORKSHOP";

    if (serviceIds.length === 0) {
      return NextResponse.json(
        { error: "Selecciona al menos un servicio." },
        { status: 400 }
      );
    }

    let zoneSurcharge = 0;
    if (mode === "HOME_SERVICE" && body.addressId) {
      const address = await prisma.address.findUnique({
        where: { id: String(body.addressId) },
      });
      if (address) {
        const zone = await prisma.coverageZone.findFirst({
          where: {
            isActive: true,
            province: address.province,
            sector: address.sector,
          },
        });
        if (zone) {
          zoneSurcharge = Number(zone.surchargeFee);
        }
      }
    }

    const quote = await calculateAppointmentQuote({
      clientId: body.clientId ? String(body.clientId) : session.user.id,
      vehicleId: body.vehicleId ? String(body.vehicleId) : null,
      serviceIds,
      mode,
      zoneSurcharge,
      useMembershipBenefit: Boolean(body.useMembershipBenefit),
      promotionCode: body.promotionCode ? String(body.promotionCode) : null,
    });

    return NextResponse.json({ quote });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo calcular la cotización.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
