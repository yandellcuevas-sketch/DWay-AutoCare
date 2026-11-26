import React from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompanyInquiryForm } from "@/components/CompanyInquiryForm";

export default function EmpresasPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#1E2127] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                <Building2 className="h-3.5 w-3.5 text-[#F50923]" aria-hidden="true" />
                División Corporativa
              </span>
              <h1 className="text-3xl font-extrabold text-[#1E2127] sm:text-4xl">
                Mantenimiento Programado para Flotas Empresariales
              </h1>
              <p className="text-sm leading-relaxed text-[#424750] sm:text-base">
                Dirigido a empresas de mensajería, distribución, ventas y servicios técnicos
                con 5 o más vehículos. Evita tiempos muertos llevando nuestra unidad móvil
                directamente a las instalaciones de tu negocio.
              </p>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-bold text-[#1E2127]">
                  Plan «Flota Básica» por vehículo
                </h2>
                <p className="mt-2 text-3xl font-extrabold text-[#1E2127]">
                  RD$1,770.00{" "}
                  <span className="text-sm font-medium text-[#424750]">
                    / mes (ITBIS incl.)
                  </span>
                </p>
                <p className="text-xs text-[#424750]">
                  RD$1,500.00 sin ITBIS · Crédito formal a 30 días para empresas con contrato
                </p>
                <ul className="mt-5 space-y-2.5 text-sm text-[#1E2127]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                    <span>4 visitas anuales de cambio de aceite semisintético y filtro.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                    <span>4 revisiones preventivas de 20 puntos + 2 pruebas de batería al año.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                    <span>10% de descuento en otros servicios aplicables y prioridad en citas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                    <span><strong>Primera revisión preventiva sin costo</strong> de evaluación para flotas corporativas interesadas en contrato.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                    <span>Reporte mensual del estado de cada vehículo de la flota.</span>
                  </li>
                </ul>
              </div>

              <figure className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <img
                  src="/images/mobile-service/mobile-unit-branded.webp"
                  alt="Unidad móvil DWay AutoCare atendiendo vehículos en sede empresarial"
                  className="aspect-video w-full object-cover"
                />
                <figcaption className="border-t border-gray-100 px-3 py-2 text-[11px] text-[#424750]">
                  Representación visual conceptual de atención corporativa en parqueos empresariales.
                </figcaption>
              </figure>
            </div>

            <div className="lg:col-span-7">
              <CompanyInquiryForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
