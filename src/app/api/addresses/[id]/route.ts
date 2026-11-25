import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const address = await prisma.address.findUnique({ where: { id: params.id } });
  if (!address) {
    return NextResponse.json({ error: "Dirección no encontrada." }, { status: 404 });
  }
  if (address.userId !== session.user.id && !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  await prisma.address.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Dirección eliminada." });
}
