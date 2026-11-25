import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PrivacidadPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-12">
        <div className="mx-auto max-w-3xl space-y-6 rounded-xl border border-gray-200 bg-white p-6 sm:p-10">
          <h1 className="text-2xl font-extrabold text-[#1E2127]">
            Política de Privacidad — DWay AutoCare
          </h1>
          <p className="text-sm text-[#424750]">
            En DWay AutoCare protegemos la información personal de nuestros clientes,
            vehículos, direcciones e historial de mantenimiento.
          </p>
          <section className="space-y-2 text-sm text-[#424750]">
            <h2 className="text-base font-bold text-[#1E2127]">
              1. Uso de Datos Personales y Vehiculares
            </h2>
            <p>
              Tus datos (nombre, teléfono, correo electrónico, direcciones y datos de tus
              vehículos) se utilizan exclusivamente para gestionar citas, historial de
              mantenimiento, membresías, facturación y recordatorios preventivos.
            </p>
            <h2 className="pt-3 text-base font-bold text-[#1E2127]">
              2. Seguridad y Aislamiento de Cuenta
            </h2>
            <p>
              Las contraseñas se almacenan cifradas mediante algoritmos de hashing seguro
              (bcrypt). Cada cliente solo puede consultar y modificar su propia información,
              vehículos, citas y comprobantes.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
