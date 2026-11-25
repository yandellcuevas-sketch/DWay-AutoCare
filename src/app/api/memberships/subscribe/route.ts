import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/availability";
import { createSystemNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Inicia sesión para contratar una membresía." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const planId = String(body.planId || "");
    const billingCycle = body.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY";
    const vehicleId = body.vehicleId ? String(body.vehicleId) : null;
    const method = String(body.method || "DEMO");
    const targetClientId =
      isAdminOrReceptionist(session.user.role) && body.clientId
        ? String(body.clientId)
        : session.user.id;

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "Plan de membresía no encontrado o inactivo." },
        { status: 404 }
      );
    }

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle || (vehicle.clientId !== targetClientId && !isAdminOrReceptionist(session.user.role))) {
        return NextResponse.json(
          { error: "El vehículo seleccionado no es válido." },
          { status: 400 }
        );
      }
    }

    const settings = await getSystemSettings(prisma);
    const basePrice =
      billingCycle === "ANNUAL" ? Number(plan.annualPrice) : Number(plan.monthlyPrice);
    const taxAmount = Number((basePrice * settings.itbisRate).toFixed(2));
    const totalAmount = Number((basePrice + taxAmount).toFixed(2));

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (billingCycle === "ANNUAL") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const result = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          clientId: targetClientId,
          vehicleId,
          planId: plan.id,
          billingCycle,
          status: "ACTIVE",
          startDate,
          endDate,
          autoRenew: billingCycle === "MONTHLY",
        },
        include: { plan: true, vehicle: true },
      });

      const payment = await tx.payment.create({
        data: {
          subscriptionId: sub.id,
          clientId: targetClientId,
          amount: totalAmount,
          taxAmount,
          status: "PAID",
          method,
          reference: `DEMO-MEM-${Date.now().toString().slice(-6)}`,
          isDemoPayment: true,
          notes: `Activación plan ${plan.name} (${billingCycle === "ANNUAL" ? "Anual" : "Mensual"}) — Pago en entorno de demostración`,
        },
      });

      return { sub, payment };
    });

    await Promise.all([
      createSystemNotification({
        userId: targetClientId,
        type: "MEMBERSHIP_EXPIRING",
        title: `Membresía ${plan.name} activada`,
        body: `Tu plan ${plan.name} está activo. Ya puedes disfrutar tus beneficios incluidos y ${plan.discountPercent}% de descuento en servicios preventivos.`,
        dedupeKey: `sub-active-${result.sub.id}`,
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SUBSCRIPTION_CREATED",
          entityType: "Subscription",
          entityId: result.sub.id,
          details: `Plan ${plan.name} (${billingCycle}) activado por RD$${totalAmount.toFixed(2)}.`,
        },
      }),
    ]);

    return NextResponse.json(
      {
        subscription: {
          ...result.sub,
          plan: {
            ...result.sub.plan,
            monthlyPrice: Number(result.sub.plan.monthlyPrice),
            annualPrice: Number(result.sub.plan.annualPrice),
          },
        },
        payment: {
          ...result.payment,
          amount: Number(result.payment.amount),
          taxAmount: Number(result.payment.taxAmount),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/memberships/subscribe:", error);
    return NextResponse.json(
      { error: "No se pudo activar la membresía." },
      { status: 500 }
    );
  }
}
