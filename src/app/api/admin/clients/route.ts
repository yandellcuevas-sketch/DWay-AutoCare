import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { containsFilter } from "@/lib/db-helpers";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      ...(q
        ? {
            OR: [
              { name: containsFilter(q) },
              { email: containsFilter(q) },
              { phone: containsFilter(q) },
              { vehicles: { some: { plate: containsFilter(q.toUpperCase()) } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      isActive: true,
      internalNotes: true,
      createdAt: true,
      vehicles: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          clientAppointments: true,
          maintenanceRecordsClient: true,
          payments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clients });
}
