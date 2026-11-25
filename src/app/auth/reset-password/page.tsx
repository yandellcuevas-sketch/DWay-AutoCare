"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

function ResetContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo restablecer la contraseña.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-[#1E2127]">
          Nueva contraseña
        </h1>
        <p className="mt-1.5 text-sm text-[#424750]">
          Define una nueva contraseña de al menos 8 caracteres para tu cuenta.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {done ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <span>¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.</span>
            </div>
            <Link
              href="/auth/login"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#1E2127] px-5 py-3 text-sm font-semibold text-white"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="rst-pass"
                className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
              >
                Nueva contraseña
              </label>
              <input
                id="rst-pass"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="rst-confirm"
                className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
              >
                Confirmar nueva contraseña
              </label>
              <input
                id="rst-confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#F50923] px-5 py-3 text-sm font-semibold text-white hover:bg-[#CC071D] disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {loading ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-12">
        <Suspense fallback={<div className="p-8 text-center text-sm">Cargando...</div>}>
          <ResetContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
