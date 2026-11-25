"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, UserPlus, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DWayLogo } from "@/components/DWayLogo";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portal";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!acceptTerms) {
      setError("Debes aceptar los términos de servicio y la política de privacidad.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
          confirmPassword,
          acceptTerms,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo completar el registro.");
        setLoading(false);
        return;
      }

      // Auto-login tras registro exitoso
      await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      router.push(callbackUrl.startsWith("/") ? callbackUrl : "/portal");
      router.refresh();
    } catch {
      setError("Error de conexión al registrar tu cuenta.");
      setLoading(false);
    }
  };

  return (
    <div className="animate-dway-enter mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <DWayLogo variant="dark" size="sm" />
          <span className="inline-block rounded-md bg-[#F50923]/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#F50923]">
            Nuevo Cliente
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
          Crea tu cuenta en DWay AutoCare
        </h1>
        <p className="mt-1.5 text-sm text-[#424750]">
          Registra tus datos para guardar tus vehículos, agendar citas y consultar tu
          historial preventivo.
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reg-firstName"
                className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
              >
                Nombre <span className="text-[#F50923]">*</span>
              </label>
              <input
                id="reg-firstName"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej. Carlos"
                className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
              />
            </div>

            <div>
              <label
                htmlFor="reg-lastName"
                className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
              >
                Apellidos <span className="text-[#F50923]">*</span>
              </label>
              <input
                id="reg-lastName"
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. Mendoza Ramírez"
                className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reg-email"
                className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
              >
                Correo electrónico <span className="text-[#F50923]">*</span>
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@ejemplo.com"
                className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
              />
            </div>

            <div>
              <label
                htmlFor="reg-phone"
                className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
              >
                Teléfono (Rep. Dom.) <span className="text-[#F50923]">*</span>
              </label>
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="809-555-1234"
                aria-describedby="phone-hint"
                className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
              />
              <span id="phone-hint" className="mt-1 block text-xs text-[#424750]">
                Formato 809, 829 u 849
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reg-password"
                className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
              >
                Contraseña <span className="text-[#F50923]">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  aria-describedby="pwd-hint"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 pr-12 text-sm text-[#1E2127]"
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1 top-1 flex h-[40px] w-[40px] items-center justify-center rounded-md text-[#424750]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <span id="pwd-hint" className="mt-1 block text-xs text-[#424750]">
                Mínimo 8 caracteres
              </span>
            </div>

            <div>
              <label
                htmlFor="reg-confirm"
                className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
              >
                Confirmar contraseña <span className="text-[#F50923]">*</span>
              </label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 text-sm text-[#424750]">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                Acepto los{" "}
                <Link href="/terminos" className="font-semibold text-[#1E2127] underline">
                  términos de servicio
                </Link>{" "}
                y la{" "}
                <Link href="/privacidad" className="font-semibold text-[#1E2127] underline">
                  política de privacidad
                </Link>{" "}
                de DWay AutoCare.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#F50923] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#CC071D] disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {loading ? "Creando cuenta..." : "Crear cuenta y continuar"}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-5 text-center text-sm text-[#424750]">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/auth/login" className="font-bold text-[#F50923] hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-12">
        <Suspense fallback={<div className="p-8 text-center text-sm">Cargando...</div>}>
          <RegisterContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
