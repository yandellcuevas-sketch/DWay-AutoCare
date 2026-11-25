import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    token: z.string().min(10, "Token inválido."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 }
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(parsed.data.token)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "El enlace de recuperación es inválido o ha expirado." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_COMPLETED",
        entityType: "User",
        entityId: user.id,
        details: "Contraseña actualizada mediante token de recuperación.",
      },
    });

    return NextResponse.json({
      message: "Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    console.error("Error en POST /api/auth/reset-password:", error);
    return NextResponse.json(
      { error: "No se pudo restablecer la contraseña." },
      { status: 500 }
    );
  }
}
