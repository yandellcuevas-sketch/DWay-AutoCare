import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

if (!process.env.NEXTAUTH_URL && process.env.RENDER_EXTERNAL_URL) {
  process.env.NEXTAUTH_URL = process.env.RENDER_EXTERNAL_URL;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12, // 12 hours
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Ingresa tu correo electrónico y contraseña.");
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            technician: {
              select: { id: true, isActive: true },
            },
          },
        });

        if (!user) {
          throw new Error("Correo o contraseña incorrectos.");
        }

        if (!user.isActive) {
          throw new Error("Tu cuenta se encuentra desactivada. Contacta a recepción.");
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minsLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
          throw new Error(
            `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta de nuevo en ${minsLeft} minuto(s).`
          );
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          const nextAttempts = user.loginAttempts + 1;
          const shouldLock = nextAttempts >= MAX_LOGIN_ATTEMPTS;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: shouldLock ? 0 : nextAttempts,
              lockedUntil: shouldLock
                ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
                : null,
            },
          });

          if (shouldLock) {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: "LOGIN_LOCKED",
                entityType: "User",
                entityId: user.id,
                details: `Cuenta bloqueada ${LOCKOUT_MINUTES} minutos tras ${MAX_LOGIN_ATTEMPTS} intentos fallidos.`,
              },
            });
            throw new Error(
              `Demasiados intentos fallidos. Cuenta bloqueada por ${LOCKOUT_MINUTES} minutos.`
            );
          }

          throw new Error("Correo o contraseña incorrectos.");
        }

        if (user.loginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          technicianId: user.technician?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.technicianId = user.technicianId ?? null;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.firstName) token.firstName = session.firstName;
        if (session.lastName) token.lastName = session.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.technicianId = (token.technicianId as string | null) ?? null;
      }
      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export function isStaffRole(role?: string | null): boolean {
  return role === "ADMIN" || role === "RECEPTIONIST" || role === "TECHNICIAN";
}

export function isAdminOrReceptionist(role?: string | null): boolean {
  return role === "ADMIN" || role === "RECEPTIONIST";
}
