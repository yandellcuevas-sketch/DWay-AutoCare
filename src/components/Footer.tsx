import React from "react";
import Link from "next/link";
import { MapPin, Clock, ShieldCheck, Wrench } from "lucide-react";
import { DWayLogo } from "./DWayLogo";

export function Footer() {
  return (
    <footer className="no-print border-t border-[#424750]/30 bg-[#1E2127] text-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <DWayLogo variant="light" size="md" />
            <p className="text-sm font-semibold text-[#FAFAFA]">
              «Tú eliges dónde, nosotros cuidamos tu vehículo»
            </p>
            <p className="text-sm leading-relaxed text-gray-300">
              Mantenimiento preventivo automotriz en nuestro centro físico y mediante unidad
              móvil en el Distrito Nacional, Santo Domingo, República Dominicana.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Navegación
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li>
                <Link href="/" className="hover:text-[#F50923]">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="hover:text-[#F50923]">
                  Catálogo de servicios
                </Link>
              </li>
              <li>
                <Link href="/membresias" className="hover:text-[#F50923]">
                  Planes de membresía
                </Link>
              </li>
              <li>
                <Link href="/empresas" className="hover:text-[#F50923]">
                  Servicios empresariales
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="hover:text-[#F50923]">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/agendar" className="font-semibold text-[#F50923] hover:underline">
                  Agendar cita
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Cobertura y Horarios
            </h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                <span>
                  Distrito Nacional (propuesta de sede en Naco / Piantini, acceso por avs.
                  27 de Febrero, Abraham Lincoln y John F. Kennedy), Santo Domingo, RD.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                <span>
                  Lunes a Viernes: 8:00 a. m. – 5:00 p. m.
                  <br />
                  Sábados: 8:00 a. m. – 1:00 p. m.
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Garantía y Transparencia
            </h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                <span>
                  30 días de garantía sobre mano de obra en todos nuestros mantenimientos
                  preventivos.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                <span>
                  Precios transparentes en pesos dominicanos (RD$) con desglose claro de
                  ITBIS (18%).
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#424750]/40 pt-6 text-xs text-gray-400 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} DWay AutoCare S.R.L. (Proyecto Empresarial PUCMM —
            Santo Domingo, República Dominicana).
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/terminos" className="hover:text-white">
              Términos de servicio
            </Link>
            <Link href="/privacidad" className="hover:text-white">
              Política de privacidad
            </Link>
            <Link href="/auth/login" className="hover:text-white">
              Portal de clientes y personal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
