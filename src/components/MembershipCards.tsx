"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Info, ArrowRight, Sparkles, ShieldCheck, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { formatDOP } from "@/lib/constants";

export interface PlanItem {
  id: string;
  slug: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  targetMode: string;
  discountPercent: number;
  includedReviews?: number;
  includedBatteryTests?: number;
  includedDiagnostics?: number;
  includedOilChanges?: number;
  benefits: string;
  restrictions: string;
}

export function MembershipCards({
  plans,
  itbisRate = 0.18,
  showComparison = true,
}: {
  plans: PlanItem[];
  itbisRate?: number;
  showComparison?: boolean;
}) {
  const [cycle, setCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        <div
          role="group"
          aria-label="Modalidad de pago de membresía"
          className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-xs"
        >
          <button
            type="button"
            onClick={() => setCycle("MONTHLY")}
            aria-pressed={cycle === "MONTHLY"}
            className={`min-h-[42px] rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              cycle === "MONTHLY"
                ? "bg-[#1E2127] text-white"
                : "text-[#424750] hover:text-[#1E2127]"
            }`}
          >
            Pago mensual
          </button>
          <button
            type="button"
            onClick={() => setCycle("ANNUAL")}
            aria-pressed={cycle === "ANNUAL"}
            className={`min-h-[42px] rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              cycle === "ANNUAL"
                ? "bg-[#F50923] text-white"
                : "text-[#424750] hover:text-[#1E2127]"
            }`}
          >
            Pago anual (ahorro ~10%)
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan, idx) => {
          const benefits: string[] = JSON.parse(plan.benefits || "[]");
          const restrictions: string[] = JSON.parse(plan.restrictions || "[]");
          const base = cycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;
          const withTax = Number((base * (1 + itbisRate)).toFixed(2));
          const annualSavings = Number(
            ((plan.monthlyPrice * 12 - plan.annualPrice) * (1 + itbisRate)).toFixed(2)
          );
          const isFeatured = plan.slug === "confort";

          return (
            <motion.article
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: "some" }}
              transition={{ duration: 0.25, delay: idx * 0.06 }}
              className={`flex flex-col justify-between rounded-xl border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-7 ${
                isFeatured
                  ? "border-2 border-[#F50923]"
                  : "border-gray-200 hover:border-[#424750]"
              }`}
            >
              <div>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-md bg-[#1E2127] px-2.5 py-1 text-xs font-semibold text-white">
                    {plan.targetMode}
                  </span>
                  {isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#F50923]/10 px-2.5 py-1 text-xs font-bold text-[#F50923]">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      Más popular
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-extrabold text-[#1E2127]">{plan.name}</h3>
                <p className="mt-2 text-sm text-[#424750]">{plan.description}</p>

                <div className="mt-5 rounded-lg border border-gray-100 bg-[#FAFAFA] p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#1E2127]">
                      {formatDOP(withTax)}
                    </span>
                    <span className="text-sm font-medium text-[#424750]">
                      / {cycle === "ANNUAL" ? "año" : "mes"} (ITBIS incl.)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#424750]">
                    Base sin impuesto: {formatDOP(base)} + ITBIS (18%)
                  </p>
                  {cycle === "ANNUAL" && annualSavings > 0 && (
                    <p className="mt-1.5 text-xs font-semibold text-emerald-700">
                      Ahorras {formatDOP(annualSavings)} al año frente al pago mensual
                    </p>
                  )}
                </div>

                <div className="mt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E2127]">
                    Beneficios incluidos por vehículo
                  </h4>
                  <ul className="mt-3 space-y-2.5">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-[#1E2127]">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#F50923]"
                          aria-hidden="true"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#424750]">
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                    Condiciones y restricciones
                  </h4>
                  <ul className="mt-2 space-y-1.5">
                    {restrictions.map((r) => (
                      <li key={r} className="text-xs text-[#424750]">
                        • {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <Link
                  href={`/portal?tab=membresias&plan=${plan.id}&cycle=${cycle}`}
                  className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
                    isFeatured
                      ? "bg-[#F50923] text-white hover:bg-[#CC071D]"
                      : "bg-[#1E2127] text-white hover:bg-[#424750]"
                  }`}
                >
                  Contratar membresía
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </motion.article>
          );
        })}
      </div>

      {showComparison && plans.length > 0 && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-[#1E2127] px-6 py-4 text-white">
            <h3 className="text-base font-bold sm:text-lg">
              Tabla comparativa de planes de membresía
            </h3>
            <p className="mt-0.5 text-xs text-gray-300">
              Cobertura por vehículo registrado, tarifas transparentes en RD$ y beneficios anuales no acumulables.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-[#FAFAFA]">
                  <th className="px-5 py-3.5 font-bold text-[#1E2127]">Característica</th>
                  {plans.map((p) => (
                    <th key={p.id} className="px-5 py-3.5 font-extrabold text-[#1E2127]">
                      <span>{p.name}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-[#F50923]">
                        {p.targetMode}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#424750]">
                <tr>
                  <td className="px-5 py-3 font-semibold text-[#1E2127]">Cuota mensual (ITBIS incl.)</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-3 font-semibold text-[#1E2127]">
                      {formatDOP(p.monthlyPrice * (1 + itbisRate))}
                      <span className="block text-[11px] font-normal text-[#424750]">
                        Base {formatDOP(p.monthlyPrice)}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-[#1E2127]">Cuota anual (ITBIS incl.)</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-3 font-semibold text-[#1E2127]">
                      {formatDOP(p.annualPrice * (1 + itbisRate))}
                      <span className="block text-[11px] font-normal text-emerald-700">
                        Ahorra {formatDOP((p.monthlyPrice * 12 - p.annualPrice) * (1 + itbisRate))}/año
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-[#1E2127]">Modalidad de atención</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-3">
                      {p.targetMode === "A domicilio"
                        ? "A domicilio (y centro si prefiere)"
                        : "Centro físico DWay"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-[#1E2127]">Revisiones preventivas 20 pts / año</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-3 font-bold text-[#1E2127]">
                      {p.includedReviews ?? 0} al año
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-[#1E2127]">Pruebas de batería / año</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-3 font-bold text-[#1E2127]">
                      {p.includedBatteryTests ?? 0} al año
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-[#1E2127]">Diagnóstico electrónico escáner / año</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-3">
                      {(p.includedDiagnostics ?? 0) > 0 ? (
                        <span className="font-bold text-[#1E2127]">
                          {p.includedDiagnostics} al año
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <Minus className="h-4 w-4" aria-hidden="true" /> No incluido
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-[#1E2127]">Cambio aceite semisintético / año</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-3">
                      {(p.includedOilChanges ?? 0) > 0 ? (
                        <span className="font-bold text-[#1E2127]">
                          {p.includedOilChanges} al año
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <Minus className="h-4 w-4" aria-hidden="true" /> No incluido
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-[#1E2127]">Descuento en demás servicios</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-3 font-extrabold text-[#F50923]">
                      {p.discountPercent}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-[#1E2127]">Traslado en visitas cubiertas</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-3">
                      {p.targetMode === "A domicilio"
                        ? "Incluido en Distrito Nacional"
                        : "Atención en centro"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-[#1E2127]">Permanencia y vigencia</td>
                  {plans.map((p) => (
                    <td key={p.id} className="px-5 py-3 text-xs">
                      12 meses mínimos en modalidad mensual; renovación automática opcional.
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-[#FAFAFA] px-6 py-4 text-xs text-[#424750]">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#F50923]" aria-hidden="true" />
              <span>
                <strong>Campaña Socios Fundadores y Referidos:</strong> Tarifa congelada 12 meses para clientes fundadores (código <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-[#1E2127] ring-1 ring-gray-200">SOCIOFUNDADOR</code>) y 5% de descuento por referidos (<code className="rounded bg-white px-1.5 py-0.5 font-semibold text-[#1E2127] ring-1 ring-gray-200">REFERIDO5</code>).
              </span>
            </p>
            <span className="font-semibold text-[#1E2127]">30 días de garantía en mano de obra</span>
          </div>
        </div>
      )}
    </div>
  );
}
