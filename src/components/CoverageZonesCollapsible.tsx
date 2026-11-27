"use client";

import React, { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { AnimatedCollapse } from "./MotionPrimitives";

export interface CoverageZoneView {
  id: string;
  sector: string;
  surchargeFee: number;
}

export function CoverageZonesCollapsible({ zones }: { zones: CoverageZoneView[] }) {
  const [open, setOpen] = useState(false);

  const renderBadges = (compact: boolean) => (
    <div className={`flex flex-wrap ${compact ? "gap-1.5 pt-3" : "mt-4 gap-2"}`}>
      {zones.map((z) => (
        <span
          key={z.id}
          className={`inline-flex items-center gap-1 rounded-md border ${
            compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1 text-xs"
          } font-semibold ${
            z.surchargeFee > 0
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : compact
              ? "border-gray-200 bg-white text-[#1E2127]"
              : "border-gray-200 bg-[#FAFAFA] text-[#1E2127]"
          }`}
        >
          <MapPin className="h-3 w-3 text-[#F50923]" aria-hidden="true" />
          {z.sector}
          {z.surchargeFee > 0 && ` (+RD$${z.surchargeFee})`}
        </span>
      ))}
    </div>
  );

  return (
    <>
      <div className="hidden md:block">{renderBadges(false)}</div>

      <div className="mt-3 rounded-lg border border-gray-200 bg-[#FAFAFA] p-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex min-h-[42px] w-full items-center justify-between text-left text-xs font-bold text-[#1E2127]"
        >
          <span>Ver {zones.length} sectores cubiertos</span>
          <span className="inline-flex items-center gap-1 text-[#F50923]">
            {open ? "Ocultar" : "Desplegar"}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </span>
        </button>
        <AnimatedCollapse isOpen={open}>{renderBadges(true)}</AnimatedCollapse>
      </div>
    </>
  );
}
