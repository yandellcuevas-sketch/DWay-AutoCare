"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Car,
  CreditCard,
  Building2,
  DollarSign,
  History,
  BarChart3,
  Settings,
  DatabaseBackup,
  Search,
  Download,
  Save,
  Printer,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { DWayLogo } from "@/components/DWayLogo";
import {
  APPOINTMENT_STATUS_LABELS,
  FUEL_TYPE_LABELS,
  formatDOP,
  formatDateRD,
  formatDateTimeRD,
} from "@/lib/constants";

export type ExtendedSection =
  | "vehiculos"
  | "membresias"
  | "contratos"
  | "pagos"
  | "historial"
  | "reportes"
  | "configuracion"
  | "respaldos";

interface VehicleRow {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  fuelType: string;
  mileage: number;
  client: { id: string; name: string; email: string; phone: string | null };
  _count: { appointments: number; maintenanceRecords: number };
  subscriptions: Array<{ plan: { name: string } }>;
}

interface PlanRow {
  id: string;
  name: string;
  slug: string;
  targetMode: string;
  monthlyPrice: number;
  annualPrice: number;
  discountPercent: number;
  isActive: boolean;
}

interface SubscriptionRow {
  id: string;
  billingCycle: string;
  status: string;
  startDate: string;
  endDate: string;
  reviewsUsed: number;
  batteryTestsUsed: number;
  diagnosticsUsed: number;
  oilChangesUsed: number;
  plan: {
    name: string;
    includedReviews: number;
    includedBatteryTests: number;
    includedDiagnostics: number;
    includedOilChanges: number;
  };
  client: { name: string; email: string };
  vehicle?: { brand: string; model: string; plate: string } | null;
}

interface MaintenanceRow {
  id: string;
  receiptNumber: string;
  serviceDate: string;
  warrantyExpiresAt: string;
  mileageAtService: number;
  servicesPerformed: string;
  productsUsed: string | null;
  observations: string | null;
  recommendations: string | null;
  totalCost: number;
  vehicle: { brand: string; model: string; plate: string };
  client: { name: string; email: string };
  technician: { user: { name: string } };
  appointment: { bookingCode: string; mode: string };
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AdminModulesExtended({
  section,
  vehicles,
  plans,
  subscriptions,
  companies,
  payments,
  records,
  appointments,
  configs,
  onRefresh,
  onNotify,
}: {
  section: ExtendedSection;
  vehicles: VehicleRow[];
  plans: PlanRow[];
  subscriptions: SubscriptionRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  companies: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payments: any[];
  records: MaintenanceRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appointments: any[];
  configs: Array<{ id: string; key: string; value: string; description: string | null }>;
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", text: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [configDrafts, setConfigDrafts] = useState<Record<string, string>>({});
  const [planDrafts, setPlanDrafts] = useState<
    Record<string, { monthlyPrice: string; annualPrice: string; discountPercent: string; isActive: boolean }>
  >({});

  // Printable record modal
  const recDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRow | null>(null);

  // New contract modal
  const contractDialogRef = useRef<HTMLDialogElement>(null);
  const [contractForm, setContractForm] = useState({
    companyId: companies[0]?.id || "",
    planName: "Flota Básica",
    vehicleCount: "5",
    monthlyFeePerVehicle: "1500",
    discountPercent: "10",
    includedVisitsPerYear: "4",
    notes: "Incluye primera revisión preventiva de evaluación sin costo.",
  });

  // Health check state for backups tab
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.plate.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.client.name.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(q) ||
        r.vehicle.plate.toLowerCase().includes(q) ||
        r.client.name.toLowerCase().includes(q)
    );
  }, [records, search]);

  const allContracts = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = [];
    for (const c of companies) {
      for (const ct of c.contracts || []) {
        rows.push({ ...ct, companyName: c.name, companyRnc: c.rnc });
      }
    }
    return rows;
  }, [companies]);

  const paidPaymentsTotal = useMemo(
    () =>
      payments
        .filter((p) => p.status === "PAID")
        .reduce((acc, p) => acc + Number(p.amount), 0),
    [payments]
  );

  // SECTION: VEHÍCULOS
  if (section === "vehiculos") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1E2127]">
              <Car className="h-5 w-5 text-[#F50923]" />
              Parque Vehicular Registrado ({vehicles.length})
            </h2>
            <p className="text-xs text-[#424750]">
              Inventario completo de vehículos vinculados a clientes y membresías activas.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar placa, marca o dueño..."
              className="min-h-[40px] w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-gray-200 bg-[#FAFAFA] text-xs font-bold uppercase text-[#424750]">
              <tr>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Combustible</th>
                <th className="px-4 py-3">Kilometraje</th>
                <th className="px-4 py-3">Propietario</th>
                <th className="px-4 py-3">Membresía</th>
                <th className="px-4 py-3">Actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.map((v) => (
                <tr key={v.id} className="hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3 font-bold text-[#1E2127]">
                    {v.brand} {v.model} ({v.year})
                    <span className="block text-xs font-normal text-[#424750]">{v.color}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-[#1E2127]">{v.plate}</td>
                  <td className="px-4 py-3 text-xs">
                    {FUEL_TYPE_LABELS[v.fuelType] ?? v.fuelType}
                  </td>
                  <td className="px-4 py-3 text-xs">{v.mileage.toLocaleString()} km</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-semibold text-[#1E2127]">{v.client.name}</span>
                    <span className="block text-[#424750]">{v.client.phone || v.client.email}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {v.subscriptions[0]?.plan ? (
                      <span className="rounded bg-[#F50923]/10 px-2 py-0.5 font-bold text-[#F50923]">
                        {v.subscriptions[0].plan.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">Sin membresía</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {v._count.appointments} citas · {v._count.maintenanceRecords} mant.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // SECTION: MEMBRESÍAS
  if (section === "membresias") {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1E2127]">
            <CreditCard className="h-5 w-5 text-[#F50923]" />
            Planes de Membresía DWay AutoCare
          </h2>
          <p className="mt-0.5 text-xs text-[#424750]">
            Ajusta tarifas netas (RD$) y descuentos aplicables según el plan de negocios.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {plans.map((p) => {
              const draft = planDrafts[p.id] ?? {
                monthlyPrice: String(p.monthlyPrice),
                annualPrice: String(p.annualPrice),
                discountPercent: String(p.discountPercent),
                isActive: p.isActive,
              };
              return (
                <div
                  key={p.id}
                  className="space-y-3 rounded-xl border border-gray-200 bg-[#FAFAFA] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-[#1E2127]">{p.name}</h3>
                      <span className="text-xs font-semibold text-[#F50923]">{p.targetMode}</span>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={(e) =>
                          setPlanDrafts({
                            ...planDrafts,
                            [p.id]: { ...draft, isActive: e.target.checked },
                          })
                        }
                      />
                      Activo
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="mb-1 block font-semibold">Mensual RD$</label>
                      <input
                        type="number"
                        value={draft.monthlyPrice}
                        onChange={(e) =>
                          setPlanDrafts({
                            ...planDrafts,
                            [p.id]: { ...draft, monthlyPrice: e.target.value },
                          })
                        }
                        className="min-h-[36px] w-full rounded border border-gray-300 bg-white px-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold">Anual RD$</label>
                      <input
                        type="number"
                        value={draft.annualPrice}
                        onChange={(e) =>
                          setPlanDrafts({
                            ...planDrafts,
                            [p.id]: { ...draft, annualPrice: e.target.value },
                          })
                        }
                        className="min-h-[36px] w-full rounded border border-gray-300 bg-white px-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold">Desc. %</label>
                      <input
                        type="number"
                        value={draft.discountPercent}
                        onChange={(e) =>
                          setPlanDrafts({
                            ...planDrafts,
                            [p.id]: { ...draft, discountPercent: e.target.value },
                          })
                        }
                        className="min-h-[36px] w-full rounded border border-gray-300 bg-white px-2"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={savingKey === p.id}
                    onClick={async () => {
                      setSavingKey(p.id);
                      const res = await fetch(`/api/memberships/plans/${p.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          monthlyPrice: Number(draft.monthlyPrice),
                          annualPrice: Number(draft.annualPrice),
                          discountPercent: Number(draft.discountPercent),
                          isActive: draft.isActive,
                        }),
                      });
                      setSavingKey(null);
                      if (res.ok) {
                        onNotify("ok", `Plan ${p.name} actualizado correctamente.`);
                        await onRefresh();
                      } else {
                        onNotify("err", "No se pudo actualizar el plan.");
                      }
                    }}
                    className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#1E2127] px-3 text-xs font-semibold text-white hover:bg-[#424750]"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Guardar cambios del plan
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-base font-bold text-[#1E2127]">
            Suscripciones de Clientes ({subscriptions.length})
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-[#FAFAFA] font-bold uppercase text-[#424750]">
                <tr>
                  <th className="px-3 py-2.5">Cliente</th>
                  <th className="px-3 py-2.5">Plan / Ciclo</th>
                  <th className="px-3 py-2.5">Vehículo</th>
                  <th className="px-3 py-2.5">Consumo anual (Rev / Bat / Diag / Aceite)</th>
                  <th className="px-3 py-2.5">Vigencia</th>
                  <th className="px-3 py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-[#1E2127]">{s.client.name}</p>
                      <p className="text-[#424750]">{s.client.email}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold">{s.plan.name}</span> ·{" "}
                      {s.billingCycle === "ANNUAL" ? "Anual" : "Mensual"}
                    </td>
                    <td className="px-3 py-2.5">
                      {s.vehicle ? `${s.vehicle.brand} ${s.vehicle.plate}` : "Cuenta"}
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      R:{s.reviewsUsed}/{s.plan.includedReviews} · B:{s.batteryTestsUsed}/
                      {s.plan.includedBatteryTests} · D:{s.diagnosticsUsed}/
                      {s.plan.includedDiagnostics} · A:{s.oilChangesUsed}/
                      {s.plan.includedOilChanges}
                    </td>
                    <td className="px-3 py-2.5">
                      {formatDateRD(s.startDate)} – {formatDateRD(s.endDate)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // SECTION: CONTRATOS EMPRESARIALES
  if (section === "contratos") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1E2127]">
              <Building2 className="h-5 w-5 text-[#F50923]" />
              Contratos de Flotas Empresariales ({allContracts.length})
            </h2>
            <p className="text-xs text-[#424750]">
              Acuerdos corporativos activos bajo tarifa Flota Básica (RD$1,500 + ITBIS/vehículo), crédito 30 días y primera revisión de evaluación sin costo.
            </p>
          </div>
          {companies.length > 0 && (
            <button
              type="button"
              onClick={() => contractDialogRef.current?.showModal()}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-[#F50923] px-4 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Emitir contrato empresarial
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-gray-200 bg-[#FAFAFA] text-xs font-bold uppercase text-[#424750]">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Empresa / RNC</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Vehículos</th>
                <th className="px-4 py-3">Cuota mensual total</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-xs text-[#424750]">
                    No hay contratos corporativos registrados aún.
                  </td>
                </tr>
              ) : (
                allContracts.map((ct) => (
                  <tr key={ct.id}>
                    <td className="px-4 py-3 font-bold text-[#1E2127]">{ct.contractCode}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1E2127]">{ct.companyName}</p>
                      <p className="text-xs text-[#424750]">RNC {ct.companyRnc}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{ct.planName}</td>
                    <td className="px-4 py-3 font-bold">{ct.vehicleCount}</td>
                    <td className="px-4 py-3 font-bold text-[#F50923]">
                      {formatDOP(Number(ct.monthlyFeePerVehicle) * Number(ct.vehicleCount))} + ITBIS
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {formatDateRD(ct.startDate)} – {formatDateRD(ct.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                        {ct.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <dialog
          ref={contractDialogRef}
          aria-labelledby="dlg-new-ct"
          className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        >
          <h3 id="dlg-new-ct" className="text-lg font-extrabold text-[#1E2127]">
            Nuevo Contrato Corporativo
          </h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/companies/contracts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contractForm),
              });
              if (res.ok) {
                contractDialogRef.current?.close();
                onNotify("ok", "Contrato empresarial emitido.");
                await onRefresh();
              } else {
                onNotify("err", "No se pudo crear el contrato.");
              }
            }}
            className="mt-4 space-y-3 text-xs"
          >
            <div>
              <label className="mb-1 block font-semibold">Empresa</label>
              <select
                value={contractForm.companyId}
                onChange={(e) => setContractForm({ ...contractForm, companyId: e.target.value })}
                className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (RNC {c.rnc})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-semibold">Nombre del plan</label>
                <input
                  required
                  value={contractForm.planName}
                  onChange={(e) => setContractForm({ ...contractForm, planName: e.target.value })}
                  className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Cantidad de vehículos</label>
                <input
                  type="number"
                  min={5}
                  required
                  value={contractForm.vehicleCount}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, vehicleCount: e.target.value })
                  }
                  className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Tarifa / vehículo (RD$)</label>
                <input
                  type="number"
                  required
                  value={contractForm.monthlyFeePerVehicle}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, monthlyFeePerVehicle: e.target.value })
                  }
                  className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Descuento flota %</label>
                <input
                  type="number"
                  min={10}
                  max={15}
                  required
                  value={contractForm.discountPercent}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, discountPercent: e.target.value })
                  }
                  className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => contractDialogRef.current?.close()}
                className="min-h-[40px] rounded-lg border border-gray-300 px-4 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[40px] rounded-lg bg-[#F50923] px-5 font-semibold text-white"
              >
                Crear contrato
              </button>
            </div>
          </form>
        </dialog>
      </div>
    );
  }

  // SECTION: PAGOS Y FACTURACIÓN
  if (section === "pagos") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1E2127]">
              <DollarSign className="h-5 w-5 text-[#F50923]" />
              Registro de Pagos e ITBIS ({payments.length})
            </h2>
            <p className="text-xs text-[#424750]">
              Total pagado confirmado:{" "}
              <strong className="text-[#1E2127]">{formatDOP(paidPaymentsTotal)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "dway-pagos.csv",
                ["Fecha", "Cliente", "Metodo", "Referencia", "ITBIS RD$", "Total RD$", "Estado"],
                payments.map((p) => [
                  formatDateTimeRD(p.createdAt),
                  p.client?.name || "",
                  p.method || "DEMO",
                  p.reference || "",
                  Number(p.taxAmount || 0).toFixed(2),
                  Number(p.amount).toFixed(2),
                  p.status,
                ])
              )
            }
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#1E2127] px-4 text-xs font-semibold text-[#1E2127]"
          >
            <Download className="h-4 w-4" />
            Exportar CSV de pagos
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-[#FAFAFA] font-bold uppercase text-[#424750]">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Método / Referencia</th>
                <th className="px-4 py-3">ITBIS</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5">{formatDateTimeRD(p.createdAt)}</td>
                  <td className="px-4 py-2.5 font-semibold text-[#1E2127]">{p.client?.name}</td>
                  <td className="px-4 py-2.5">
                    {p.method || "DEMO"} · {p.reference || "—"}
                    {p.isDemoPayment && (
                      <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">
                        Demo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{formatDOP(p.taxAmount || 0)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-[#1E2127]">
                    {formatDOP(p.amount)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // SECTION: HISTORIAL DE MANTENIMIENTOS Y COMPROBANTES
  if (section === "historial") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1E2127]">
              <History className="h-5 w-5 text-[#F50923]" />
              Historial Técnico y Comprobantes ({records.length})
            </h2>
            <p className="text-xs text-[#424750]">
              Expedientes cerrados con control de calidad y garantía escrita de 30 días.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar comprobante, placa o cliente..."
              className="min-h-[40px] w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-xs"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredRecords.map((r) => (
            <article
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="text-xs font-bold text-[#F50923]">
                  {r.receiptNumber} · Cita {r.appointment.bookingCode}
                </p>
                <p className="text-sm font-extrabold text-[#1E2127]">
                  {r.vehicle.brand} {r.vehicle.model} ({r.vehicle.plate}) — {r.client.name}
                </p>
                <p className="text-xs text-[#424750]">
                  {formatDateRD(r.serviceDate)} · {r.mileageAtService.toLocaleString()} km ·
                  Técnico: {r.technician.user.name} · Garantía hasta{" "}
                  {formatDateRD(r.warrantyExpiresAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-extrabold text-[#1E2127]">
                  {formatDOP(r.totalCost)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecord(r);
                    recDialogRef.current?.showModal();
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#1E2127] px-3 text-xs font-semibold text-[#1E2127]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Comprobante
                </button>
              </div>
            </article>
          ))}
        </div>

        <dialog
          ref={recDialogRef}
          aria-labelledby="adm-rcpt-title"
          className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        >
          {selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
                <div className="space-y-1.5">
                  <DWayLogo variant="dark" size="sm" />
                  <p className="text-xs font-bold uppercase text-[#F50923]">
                    Comprobante de Servicio Preventivo
                  </p>
                  <h3 id="adm-rcpt-title" className="text-xl font-extrabold text-[#1E2127]">
                    {selectedRecord.receiptNumber}
                  </h3>
                </div>
                <div className="text-right text-xs text-[#424750]">
                  <p>{formatDateRD(selectedRecord.serviceDate)}</p>
                  <p>{selectedRecord.appointment.bookingCode}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#FAFAFA] p-4 text-xs">
                <p>
                  <strong>Cliente:</strong> {selectedRecord.client.name}
                </p>
                <p>
                  <strong>Vehículo:</strong> {selectedRecord.vehicle.brand}{" "}
                  {selectedRecord.vehicle.model} ({selectedRecord.vehicle.plate})
                </p>
                <p>
                  <strong>Técnico:</strong> {selectedRecord.technician.user.name}
                </p>
                <p>
                  <strong>Garantía 30 días:</strong> Hasta{" "}
                  {formatDateRD(selectedRecord.warrantyExpiresAt)}
                </p>
              </div>
              <div className="text-xs">
                <p className="font-bold uppercase text-[#424750]">Servicios</p>
                <ul className="mt-1 space-y-1">
                  {(JSON.parse(selectedRecord.servicesPerformed || "[]") as string[]).map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-extrabold text-[#F50923]">
                  {formatDOP(selectedRecord.totalCost)}
                </span>
              </div>
              <div className="no-print flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => recDialogRef.current?.close()}
                  className="min-h-[40px] rounded-lg border border-gray-300 px-4 text-xs font-semibold"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#1E2127] px-4 text-xs font-semibold text-white"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir
                </button>
              </div>
            </div>
          )}
        </dialog>
      </div>
    );
  }

  // SECTION: REPORTES
  if (section === "reportes") {
    const workshopCount = appointments.filter((a) => a.mode === "WORKSHOP").length;
    const homeCount = appointments.filter((a) => a.mode === "HOME_SERVICE").length;
    const completedTotal = appointments
      .filter((a) => a.status === "COMPLETED")
      .reduce((acc, a) => acc + Number(a.totalAmount), 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1E2127]">
              <BarChart3 className="h-5 w-5 text-[#F50923]" />
              Reportes Operativos y Exportación
            </h2>
            <p className="text-xs text-[#424750]">
              Indicadores reales extraídos de citas, ingresos y demanda de servicios.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "dway-reporte-citas.csv",
                ["Codigo", "Fecha", "Cliente", "Vehiculo", "Modalidad", "Estado", "Total RD$"],
                appointments.map((a) => [
                  a.bookingCode,
                  formatDateTimeRD(a.appointmentDate),
                  a.client?.name || "",
                  `${a.vehicle?.brand || ""} ${a.vehicle?.plate || ""}`,
                  a.mode === "HOME_SERVICE" ? "A domicilio" : "Centro",
                  APPOINTMENT_STATUS_LABELS[a.status] ?? a.status,
                  Number(a.totalAmount).toFixed(2),
                ])
              )
            }
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#F50923] px-4 py-2 text-xs font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Exportar reporte de citas (CSV)
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold text-[#424750]">Citas en Centro Físico</p>
            <p className="mt-1 text-2xl font-extrabold text-[#1E2127]">{workshopCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold text-[#424750]">Citas Unidad Móvil</p>
            <p className="mt-1 text-2xl font-extrabold text-[#F50923]">{homeCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold text-[#424750]">Facturación Citas Completadas</p>
            <p className="mt-1 text-2xl font-extrabold text-[#1E2127]">
              {formatDOP(completedTotal)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold text-[#424750]">Membresías Vigentes</p>
            <p className="mt-1 text-2xl font-extrabold text-[#1E2127]">
              {subscriptions.filter((s) => s.status === "ACTIVE").length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SECTION: CONFIGURACIÓN DEL SISTEMA
  if (section === "configuracion") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1E2127]">
            <Settings className="h-5 w-5 text-[#F50923]" />
            Parámetros Operativos y Tributarios
          </h2>
          <p className="mt-0.5 text-xs text-[#424750]">
            Edita horarios de apertura/cierre, tasa de ITBIS, buffers entre citas y duración de garantía. Los cambios impactan de inmediato la agenda y los cálculos.
          </p>

          <div className="mt-4 divide-y divide-gray-100">
            {configs.map((cfg) => {
              const draftVal = configDrafts[cfg.key] ?? cfg.value;
              return (
                <div
                  key={cfg.id}
                  className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-mono text-xs font-bold text-[#1E2127]">{cfg.key}</p>
                    <p className="text-xs text-[#424750]">{cfg.description || cfg.key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={draftVal}
                      onChange={(e) =>
                        setConfigDrafts({ ...configDrafts, [cfg.key]: e.target.value })
                      }
                      aria-label={`Valor de ${cfg.key}`}
                      className="min-h-[38px] w-48 rounded-lg border border-gray-300 px-3 text-xs font-semibold"
                    />
                    <button
                      type="button"
                      disabled={savingKey === cfg.key}
                      onClick={async () => {
                        setSavingKey(cfg.key);
                        const res = await fetch("/api/admin/operations", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            kind: "SYSTEM_CONFIG",
                            key: cfg.key,
                            value: draftVal,
                          }),
                        });
                        setSavingKey(null);
                        if (res.ok) {
                          onNotify("ok", `Parámetro ${cfg.key} actualizado.`);
                          await onRefresh();
                        } else {
                          onNotify("err", "No se pudo guardar el parámetro.");
                        }
                      }}
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#1E2127] px-3 text-xs font-semibold text-white"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Guardar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // SECTION: RESPALDOS
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-4 rounded-xl border border-[#424750]/20 bg-[#1E2127] p-6 text-white lg:col-span-6">
        <DWayLogo variant="light" size="md" />
        <h2 className="text-xl font-extrabold">Respaldo de Base de Datos</h2>
        <p className="text-sm text-gray-300">
          Descarga una copia íntegra e instantánea de la base de datos activa (archivo binario SQLite en local o exportación JSON completa en PostgreSQL en la nube) con todos los
          clientes, vehículos, membresías, citas, contratos, historial técnico y pagos.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="/api/admin/backup"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#F50923] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#CC071D]"
          >
            <DatabaseBackup className="h-4 w-4" />
            Descargar respaldo ahora
          </a>
          <button
            type="button"
            onClick={async () => {
              const r = await fetch("/api/health");
              const j = await r.json();
              setHealthStatus(
                r.ok
                  ? `Sistema saludable · BD conectada (${j.database || "SQLite OK"})`
                  : "Error verificando salud del sistema"
              );
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-400 px-4 py-2 text-xs font-semibold text-white"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Verificar integridad del servidor
          </button>
        </div>
        {healthStatus && (
          <p className="rounded-lg bg-black/30 px-3 py-2 text-xs text-emerald-300">
            {healthStatus}
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 lg:col-span-6">
        <h3 className="text-base font-bold text-[#1E2127]">
          Protocolo de Respaldo y Restauración Local
        </h3>
        <ul className="space-y-2 text-xs leading-relaxed text-[#424750]">
          <li>
            • <strong>Respaldo rápido desde Windows:</strong> Ejecuta{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[#1E2127]">
              RESPALDO_DWAY.bat
            </code>{" "}
            en la carpeta raíz para guardar un archivo fechado dentro de <code>backups/</code>.
          </li>
          <li>
            • <strong>Migraciones seguras:</strong> Toda actualización conserva los registros de
            clientes, vehículos y citas mediante respaldos previos automáticos.
          </li>
          <li>
            • <strong>Modo sin conexión:</strong> El sistema opera 100% en la red local con
            fuentes Montserrat empaquetadas localmente e interfaz adaptada para demostración en
            vivo.
          </li>
        </ul>
      </div>
    </div>
  );
}
