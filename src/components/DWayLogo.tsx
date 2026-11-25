import React from "react";

interface DWayLogoProps {
  /**
   * "light": superficie oscura (#1E2127 / #1E2128) — renderiza PNG transparente directamente.
   * "dark": superficie clara (#FAFAFA / #FFFFFF) — encapsula el PNG transparente en placa corporativa #1E2128 sin alterar colores ni proporciones originales.
   * "original": versión íntegra original sin recorte ni transparencia.
   */
  variant?: "dark" | "light" | "original";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_DIMENSIONS = {
  sm: { width: 92, height: 52, imgClass: "h-7 w-auto" },
  md: { width: 120, height: 68, imgClass: "h-9 w-auto sm:h-10" },
  lg: { width: 158, height: 90, imgClass: "h-12 w-auto sm:h-14" },
  xl: { width: 210, height: 119, imgClass: "h-16 w-auto sm:h-20" },
} as const;

export function DWayLogo({
  variant = "dark",
  size = "md",
  className = "",
}: DWayLogoProps) {
  const dims = SIZE_DIMENSIONS[size];

  if (variant === "original") {
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`}>
        <img
          src="/images/branding/dway-logo-original.jpg"
          alt="DWay AutoCare — Tú eliges dónde, nosotros cuidamos tu vehículo"
          width={dims.width}
          height={dims.width}
          className={`aspect-square rounded-lg object-contain ${
            size === "sm"
              ? "h-10 w-10"
              : size === "md"
                ? "h-12 w-12"
                : size === "lg"
                  ? "h-16 w-16"
                  : "h-24 w-24"
          }`}
        />
      </span>
    );
  }

  if (variant === "light") {
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`}>
        <img
          src="/images/branding/dway-logo-transparent.png"
          alt="DWay AutoCare"
          width={dims.width}
          height={dims.height}
          className={`select-none object-contain ${dims.imgClass}`}
        />
      </span>
    );
  }

  // variant === "dark" (colocado sobre fondos claros #FAFAFA o #FFFFFF manteniendo fidelidad cromática)
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-lg bg-[#1E2128] px-2.5 py-1 shadow-xs ring-1 ring-[#1E2127]/15 ${className}`}
    >
      <img
        src="/images/branding/dway-logo-transparent.png"
        alt="DWay AutoCare"
        width={dims.width}
        height={dims.height}
        className={`select-none object-contain ${dims.imgClass}`}
      />
    </span>
  );
}
