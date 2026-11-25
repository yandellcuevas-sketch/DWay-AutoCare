import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPostgresEnv } from "@/lib/db-helpers";

export async function GET() {
  const session = await getAuthSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  if (isPostgresEnv()) {
    const [
      users,
      vehicles,
      addresses,
      services,
      membershipPlans,
      subscriptions,
      appointments,
      maintenanceRecords,
      companies,
      corporateContracts,
      payments,
      coverageZones,
      promotions,
      holidays,
      systemConfigs,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.vehicle.findMany(),
      prisma.address.findMany(),
      prisma.service.findMany(),
      prisma.membershipPlan.findMany(),
      prisma.subscription.findMany(),
      prisma.appointment.findMany({ include: { appointmentServices: true } }),
      prisma.maintenanceRecord.findMany(),
      prisma.company.findMany(),
      prisma.corporateContract.findMany(),
      prisma.payment.findMany(),
      prisma.coverageZone.findMany(),
      prisma.promotion.findMany(),
      prisma.holiday.findMany(),
      prisma.systemConfig.findMany(),
    ]);

    const snapshot = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        engine: "postgresql",
        counts: {
          users: users.length,
          vehicles: vehicles.length,
          appointments: appointments.length,
          maintenanceRecords: maintenanceRecords.length,
        },
        data: {
          users,
          vehicles,
          addresses,
          services,
          membershipPlans,
          subscriptions,
          appointments,
          maintenanceRecords,
          companies,
          corporateContracts,
          payments,
          coverageZones,
          promotions,
          holidays,
          systemConfigs,
        },
      },
      null,
      2
    );

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DATABASE_BACKUP_DOWNLOADED",
        entityType: "System",
        entityId: "postgresql",
        details: `Respaldo JSON de PostgreSQL descargado (${Buffer.byteLength(snapshot)} bytes).`,
      },
    });

    return new NextResponse(snapshot, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="dway-autocare-pg-backup-${timestamp}.json"`,
      },
    });
  }

  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json(
      { error: "Archivo de base de datos no encontrado." },
      { status: 404 }
    );
  }

  const buffer = fs.readFileSync(dbPath);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DATABASE_BACKUP_DOWNLOADED",
      entityType: "System",
      entityId: "dev.db",
      details: `Respaldo SQLite descargado (${buffer.length} bytes).`,
    },
  });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="dway-autocare-backup-${timestamp}.db"`,
    },
  });
}
