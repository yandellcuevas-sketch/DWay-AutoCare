import React from "react";
import Link from "next/link";
import { ShieldCheck, Users, Target, Award, CalendarPlus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DWayLogo } from "@/components/DWayLogo";
import { RevealSection } from "@/components/MotionPrimitives";

const VALUES = [
  {
    name: "Honestidad",
    desc: "Solo recomendamos lo que el vehículo realmente necesita y mostramos las piezas o niveles revisados.",
  },
  {
    name: "Responsabilidad",
    desc: "Cumplimos las citas acordadas y respondemos por cada trabajo con 30 días de garantía en mano de obra.",
  },
  {
    name: "Respeto por el tiempo",
    desc: "Citas puntuales, tiempos informados de antemano y recordatorios automáticos.",
  },
  {
    name: "Seguridad",
    desc: "Solo realizamos en la unidad móvil los trabajos seguros fuera del taller; el resto se atiende en elevador.",
  },
  {
    name: "Mejora constante",
    desc: "Medimos la satisfacción de nuestros clientes y auditamos semanalmente las órdenes de trabajo.",
  },
  {
    name: "Cuidado del ambiente",
    desc: "Manejamos el aceite usado y los filtros mediante gestores de residuos autorizados desde el primer día.",
  },
];

const FOUNDERS = [
  {
    name: "Daniel Osiris Rodríguez Medina",
    role: "Dirección General, Ventas y Marketing",
    bio: "Estudiante de Dirección Empresarial con concentración en Negocios Internacionales (PUCMM). Lidera alianzas comerciales, contratos empresariales y estrategia de crecimiento.",
  },
  {
    name: "Wesley Reyes Martínez",
    role: "Operaciones y Atención al Cliente",
    bio: "Estudiante de Dirección Empresarial con concentración en Negocios Internacionales (PUCMM). Coordina la agenda del taller, unidad móvil, control de calidad y seguimiento al cliente.",
  },
  {
    name: "Ángel Yandell Cuevas Mora",
    role: "Administración y Tecnología",
    bio: "Estudiante de Dirección Empresarial con concentración en Negocios Internacionales (PUCMM) y bachiller técnico en desarrollo de aplicaciones. Responsable de sistemas digitales, finanzas e historial vehicular.",
  },
];

export default function NosotrosPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-12">
        <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
          <section className="grid items-center gap-10 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-6">
              <div className="mb-2">
                <DWayLogo variant="dark" size="md" />
              </div>
              <span className="inline-block rounded-md bg-[#F50923]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F50923]">
                Nuestra Identidad — DWay AutoCare
              </span>
              <h1 className="text-3xl font-extrabold text-[#1E2127] sm:text-4xl">
                «Tú eliges dónde, nosotros cuidamos tu vehículo»
              </h1>
              <p className="text-sm leading-relaxed text-[#424750] sm:text-base">
                DWay AutoCare surge como iniciativa emprendedora de tres estudiantes de
                Dirección Empresarial en la Pontificia Universidad Católica Madre y Maestra
                (PUCMM), Santo Domingo. El nombre combina las iniciales de sus fundadores:{" "}
                <strong>D</strong> de Daniel, <strong>W</strong> de Wesley, <strong>A</strong>{" "}
                de «and» y <strong>Y</strong> de Yandell.
              </p>
              <p className="text-sm leading-relaxed text-[#424750] sm:text-base">
                Nuestra propuesta integra un centro físico de mantenimiento preventivo con
                elevador hidráulico en el Distrito Nacional y una unidad móvil equipada para
                acudir a tu casa, oficina o empresa, respaldados por técnicos calificados y
                un jefe de taller experimentado.
              </p>
              <div className="pt-2">
                <Link
                  href="/agendar"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-[#F50923] px-5 py-3 text-sm font-semibold text-white hover:bg-[#CC071D]"
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  Agendar mantenimiento
                </Link>
              </div>
            </div>
            <div className="lg:col-span-6">
              <figure className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <img
                  src="/images/workshop/workshop-branded.jpg"
                  alt="Centro de mantenimiento preventivo DWay AutoCare"
                  className="aspect-video w-full object-cover"
                />
                <figcaption className="border-t border-gray-100 px-3 py-2 text-[11px] font-medium text-[#424750]">
                  Representación visual conceptual de las instalaciones y área de elevadores de DWay AutoCare.
                </figcaption>
              </figure>
            </div>
          </section>

          <RevealSection>
            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-3 flex items-center gap-2.5">
                  <Target className="h-5 w-5 text-[#F50923]" aria-hidden="true" />
                  <h2 className="text-xl font-bold text-[#1E2127]">Misión</h2>
                </div>
                <p className="text-sm leading-relaxed text-[#424750]">
                  Brindar mantenimiento preventivo automotriz confiable, rápido y transparente,
                  adaptándose al tiempo y ubicación de cada cliente mediante un centro físico
                  equipado y unidades móviles especializadas, con personal capacitado y precios claros.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-3 flex items-center gap-2.5">
                  <Award className="h-5 w-5 text-[#F50923]" aria-hidden="true" />
                  <h2 className="text-xl font-bold text-[#1E2127]">Visión</h2>
                </div>
                <p className="text-sm leading-relaxed text-[#424750]">
                  Consolidarnos en los próximos cinco años como marca líder en mantenimiento
                  preventivo y servicios rápidos en el Distrito Nacional y el Gran Santo Domingo,
                  reconocida por su puntualidad, honestidad técnica y experiencia del cliente.
                </p>
              </div>
            </section>
          </RevealSection>

          <RevealSection>
            <section>
              <div className="mb-6 flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[#F50923]" aria-hidden="true" />
                <h2 className="text-2xl font-extrabold text-[#1E2127]">Nuestros Valores</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {VALUES.map((v) => (
                  <div
                    key={v.name}
                    className="rounded-xl border border-gray-200 bg-white p-5"
                  >
                    <h3 className="text-base font-bold text-[#1E2127]">{v.name}</h3>
                    <p className="mt-1.5 text-sm text-[#424750]">{v.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </RevealSection>

          <RevealSection>
            <section>
              <div className="mb-6 flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#F50923]" aria-hidden="true" />
                <h2 className="text-2xl font-extrabold text-[#1E2127]">Equipo Fundador</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {FOUNDERS.map((f) => (
                  <div
                    key={f.name}
                    className="rounded-xl border border-gray-200 bg-white p-6"
                  >
                    <h3 className="text-lg font-bold text-[#1E2127]">{f.name}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#F50923]">
                      {f.role}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[#424750]">{f.bio}</p>
                  </div>
                ))}
              </div>
            </section>
          </RevealSection>
        </div>
      </main>
      <Footer />
    </div>
  );
}
