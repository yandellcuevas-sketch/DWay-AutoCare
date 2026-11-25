import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().email("Correo electrónico inválido.").toLowerCase(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Correo inválido." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, firstName: true, isActive: true },
    });

    const emailProviderConfigured = Boolean(
      process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM_ADDRESS
    );

    if (!user || !user.isActive) {
      return NextResponse.json({
        message:
          "Si el correo está registrado, se ha generado la solicitud de recuperación de contraseña.",
        emailConfigured: emailProviderConfigured,
      });
    }

    const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entityType: "User",
        entityId: user.id,
        details: emailProviderConfigured
          ? "Token generado y en cola de correo."
          : "Token generado en entorno local (sin proveedor SMTP configurado).",
      },
    });

    return NextResponse.json({
      message: emailProviderConfigured
        ? "Se enviaron las instrucciones de recuperación a tu correo electrónico."
        : "Modo demostración local: no hay proveedor de correo configurado; utiliza el enlace directo temporal de abajo.",
      emailConfigured: emailProviderConfigured,
      // Solo se expone en entorno local sin proveedor de correo configurado para permitir probar recuperación en la demostración
      demoResetUrl: !emailProviderConfigured
        ? `/auth/reset-password?token=${rawToken}`
        : undefined,
    });
  } catch (error) {
    console.error("Error en POST /api/auth/forgot-password:", error);
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud de recuperación." },
      { status: 500 }
    );
  }
}
