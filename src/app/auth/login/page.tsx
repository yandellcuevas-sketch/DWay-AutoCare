"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import {
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Shield,
  CarFront,
  CalendarCheck2,
  UserPlus,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DWayLogo } from "@/components/DWayLogo";
import { isStaffRole } from "@/lib/auth-client";

const LOCAL_DEMO_CLIENT =
  process.env.NEXT_PUBLIC_LOCAL_DEMO_CLIENT_EMAIL &&
  process.env.NEXT_PUBLIC_LOCAL_DEMO_CLIENT_PASSWORD
    ? {
        email: process.env.NEXT_PUBLIC_LOCAL_DEMO_CLIENT_EMAIL,
        pass: process.env.NEXT_PUBLIC_LOCAL_DEMO_CLIENT_PASSWORD,
      }
    : null;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      const session = await getSession();
      if (callbackUrl && callbackUrl.startsWith("/")) {
        router.push(callbackUrl);
      } else if (isStaffRole(session?.user?.role)) {
        router.push("/admin");
      } else {
        router.push("/portal");
      }
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="animate-dway-enter mx-auto grid max-w-5xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 lg:col-span-7">
        <div className="mb-4 flex items-center justify-between gap-4">
          <DWayLogo variant="dark" size="sm" />
          <span className="inline-block rounded-md bg-[#1E2127] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Acceso Seguro
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
          Iniciar sesión en DWay AutoCare
        </h1>
        <p className="mt-1.5 text-sm text-[#424750]">
          Ingresa a tu portal para gestionar tus vehículos, citas, membresía e historial.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
            >
              Correo electrónico <span className="text-[#F50923]">*</span>
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-[#1E2127]"
              >
                Contraseña <span className="text-[#F50923]">*</span>
              </label>
              <Link
                href="/auth/recuperar"
                className="text-xs font-semibold text-[#F50923] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 pr-12 text-sm text-[#1E2127]"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-1 top-1 flex h-[40px] w-[40px] items-center justify-center rounded-md text-[#424750] hover:text-[#1E2127]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#F50923] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#CC071D] disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {loading ? "Verificando credenciales..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-5 text-center text-sm text-[#424750]">
          ¿Aún no tienes cuenta en DWay AutoCare?{" "}
          <Link
            href={
              callbackUrl
                ? `/auth/registro?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/auth/registro"
            }
            className="font-bold text-[#F50923] hover:underline"
          >
            Regístrate aquí
          </Link>
        </div>
      </div>

      {/* Secure Account Information Panel */}
      <aside className="rounded-2xl border border-[#424750]/20 bg-[#1E2127] p-6 text-white lg:col-span-5">
        <span className="inline-block rounded-md bg-[#F50923] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
          Portal DWay AutoCare
        </span>
        <h2 className="mt-3 text-lg font-bold text-white">
          Tu historial y citas en un solo lugar
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-300">
          Inicia sesión con tu correo registrado para administrar tus vehículos, revisar
          comprobantes preventivos y agendar citas en taller o a domicilio.
        </p>

        <ul className="mt-5 space-y-3 text-xs text-gray-200">
          <li className="flex items-start gap-2.5 rounded-lg border border-[#424750]/60 bg-[#15171B] p-3">
            <CarFront className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
            <span>Guarda varios vehículos y consulta su kilometraje y garantía de 30 días.</span>
          </li>
          <li className="flex items-start gap-2.5 rounded-lg border border-[#424750]/60 bg-[#15171B] p-3">
            <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
            <span>Agenda en tiempo real en centro físico o con nuestra unidad móvil.</span>
          </li>
          <li className="flex items-start gap-2.5 rounded-lg border border-[#424750]/60 bg-[#15171B] p-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
            <span>Sesiones cifradas y control de acceso independiente para clientes y equipo técnico.</span>
          </li>
        </ul>

        <div className="mt-5 flex flex-col gap-2.5 border-t border-[#424750]/50 pt-4">
          <Link
            href={
              callbackUrl
                ? `/auth/registro?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/auth/registro"
            }
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#F50923] px-4 py-2 text-xs font-semibold text-white hover:bg-[#CC071D]"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Crear cuenta gratuita ahora
          </Link>

          {LOCAL_DEMO_CLIENT && (
            <button
              type="button"
              onClick={() => {
                setEmail(LOCAL_DEMO_CLIENT.email);
                setPassword(LOCAL_DEMO_CLIENT.pass);
                setError(null);
              }}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#424750] bg-[#15171B] px-3 py-2 text-xs font-semibold text-gray-200 hover:border-[#F50923]"
            >
              Rellenar cuenta cliente demo local
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-12">
        <Suspense fallback={<div className="p-8 text-center text-sm">Cargando...</div>}>
          <LoginContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
