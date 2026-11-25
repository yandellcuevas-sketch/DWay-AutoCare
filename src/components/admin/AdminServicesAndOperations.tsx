"use client";

import React, { useRef, useState } from "react";
import {
  Wrench,
  Plus,
  Edit3,
  Clock,
  MapPin,
  CalendarOff,
  Download,
  Settings,
  Trash2,
} from "lucide-react";
import { formatDOP, formatDateRD } from "@/lib/constants";

interface AdminService {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  homePrice: number | null;
  estimatedDuration: number;
  isAvailableWorkshop: boolean;
  isAvailableHome: boolean;
  requiresLift: boolean;
  isActive: boolean;
  conditions: string | null;
}

interface TechnicianRow {
  id: string;
  canDriveMobileUnit: boolean;
  isActive: boolean;
  user: { name: string; email: string; phone: string | null };
  workSchedules: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
}

interface OperationsData {
  technicians: TechnicianRow[];
  resources: Array<{ id: string; name: string; type: string; capacity: number; isActive: boolean }>;
  mobileUnits: Array<{ id: string; name: string; plate: string; vehicleModel: string; isActive: boolean }>;
  holidays: Array<{ id: string; date: string; name: string; isRecurring: boolean }>;
  blockedSlots: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string | null;
    technician?: { user: { name: string } } | null;
    resource?: { name: string } | null;
    mobileUnit?: { name: string } | null;
  }>;
  zones: Array<{ id: string; province: string; municipality: string; sector: string; travelTimeMinutes: number; surchargeFee: number; isActive: boolean }>;
  configs: Array<{ id: string; key: string; value: string; description: string | null }>;
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function AdminServicesAndOperations({
  mode,
  services,
  operations,
  onRefresh,
  onNotify,
}: {
  mode: "servicios" | "operativa";
  services: AdminService[];
  operations: OperationsData;
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", text: string) => void;
}) {
  // Service Edit/Create Dialog
  const srvDialogRef = useRef<HTMLDialogElement>(null);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [sForm, setSForm] = useState({
    name: "",
    category: "Lubricación y Filtros",
    description: "",
    price: "",
    homePrice: "",
    estimatedDuration: "45",
    isAvailableWorkshop: true,
    isAvailableHome: true,
    requiresLift: false,
    isActive: true,
    conditions: "",
  });

  // Block Slot Form
  const [blockForm, setBlockForm] = useState({
    date: "",
    startTime: "08:00",
    endTime: "12:00",
    reason: "Mantenimiento de equipos",
    technicianId: "",
  });

  // Holiday Form
  const [holForm, setHolForm] = useState({ date: "", name: "", isRecurring: false });

  // Coverage Zone Form
  const [zoneForm, setZoneForm] = useState({
    sector: "",
    travelTimeMinutes: "30",
    surchargeFee: "0",
  });

  const openServiceModal = (s?: AdminService) => {
    if (s) {
      setEditingService(s);
      setSForm({
        name: s.name,
        category: s.category,
        description: s.description,
        price: String(s.price),
        homePrice: s.homePrice !== null ? String(s.homePrice) : "",
        estimatedDuration: String(s.estimatedDuration),
        isAvailableWorkshop: s.isAvailableWorkshop,
        isAvailableHome: s.isAvailableHome,
        requiresLift: s.requiresLift,
        isActive: s.isActive,
        conditions: s.conditions || "",
      });
    } else {
      setEditingService(null);
      setSForm({
        name: "",
        category: "Lubricación y Filtros",
        description: "",
        price: "",
        homePrice: "",
        estimatedDuration: "45",
        isAvailableWorkshop: true,
        isAvailableHome: false,
        requiresLift: false,
        isActive: true,
        conditions: "",
      });
    }
    srvDialogRef.current?.showModal();
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingService
      ? `/api/services/${editingService.id}`
      : "/api/services";
    const method = editingService ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...sForm,
        price: Number(sForm.price),
        homePrice: sForm.isAvailableHome && sForm.homePrice ? Number(sForm.homePrice) : null,
        estimatedDuration: Number(sForm.estimatedDuration),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onNotify("err", data.error || "No se pudo guardar el servicio.");
    } else {
      srvDialogRef.current?.close();
      onNotify("ok", "Catálogo de servicios actualizado.");
      await onRefresh();
    }
  };

  const handleToggleService = async (s: AdminService) => {
    await fetch(`/api/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    onNotify("ok", `Servicio "${s.name}" ${s.isActive ? "desactivado" : "activado"}.`);
    await onRefresh();
  };

  const postOp = async (payload: Record<string, unknown>, msg: string) => {
    const res = await fetch("/api/admin/operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      onNotify("ok", msg);
      await onRefresh();
    } else {
      const d = await res.json();
      onNotify("err", d.error || "Error en operación.");
    }
  };

  const deleteOp = async (kind: string, id: string) => {
    await fetch(`/api/admin/operations?kind=${kind}&id=${id}`, { method: "DELETE" });
    onNotify("ok", "Registro eliminado.");
    await onRefresh();
  };

  if (mode === "servicios") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#424750]">
            Precios base expresados en RD$ sin ITBIS. Cualquier cambio se refleja de
            inmediato en el sitio público y en el agendador.
          </p>
          <button
            type="button"
            onClick={() => openServiceModal()}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-[#F50923] px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Nuevo servicio
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-[#FAFAFA] text-xs font-bold uppercase text-[#424750]">
              <tr>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Taller</th>
                <th className="px-4 py-3">Domicilio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3">
                    <p className="font-bold text-[#1E2127]">{s.name}</p>
                    <p className="text-xs text-[#424750]">{s.category}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{s.estimatedDuration} min</td>
                  <td className="px-4 py-3 font-semibold">{formatDOP(s.price)}</td>
                  <td className="px-4 py-3 text-xs">
                    {s.isAvailableHome && s.homePrice !== null
                      ? formatDOP(s.homePrice)
                      : "Solo taller"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleService(s)}
                      className={`rounded px-2.5 py-1 text-xs font-bold ${
                        s.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {s.isActive ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openServiceModal(s)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1E2127] px-3 py-1.5 text-xs font-semibold"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Service Edit/Create Dialog */}
        <dialog
          ref={srvDialogRef}
          aria-labelledby="dlg-srv-title"
          className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        >
          <h1 id="dlg-srv-title" className="text-lg font-extrabold text-[#1E2127]">
            {editingService ? `Editar: ${editingService.name}` : "Nuevo servicio preventivo"}
          </h1>
          <form onSubmit={handleSaveService} className="mt-4 space-y-3">
            <div>
              <label htmlFor="sv-name" className="mb-1 block text-xs font-semibold">
                Nombre *
              </label>
              <input
                id="sv-name"
                required
                value={sForm.name}
                onChange={(e) => setSForm({ ...sForm, name: e.target.value })}
                className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sv-cat" className="mb-1 block text-xs font-semibold">
                  Categoría *
                </label>
                <input
                  id="sv-cat"
                  required
                  value={sForm.category}
                  onChange={(e) => setSForm({ ...sForm, category: e.target.value })}
                  className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="sv-dur" className="mb-1 block text-xs font-semibold">
                  Duración (min) *
                </label>
                <input
                  id="sv-dur"
                  type="number"
                  required
                  value={sForm.estimatedDuration}
                  onChange={(e) =>
                    setSForm({ ...sForm, estimatedDuration: e.target.value })
                  }
                  className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="sv-pr" className="mb-1 block text-xs font-semibold">
                  Precio Taller (sin ITBIS) *
                </label>
                <input
                  id="sv-pr"
                  type="number"
                  step="0.01"
                  required
                  value={sForm.price}
                  onChange={(e) => setSForm({ ...sForm, price: e.target.value })}
                  className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="sv-hpr" className="mb-1 block text-xs font-semibold">
                  Precio Domicilio (sin ITBIS)
                </label>
                <input
                  id="sv-hpr"
                  type="number"
                  step="0.01"
                  disabled={!sForm.isAvailableHome}
                  value={sForm.homePrice}
                  onChange={(e) => setSForm({ ...sForm, homePrice: e.target.value })}
                  className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm disabled:bg-gray-100"
                />
              </div>
            </div>
            <div>
              <label htmlFor="sv-desc" className="mb-1 block text-xs font-semibold">
                Descripción *
              </label>
              <textarea
                id="sv-desc"
                rows={2}
                required
                value={sForm.description}
                onChange={(e) => setSForm({ ...sForm, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="sv-cond" className="mb-1 block text-xs font-semibold">
                Condiciones y restricciones
              </label>
              <input
                id="sv-cond"
                value={sForm.conditions}
                onChange={(e) => setSForm({ ...sForm, conditions: e.target.value })}
                className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sForm.isAvailableWorkshop}
                  onChange={(e) =>
                    setSForm({ ...sForm, isAvailableWorkshop: e.target.checked })
                  }
                />
                Disponible en taller
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sForm.isAvailableHome}
                  onChange={(e) =>
                    setSForm({ ...sForm, isAvailableHome: e.target.checked })
                  }
                />
                Disponible a domicilio
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sForm.requiresLift}
                  onChange={(e) =>
                    setSForm({ ...sForm, requiresLift: e.target.checked })
                  }
                />
                Requiere elevador
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => srvDialogRef.current?.close()}
                className="min-h-[42px] rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[42px] rounded-lg bg-[#F50923] px-5 py-2 text-xs font-semibold text-white"
              >
                Guardar servicio
              </button>
            </div>
          </form>
        </dialog>
      </div>
    );
  }

  // OPERATIVA
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left column: Technicians, Resources, Mobile Units */}
      <div className="space-y-6 lg:col-span-7">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#1E2127]">
            <Wrench className="h-4 w-4 text-[#F50923]" />
            Técnicos y Horarios Laborales
          </h3>
          <div className="mt-4 space-y-4">
            {operations.technicians.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-gray-200 bg-[#FAFAFA] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#1E2127]">{t.user.name}</p>
                    <p className="text-xs text-[#424750]">
                      {t.user.email} ·{" "}
                      {t.canDriveMobileUnit ? "Apto Unidad Móvil y Taller" : "Solo Taller"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      postOp(
                        { kind: "TOGGLE_TECHNICIAN", id: t.id, isActive: !t.isActive },
                        "Estado del técnico actualizado."
                      )
                    }
                    className={`rounded px-2.5 py-1 text-xs font-bold ${
                      t.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {t.isActive ? "Activo" : "Inactivo"}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                  {t.workSchedules.map((ws) => (
                    <span
                      key={ws.id}
                      className="rounded border border-gray-200 bg-white px-2 py-1 font-medium text-[#1E2127]"
                    >
                      {DAY_NAMES[ws.dayOfWeek]}: {ws.startTime}–{ws.endTime}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold text-[#1E2127]">Recursos del Taller</h3>
            <div className="mt-3 space-y-2 text-xs">
              {operations.resources.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-[#FAFAFA] p-3"
                >
                  <div>
                    <p className="font-bold">{r.name}</p>
                    <p className="text-[#424750]">Capacidad: {r.capacity}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      postOp(
                        { kind: "TOGGLE_RESOURCE", id: r.id, isActive: !r.isActive },
                        "Recurso actualizado."
                      )
                    }
                    className={`rounded px-2 py-1 font-bold ${
                      r.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {r.isActive ? "Activo" : "Inactivo"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold text-[#1E2127]">Unidades Móviles</h3>
            <div className="mt-3 space-y-2 text-xs">
              {operations.mobileUnits.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg bg-[#FAFAFA] p-3"
                >
                  <div>
                    <p className="font-bold">{u.name}</p>
                    <p className="text-[#424750]">Placa: {u.plate}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      postOp(
                        { kind: "TOGGLE_MOBILE_UNIT", id: u.id, isActive: !u.isActive },
                        "Unidad móvil actualizada."
                      )
                    }
                    className={`rounded px-2 py-1 font-bold ${
                      u.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {u.isActive ? "Activa" : "Inactiva"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coverage Zones */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#1E2127]">
            <MapPin className="h-4 w-4 text-[#F50923]" />
            Zonas de cobertura móvil (Distrito Nacional)
          </h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/coverage-zones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(zoneForm),
              });
              setZoneForm({ sector: "", travelTimeMinutes: "30", surchargeFee: "0" });
              onNotify("ok", "Zona de cobertura agregada.");
              await onRefresh();
            }}
            className="mt-3 flex flex-wrap gap-2"
          >
            <input
              required
              placeholder="Nuevo sector (ej. Renacimiento)"
              value={zoneForm.sector}
              onChange={(e) => setZoneForm({ ...zoneForm, sector: e.target.value })}
              className="min-h-[38px] flex-1 rounded-lg border border-gray-300 px-3 text-xs"
            />
            <button
              type="submit"
              className="min-h-[38px] rounded-lg bg-[#1E2127] px-4 text-xs font-semibold text-white"
            >
              Agregar sector
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {operations.zones.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={async () => {
                  await fetch("/api/coverage-zones", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: z.id, isActive: !z.isActive }),
                  });
                  await onRefresh();
                }}
                className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                  z.isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-gray-200 bg-gray-100 text-gray-500 line-through"
                }`}
              >
                {z.sector}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right column: Blocks, Holidays, Config & Backup */}
      <div className="space-y-6 lg:col-span-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#1E2127]">
            <Clock className="h-4 w-4 text-[#F50923]" />
            Bloqueo de horarios
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              postOp({ kind: "BLOCK_SLOT", ...blockForm }, "Horario bloqueado.");
            }}
            className="mt-3 space-y-2.5 text-xs"
          >
            <input
              type="date"
              required
              value={blockForm.date}
              onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
              className="min-h-[38px] w-full rounded-lg border border-gray-300 px-3"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                required
                value={blockForm.startTime}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, startTime: e.target.value })
                }
                className="min-h-[38px] rounded-lg border border-gray-300 px-3"
              />
              <input
                type="time"
                required
                value={blockForm.endTime}
                onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                className="min-h-[38px] rounded-lg border border-gray-300 px-3"
              />
            </div>
            <select
              value={blockForm.technicianId}
              onChange={(e) =>
                setBlockForm({ ...blockForm, technicianId: e.target.value })
              }
              className="min-h-[38px] w-full rounded-lg border border-gray-300 px-3"
            >
              <option value="">Bloqueo general (todo el centro y unidad móvil)</option>
              {operations.technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  Solo técnico: {t.user.name}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Motivo del bloqueo"
              value={blockForm.reason}
              onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
              className="min-h-[38px] w-full rounded-lg border border-gray-300 px-3"
            />
            <button
              type="submit"
              className="min-h-[38px] w-full rounded-lg bg-[#1E2127] text-xs font-semibold text-white"
            >
              Bloquear horario
            </button>
          </form>

          {operations.blockedSlots.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-xs">
              {operations.blockedSlots.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded bg-[#FAFAFA] p-2"
                >
                  <span>
                    {formatDateRD(b.date)} ({b.startTime}–{b.endTime}) · {b.reason}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteOp("BLOCK_SLOT", b.id)}
                    aria-label="Eliminar bloqueo"
                    className="text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#1E2127]">
            <CalendarOff className="h-4 w-4 text-[#F50923]" />
            Días no laborables y feriados
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              postOp({ kind: "HOLIDAY", ...holForm }, "Feriado agregado.");
            }}
            className="mt-3 flex flex-wrap gap-2 text-xs"
          >
            <input
              type="date"
              required
              value={holForm.date}
              onChange={(e) => setHolForm({ ...holForm, date: e.target.value })}
              className="min-h-[38px] rounded-lg border border-gray-300 px-2"
            />
            <input
              required
              placeholder="Nombre del feriado"
              value={holForm.name}
              onChange={(e) => setHolForm({ ...holForm, name: e.target.value })}
              className="min-h-[38px] flex-1 rounded-lg border border-gray-300 px-3"
            />
            <button
              type="submit"
              className="min-h-[38px] rounded-lg bg-[#1E2127] px-3 font-semibold text-white"
            >
              Agregar
            </button>
          </form>
          <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs">
            {operations.holidays.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded bg-[#FAFAFA] p-2"
              >
                <span>
                  {formatDateRD(h.date)} — <strong>{h.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => deleteOp("HOLIDAY", h.id)}
                  aria-label={`Eliminar feriado ${h.name}`}
                  className="text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[#424750]/20 bg-[#1E2127] p-5 text-white">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <Settings className="h-4 w-4 text-[#F50923]" />
            Respaldo de Base de Datos
          </h3>
          <p className="mt-1 text-xs text-gray-300">
            Descarga una copia íntegra de la base de datos activa con todos los
            clientes, vehículos, citas, historiales y pagos.
          </p>
          <a
            href="/api/admin/backup"
            className="mt-4 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#F50923] px-4 py-2 text-xs font-semibold text-white hover:bg-[#CC071D]"
          >
            <Download className="h-4 w-4" />
            Descargar respaldo de BD
          </a>
        </div>
      </div>
    </div>
  );
}
