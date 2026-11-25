"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Building2, Plus, Eye, FileText, Tag } from "lucide-react";
import {
  APPOINTMENT_STATUS_LABELS,
  formatDOP,
  formatDateRD,
  formatDateTimeRD,
} from "@/lib/constants";

interface ClientListRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  internalNotes: string | null;
  createdAt: string;
  vehicles: Array<{ id: string; brand: string; model: string; year: number; plate: string }>;
  subscriptions: Array<{ status: string; plan: { name: string } }>;
  _count: { clientAppointments: number; maintenanceRecordsClient: number; payments: number };
}

interface CompanyRow {
  id: string;
  name: string;
  rnc: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  vehicleCount: number | null;
  estimatedFrequency: string | null;
  notes: string | null;
  internalNotes: string | null;
  status: string;
  createdAt: string;
  contracts: Array<{
    id: string;
    contractCode: string;
    planName: string;
    monthlyFeePerVehicle: number;
    vehicleCount: number;
    status: string;
    startDate: string;
    endDate: string;
  }>;
}

interface ClientDossier {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  internalNotes: string | null;
  vehicles: Array<{ id: string; brand: string; model: string; year: number; plate: string; mileage: number }>;
  clientAppointments: Array<{
    id: string;
    bookingCode: string;
    appointmentDate: string;
    status: string;
    totalAmount: number;
    vehicle: { plate: string };
  }>;
  maintenanceRecordsClient: Array<{
    id: string;
    receiptNumber: string;
    serviceDate: string;
    totalCost: number;
    vehicle: { plate: string };
  }>;
  subscriptions: Array<{
    id: string;
    status: string;
    endDate: string;
    plan: { name: string };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string | null;
    createdAt: string;
  }>;
}

export function AdminClientsAndCommercial({
  clients,
  companies,
  promotions,
  payments,
  notificationsLog,
  forcedTab,
  onRefresh,
  onNotify,
}: {
  clients: ClientListRow[];
  companies: CompanyRow[];
  promotions: Array<{ id: string; code: string; name: string; discountPercent: number; currentUses: number; isActive: boolean }>;
  payments: Array<{ id: string; amount: number; status: string; method: string | null; reference: string | null; isDemoPayment: boolean; createdAt: string; client: { name: string } }>;
  notificationsLog: Array<{ id: string; channel: string; title: string; deliveryStatus: string; providerResponse: string | null; createdAt: string; user: { name: string; email: string } }>;
  forcedTab?: "clientes" | "empresas" | "comercial";
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", text: string) => void;
}) {
  const [subTab, setSubTab] = useState<"clientes" | "empresas" | "comercial">(forcedTab || "clientes");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (forcedTab) setSubTab(forcedTab);
  }, [forcedTab]);

  // Client dossier modal
  const dossierRef = useRef<HTMLDialogElement>(null);
  const [dossier, setDossier] = useState<ClientDossier | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  // Contract modal
  const contractRef = useRef<HTMLDialogElement>(null);
  const [targetCompany, setTargetCompany] = useState<CompanyRow | null>(null);
  const [contractForm, setContractForm] = useState({
    planName: "Flota Básica",
    vehicleCount: "5",
    monthlyFeePerVehicle: "1500",
    discountPercent: "10",
    includedVisitsPerYear: "4",
    notes: "",
  });

  // Promo form
  const [promoForm, setPromoForm] = useState({
    code: "",
    name: "",
    description: "",
    discountPercent: "5",
  });

  const filteredClients = clients.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone || "").includes(q) ||
      c.vehicles.some((v) => v.plate.toLowerCase().includes(q))
    );
  });

  const openClientDossier = async (id: string) => {
    const res = await fetch(`/api/admin/clients/${id}`);
    if (res.ok) {
      const data = await res.json();
      setDossier(data.client);
      setNotesDraft(data.client.internalNotes || "");
      dossierRef.current?.showModal();
    }
  };

  const handleSaveClientNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier) return;
    const res = await fetch(`/api/admin/clients/${dossier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalNotes: notesDraft }),
    });
    if (res.ok) {
      onNotify("ok", "Observaciones internas del cliente actualizadas.");
      await onRefresh();
    }
  };

  const handleUpdateCompanyStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      onNotify("ok", "Estado de oportunidad empresarial actualizado.");
      await onRefresh();
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCompany) return;
    const res = await fetch("/api/companies/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: targetCompany.id,
        ...contractForm,
        vehicleCount: Number(contractForm.vehicleCount),
        monthlyFeePerVehicle: Number(contractForm.monthlyFeePerVehicle),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onNotify("err", data.error);
    } else {
      contractRef.current?.close();
      onNotify("ok", `Contrato ${data.contract.contractCode} creado.`);
      await onRefresh();
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "PROMOTION", ...promoForm }),
    });
    if (res.ok) {
      setPromoForm({ code: "", name: "", description: "", discountPercent: "5" });
      onNotify("ok", "Promoción creada.");
      await onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      {!forcedTab && (
        <div className="flex flex-wrap gap-2">
          {[
            { id: "clientes", label: `Clientes (${clients.length})` },
            { id: "empresas", label: `Empresas y Contratos (${companies.length})` },
            { id: "comercial", label: "Pagos, Promociones y Envíos" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`min-h-[40px] rounded-lg px-4 py-2 text-xs font-semibold ${
                subTab === t.id
                  ? "bg-[#1E2127] text-white"
                  : "border border-gray-200 bg-white text-[#424750]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* CLIENTES */}
      {subTab === "clientes" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, correo, teléfono o placa..."
              className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-[#FAFAFA] text-xs font-bold uppercase text-[#424750]">
                <tr>
                  <th scope="col" className="px-4 py-3">Cliente</th>
                  <th scope="col" className="px-4 py-3">Teléfono</th>
                  <th scope="col" className="px-4 py-3">Vehículos</th>
                  <th scope="col" className="px-4 py-3">Membresía</th>
                  <th scope="col" className="px-4 py-3">Citas / Mant.</th>
                  <th scope="col" className="px-4 py-3">Expediente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#1E2127]">{c.name}</p>
                      <p className="text-xs text-[#424750]">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {c.vehicles.map((v) => `${v.brand} ${v.plate}`).join(", ") || "Ninguno"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.subscriptions.find((s) => s.status === "ACTIVE")?.plan.name || "Sin plan"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c._count.clientAppointments} citas · {c._count.maintenanceRecordsClient} mant.
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openClientDossier(c.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#1E2127] px-3 py-1.5 text-xs font-semibold text-[#1E2127]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver expediente
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPRESAS Y CONTRATOS */}
      {subTab === "empresas" && (
        <div className="space-y-4">
          {companies.map((comp) => (
            <article
              key={comp.id}
              className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#F50923]" />
                    <h3 className="text-lg font-extrabold text-[#1E2127]">{comp.name}</h3>
                    <span className="rounded bg-[#1E2127] px-2 py-0.5 text-xs font-semibold text-white">
                      {comp.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#424750]">
                    RNC: {comp.rnc} · Contacto: {comp.contactName} ({comp.contactPhone} ·{" "}
                    {comp.contactEmail}) · Flota: {comp.vehicleCount ?? "—"} vehículos
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    aria-label={`Estado de ${comp.name}`}
                    value={comp.status}
                    onChange={(e) => handleUpdateCompanyStatus(comp.id, e.target.value)}
                    className="min-h-[38px] rounded-lg border border-gray-300 px-3 text-xs font-semibold"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="CONTACTED">Contactada</option>
                    <option value="ACTIVE">Activa</option>
                    <option value="ARCHIVED">Archivada</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetCompany(comp);
                      setContractForm((prev) => ({
                        ...prev,
                        vehicleCount: String(comp.vehicleCount || 5),
                      }));
                      contractRef.current?.showModal();
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#F50923] px-3.5 py-1.5 text-xs font-semibold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nuevo contrato
                  </button>
                </div>
              </div>

              {comp.notes && (
                <p className="mt-3 text-xs text-[#424750]">
                  <strong>Observaciones de solicitud:</strong> {comp.notes}
                </p>
              )}

              {comp.contracts.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold uppercase text-[#424750]">
                    Contratos vigentes
                  </p>
                  {comp.contracts.map((ct) => (
                    <div
                      key={ct.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FAFAFA] p-3 text-xs"
                    >
                      <span>
                        <strong>{ct.contractCode}</strong> · {ct.planName} ({ct.vehicleCount}{" "}
                        vehículos × {formatDOP(ct.monthlyFeePerVehicle)} + ITBIS/mes)
                      </span>
                      <span className="font-semibold text-emerald-700">
                        {formatDateRD(ct.startDate)} – {formatDateRD(ct.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* COMERCIAL: PAGOS, PROMOCIONES Y NOTIFICACIONES */}
      {subTab === "comercial" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="flex items-center gap-2 text-base font-bold text-[#1E2127]">
                <Tag className="h-4 w-4 text-[#F50923]" />
                Promociones y códigos de descuento
              </h3>
              <form onSubmit={handleCreatePromo} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  required
                  placeholder="Código (ej. VERANO10)"
                  value={promoForm.code}
                  onChange={(e) =>
                    setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })
                  }
                  className="min-h-[40px] rounded-lg border border-gray-300 px-3 text-xs uppercase"
                />
                <input
                  required
                  placeholder="Nombre promoción"
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  className="min-h-[40px] rounded-lg border border-gray-300 px-3 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  placeholder="% Descuento"
                  value={promoForm.discountPercent}
                  onChange={(e) =>
                    setPromoForm({ ...promoForm, discountPercent: e.target.value })
                  }
                  className="min-h-[40px] rounded-lg border border-gray-300 px-3 text-xs"
                />
                <button
                  type="submit"
                  className="min-h-[40px] rounded-lg bg-[#1E2127] px-4 text-xs font-semibold text-white"
                >
                  Crear código
                </button>
              </form>
              <ul className="mt-4 space-y-2 text-xs">
                {promotions.map((pr) => (
                  <li
                    key={pr.id}
                    className="flex justify-between rounded-lg bg-[#FAFAFA] p-2.5"
                  >
                    <span>
                      <strong>{pr.code}</strong> — {pr.name} ({pr.discountPercent}%)
                    </span>
                    <span className="text-[#424750]">{pr.currentUses} usos</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-bold text-[#1E2127]">
                Registro real de notificaciones y envíos
              </h3>
              <p className="mt-1 text-xs text-[#424750]">
                Los canales externos sin API configurada muestran estado{" "}
                <code>NOT_CONFIGURED</code> en lugar de simular envíos.
              </p>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto text-xs">
                {notificationsLog.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg border border-gray-100 bg-[#FAFAFA] p-2.5"
                  >
                    <div className="flex justify-between font-bold">
                      <span>
                        [{n.channel}] {n.title}
                      </span>
                      <span
                        className={
                          n.deliveryStatus === "DELIVERED"
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }
                      >
                        {n.deliveryStatus}
                      </span>
                    </div>
                    <p className="text-gray-500">
                      {n.user.email} · {formatDateTimeRD(n.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-6">
            <h3 className="flex items-center gap-2 text-base font-bold text-[#1E2127]">
              <FileText className="h-4 w-4 text-[#F50923]" />
              Pagos registrados ({payments.length})
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-[#FAFAFA] font-bold uppercase text-[#424750]">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Método</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2">{formatDateRD(p.createdAt)}</td>
                      <td className="px-3 py-2 font-semibold">{p.client.name}</td>
                      <td className="px-3 py-2">
                        {p.method || "DEMO"} {p.isDemoPayment ? "(Demo)" : ""}
                      </td>
                      <td className="px-3 py-2 text-right font-bold">
                        {formatDOP(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Client Dossier Dialog */}
      <dialog
        ref={dossierRef}
        aria-labelledby="dlg-dossier-title"
        className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        {dossier && (
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b border-gray-200 pb-3">
              <div>
                <h1 id="dlg-dossier-title" className="text-xl font-extrabold text-[#1E2127]">
                  Expediente: {dossier.name}
                </h1>
                <p className="text-xs text-[#424750]">
                  {dossier.email} · {dossier.phone || "Sin teléfono"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dossierRef.current?.close()}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-lg bg-[#FAFAFA] p-3">
                <p className="font-bold uppercase text-[#424750]">Vehículos</p>
                <ul className="mt-1 space-y-1">
                  {dossier.vehicles.map((v) => (
                    <li key={v.id}>
                      • {v.brand} {v.model} ({v.year}) · {v.plate} ·{" "}
                      {v.mileage.toLocaleString()} km
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-[#FAFAFA] p-3">
                <p className="font-bold uppercase text-[#424750]">Membresías</p>
                <ul className="mt-1 space-y-1">
                  {dossier.subscriptions.length === 0 ? (
                    <li>Sin membresías</li>
                  ) : (
                    dossier.subscriptions.map((s) => (
                      <li key={s.id}>
                        • {s.plan.name} ({s.status}) — vence {formatDateRD(s.endDate)}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            <div className="text-xs">
              <p className="font-bold uppercase text-[#424750]">Últimas citas</p>
              <ul className="mt-1 space-y-1">
                {dossier.clientAppointments.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex justify-between rounded bg-[#FAFAFA] p-2">
                    <span>
                      <strong>{a.bookingCode}</strong> ({a.vehicle.plate}) —{" "}
                      {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
                    </span>
                    <span className="font-bold">{formatDOP(a.totalAmount)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleSaveClientNotes} className="space-y-2 border-t pt-3">
              <label htmlFor="dos-notes" className="block text-xs font-bold text-[#1E2127]">
                Observaciones internas del equipo
              </label>
              <textarea
                id="dos-notes"
                rows={2}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
              />
              <button
                type="submit"
                className="min-h-[40px] rounded-lg bg-[#1E2127] px-4 py-2 text-xs font-semibold text-white"
              >
                Guardar observaciones
              </button>
            </form>
          </div>
        )}
      </dialog>

      {/* Create Corporate Contract Dialog */}
      <dialog
        ref={contractRef}
        aria-labelledby="dlg-contract-title"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h1 id="dlg-contract-title" className="text-lg font-extrabold text-[#1E2127]">
          Nuevo contrato para {targetCompany?.name}
        </h1>
        <form onSubmit={handleCreateContract} className="mt-4 space-y-3">
          <div>
            <label htmlFor="ct-plan" className="mb-1 block text-xs font-semibold">
              Nombre del plan
            </label>
            <input
              id="ct-plan"
              required
              value={contractForm.planName}
              onChange={(e) =>
                setContractForm({ ...contractForm, planName: e.target.value })
              }
              className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ct-veh" className="mb-1 block text-xs font-semibold">
                Cantidad vehículos
              </label>
              <input
                id="ct-veh"
                type="number"
                min={1}
                required
                value={contractForm.vehicleCount}
                onChange={(e) =>
                  setContractForm({ ...contractForm, vehicleCount: e.target.value })
                }
                className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ct-fee" className="mb-1 block text-xs font-semibold">
                Cuota/vehículo (RD$)
              </label>
              <input
                id="ct-fee"
                type="number"
                required
                value={contractForm.monthlyFeePerVehicle}
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    monthlyFeePerVehicle: e.target.value,
                  })
                }
                className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => contractRef.current?.close()}
              className="min-h-[42px] rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[42px] rounded-lg bg-[#F50923] px-5 py-2 text-xs font-semibold text-white"
            >
              Crear contrato
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
