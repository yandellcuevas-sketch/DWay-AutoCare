import React from "react";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const dynamic = "force-dynamic";

export default async function AgendarPage({
  searchParams,
}: {
  searchParams: { service?: string };
}) {
  const [servicesRaw, zonesRaw] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.coverageZone.findMany({
      where: { isActive: true },
      orderBy: { sector: "asc" },
    }),
  ]);

  const services = servicesRaw.map((s) => ({
    ...s,
    price: Number(s.price),
    homePrice: s.homePrice !== null ? Number(s.homePrice) : null,
  }));

  const coverageZones = zonesRaw.map((z) => ({
    ...z,
    surchargeFee: Number(z.surchargeFee),
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="inline-block rounded-md bg-[#F50923]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F50923]">
              Sistema Avanzado de Reservas
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
              Agendar cita de mantenimiento preventivo
            </h1>
            <p className="mt-1 text-sm text-[#424750]">
              Disponibilidad calculada en tiempo real conectada a nuestro taller y unidad
              móvil.
            </p>
          </div>

          <BookingWizard
            services={services}
            coverageZones={coverageZones}
            initialServiceId={searchParams.service}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
