import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validations";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 }
      );
    }

    const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        name: fullName,
        phone: parsed.data.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_UPDATED",
        entityType: "User",
        entityId: session.user.id,
        details: `Perfil actualizado por el usuario.`,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Error en PATCH /api/profile:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el perfil." },
      { status: 500 }
    );
  }
}
