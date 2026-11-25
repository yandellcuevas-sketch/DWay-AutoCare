"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    message: string;
    demoResetUrl?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo procesar la solicitud.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-12">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-extrabold text-[#1E2127]">
              Recuperar contraseña
            </h1>
            <p className="mt-1.5 text-sm text-[#424750]">
              Ingresa tu correo electrónico registrado para generar un enlace seguro de
              restablecimiento.
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

            {result && (
              <div
                role="status"
                className="mt-4 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>{result.message}</span>
                </div>
                {result.demoResetUrl && (
                  <Link
                    href={result.demoResetUrl}
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#1E2127] px-4 py-2 text-xs font-semibold text-white hover:bg-[#424750]"
                  >
                    Ir a restablecer contraseña (Demo Local)
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="rec-email"
                  className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
                >
                  Correo electrónico
                </label>
                <input
                  id="rec-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#F50923] px-5 py-3 text-sm font-semibold text-white hover:bg-[#CC071D] disabled:opacity-60"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {loading ? "Procesando..." : "Solicitar recuperación"}
              </button>
            </form>

            <div className="mt-5 text-center text-sm">
              <Link href="/auth/login" className="font-semibold text-[#1E2127] hover:underline">
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
