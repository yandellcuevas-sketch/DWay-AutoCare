import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const body = await request.json();
  const company = await prisma.company.update({
    where: { id: params.id },
    data: {
      status: body.status ? String(body.status) : undefined,
      internalNotes: body.internalNotes !== undefined ? body.internalNotes : undefined,
      vehicleCount: body.vehicleCount !== undefined ? Number(body.vehicleCount) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "COMPANY_UPDATED",
      entityType: "Company",
      entityId: company.id,
      details: `Empresa ${company.name} actualizada a estado ${company.status}.`,
    },
  });

  return NextResponse.json({ company });
}
