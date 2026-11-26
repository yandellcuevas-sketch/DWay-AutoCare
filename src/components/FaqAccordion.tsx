"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const FAQ_ITEMS = [
  {
    q: "¿Qué servicios realizan a domicilio y cuáles solo en el taller?",
    a: "Con nuestra unidad móvil realizamos cambio de aceite y filtro, cambio de filtros de aire y cabina, inspección preventiva de 20 puntos, prueba e instalación de batería y diagnóstico básico con escáner. Los trabajos que requieren elevador hidráulico —como el cambio de pastillas de freno, revisión y limpieza profunda de frenos, y cambio de líquido de frenos o refrigerante— se realizan exclusivamente en nuestro centro físico por seguridad.",
  },
  {
    q: "¿Qué condiciones necesita el servicio a domicilio?",
    a: "Necesitamos que tu vehículo se encuentre dentro de las zonas de cobertura en el Distrito Nacional (como Naco, Piantini, Ensanche Paraíso, Evaristo Morales, Serrallés, Bella Vista y sectores cercanos) y en un espacio seguro, plano y ventilado. Contemplamos un margen de llegada acordado para mayor puntualidad.",
  },
  {
    q: "¿Realizan reparaciones complejas de motor o transmisión?",
    a: "No. DWay AutoCare se especializa estrictamente en mantenimiento preventivo, inspección y reemplazo rápido de consumibles. Si durante una revisión detectamos una avería mayor de motor o transmisión, te lo explicamos con transparencia y te orientamos hacia un taller especializado.",
  },
  {
    q: "¿Qué garantía tienen los servicios?",
    a: "Ofrecemos una garantía escrita de 30 días sobre la mano de obra realizada. Si dentro de ese plazo notas cualquier fuga o inconveniente relacionado con el trabajo efectuado, lo revisamos sin costo. Las baterías y repuestos cuentan además con la garantía directa de su fabricante o proveedor.",
  },
  {
    q: "¿Los precios incluyen ITBIS?",
    a: "En toda la plataforma desglosamos con total transparencia el precio base del servicio en pesos dominicanos (RD$), el cargo de desplazamiento si aplica a domicilio, los descuentos de membresía y el 18% de ITBIS correspondiente antes de confirmar tu cita.",
  },
  {
    q: "¿Cómo funcionan los planes de membresía?",
    a: "Cada membresía (Esencial, Confort y Premium Domicilio) aplica por vehículo registrado, con pago mensual (permanencia mínima de 12 meses) o pago único anual con ahorro exacto del 10%. Los servicios incluidos se agendan por cita previa y no se acumulan de un año a otro.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={item.q}
            className="p-5 transition-colors duration-150 hover:bg-[#FAFAFA]/80 sm:p-6"
          >
            <h3 className="text-base font-bold text-[#1E2127]">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${idx}`}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex min-h-[44px] w-full items-center justify-between gap-4 text-left font-bold text-[#1E2127] transition-colors hover:text-[#F50923]"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[#424750] transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-[#F50923]" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-panel-${idx}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pt-3 text-sm leading-relaxed text-[#424750]">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
