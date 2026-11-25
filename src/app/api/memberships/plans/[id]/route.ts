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
  const plan = await prisma.membershipPlan.update({
    where: { id: params.id },
    data: {
      monthlyPrice: body.monthlyPrice !== undefined ? Number(body.monthlyPrice) : undefined,
      annualPrice: body.annualPrice !== undefined ? Number(body.annualPrice) : undefined,
      discountPercent:
        body.discountPercent !== undefined ? Number(body.discountPercent) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      description: body.description !== undefined ? String(body.description) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "MEMBERSHIP_PLAN_UPDATED",
      entityType: "MembershipPlan",
      entityId: plan.id,
      details: `Plan ${plan.name} actualizado.`,
    },
  });

  return NextResponse.json({
    plan: {
      ...plan,
      monthlyPrice: Number(plan.monthlyPrice),
      annualPrice: Number(plan.annualPrice),
    },
  });
}
