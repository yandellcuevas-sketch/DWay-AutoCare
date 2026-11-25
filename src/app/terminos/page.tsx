import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function TerminosPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-12">
        <div className="mx-auto max-w-3xl space-y-6 rounded-xl border border-gray-200 bg-white p-6 sm:p-10">
          <h1 className="text-2xl font-extrabold text-[#1E2127]">
            Términos de Servicio — DWay AutoCare
          </h1>
          <p className="text-sm text-[#424750]">
            DWay AutoCare ofrece servicios especializados de mantenimiento preventivo
            automotriz en centro físico y unidad móvil dentro del Distrito Nacional,
            República Dominicana.
          </p>
          <section className="space-y-2 text-sm text-[#424750]">
            <h2 className="text-base font-bold text-[#1E2127]">1. Alcance y Diagnóstico</h2>
            <p>
              Ningún servicio adicional se ejecuta sin aprobación previa del cliente. No
              realizamos reparaciones complejas de motor o transmisión.
            </p>
            <h2 className="pt-3 text-base font-bold text-[#1E2127]">
              2. Servicio a Domicilio
            </h2>
            <p>
              El lugar de atención debe encontrarse dentro de las zonas de cobertura activas y
              contar con espacio seguro, plano y ventilado. Si el sitio no reúne condiciones
              seguras, se reprogramará la atención al centro físico.
            </p>
            <h2 className="pt-3 text-base font-bold text-[#1E2127]">3. Garantía</h2>
            <p>
              La mano de obra cuenta con garantía de 30 días calendario. Las baterías y
              repuestos están cubiertos por la garantía del fabricante o proveedor.
            </p>
            <h2 className="pt-3 text-base font-bold text-[#1E2127]">4. Membresías</h2>
            <p>
              Las membresías aplican por vehículo registrado, con permanencia mínima de 12
              meses en modalidad mensual. Los beneficios anuales incluidos se solicitan por
              cita previa y no se acumulan de un año a otro.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
