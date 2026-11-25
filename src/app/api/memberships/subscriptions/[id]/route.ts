import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/availability";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: params.id },
    include: { plan: true },
  });

  if (!sub) {
    return NextResponse.json({ error: "Suscripción no encontrada." }, { status: 404 });
  }
  if (sub.clientId !== session.user.id && !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const body = await request.json();
  const action = String(body.action || "CANCEL");

  if (action === "CANCEL") {
    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "CANCELLED",
        autoRenew: false,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBSCRIPTION_CANCELLED",
        entityType: "Subscription",
        entityId: sub.id,
        details: `Suscripción ${sub.plan.name} cancelada.`,
      },
    });
    return NextResponse.json({ subscription: updated });
  }

  if (action === "RENEW") {
    const settings = await getSystemSettings(prisma);
    const basePrice =
      sub.billingCycle === "ANNUAL"
        ? Number(sub.plan.annualPrice)
        : Number(sub.plan.monthlyPrice);
    const taxAmount = Number((basePrice * settings.itbisRate).toFixed(2));
    const totalAmount = Number((basePrice + taxAmount).toFixed(2));

    const newStart = sub.endDate > new Date() ? sub.endDate : new Date();
    const newEnd = new Date(newStart);
    if (sub.billingCycle === "ANNUAL") {
      newEnd.setFullYear(newEnd.getFullYear() + 1);
    } else {
      newEnd.setMonth(newEnd.getMonth() + 1);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          endDate: newEnd,
          reviewsUsed: 0,
          batteryTestsUsed: 0,
          diagnosticsUsed: 0,
          oilChangesUsed: 0,
        },
      });
      await tx.payment.create({
        data: {
          subscriptionId: sub.id,
          clientId: sub.clientId,
          amount: totalAmount,
          taxAmount,
          status: "PAID",
          method: "DEMO",
          reference: `DEMO-REN-${Date.now().toString().slice(-6)}`,
          isDemoPayment: true,
          notes: `Renovación plan ${sub.plan.name}`,
        },
      });
      return s;
    });

    return NextResponse.json({ subscription: updated });
  }

  return NextResponse.json({ error: "Acción no soportada." }, { status: 400 });
}
