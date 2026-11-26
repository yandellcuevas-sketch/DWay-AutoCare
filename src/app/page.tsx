import React from "react";
import Link from "next/link";
import {
  CalendarPlus,
  Wrench,
  Clock,
  ShieldCheck,
  CarFront,
  Building2,
  CheckCircle2,
  MapPin,
  FileCheck2,
  BellRing,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/availability";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ServiceCatalogGrid } from "@/components/ServiceCatalogGrid";
import { MembershipCards } from "@/components/MembershipCards";
import { CompanyInquiryForm } from "@/components/CompanyInquiryForm";
import { FaqAccordion } from "@/components/FaqAccordion";
import { DWayLogo } from "@/components/DWayLogo";
import { HeroEntrance, RevealSection } from "@/components/MotionPrimitives";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [servicesRaw, plansRaw, settings, zones] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getSystemSettings(prisma),
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

  const plans = plansRaw.map((p) => ({
    ...p,
    monthlyPrice: Number(p.monthlyPrice),
    annualPrice: Number(p.annualPrice),
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative border-b border-[#424750]/20 bg-[#1E2127] text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-7 sm:px-6 sm:py-12 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-20">
            <HeroEntrance className="space-y-4 sm:space-y-6 lg:col-span-6">
              <div className="flex flex-wrap items-center gap-4">
                <DWayLogo variant="light" size="md" />
                <div className="inline-flex items-center gap-2 rounded-md border border-[#424750] bg-[#15171B] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-200">
                  <MapPin className="h-3.5 w-3.5 text-[#F50923]" aria-hidden="true" />
                  Santo Domingo · Centro Físico y Unidad Móvil
                </div>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                «Tú eliges dónde, nosotros cuidamos tu vehículo»
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
                Mantenimiento preventivo organizado, transparente y sin esperas largas.
                Agenda tu cita en nuestro centro especializado o recibe nuestra unidad móvil
                equipada en tu casa u oficina en el Distrito Nacional.
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                <Link
                  href="/agendar"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg bg-[#F50923] px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#CC071D]"
                >
                  <CalendarPlus className="h-5 w-5" aria-hidden="true" />
                  Agendar mantenimiento
                </Link>
                <a
                  href="#servicios"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-gray-400 bg-transparent px-6 py-3.5 text-base font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
                >
                  Conocer nuestros servicios
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#424750]/60 pt-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Modalidades
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">Taller y Domicilio</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Garantía escrita
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">30 días mano de obra</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Horarios
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">Lun–Sáb con cita</p>
                </div>
              </div>
            </HeroEntrance>

            <HeroEntrance delay={0.08} className="lg:col-span-6">
              <figure className="overflow-hidden rounded-xl border border-[#424750] bg-[#15171B]">
                <img
                  src="/images/workshop/workshop-branded.webp"
                  alt="Técnico de DWay AutoCare realizando inspección preventiva en un vehículo sobre elevador hidráulico"
                  className="aspect-video max-h-[190px] w-full object-cover sm:max-h-none"
                />
                <figcaption className="border-t border-[#424750]/50 px-3 py-1.5 text-[11px] text-gray-400">
                  Representación visual conceptual de nuestro centro físico equipado.
                </figcaption>
              </figure>
            </HeroEntrance>
          </div>
        </section>

        {/* 2. PRESENTACIÓN DE LA EMPRESA */}
        <section id="nosotros" className="border-b border-gray-200 bg-white py-16">
          <RevealSection className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-6">
              <figure className="overflow-hidden rounded-xl border border-gray-200 bg-[#FAFAFA]">
                <img
                  src="/images/mobile-service/mobile-unit-branded.webp"
                  alt="Unidad móvil DWay AutoCare realizando mantenimiento preventivo a domicilio en Santo Domingo"
                  className="aspect-video w-full object-cover"
                />
                <figcaption className="border-t border-gray-200 px-3 py-1.5 text-[11px] text-[#424750]">
                  Representación visual conceptual de nuestra unidad móvil a domicilio en servicio.
                </figcaption>
              </figure>
            </div>
            <div className="space-y-5 lg:col-span-6">
              <span className="inline-block rounded-md bg-[#F50923]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F50923]">
                Sobre DWay AutoCare
              </span>
              <h2 className="text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
                Mantenimiento preventivo diseñado alrededor de tu tiempo
              </h2>
              <p className="text-sm leading-relaxed text-[#424750] sm:text-base">
                DWay AutoCare nació en Santo Domingo con una meta clara: evitar que la falta
                de tiempo provoque descuidos costosos en tu vehículo. Combinamos un centro
                físico equipado con elevador hidráulico y una unidad móvil equipada para
                atenderte en casa o en tu oficina.
              </p>
              <p className="text-sm leading-relaxed text-[#424750] sm:text-base">
                Trabajamos con listas de verificación técnica, precios claros antes de
                autorizar cualquier trabajo, ventana estimada de llegada a domicilio de
                +/- 1 hora, manejo ambiental responsable del aceite usado y un historial
                digital por vehículo.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/nosotros"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#1E2127] px-4 py-2 text-sm font-semibold text-[#1E2127] transition-colors hover:bg-[#1E2127] hover:text-white"
                >
                  Conocer nuestra historia y equipo
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </RevealSection>
        </section>

        {/* 3. CATÁLOGO DE SERVICIOS */}
        <section id="servicios" className="border-b border-gray-200 bg-[#FAFAFA] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <span className="inline-block rounded-md bg-[#1E2127] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Catálogo Preventivo
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
                Servicios de mantenimiento preventivo disponibles
              </h2>
              <p className="mt-2 text-sm text-[#424750] sm:text-base">
                Especializados exclusivamente en mantenimiento preventivo para automóviles,
                jeepetas y camionetas ligeras. Consulta tarifas transparentes por modalidad.
              </p>
            </div>

            <ServiceCatalogGrid services={services} itbisRate={settings.itbisRate} />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                <p>
                  <strong>Alcance del servicio:</strong> DWay AutoCare no realiza reparaciones
                  complejas de motor ni de transmisión. Si detectamos una falla mayor de ese tipo,
                  te lo explicamos con honestidad y te orientamos hacia un taller especializado.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-[#424750]">
                <p className="font-bold text-[#1E2127]">
                  Artículos complementarios y atención a domicilio
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  Disponemos también de artículos preventivos menores (escobillas limpiaparabrisas,
                  bombillas y aditivos) bajo cotización previa aprobada. A domicilio se requiere un
                  espacio seguro y ventilado; las visitas cuentan con margen de llegada de +/- 1 hora
                  y reprogramación sin costo ante aviso anticipado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. BENEFICIOS DE ELEGIR DWAY AUTOCARE */}
        <section className="border-b border-gray-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <span className="inline-block rounded-md bg-[#F50923]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F50923]">
                Nuestra Propuesta de Valor
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
                ¿Por qué elegir DWay AutoCare?
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: CarFront,
                  title: "Flexibilidad de lugar",
                  desc: "Elige entre acudir a nuestro centro físico o solicitar la unidad móvil para los servicios seguros fuera del taller.",
                },
                {
                  icon: Clock,
                  title: "Ahorro real de tiempo",
                  desc: "Citas programadas con horarios reales disponibles para evitar filas, esperas largas e interrupciones innecesarias.",
                },
                {
                  icon: BellRing,
                  title: "Historial y recordatorios",
                  desc: "Cada vehículo conserva su expediente técnico con kilometraje, productos utilizados y alertas de próximo mantenimiento.",
                },
                {
                  icon: FileCheck2,
                  title: "Precios claros desde el inicio",
                  desc: "Conoces el subtotal, desplazamiento e ITBIS antes de confirmar. Ningún trabajo adicional se realiza sin tu aprobación.",
                },
                {
                  icon: Wrench,
                  title: "Especialización preventiva",
                  desc: "Al enfocarnos en mantenimiento preventivo, estandarizamos listas de verificación y reducimos errores operativos.",
                },
                {
                  icon: ShieldCheck,
                  title: "Garantía de 30 días",
                  desc: "Respaldamos la mano de obra durante 30 días y tramitamos la garantía de fabricante de baterías y piezas instaladas.",
                },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-6"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#1E2127] text-white">
                      <Icon className="h-5 w-5 text-[#F50923]" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1E2127]">{b.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#424750]">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. CÓMO FUNCIONA EL SERVICIO */}
        <section id="como-funciona" className="border-b border-[#424750]/20 bg-[#1E2127] py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <span className="inline-block rounded-md bg-[#F50923] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Proceso Organizado
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
                Cómo funciona tu cita paso a paso
              </h2>
              <p className="mt-2 text-sm text-gray-300 sm:text-base">
                Desde la reserva digital hasta el control de calidad del jefe de taller y tu
                comprobante descargable.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Elige vehículo y servicio",
                  desc: "Selecciona uno de tus vehículos registrados y combina los servicios preventivos que necesites.",
                },
                {
                  step: "02",
                  title: "Taller o Unidad Móvil",
                  desc: "Decide si vienes a nuestro taller o si enviamos la unidad móvil a tu dirección dentro de la cobertura.",
                },
                {
                  step: "03",
                  title: "Horario real garantizado",
                  desc: "El sistema consulta técnicos, elevador y unidad móvil en tiempo real para reservar tu hora exacta.",
                },
                {
                  step: "04",
                  title: "Control de calidad e historial",
                  desc: "El técnico completa el servicio, mostramos las piezas reemplazadas y recibes tu comprobante digital.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-[#424750]/60 bg-[#15171B] p-6"
                >
                  <span className="text-2xl font-extrabold text-[#F50923]">{item.step}</span>
                  <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="overflow-hidden rounded-xl border border-[#424750] bg-[#15171B]">
                <img
                  src="/images/services/service-oil.webp"
                  alt="Cambio profesional de aceite sintético y filtro en DWay AutoCare"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-xl border border-[#424750] bg-[#15171B]">
                <img
                  src="/images/services/service-inspection.webp"
                  alt="Inspección de sistema de frenos, torque y prueba de batería"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-xl border border-[#424750] bg-[#15171B]">
                <img
                  src="/images/services/service-diagnostics.webp"
                  alt="Diagnóstico electrónico básico OBD-II y prueba digital de batería"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 6. PLANES DE MEMBRESÍA */}
        <section id="membresias" className="border-b border-gray-200 bg-[#FAFAFA] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F50923]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F50923]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Membresías por Vehículo
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
                Planes de membresía claros y sostenibles
              </h2>
              <p className="mt-2 text-sm text-[#424750] sm:text-base">
                Organiza el cuidado anual de tu vehículo con beneficios definidos, prioridad
                en agenda, recordatorios y descuentos reales sin promesas engañosas.
              </p>
            </div>

            <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <img
                src="/images/memberships/memberships-banner.webp"
                alt="Asesor técnico DWay AutoCare mostrando checklist digital preventivo a propietaria"
                className="aspect-[21/7] w-full object-cover object-center"
              />
            </div>

            <MembershipCards plans={plans} itbisRate={settings.itbisRate} showComparison={true} />
          </div>
        </section>

        {/* 7. SERVICIOS EMPRESARIALES */}
        <section id="empresas" className="border-b border-gray-200 bg-white py-16">
          <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="space-y-5 lg:col-span-5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#1E2127] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                <Building2 className="h-3.5 w-3.5 text-[#F50923]" aria-hidden="true" />
                Flotas Empresariales
              </span>
              <h2 className="text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
                Contrato empresarial «Flota Básica»
              </h2>
              <p className="text-sm leading-relaxed text-[#424750] sm:text-base">
                Evita que tus vehículos de mensajería, distribución o ventas se detengan por
                falta de mantenimiento. Atendemos flotas desde 5 vehículos directamente en las
                instalaciones de tu empresa con nuestra unidad móvil.
              </p>

              <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#424750]">
                  Tarifa estándar por vehículo
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[#1E2127]">
                  RD$1,770.00 <span className="text-sm font-medium text-[#424750]">/ mes (ITBIS incl.)</span>
                </p>
                <p className="text-xs text-[#424750]">
                  RD$1,500.00 sin ITBIS · Facturación formal con pago a 30 días
                </p>

                <ul className="mt-4 space-y-2 text-sm text-[#1E2127]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                    <span>
                      4 visitas anuales con cambio de aceite semisintético y filtro + revisión
                      preventiva en cada visita.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                    <span>2 pruebas de batería al año por vehículo en tus instalaciones.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                    <span>10% de descuento en otros servicios aplicables y prioridad en citas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                    <span><strong>Primera revisión preventiva sin costo</strong> de evaluación para flotas corporativas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
                    <span>Reporte mensual del estado de cada vehículo de la flota.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-7">
              <CompanyInquiryForm />
            </div>
          </div>
        </section>

        {/* 8. PREGUNTAS FRECUENTES */}
        <section id="preguntas-frecuentes" className="border-b border-gray-200 bg-[#FAFAFA] py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <span className="inline-block rounded-md bg-[#1E2127] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Preguntas Frecuentes
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
                Resolvemos tus dudas antes de agendar
              </h2>
            </div>

            <FaqAccordion />
          </div>
        </section>

        {/* 9. INFORMACIÓN DE CONTACTO Y COBERTURA */}
        <section id="contacto" className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 rounded-2xl border border-gray-200 bg-[#FAFAFA] p-6 sm:p-10 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-6">
                <span className="inline-block rounded-md bg-[#F50923]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F50923]">
                  Cobertura y Atención
                </span>
                <h2 className="text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
                  ¿Listo para cuidar tu vehículo sin complicaciones?
                </h2>
                <p className="text-sm leading-relaxed text-[#424750]">
                  Nuestro centro de servicio está proyectado para el Distrito Nacional
                  (sectores Naco, Piantini y zonas cercanas con acceso a las avenidas 27 de
                  Febrero, Abraham Lincoln y John F. Kennedy), complementado por nuestra
                  unidad móvil.
                </p>
                <div className="space-y-2 text-sm text-[#1E2127]">
                  <p>
                    <strong>Horario de atención:</strong> Lunes a Viernes 8:00 a. m. – 5:00 p. m.
                    · Sábados 8:00 a. m. – 1:00 p. m.
                  </p>
                  <p>
                    <strong>Gestión de citas y seguimiento:</strong> Disponible 24/7 desde tu
                    portal de cliente y confirmación por recepción.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/agendar"
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-[#F50923] px-5 py-3 text-sm font-semibold text-white hover:bg-[#CC071D]"
                  >
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Agendar cita ahora
                  </Link>
                  <Link
                    href="/auth/registro"
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#1E2127] bg-white px-5 py-3 text-sm font-semibold text-[#1E2127] hover:bg-[#1E2127] hover:text-white"
                  >
                    Crear mi cuenta gratis
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-6">
                <h3 className="text-base font-bold text-[#1E2127]">
                  Sectores activos con cobertura móvil (Distrito Nacional y Gran Santo Domingo)
                </h3>
                <p className="mt-1 text-xs text-[#424750]">
                  Sectores del Distrito Nacional sin recargo adicional y zonas extendidas con tarifa transparente de desplazamiento:
                </p>
                <div className="mt-4 hidden flex-wrap gap-2 md:flex">
                  {zones.map((z) => (
                    <span
                      key={z.id}
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                        Number(z.surchargeFee) > 0
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : "border-gray-200 bg-[#FAFAFA] text-[#1E2127]"
                      }`}
                    >
                      <MapPin className="h-3 w-3 text-[#F50923]" aria-hidden="true" />
                      {z.sector}
                      {Number(z.surchargeFee) > 0 && ` (+RD$${Number(z.surchargeFee)})`}
                    </span>
                  ))}
                </div>
                <details className="mt-3 rounded-lg border border-gray-200 bg-[#FAFAFA] p-3 md:hidden">
                  <summary className="flex min-h-[40px] cursor-pointer items-center justify-between text-xs font-bold text-[#1E2127]">
                    <span>Ver {zones.length} sectores cubiertos</span>
                    <span className="text-[#F50923]">Desplegar</span>
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {zones.map((z) => (
                      <span
                        key={z.id}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${
                          Number(z.surchargeFee) > 0
                            ? "border-amber-200 bg-amber-50 text-amber-900"
                            : "border-gray-200 bg-white text-[#1E2127]"
                        }`}
                      >
                        <MapPin className="h-3 w-3 text-[#F50923]" aria-hidden="true" />
                        {z.sector}
                        {Number(z.surchargeFee) > 0 && ` (+RD$${Number(z.surchargeFee)})`}
                      </span>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
