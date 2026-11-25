"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building, CarFront, Clock, AlertCircle, CalendarPlus } from "lucide-react";
import { ServiceIcon } from "./ServiceIcon";
import { formatDOP } from "@/lib/constants";

export interface CatalogService {
  id: string;
  slug: string;
  category: string;
  name: string;
  description: string;
  price: number;
  homePrice: number | null;
  estimatedDuration: number;
  isAvailableWorkshop: boolean;
  isAvailableHome: boolean;
  requiresLift: boolean;
  imageUrl: string | null;
  iconName: string | null;
  conditions: string | null;
}

export function ServiceCatalogGrid({
  services,
  itbisRate = 0.18,
}: {
  services: CatalogService[];
  itbisRate?: number;
}) {
  const [filter, setFilter] = useState<"ALL" | "WORKSHOP" | "HOME">("ALL");

  const filtered = services.filter((s) => {
    if (filter === "WORKSHOP") return s.isAvailableWorkshop;
    if (filter === "HOME") return s.isAvailableHome;
    return true;
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div
          role="group"
          aria-label="Filtrar servicios por modalidad"
          className="inline-flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-1.5"
        >
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            aria-pressed={filter === "ALL"}
            className={`min-h-[42px] rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              filter === "ALL"
                ? "bg-[#1E2127] text-white"
                : "text-[#424750] hover:text-[#1E2127]"
            }`}
          >
            Todos ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("WORKSHOP")}
            aria-pressed={filter === "WORKSHOP"}
            className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              filter === "WORKSHOP"
                ? "bg-[#1E2127] text-white"
                : "text-[#424750] hover:text-[#1E2127]"
            }`}
          >
            <Building className="h-4 w-4" aria-hidden="true" />
            En Taller
          </button>
          <button
            type="button"
            onClick={() => setFilter("HOME")}
            aria-pressed={filter === "HOME"}
            className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              filter === "HOME"
                ? "bg-[#F50923] text-white"
                : "text-[#424750] hover:text-[#1E2127]"
            }`}
          >
            <CarFront className="h-4 w-4" aria-hidden="true" />
            A Domicilio
          </button>
        </div>

        <p className="text-xs font-medium text-[#424750]">
          Precios expresados en RD$ (base sin impuesto y precio final con 18% ITBIS).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => {
          const workshopWithTax = Number((s.price * (1 + itbisRate)).toFixed(2));
          const homeWithTax =
            s.homePrice !== null ? Number((s.homePrice * (1 + itbisRate)).toFixed(2)) : null;

          return (
            <article
              key={s.id}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-[#424750]"
            >
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1E2127] text-white">
                    <ServiceIcon name={s.iconName} className="h-5 w-5 text-[#F50923]" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {s.isAvailableWorkshop && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-[#1E2127]">
                        <Building className="h-3.5 w-3.5" aria-hidden="true" />
                        Taller
                      </span>
                    )}
                    {s.isAvailableHome ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#F50923]/10 px-2.5 py-1 text-xs font-semibold text-[#F50923]">
                        <CarFront className="h-3.5 w-3.5" aria-hidden="true" />
                        Domicilio
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-[#424750]">
                        Solo taller
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-[#F50923]">
                  {s.category}
                </span>
                <h3 className="mt-1 text-lg font-bold text-[#1E2127]">{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#424750]">{s.description}</p>

                <div className="mt-4 space-y-2 rounded-lg border border-gray-100 bg-[#FAFAFA] p-3.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#424750]">En taller (c/ ITBIS):</span>
                    <span className="font-bold text-[#1E2127]">
                      {formatDOP(workshopWithTax)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#424750]">
                    <span>Base sin impuesto:</span>
                    <span>{formatDOP(s.price)}</span>
                  </div>

                  {s.isAvailableHome && homeWithTax !== null && (
                    <>
                      <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#424750]">
                          A domicilio (c/ ITBIS):
                        </span>
                        <span className="font-bold text-[#F50923]">
                          {formatDOP(homeWithTax)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#424750]">
                        <span>Base domicilio sin ITBIS:</span>
                        <span>{formatDOP(s.homePrice)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#424750]">
                  <Clock className="h-4 w-4 text-[#1E2127]" aria-hidden="true" />
                  <span>Duración estimada: {s.estimatedDuration} minutos</span>
                </div>

                {s.conditions && (
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-[#424750]">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#424750]" aria-hidden="true" />
                    <span>{s.conditions}</span>
                  </p>
                )}
              </div>

              <div className="mt-5 pt-2">
                <Link
                  href={`/agendar?service=${s.id}`}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#1E2127] bg-white px-4 py-2.5 text-sm font-semibold text-[#1E2127] transition-colors hover:bg-[#1E2127] hover:text-white"
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  Agendar este servicio
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
