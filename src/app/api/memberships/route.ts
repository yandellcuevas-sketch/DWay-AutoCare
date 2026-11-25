import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();

  const plans = await prisma.membershipPlan.findMany({
    where: isAdminOrReceptionist(session?.user?.role) ? {} : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  let subscriptions: unknown[] = [];
  if (session?.user?.id) {
    const subs = await prisma.subscription.findMany({
      where: isAdminOrReceptionist(session.user.role)
        ? {}
        : { clientId: session.user.id },
      include: {
        plan: true,
        vehicle: true,
        client: { select: { id: true, name: true, email: true, phone: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    subscriptions = subs.map((s) => ({
      ...s,
      plan: {
        ...s.plan,
        monthlyPrice: Number(s.plan.monthlyPrice),
        annualPrice: Number(s.plan.annualPrice),
      },
      payments: s.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        taxAmount: Number(p.taxAmount),
      })),
    }));
  }

  return NextResponse.json({
    plans: plans.map((p) => ({
      ...p,
      monthlyPrice: Number(p.monthlyPrice),
      annualPrice: Number(p.annualPrice),
    })),
    subscriptions,
  });
}
