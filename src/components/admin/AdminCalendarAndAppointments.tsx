"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import {
  Plus,
  Wrench,
  CheckCircle2,
  Building,
  CarFront,
  Filter,
  ClipboardCheck,
} from "lucide-react";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  STATUSES_BY_MODE,
  formatDOP,
  formatDateTimeRD,
} from "@/lib/constants";

export interface AdminAppointment {
  id: string;
  bookingCode: string;
  mode: "WORKSHOP" | "HOME_SERVICE";
  appointmentDate: string;
  endDate: string;
  estimatedDuration: number;
  status: string;
  notes: string | null;
  technicianId: string | null;
  totalAmount: number;
  client: { id: string; name: string; email: string; phone: string | null };
  vehicle: { id: string; brand: string; model: string; year: number; plate: string; mileage: number };
  address?: { street: string; number: string; sector: string; province: string } | null;
  technician?: { id: string; user: { name: string } } | null;
  resource?: { name: string } | null;
  mobileUnit?: { name: string } | null;
  appointmentServices: Array<{
    id: string;
    serviceId: string;
    price: number;
    service: { id: string; name: string };
  }>;
  statusHistory: Array<{
    id: string;
    status: string;
    changedAt: string;
    notes: string | null;
    changedBy: { name: string };
  }>;
  maintenanceRecord?: { id: string; receiptNumber: string } | null;
}

interface TechnicianOption {
  id: string;
  canDriveMobileUnit: boolean;
  isActive: boolean;
  user: { name: string };
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  isAvailableHome: boolean;
  estimatedDuration: number;
}

interface ClientOption {
  id: string;
  name: string;
  email: string;
  vehicles: Array<{ id: string; brand: string; model: string; plate: string }>;
}

export function AdminCalendarAndAppointments({
  appointments,
  technicians,
  services,
  clients,
  userRole,
  initialView = "calendar",
  onRefresh,
  onNotify,
}: {
  appointments: AdminAppointment[];
  technicians: TechnicianOption[];
  services: ServiceOption[];
  clients: ClientOption[];
  userRole: string;
  initialView?: "calendar" | "table";
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", text: string) => void;
}) {
  const canManage = userRole === "ADMIN" || userRole === "RECEPTIONIST";

  const [modeFilter, setModeFilter] = useState("ALL");
  const [techFilter, setTechFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"calendar" | "table">(initialView);

  useEffect(() => {
    setViewMode(initialView);
  }, [initialView]);

  // Selected appointment modal
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedAppt, setSelectedAppt] = useState<AdminAppointment | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [assignTechId, setAssignTechId] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Maintenance completion sub-form inside detail dialog
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [maintForm, setMaintForm] = useState({
    mileageAtService: "",
    productsUsed: "4 L Aceite semisintético, 1 Filtro de aceite, Paños y arandela",
    observations: "",
    recommendations: "Próximo mantenimiento preventivo en 5,000 km o 3 meses.",
    nextServiceDate: "",
    nextServiceMileage: "",
    totalCost: "",
    fugasRevisadas: true,
    nivelesVerificados: true,
    taponesAjustados: true,
    areaLimpia: true,
    piezasMostradas: true,
  });

  // Manual booking modal
  const manualDialogRef = useRef<HTMLDialogElement>(null);
  const [mClientId, setMClientId] = useState(clients[0]?.id || "");
  const [mVehicleId, setMVehicleId] = useState(clients[0]?.vehicles[0]?.id || "");
  const [mServiceIds, setMServiceIds] = useState<string[]>(services[0] ? [services[0].id] : []);
  const [mMode, setMMode] = useState<"WORKSHOP" | "HOME_SERVICE">("WORKSHOP");
  const [mAddressId, setMAddressId] = useState("");
  const [mAddresses, setMAddresses] = useState<Array<{ id: string; label: string; sector: string }>>([]);
  const [mDate, setMDate] = useState("");
  const [mSlots, setMSlots] = useState<Array<{ time: string; endTime: string }>>([]);
  const [mTime, setMTime] = useState("");

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (modeFilter !== "ALL" && a.mode !== modeFilter) return false;
      if (techFilter !== "ALL" && a.technicianId !== techFilter) return false;
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      return true;
    });
  }, [appointments, modeFilter, techFilter, statusFilter]);

  const calendarEvents = useMemo(
    () =>
      filteredAppointments.map((a) => ({
        id: a.id,
        title: `${a.bookingCode} · ${a.vehicle.plate} (${a.client.name})`,
        start: a.appointmentDate,
        end: a.endDate,
        backgroundColor: a.mode === "HOME_SERVICE" ? "#F50923" : "#1E2127",
        borderColor: a.mode === "HOME_SERVICE" ? "#CC071D" : "#424750",
        textColor: "#FFFFFF",
      })),
    [filteredAppointments]
  );

  const openDetailModal = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setNextStatus(appt.status);
    setAssignTechId(appt.technicianId || "");
    setStatusNote("");
    setShowMaintForm(false);
    setMaintForm({
      mileageAtService: String(appt.vehicle.mileage),
      productsUsed: "4 L Aceite según especificación, Filtro nuevo, Consumibles",
      observations: "",
      recommendations: "Próximo mantenimiento preventivo en 5,000 km o 3 meses.",
      nextServiceDate: "",
      nextServiceMileage: String(appt.vehicle.mileage + 5000),
      totalCost: String(appt.totalAmount),
      fugasRevisadas: true,
      nivelesVerificados: true,
      taponesAjustados: true,
      areaLimpia: true,
      piezasMostradas: true,
    });
    detailDialogRef.current?.showModal();
  };

  const handleUpdateAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    const res = await fetch(`/api/appointments/${selectedAppt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_STATUS",
        status: nextStatus,
        technicianId: assignTechId || null,
        notes: statusNote || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onNotify("err", data.error || "No se pudo actualizar la cita.");
    } else {
      detailDialogRef.current?.close();
      onNotify("ok", `Cita ${selectedAppt.bookingCode} actualizada.`);
      await onRefresh();
    }
  };

  const handleCompleteMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    const res = await fetch("/api/maintenance-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: selectedAppt.id,
        mileageAtService: Number(maintForm.mileageAtService),
        servicesPerformed: selectedAppt.appointmentServices.map((s) => s.service.name),
        productsUsed: maintForm.productsUsed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        checklist: {
          fugasRevisadas: maintForm.fugasRevisadas,
          nivelesVerificados: maintForm.nivelesVerificados,
          taponesAjustados: maintForm.taponesAjustados,
          areaLimpia: maintForm.areaLimpia,
          piezasMostradas: maintForm.piezasMostradas,
        },
        totalCost: Number(maintForm.totalCost || selectedAppt.totalAmount),
        observations: maintForm.observations || null,
        recommendations: maintForm.recommendations || null,
        nextServiceDate: maintForm.nextServiceDate || null,
        nextServiceMileage: maintForm.nextServiceMileage
          ? Number(maintForm.nextServiceMileage)
          : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onNotify("err", data.error || "No se pudo registrar el mantenimiento.");
    } else {
      detailDialogRef.current?.close();
      onNotify(
        "ok",
        `Mantenimiento completado. Comprobante ${data.record.receiptNumber} generado.`
      );
      await onRefresh();
    }
  };

  // Manual Booking: load client addresses when client changes
  useEffect(() => {
    const c = clients.find((cl) => cl.id === mClientId);
    if (c && c.vehicles.length > 0) {
      setMVehicleId(c.vehicles[0].id);
    } else {
      setMVehicleId("");
    }
    if (mClientId && canManage) {
      fetch(`/api/addresses?clientId=${mClientId}`)
        .then((r) => r.json())
        .then((d) => {
          setMAddresses(d.addresses || []);
          setMAddressId(d.addresses?.[0]?.id || "");
        })
        .catch(() => setMAddresses([]));
    }
  }, [mClientId, clients, canManage]);

  // Manual Booking: fetch available slots
  useEffect(() => {
    if (!mDate || mServiceIds.length === 0) return;
    const params = new URLSearchParams({
      date: mDate,
      serviceIds: mServiceIds.join(","),
      mode: mMode,
    });
    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setMSlots(d.isClosed ? [] : d.slots || []);
        setMTime("");
      })
      .catch(() => setMSlots([]));
  }, [mDate, mServiceIds, mMode]);

  const handleCreateManualAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientIdOverride: mClientId,
        vehicleId: mVehicleId,
        serviceIds: mServiceIds,
        mode: mMode,
        addressId: mMode === "HOME_SERVICE" ? mAddressId : null,
        date: mDate,
        time: mTime,
        notes: "Cita creada manualmente desde el panel administrativo.",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onNotify("err", data.error || "No se pudo crear la cita.");
    } else {
      manualDialogRef.current?.close();
      onNotify("ok", `Cita manual ${data.appointment.bookingCode} creada y confirmada.`);
      await onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Filter className="h-4 w-4 text-[#F50923]" aria-hidden="true" />
          <select
            aria-label="Filtrar por modalidad"
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="min-h-[40px] rounded-lg border border-gray-300 bg-[#FAFAFA] px-3 text-xs font-semibold"
          >
            <option value="ALL">Todas las modalidades</option>
            <option value="WORKSHOP">Taller físico</option>
            <option value="HOME_SERVICE">Unidad móvil (Domicilio)</option>
          </select>

          <select
            aria-label="Filtrar por técnico"
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="min-h-[40px] rounded-lg border border-gray-300 bg-[#FAFAFA] px-3 text-xs font-semibold"
          >
            <option value="ALL">Todos los técnicos</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[40px] rounded-lg border border-gray-300 bg-[#FAFAFA] px-3 text-xs font-semibold"
          >
            <option value="ALL">Todos los estados</option>
            {Object.entries(APPOINTMENT_STATUS_LABELS).map(([k, lbl]) => (
              <option key={k} value={k}>
                {lbl}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-[#FAFAFA] p-1">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${
                viewMode === "calendar" ? "bg-[#1E2127] text-white" : "text-[#424750]"
              }`}
            >
              Calendario
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${
                viewMode === "table" ? "bg-[#1E2127] text-white" : "text-[#424750]"
              }`}
            >
              Listado ({filteredAppointments.length})
            </button>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => manualDialogRef.current?.showModal()}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#F50923] px-4 py-2 text-xs font-semibold text-white hover:bg-[#CC071D]"
            >
              <Plus className="h-4 w-4" />
              Cita manual
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#424750]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#1E2127]" />
          <Building className="h-3.5 w-3.5" /> Taller físico
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#F50923]" />
          <CarFront className="h-3.5 w-3.5" /> Unidad móvil (Domicilio)
        </span>
      </div>

      {viewMode === "calendar" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={calendarEvents}
            slotMinTime="07:30:00"
            slotMaxTime="18:00:00"
            contentHeight={540}
            dayMaxEvents={3}
            eventClick={(info) => {
              const found = appointments.find((a) => a.id === info.event.id);
              if (found) openDetailModal(found);
            }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-[#FAFAFA] text-xs font-bold uppercase text-[#424750]">
              <tr>
                <th scope="col" className="px-4 py-3">Código</th>
                <th scope="col" className="px-4 py-3">Fecha y hora</th>
                <th scope="col" className="px-4 py-3">Cliente / Vehículo</th>
                <th scope="col" className="px-4 py-3">Modalidad</th>
                <th scope="col" className="px-4 py-3">Técnico</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Total</th>
                <th scope="col" className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppointments.map((a) => (
                <tr key={a.id} className="hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3 font-bold text-[#1E2127]">{a.bookingCode}</td>
                  <td className="px-4 py-3 text-xs">{formatDateTimeRD(a.appointmentDate)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1E2127]">{a.client.name}</p>
                    <p className="text-xs text-[#424750]">
                      {a.vehicle.brand} {a.vehicle.model} ({a.vehicle.plate})
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold text-white ${
                        a.mode === "HOME_SERVICE" ? "bg-[#F50923]" : "bg-[#1E2127]"
                      }`}
                    >
                      {a.mode === "HOME_SERVICE" ? "Domicilio" : "Taller"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {a.technician?.user.name || "Sin asignar"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-xs font-bold ${
                        APPOINTMENT_STATUS_COLORS[a.status] ?? "bg-gray-100"
                      }`}
                    >
                      {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{formatDOP(a.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetailModal(a)}
                      className="rounded-lg border border-[#1E2127] px-3 py-1.5 text-xs font-semibold text-[#1E2127] hover:bg-[#1E2127] hover:text-white"
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Appointment Detail & Maintenance Dialog */}
      <dialog
        ref={detailDialogRef}
        aria-labelledby="adm-dlg-appt"
        className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        {selectedAppt && (
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b border-gray-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-[#F50923]">
                  {selectedAppt.mode === "HOME_SERVICE" ? "Unidad Móvil" : "Centro Físico"}
                </span>
                <h1 id="adm-dlg-appt" className="text-xl font-extrabold text-[#1E2127]">
                  Cita {selectedAppt.bookingCode}
                </h1>
                <p className="text-xs text-[#424750]">
                  {selectedAppt.client.name} ({selectedAppt.client.phone || selectedAppt.client.email}) ·{" "}
                  {selectedAppt.vehicle.brand} {selectedAppt.vehicle.model} ({selectedAppt.vehicle.plate})
                </p>
              </div>
              <button
                type="button"
                onClick={() => detailDialogRef.current?.close()}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-3 rounded-lg bg-[#FAFAFA] p-4 text-xs sm:grid-cols-2">
              <p>
                <strong>Fecha:</strong> {formatDateTimeRD(selectedAppt.appointmentDate)}
              </p>
              <p>
                <strong>Total:</strong> {formatDOP(selectedAppt.totalAmount)}
              </p>
              <p>
                <strong>Recurso / Unidad:</strong>{" "}
                {selectedAppt.resource?.name || selectedAppt.mobileUnit?.name || "Por asignar"}
              </p>
              <p>
                <strong>Servicios:</strong>{" "}
                {selectedAppt.appointmentServices.map((s) => s.service.name).join(", ")}
              </p>
              {selectedAppt.address && (
                <p className="sm:col-span-2">
                  <strong>Dirección:</strong> {selectedAppt.address.street} #
                  {selectedAppt.address.number}, {selectedAppt.address.sector}
                </p>
              )}
            </div>

            {!showMaintForm ? (
              <form onSubmit={handleUpdateAppt} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="adm-st" className="mb-1 block text-xs font-semibold">
                      Estado de la cita
                    </label>
                    <select
                      id="adm-st"
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                    >
                      {STATUSES_BY_MODE[selectedAppt.mode].map((st) => (
                        <option key={st} value={st}>
                          {APPOINTMENT_STATUS_LABELS[st]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {canManage && (
                    <div>
                      <label htmlFor="adm-tech" className="mb-1 block text-xs font-semibold">
                        Técnico asignado
                      </label>
                      <select
                        id="adm-tech"
                        value={assignTechId}
                        onChange={(e) => setAssignTechId(e.target.value)}
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                      >
                        <option value="">Sin asignar</option>
                        {technicians
                          .filter((t) =>
                            selectedAppt.mode === "HOME_SERVICE" ? t.canDriveMobileUnit : true
                          )
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.user.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="adm-note" className="mb-1 block text-xs font-semibold">
                    Nota del cambio de estado
                  </label>
                  <input
                    id="adm-note"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Ej. Cliente en recepción, vehículo en elevador..."
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                  />
                </div>

                <div className="flex flex-wrap justify-between gap-2 pt-2">
                  {!selectedAppt.maintenanceRecord &&
                    !["CANCELLED", "NO_SHOW"].includes(selectedAppt.status) && (
                      <button
                        type="button"
                        onClick={() => setShowMaintForm(true)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        Completar mantenimiento y emitir comprobante
                      </button>
                    )}

                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#1E2127] px-5 py-2 text-sm font-semibold text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Guardar cambios
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleCompleteMaintenance}
                className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-bold text-[#1E2127]">
                    <Wrench className="h-4 w-4 text-[#F50923]" />
                    Registro de Mantenimiento y Control de Calidad
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowMaintForm(false)}
                    className="text-xs font-semibold text-[#424750] underline"
                  >
                    Volver
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="m-km" className="mb-1 block text-xs font-semibold">
                      Kilometraje al servicio *
                    </label>
                    <input
                      id="m-km"
                      type="number"
                      required
                      value={maintForm.mileageAtService}
                      onChange={(e) =>
                        setMaintForm({ ...maintForm, mileageAtService: e.target.value })
                      }
                      className="min-h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="m-cost" className="mb-1 block text-xs font-semibold">
                      Costo final (RD$) *
                    </label>
                    <input
                      id="m-cost"
                      type="number"
                      step="0.01"
                      required
                      value={maintForm.totalCost}
                      onChange={(e) =>
                        setMaintForm({ ...maintForm, totalCost: e.target.value })
                      }
                      className="min-h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="m-prod" className="mb-1 block text-xs font-semibold">
                      Productos utilizados (separados por coma)
                    </label>
                    <input
                      id="m-prod"
                      value={maintForm.productsUsed}
                      onChange={(e) =>
                        setMaintForm({ ...maintForm, productsUsed: e.target.value })
                      }
                      className="min-h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="m-ndate" className="mb-1 block text-xs font-semibold">
                      Fecha próximo mantenimiento
                    </label>
                    <input
                      id="m-ndate"
                      type="date"
                      value={maintForm.nextServiceDate}
                      onChange={(e) =>
                        setMaintForm({ ...maintForm, nextServiceDate: e.target.value })
                      }
                      className="min-h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="m-nkm" className="mb-1 block text-xs font-semibold">
                      Kilometraje próximo mantenimiento
                    </label>
                    <input
                      id="m-nkm"
                      type="number"
                      value={maintForm.nextServiceMileage}
                      onChange={(e) =>
                        setMaintForm({ ...maintForm, nextServiceMileage: e.target.value })
                      }
                      className="min-h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="m-obs" className="mb-1 block text-xs font-semibold">
                      Observaciones técnicas
                    </label>
                    <textarea
                      id="m-obs"
                      rows={2}
                      value={maintForm.observations}
                      onChange={(e) =>
                        setMaintForm({ ...maintForm, observations: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="m-rec" className="mb-1 block text-xs font-semibold">
                      Recomendaciones al cliente
                    </label>
                    <textarea
                      id="m-rec"
                      rows={2}
                      value={maintForm.recommendations}
                      onChange={(e) =>
                        setMaintForm({ ...maintForm, recommendations: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm"
                    />
                  </div>
                </div>

                <fieldset className="rounded-lg border border-gray-200 bg-white p-3">
                  <legend className="px-1 text-xs font-bold text-[#1E2127]">
                    Lista de verificación de control de calidad
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2 text-xs">
                    {[
                      { k: "fugasRevisadas", lbl: "Sin fugas visibles" },
                      { k: "nivelesVerificados", lbl: "Niveles de fluidos verificados" },
                      { k: "taponesAjustados", lbl: "Tapones ajustados con torque" },
                      { k: "areaLimpia", lbl: "Área de motor limpia" },
                      { k: "piezasMostradas", lbl: "Filtros/piezas mostradas al cliente" },
                    ].map((chk) => (
                      <label key={chk.k} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(maintForm[chk.k as keyof typeof maintForm])}
                          onChange={(e) =>
                            setMaintForm({ ...maintForm, [chk.k]: e.target.checked })
                          }
                        />
                        <span>{chk.lbl}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <button
                  type="submit"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#F50923] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Finalizar orden y guardar en historial
                </button>
              </form>
            )}
          </div>
        )}
      </dialog>

      {/* Manual Appointment Creation Dialog */}
      <dialog
        ref={manualDialogRef}
        aria-labelledby="adm-dlg-manual"
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h1 id="adm-dlg-manual" className="text-lg font-extrabold text-[#1E2127]">
          Crear cita manual (Recepción / Admin)
        </h1>
        <form onSubmit={handleCreateManualAppt} className="mt-4 space-y-3">
          <div>
            <label htmlFor="mc-cl" className="mb-1 block text-xs font-semibold">
              Cliente
            </label>
            <select
              id="mc-cl"
              value={mClientId}
              onChange={(e) => setMClientId(e.target.value)}
              className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mc-veh" className="mb-1 block text-xs font-semibold">
              Vehículo
            </label>
            <select
              id="mc-veh"
              value={mVehicleId}
              onChange={(e) => setMVehicleId(e.target.value)}
              className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            >
              {(clients.find((c) => c.id === mClientId)?.vehicles || []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.plate})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mc-srv" className="mb-1 block text-xs font-semibold">
              Servicio principal
            </label>
            <select
              id="mc-srv"
              value={mServiceIds[0] || ""}
              onChange={(e) => setMServiceIds([e.target.value])}
              className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({formatDOP(s.price)})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mc-mode" className="mb-1 block text-xs font-semibold">
                Modalidad
              </label>
              <select
                id="mc-mode"
                value={mMode}
                onChange={(e) =>
                  setMMode(e.target.value === "HOME_SERVICE" ? "HOME_SERVICE" : "WORKSHOP")
                }
                className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              >
                <option value="WORKSHOP">Taller físico</option>
                <option value="HOME_SERVICE">Unidad móvil</option>
              </select>
            </div>
            <div>
              <label htmlFor="mc-date" className="mb-1 block text-xs font-semibold">
                Fecha
              </label>
              <input
                id="mc-date"
                type="date"
                required
                value={mDate}
                onChange={(e) => setMDate(e.target.value)}
                className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
          </div>

          {mMode === "HOME_SERVICE" && (
            <div>
              <label htmlFor="mc-addr" className="mb-1 block text-xs font-semibold">
                Dirección del cliente
              </label>
              <select
                id="mc-addr"
                value={mAddressId}
                onChange={(e) => setMAddressId(e.target.value)}
                className="min-h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              >
                {mAddresses.map((ad) => (
                  <option key={ad.id} value={ad.id}>
                    {ad.label} — {ad.sector}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mDate && (
            <div>
              <p className="mb-1 text-xs font-semibold">Horarios disponibles:</p>
              <div className="grid grid-cols-3 gap-2">
                {mSlots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    onClick={() => setMTime(s.time)}
                    className={`min-h-[38px] rounded border text-xs font-semibold ${
                      mTime === s.time
                        ? "border-[#F50923] bg-[#F50923] text-white"
                        : "border-gray-200"
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
              {mSlots.length === 0 && (
                <p className="text-xs text-red-700">Sin cupos disponibles en esa fecha.</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => manualDialogRef.current?.close()}
              className="min-h-[42px] rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!mVehicleId || !mTime}
              className="min-h-[42px] rounded-lg bg-[#F50923] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Crear y confirmar cita
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
