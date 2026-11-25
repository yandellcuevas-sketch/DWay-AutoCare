import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const unreadCount = notifications.filter(
    (n) => n.channel === "INTERNAL" && !n.isRead
  ).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json();

  if (body.markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
  } else if (body.id) {
    await prisma.notification.updateMany({
      where: { id: String(body.id), userId: session.user.id },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ ok: true });
}
