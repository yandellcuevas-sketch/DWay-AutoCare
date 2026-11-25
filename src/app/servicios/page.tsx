import React from "react";
import Link from "next/link";
import { CalendarPlus, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/availability";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ServiceCatalogGrid } from "@/components/ServiceCatalogGrid";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const [servicesRaw, settings] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    getSystemSettings(prisma),
  ]);

  const services = servicesRaw.map((s) => ({
    ...s,
    price: Number(s.price),
    homePrice: s.homePrice !== null ? Number(s.homePrice) : null,
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="inline-block rounded-md bg-[#1E2127] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Catálogo Oficial DWay AutoCare
              </span>
              <h1 className="mt-3 text-3xl font-extrabold text-[#1E2127] sm:text-4xl">
                Servicios de Mantenimiento Preventivo
              </h1>
              <p className="mt-2 text-sm text-[#424750] sm:text-base">
                Precios transparentes en pesos dominicanos (RD$), duración estimada y
                disponibilidad real en taller o mediante nuestra unidad móvil.
              </p>
            </div>
            <Link
              href="/agendar"
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[#F50923] px-5 py-3 text-sm font-semibold text-white hover:bg-[#CC071D]"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Agendar cita
            </Link>
          </div>

          <ServiceCatalogGrid services={services} itbisRate={settings.itbisRate} />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <p>
                <strong>Restricción del modelo preventivo:</strong> No realizamos reparaciones
                complejas de motor ni transmisión. Todos nuestros servicios cuentan con 30 días
                de garantía sobre mano de obra y lista de verificación técnica.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-[#424750]">
              <p className="font-bold text-[#1E2127]">
                Productos complementarios y política a domicilio
              </p>
              <p className="mt-1 text-xs leading-relaxed">
                También disponemos de artículos preventivos menores (escobillas limpiaparabrisas,
                bombillas y aditivos) sujetos a cotización previa aprobada. En atención a domicilio
                contamos con margen de llegada de +/- 1 hora según tránsito y espacio seguro obligatorio.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
