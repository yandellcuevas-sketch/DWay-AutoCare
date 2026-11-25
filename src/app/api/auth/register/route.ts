import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { createSystemNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Datos de registro inválidos.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta registrada con este correo electrónico." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`.trim();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: fullName,
        firstName,
        lastName,
        phone,
        role: "CLIENT",
        termsAcceptedAt: new Date(),
      },
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

    await Promise.all([
      createSystemNotification({
        userId: user.id,
        type: "ACCOUNT_CREATED",
        title: `¡Bienvenido a DWay AutoCare, ${user.firstName}!`,
        body: "Tu cuenta ha sido creada exitosamente. Registra tu primer vehículo para agendar tu mantenimiento preventivo en taller o a domicilio.",
        dedupeKey: `account-created-${user.id}`,
        dispatchExternal: true,
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CLIENT_REGISTERED",
          entityType: "User",
          entityId: user.id,
          details: `Nuevo cliente registrado: ${user.email}`,
        },
      }),
    ]);

    return NextResponse.json(
      {
        message: "Cuenta registrada exitosamente.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/auth/register:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al registrar la cuenta. Inténtalo nuevamente." },
      { status: 500 }
    );
  }
}
