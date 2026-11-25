import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const body = await request.json();
  const companyId = String(body.companyId || "");
  const vehicleCount = Math.max(1, Number(body.vehicleCount || 5));
  const monthlyFeePerVehicle = Number(body.monthlyFeePerVehicle || 1500);
  const startDate = body.startDate ? new Date(body.startDate) : new Date();
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const count = await prisma.corporateContract.count();
  const contractCode = `CONT-FLOTA-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  const contract = await prisma.$transaction(async (tx) => {
    const ct = await tx.corporateContract.create({
      data: {
        companyId,
        contractCode,
        planName: String(body.planName || "Flota Básica"),
        monthlyFeePerVehicle,
        vehicleCount,
        discountPercent: Number(body.discountPercent ?? 10),
        includedVisitsPerYear: Number(body.includedVisitsPerYear ?? 4),
        startDate,
        endDate,
        paymentTermsDays: Number(body.paymentTermsDays ?? 30),
        status: "ACTIVE",
        notes: body.notes ?? null,
      },
    });

    await tx.company.update({
      where: { id: companyId },
      data: { status: "ACTIVE", vehicleCount },
    });

    return ct;
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CORPORATE_CONTRACT_CREATED",
      entityType: "CorporateContract",
      entityId: contract.id,
      details: `Contrato ${contract.contractCode} creado (${vehicleCount} vehículos).`,
    },
  });

  return NextResponse.json(
    {
      contract: {
        ...contract,
        monthlyFeePerVehicle: Number(contract.monthlyFeePerVehicle),
      },
    },
    { status: 201 }
  );
}
