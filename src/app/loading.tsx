import { DWayLogo } from "@/components/DWayLogo";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 bg-[#FAFAFA] px-4"
    >
      <div className="rounded-2xl bg-[#1E2127] px-6 py-4 shadow-sm">
        <DWayLogo variant="light" size="lg" />
      </div>
      <div className="flex items-center gap-3 text-sm font-semibold text-[#424750]">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-[#1E2127]/20 border-t-[#F50923]"
          aria-hidden="true"
        />
        <span>Cargando DWay AutoCare...</span>
      </div>
    </div>
  );
}
