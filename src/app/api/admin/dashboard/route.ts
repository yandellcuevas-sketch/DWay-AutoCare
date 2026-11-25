import { NextResponse } from "next/server";
import { getAuthSession, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRDDateString, parseRDDateTime } from "@/lib/constants";
import { OCCUPYING_STATUSES } from "@/lib/availability";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const now = new Date();
  const todayStr = getRDDateString(now);
  const todayStart = parseRDDateTime(todayStr, "00:00");
  const todayEnd = parseRDDateTime(todayStr, "23:59");

  const [
    todayAppointments,
    pendingCount,
    confirmedCount,
    completedCount,
    clientsCount,
    vehiclesCount,
    activeSubscriptionsCount,
    paidPayments,
    pendingCompanyCount,
    activeResourcesCount,
    activeMobileUnitsCount,
    activeTechCount,
    allAppointments,
    recentAuditLogs,
    notificationsLog,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        appointmentDate: { gte: todayStart, lte: todayEnd },
        status: { in: OCCUPYING_STATUSES },
      },
    }),
    prisma.appointment.count({ where: { status: "PENDING_CONFIRMATION" } }),
    prisma.appointment.count({
      where: {
        status: { in: ["CONFIRMED", "TECHNICIAN_EN_ROUTE", "CLIENT_RECEIVED", "IN_PROGRESS"] },
      },
    }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
    prisma.user.count({ where: { role: "CLIENT", isActive: true } }),
    prisma.vehicle.count(),
    prisma.subscription.count({
      where: { status: "ACTIVE", endDate: { gte: now } },
    }),
    prisma.payment.findMany({
      where: { status: "PAID" },
      select: { amount: true, createdAt: true },
    }),
    prisma.company.count({ where: { status: "PENDING" } }),
    prisma.workshopResource.count({ where: { isActive: true } }),
    prisma.mobileUnit.count({ where: { isActive: true } }),
    prisma.technician.count({ where: { isActive: true } }),
    prisma.appointment.findMany({
      select: {
        mode: true,
        status: true,
        appointmentDate: true,
        totalAmount: true,
      },
      orderBy: { appointmentDate: "asc" },
    }),
    prisma.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const totalRevenue = paidPayments.reduce((acc, p) => acc + Number(p.amount), 0);

  // Capacidad diaria estimada del taller + unidad móvil según plan (10-12 taller + 4 móvil)
  const dailyMaxSlots = activeResourcesCount * 6 + activeMobileUnitsCount * 4;
  const capacityUsagePercent =
    dailyMaxSlots > 0 ? Math.min(100, Math.round((todayAppointments / dailyMaxSlots) * 100)) : 0;

  // Datos reales para gráficas Recharts: citas por modalidad y estado
  const modeDistribution = [
    {
      name: "Centro Físico",
      citas: allAppointments.filter((a) => a.mode === "WORKSHOP").length,
      ingresos: allAppointments
        .filter((a) => a.mode === "WORKSHOP" && a.status === "COMPLETED")
        .reduce((acc, a) => acc + Number(a.totalAmount), 0),
    },
    {
      name: "Unidad Móvil",
      citas: allAppointments.filter((a) => a.mode === "HOME_SERVICE").length,
      ingresos: allAppointments
        .filter((a) => a.mode === "HOME_SERVICE" && a.status === "COMPLETED")
        .reduce((acc, a) => acc + Number(a.totalAmount), 0),
    },
  ];

  // Serie por mes de ingresos/citas reales
  const monthlyMap = new Map<string, { mes: string; citas: number; ingresos: number }>();
  for (const a of allAppointments) {
    const key = getRDDateString(a.appointmentDate).slice(0, 7);
    const existing = monthlyMap.get(key) ?? { mes: key, citas: 0, ingresos: 0 };
    existing.citas += 1;
    if (a.status === "COMPLETED") {
      existing.ingresos += Number(a.totalAmount);
    }
    monthlyMap.set(key, existing);
  }

  return NextResponse.json({
    kpis: {
      todayAppointments,
      pendingCount,
      confirmedCount,
      completedCount,
      clientsCount,
      vehiclesCount,
      activeSubscriptionsCount,
      totalRevenue,
      pendingCompanyCount,
      activeTechCount,
      dailyMaxSlots,
      availableTodaySlots: Math.max(0, dailyMaxSlots - todayAppointments),
      capacityUsagePercent,
    },
    charts: {
      modeDistribution,
      monthlySeries: Array.from(monthlyMap.values()),
    },
    recentAuditLogs,
    notificationsLog,
  });
}
