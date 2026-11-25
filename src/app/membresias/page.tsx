import React from "react";
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/availability";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MembershipCards } from "@/components/MembershipCards";

export const dynamic = "force-dynamic";

export default async function MembresiasPage() {
  const [plansRaw, settings] = await Promise.all([
    prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getSystemSettings(prisma),
  ]);

  const plans = plansRaw.map((p) => ({
    ...p,
    monthlyPrice: Number(p.monthlyPrice),
    annualPrice: Number(p.annualPrice),
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F50923]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F50923]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Membresías DWay AutoCare
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-[#1E2127] sm:text-4xl">
              Planes de Membresía por Vehículo
            </h1>
            <p className="mt-2 text-sm text-[#424750] sm:text-base">
              Mantén tu vehículo al día durante todo el año con revisiones programadas,
              pruebas de batería, prioridad en citas y descuentos aplicables directamente al
              agendar.
            </p>
          </div>

          <figure className="mb-10 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <img
              src="/images/memberships/memberships-banner.jpg"
              alt="Técnico de DWay AutoCare revisando la lista preventiva junto al propietario de un vehículo"
              className="aspect-[21/9] w-full object-cover object-center"
            />
            <figcaption className="border-t border-gray-100 px-4 py-2 text-xs text-[#424750]">
              Seguimiento transparente y control digital de beneficios para cada vehículo registrado.
            </figcaption>
          </figure>

          <MembershipCards plans={plans} itbisRate={settings.itbisRate} showComparison={true} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
