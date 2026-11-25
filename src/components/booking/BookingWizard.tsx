"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Car,
  Plus,
  Wrench,
  Building,
  CarFront,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Download,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LocateFixed,
} from "lucide-react";
import {
  DOMINICAN_PROVINCES,
  FUEL_TYPE_LABELS,
  MUNICIPALITIES_BY_PROVINCE,
  formatDOP,
  formatDateRD,
  formatTimeRD,
} from "@/lib/constants";
import { ServiceIcon } from "@/components/ServiceIcon";
import { DWayLogo } from "@/components/DWayLogo";
import { StepTransition } from "@/components/MotionPrimitives";

interface VehicleItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  fuelType: string;
  mileage: number;
  subscriptions?: Array<{ plan: { name: string; discountPercent: number } }>;
}

interface ServiceItem {
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
  iconName: string | null;
  conditions: string | null;
}

interface AddressItem {
  id: string;
  label: string;
  province: string;
  municipality: string;
  sector: string;
  street: string;
  number: string;
  reference: string | null;
  additionalInstructions: string | null;
  latitude: number | null;
  longitude: number | null;
  isCovered: boolean;
  zoneSurcharge: number;
}

interface CoverageZoneItem {
  id: string;
  province: string;
  municipality: string;
  sector: string;
  travelTimeMinutes: number;
  surchargeFee: number;
}

interface SlotItem {
  time: string;
  endTime: string;
  label: string;
}

interface QuoteData {
  subtotalAmount: number;
  travelFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  itbisRate: number;
  estimatedDuration: number;
  appliedBenefitType: string | null;
  appliedDiscountLabel: string | null;
  subscriptionId: string | null;
}

interface ConfirmedAppointment {
  id: string;
  bookingCode: string;
  appointmentDate: string;
  estimatedDuration: number;
  mode: string;
  status: string;
  subtotalAmount: number;
  discountAmount: number;
  travelFee: number;
  taxAmount: number;
  totalAmount: number;
  vehicle: VehicleItem;
  address?: AddressItem | null;
  technician?: { user: { name: string } } | null;
  appointmentServices: Array<{ service: { name: string } }>;
}

const STEPS = [
  { num: 1, label: "Vehículo" },
  { num: 2, label: "Servicios" },
  { num: 3, label: "Modalidad" },
  { num: 4, label: "Fecha y hora" },
  { num: 5, label: "Resumen" },
  { num: 6, label: "Confirmación" },
];

export function BookingWizard({
  services,
  coverageZones,
  initialServiceId,
}: {
  services: ServiceItem[];
  coverageZones: CoverageZoneItem[];
  initialServiceId?: string;
}) {
  const { data: session, status: authStatus } = useSession();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Vehicle
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  const [vForm, setVForm] = useState({
    brand: "",
    model: "",
    year: String(new Date().getFullYear()),
    plate: "",
    color: "",
    mileage: "",
    fuelType: "GASOLINA",
    lastMaintenanceDate: "",
    notes: "",
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Step 2: Services
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    initialServiceId && services.some((s) => s.id === initialServiceId)
      ? [initialServiceId]
      : []
  );

  // Step 3: Mode & Address
  const [mode, setMode] = useState<"WORKSHOP" | "HOME_SERVICE">("WORKSHOP");
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [aForm, setAForm] = useState({
    label: "Casa",
    province: "Distrito Nacional",
    municipality: "Santo Domingo de Guzmán",
    sector: coverageZones[0]?.sector || "Naco",
    street: "",
    number: "",
    reference: "",
    additionalInstructions: "",
    latitude: null as number | null,
    longitude: null as number | null,
    isDefault: true,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Step 4: Date, Time & Benefits
  const todayRD = useMemo(() => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Santo_Domingo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${d}`;
  }, []);

  const [calMonth, setCalMonth] = useState(() => {
    const [y, m] = todayRD.split("-").map(Number);
    return { year: y, month: m - 1 };
  });
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [closedReason, setClosedReason] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [useMembershipBenefit, setUseMembershipBenefit] = useState(true);
  const [promotionCode, setPromotionCode] = useState("");
  const [notes, setNotes] = useState("");

  // Step 5 & 6: Quote & Confirmation
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [confirmedAgree, setConfirmedAgree] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState<ConfirmedAppointment | null>(null);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );

  const allServicesHomeCompatible = useMemo(
    () => selectedServices.length > 0 && selectedServices.every((s) => s.isAvailableHome),
    [selectedServices]
  );

  const totalEstimatedDuration = useMemo(
    () => selectedServices.reduce((acc, s) => acc + s.estimatedDuration, 0),
    [selectedServices]
  );

  const rawEstimatedSubtotal = useMemo(
    () => selectedServices.reduce((acc, s) => acc + s.price, 0),
    [selectedServices]
  );

  // Load client vehicles & addresses once authenticated
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    setLoadingVehicles(true);
    Promise.all([fetch("/api/vehicles"), fetch("/api/addresses")])
      .then(async ([vRes, aRes]) => {
        if (vRes.ok) {
          const vData = await vRes.json();
          setVehicles(vData.vehicles || []);
          if (vData.vehicles?.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(vData.vehicles[0].id);
          } else if ((vData.vehicles || []).length === 0) {
            setShowNewVehicleForm(true);
          }
        }
        if (aRes.ok) {
          const aData = await aRes.json();
          setAddresses(aData.addresses || []);
          const defaultAddr =
            aData.addresses?.find((a: AddressItem) => a.isCovered) ?? aData.addresses?.[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          } else {
            setShowNewAddressForm(true);
          }
        }
      })
      .finally(() => setLoadingVehicles(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  // If mode was HOME_SERVICE and user added a workshop-only service, switch back to WORKSHOP
  useEffect(() => {
    if (mode === "HOME_SERVICE" && !allServicesHomeCompatible) {
      setMode("WORKSHOP");
    }
  }, [allServicesHomeCompatible, mode]);

  // Fetch real available slots when date, services, or mode change
  useEffect(() => {
    if (!selectedDate || selectedServiceIds.length === 0) return;
    setLoadingSlots(true);
    setSelectedTime("");
    setClosedReason(null);
    const params = new URLSearchParams({
      date: selectedDate,
      serviceIds: selectedServiceIds.join(","),
      mode,
    });
    fetch(`/api/availability?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setClosedReason(data.error || "No se pudo consultar la disponibilidad.");
          setSlots([]);
        } else if (data.isClosed) {
          setClosedReason(data.closedReason || "No laborable en esta fecha.");
          setSlots([]);
        } else {
          setSlots(data.slots || []);
        }
      })
      .catch(() => {
        setClosedReason("Error consultando horarios disponibles.");
        setSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedServiceIds, mode]);

  // Fetch exact backend quote when entering Step 5
  useEffect(() => {
    if (step !== 5 || authStatus !== "authenticated") return;
    setLoadingQuote(true);
    fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: selectedVehicleId,
        serviceIds: selectedServiceIds,
        mode,
        addressId: mode === "HOME_SERVICE" ? selectedAddressId : null,
        useMembershipBenefit,
        promotionCode: promotionCode.trim() || null,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setQuote(data.quote);
      })
      .finally(() => setLoadingQuote(false));
  }, [
    step,
    authStatus,
    selectedVehicleId,
    selectedServiceIds,
    mode,
    selectedAddressId,
    useMembershipBenefit,
    promotionCode,
  ]);

  const handleSaveNewVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavingVehicle(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vForm,
          year: Number(vForm.year),
          mileage: Number(vForm.mileage || 0),
          lastMaintenanceDate: vForm.lastMaintenanceDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo registrar el vehículo.");
      } else {
        setVehicles((prev) => [data.vehicle, ...prev]);
        setSelectedVehicleId(data.vehicle.id);
        setShowNewVehicleForm(false);
        setVForm({
          brand: "",
          model: "",
          year: String(new Date().getFullYear()),
          plate: "",
          color: "",
          mileage: "",
          fuelType: "GASOLINA",
          lastMaintenanceDate: "",
          notes: "",
        });
      }
    } catch {
      setError("Error de conexión registrando vehículo.");
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavingAddress(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar la dirección.");
      } else {
        setAddresses((prev) => [data.address, ...prev]);
        setSelectedAddressId(data.address.id);
        setShowNewAddressForm(false);
      }
    } catch {
      setError("Error guardando la dirección.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAForm((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
      },
      () => {
        setError(
          "No pudimos acceder a tu ubicación. Verifica permisos del navegador o escribe tu dirección."
        );
      }
    );
  };

  const handleConfirmBooking = async () => {
    if (!confirmedAgree) {
      setError("Confirma los detalles de tu cita antes de registrarla.");
      return;
    }
    setError(null);
    setSubmittingBooking(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          serviceIds: selectedServiceIds,
          mode,
          addressId: mode === "HOME_SERVICE" ? selectedAddressId : null,
          date: selectedDate,
          time: selectedTime,
          notes: notes.trim() || null,
          useMembershipBenefit,
          promotionCode: promotionCode.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo registrar la cita.");
        if (res.status === 409) {
          // Si hubo colisión simultánea, regresar al paso 4 y refrescar horarios
          setStep(4);
          setSelectedTime("");
        }
      } else {
        setConfirmedAppt(data.appointment);
        setStep(6);
      }
    } catch {
      setError("Error de red al confirmar la reserva.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const goNext = () => {
    setError(null);
    if (step === 1 && !selectedVehicleId) {
      setError("Selecciona un vehículo o registra uno nuevo para continuar.");
      return;
    }
    if (step === 2 && selectedServiceIds.length === 0) {
      setError("Selecciona al menos un servicio preventivo.");
      return;
    }
    if (step === 3) {
      if (mode === "HOME_SERVICE") {
        if (!allServicesHomeCompatible) {
          setError(
            "Uno o más servicios seleccionados requieren elevador y solo se realizan en el taller."
          );
          return;
        }
        const addr = addresses.find((a) => a.id === selectedAddressId);
        if (!addr) {
          setError("Selecciona o guarda una dirección para el servicio a domicilio.");
          return;
        }
        if (!addr.isCovered) {
          setError(
            `El sector "${addr.sector}" no está dentro de la zona de cobertura móvil actual.`
          );
          return;
        }
      }
    }
    if (step === 4 && (!selectedDate || !selectedTime)) {
      setError("Selecciona una fecha y un horario disponible.");
      return;
    }
    setStep((s) => Math.min(6, s + 1));
  };

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const first = new Date(calMonth.year, calMonth.month, 1);
    const startOffset = first.getDay(); // 0=Sun..6=Sat
    const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
    const cells: Array<{ dateStr: string; day: number; isPast: boolean; isSunday: boolean } | null> = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(calMonth.month + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateStr = `${calMonth.year}-${mStr}-${dStr}`;
      const dow = new Date(calMonth.year, calMonth.month, d).getDay();
      cells.push({
        dateStr,
        day: d,
        isPast: dateStr < todayRD,
        isSunday: dow === 0,
      });
    }
    return cells;
  }, [calMonth, todayRD]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("es-DO", {
      month: "long",
      year: "numeric",
    }).format(new Date(calMonth.year, calMonth.month, 1));
  }, [calMonth]);

  if (authStatus === "loading") {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-[#424750]">
        Cargando asistente de citas...
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#1E2127] text-[#F50923]">
          <Car className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#1E2127]">
          Inicia sesión para agendar tu mantenimiento
        </h2>
        <p className="mt-2 text-sm text-[#424750]">
          Tu cita quedará vinculada a tu cuenta y vehículo para conservar el historial de
          mantenimiento, recordatorios y beneficios de membresía.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/login?callbackUrl=%2Fagendar"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#F50923] px-6 py-3 text-sm font-semibold text-white hover:bg-[#CC071D]"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/registro?callbackUrl=%2Fagendar"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[#1E2127] px-6 py-3 text-sm font-semibold text-[#1E2127] hover:bg-[#1E2127] hover:text-white"
          >
            Crear cuenta nueva
          </Link>
        </div>
      </div>
    );
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <nav aria-label="Progreso de reserva" className="rounded-xl border border-gray-200 bg-white p-4">
        <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STEPS.map((s) => {
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <li
                key={s.num}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold ${
                  isCurrent
                    ? "bg-[#F50923] text-white"
                    : isDone
                    ? "bg-[#1E2127] text-white"
                    : "bg-[#FAFAFA] text-[#424750]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-white text-[#F50923]"
                      : isDone
                      ? "bg-[#F50923] text-white"
                      : "bg-gray-200 text-[#1E2127]"
                  }`}
                >
                  {isDone ? "✓" : s.num}
                </span>
                <span className="truncate">{s.label}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[#F50923] transition-all duration-300 ease-out"
            style={{ width: `${Math.round((step / STEPS.length) * 100)}%` }}
          />
        </div>
      </nav>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <StepTransition stepKey={step}>
        <div>
          {/* STEP 1: VEHICLE SELECTION */}
          {step === 1 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#1E2127]">
                Paso 1. Selecciona tu vehículo
              </h2>
              <p className="text-sm text-[#424750]">
                Elige un vehículo registrado en tu cuenta o agrega uno nuevo ahora mismo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewVehicleForm((prev) => !prev)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#1E2127] px-4 py-2 text-sm font-semibold text-[#1E2127] hover:bg-[#1E2127] hover:text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {showNewVehicleForm ? "Cancelar nuevo vehículo" : "Registrar vehículo nuevo"}
            </button>
          </div>

          {loadingVehicles ? (
            <p className="text-sm text-[#424750]">Cargando tus vehículos...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {vehicles.map((v) => {
                const selected = v.id === selectedVehicleId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVehicleId(v.id)}
                    aria-pressed={selected}
                    className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-2 border-[#F50923] bg-[#F50923]/5"
                        : "border-gray-200 bg-[#FAFAFA] hover:border-[#424750]"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                        selected ? "bg-[#F50923] text-white" : "bg-[#1E2127] text-white"
                      }`}
                    >
                      <Car className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#1E2127]">
                          {v.brand} {v.model} ({v.year})
                        </p>
                        {v.subscriptions && v.subscriptions.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <Sparkles className="h-3 w-3" />
                            Plan {v.subscriptions[0].plan.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-[#424750]">
                        Placa: {v.plate} · Color: {v.color}
                      </p>
                      <p className="mt-1 text-xs text-[#424750]">
                        {FUEL_TYPE_LABELS[v.fuelType] ?? v.fuelType} ·{" "}
                        {v.mileage.toLocaleString()} km
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {showNewVehicleForm && (
            <form
              onSubmit={handleSaveNewVehicle}
              className="mt-6 rounded-xl border border-gray-200 bg-[#FAFAFA] p-5"
            >
              <h3 className="mb-4 text-base font-bold text-[#1E2127]">
                Nuevo vehículo
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="nv-brand" className="mb-1 block text-xs font-semibold">
                    Marca *
                  </label>
                  <input
                    id="nv-brand"
                    required
                    value={vForm.brand}
                    onChange={(e) => setVForm({ ...vForm, brand: e.target.value })}
                    placeholder="Ej. Toyota"
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="nv-model" className="mb-1 block text-xs font-semibold">
                    Modelo *
                  </label>
                  <input
                    id="nv-model"
                    required
                    value={vForm.model}
                    onChange={(e) => setVForm({ ...vForm, model: e.target.value })}
                    placeholder="Ej. Corolla"
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="nv-year" className="mb-1 block text-xs font-semibold">
                    Año *
                  </label>
                  <input
                    id="nv-year"
                    type="number"
                    min={1985}
                    max={new Date().getFullYear() + 1}
                    required
                    value={vForm.year}
                    onChange={(e) => setVForm({ ...vForm, year: e.target.value })}
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="nv-plate" className="mb-1 block text-xs font-semibold">
                    Placa *
                  </label>
                  <input
                    id="nv-plate"
                    required
                    value={vForm.plate}
                    onChange={(e) => setVForm({ ...vForm, plate: e.target.value.toUpperCase() })}
                    placeholder="Ej. A912345"
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm uppercase"
                  />
                </div>
                <div>
                  <label htmlFor="nv-color" className="mb-1 block text-xs font-semibold">
                    Color *
                  </label>
                  <input
                    id="nv-color"
                    required
                    value={vForm.color}
                    onChange={(e) => setVForm({ ...vForm, color: e.target.value })}
                    placeholder="Ej. Blanco"
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="nv-mileage" className="mb-1 block text-xs font-semibold">
                    Kilometraje actual *
                  </label>
                  <input
                    id="nv-mileage"
                    type="number"
                    min={0}
                    required
                    value={vForm.mileage}
                    onChange={(e) => setVForm({ ...vForm, mileage: e.target.value })}
                    placeholder="Ej. 45000"
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="nv-fuel" className="mb-1 block text-xs font-semibold">
                    Combustible *
                  </label>
                  <select
                    id="nv-fuel"
                    value={vForm.fuelType}
                    onChange={(e) => setVForm({ ...vForm, fuelType: e.target.value })}
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  >
                    {Object.entries(FUEL_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="nv-last" className="mb-1 block text-xs font-semibold">
                    Último mantenimiento (opcional)
                  </label>
                  <input
                    id="nv-last"
                    type="date"
                    value={vForm.lastMaintenanceDate}
                    onChange={(e) =>
                      setVForm({ ...vForm, lastMaintenanceDate: e.target.value })
                    }
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="nv-notes" className="mb-1 block text-xs font-semibold">
                    Observaciones (opcional)
                  </label>
                  <input
                    id="nv-notes"
                    value={vForm.notes}
                    onChange={(e) => setVForm({ ...vForm, notes: e.target.value })}
                    placeholder="Detalles adicionales"
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingVehicle}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#1E2127] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#424750]"
              >
                {savingVehicle ? "Guardando..." : "Guardar y seleccionar vehículo"}
              </button>
            </form>
          )}
        </section>
      )}

      {/* STEP 2: SERVICES */}
      {step === 2 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#1E2127]">
                Paso 2. Selecciona los servicios
              </h2>
              <p className="text-sm text-[#424750]">
                Puedes combinar varios servicios preventivos compatibles en una misma cita.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-[#FAFAFA] px-4 py-2 text-right">
              <p className="text-xs text-[#424750]">
                {selectedServiceIds.length} servicio(s) · {totalEstimatedDuration} min
              </p>
              <p className="text-base font-extrabold text-[#1E2127]">
                Subtotal base: {formatDOP(rawEstimatedSubtotal)}
              </p>
            </div>
          </div>

          {!allServicesHomeCompatible && selectedServices.length > 0 && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
              <Building className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              <span>
                Has seleccionado al menos un servicio que requiere elevador hidráulico o manejo
                de fluidos en taller. Esta cita deberá atenderse en nuestro{" "}
                <strong>centro físico</strong>.
              </span>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {services.map((s) => {
              const checked = selectedServiceIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors ${
                    checked
                      ? "border-2 border-[#F50923] bg-[#F50923]/5"
                      : "border-gray-200 bg-[#FAFAFA] hover:border-[#424750]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedServiceIds((prev) =>
                        prev.includes(s.id)
                          ? prev.filter((id) => id !== s.id)
                          : [...prev, s.id]
                      );
                    }}
                    className="mt-1 h-5 w-5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E2127]">
                        <ServiceIcon name={s.iconName} className="h-4 w-4 text-[#F50923]" />
                        {s.name}
                      </span>
                      <span className="shrink-0 text-sm font-extrabold text-[#1E2127]">
                        {formatDOP(s.price)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#424750]">{s.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                      <span className="inline-flex items-center gap-1 text-[#424750]">
                        <Clock className="h-3 w-3" /> {s.estimatedDuration} min
                      </span>
                      <span className="rounded bg-gray-200 px-2 py-0.5 text-[#1E2127]">
                        Taller
                      </span>
                      {s.isAvailableHome ? (
                        <span className="rounded bg-[#F50923]/15 px-2 py-0.5 text-[#F50923]">
                          Apto domicilio ({formatDOP(s.homePrice)})
                        </span>
                      ) : (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">
                          Solo taller
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* STEP 3: MODE & ADDRESS */}
      {step === 3 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-extrabold text-[#1E2127]">
            Paso 3. Elige la modalidad de atención
          </h2>
          <p className="mt-1 text-sm text-[#424750]">
            «Tú eliges dónde, nosotros cuidamos tu vehículo».
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("WORKSHOP")}
              aria-pressed={mode === "WORKSHOP"}
              className={`flex flex-col items-start rounded-xl border p-5 text-left transition-colors ${
                mode === "WORKSHOP"
                  ? "border-2 border-[#1E2127] bg-[#1E2127] text-white"
                  : "border-gray-200 bg-[#FAFAFA] text-[#1E2127] hover:border-[#424750]"
              }`}
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#F50923] text-white">
                <Building className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Atención en nuestro taller</h3>
              <p
                className={`mt-1 text-sm ${
                  mode === "WORKSHOP" ? "text-gray-300" : "text-[#424750]"
                }`}
              >
                Centro físico DWay AutoCare en Distrito Nacional (Naco / Piantini). Cuenta
                con elevador hidráulico, sala de espera y todos los servicios del catálogo.
              </p>
              <span className="mt-3 text-xs font-bold uppercase tracking-wider text-[#F50923]">
                Sin recargo de traslado
              </span>
            </button>

            <button
              type="button"
              disabled={!allServicesHomeCompatible}
              onClick={() => allServicesHomeCompatible && setMode("HOME_SERVICE")}
              aria-pressed={mode === "HOME_SERVICE"}
              className={`flex flex-col items-start rounded-xl border p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                mode === "HOME_SERVICE"
                  ? "border-2 border-[#F50923] bg-[#F50923]/5 text-[#1E2127]"
                  : "border-gray-200 bg-[#FAFAFA] text-[#1E2127] hover:border-[#424750]"
              }`}
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#1E2127] text-[#F50923]">
                <CarFront className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Servicio a domicilio (Unidad Móvil)</h3>
              <p className="mt-1 text-sm text-[#424750]">
                {allServicesHomeCompatible
                  ? "Nuestra unidad móvil equipada acude a tu casa u oficina dentro de las zonas de cobertura del Distrito Nacional."
                  : "No disponible para la selección actual porque incluye servicios que requieren elevador en taller."}
              </p>
              <span className="mt-3 text-xs font-bold uppercase tracking-wider text-[#F50923]">
                Requiere espacio plano y ventilado
              </span>
            </button>
          </div>

          {mode === "HOME_SERVICE" && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="mb-5 rounded-xl border border-[#1E2127]/15 bg-[#FAFAFA] p-4 text-xs text-[#424750]">
                <p className="font-bold text-[#1E2127]">
                  Condiciones operativas de la unidad móvil
                </p>
                <p className="mt-1 leading-relaxed">
                  Ventana estimada de llegada de <strong>+/- 1 hora</strong> según condiciones de
                  tránsito en Santo Domingo (con aviso oportuno en caso de retraso). Se requiere
                  un espacio plano, seguro y permitido (marquesina, parqueo residencial o empresarial).
                  Sin cargo por reprogramación al avisar con antelación.
                </p>
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#1E2127]">
                    Dirección para la unidad móvil
                  </h3>
                  <p className="text-xs text-[#424750]">
                    Validamos automáticamente que el sector esté cubierto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm((prev) => !prev)}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#1E2127] px-3.5 py-2 text-xs font-semibold text-[#1E2127]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showNewAddressForm ? "Ocultar formulario" : "Nueva dirección"}
                </button>
              </div>

              {addresses.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((addr) => {
                    const selected = addr.id === selectedAddressId;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left ${
                          selected
                            ? "border-2 border-[#F50923] bg-[#F50923]/5"
                            : "border-gray-200 bg-[#FAFAFA]"
                        }`}
                      >
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#F50923]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-[#1E2127]">
                              {addr.label}
                            </span>
                            {addr.isCovered ? (
                              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                En cobertura
                              </span>
                            ) : (
                              <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                                Fuera de zona
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-[#424750]">
                            {addr.street} #{addr.number}, {addr.sector}, {addr.province}
                          </p>
                          {addr.reference && (
                            <p className="mt-0.5 text-[11px] text-gray-500">
                              Ref: {addr.reference}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {showNewAddressForm && (
                <form
                  onSubmit={handleSaveNewAddress}
                  className="mt-5 rounded-xl border border-gray-200 bg-[#FAFAFA] p-5"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#1E2127]">
                      Guardar dirección frecuente
                    </h4>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2127] hover:border-[#F50923]"
                    >
                      <LocateFixed className="h-3.5 w-3.5 text-[#F50923]" />
                      Adjuntar coordenadas GPS
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label htmlFor="na-label" className="mb-1 block text-xs font-semibold">
                        Etiqueta *
                      </label>
                      <input
                        id="na-label"
                        required
                        value={aForm.label}
                        onChange={(e) => setAForm({ ...aForm, label: e.target.value })}
                        placeholder="Casa, Oficina..."
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="na-prov" className="mb-1 block text-xs font-semibold">
                        Provincia *
                      </label>
                      <select
                        id="na-prov"
                        value={aForm.province}
                        onChange={(e) => {
                          const prov = e.target.value;
                          const muns = MUNICIPALITIES_BY_PROVINCE[prov] || [prov];
                          setAForm({ ...aForm, province: prov, municipality: muns[0] });
                        }}
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      >
                        {DOMINICAN_PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="na-mun" className="mb-1 block text-xs font-semibold">
                        Municipio *
                      </label>
                      <input
                        id="na-mun"
                        required
                        value={aForm.municipality}
                        onChange={(e) =>
                          setAForm({ ...aForm, municipality: e.target.value })
                        }
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="na-sec" className="mb-1 block text-xs font-semibold">
                        Sector (Zonas en cobertura) *
                      </label>
                      <input
                        id="na-sec"
                        list="coverage-sectors"
                        required
                        value={aForm.sector}
                        onChange={(e) => setAForm({ ...aForm, sector: e.target.value })}
                        placeholder="Ej. Naco, Piantini"
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      />
                      <datalist id="coverage-sectors">
                        {coverageZones.map((z) => (
                          <option key={z.id} value={z.sector} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label htmlFor="na-street" className="mb-1 block text-xs font-semibold">
                        Calle *
                      </label>
                      <input
                        id="na-street"
                        required
                        value={aForm.street}
                        onChange={(e) => setAForm({ ...aForm, street: e.target.value })}
                        placeholder="Ej. Av. Tiradentes"
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="na-num" className="mb-1 block text-xs font-semibold">
                        Número / Edificio *
                      </label>
                      <input
                        id="na-num"
                        required
                        value={aForm.number}
                        onChange={(e) => setAForm({ ...aForm, number: e.target.value })}
                        placeholder="Ej. #24, Torre Norte"
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-2">
                      <label htmlFor="na-ref" className="mb-1 block text-xs font-semibold">
                        Referencia de ubicación
                      </label>
                      <input
                        id="na-ref"
                        value={aForm.reference}
                        onChange={(e) => setAForm({ ...aForm, reference: e.target.value })}
                        placeholder="Frente al parqueo de visitas..."
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="na-inst" className="mb-1 block text-xs font-semibold">
                        Instrucciones adicionales
                      </label>
                      <input
                        id="na-inst"
                        value={aForm.additionalInstructions}
                        onChange={(e) =>
                          setAForm({ ...aForm, additionalInstructions: e.target.value })
                        }
                        placeholder="Llamar al llegar..."
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      />
                    </div>
                  </div>

                  {aForm.latitude && aForm.longitude && (
                    <p className="mt-3 text-xs font-medium text-emerald-700">
                      Coordenadas capturadas: {aForm.latitude}, {aForm.longitude}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#1E2127] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    {savingAddress ? "Guardando..." : "Guardar y usar esta dirección"}
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      )}

      {/* STEP 4: REAL-TIME AVAILABILITY CALENDAR */}
      {step === 4 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-extrabold text-[#1E2127]">
            Paso 4. Selecciona fecha y horario disponible
          </h2>
          <p className="mt-1 text-sm text-[#424750]">
            Calculado en tiempo real según capacidad de taller, técnicos, unidad móvil,
            desplazamiento y citas existentes.
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-12">
            {/* Interactive Month Calendar */}
            <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 lg:col-span-6">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Mes anterior"
                  onClick={() =>
                    setCalMonth((prev) =>
                      prev.month === 0
                        ? { year: prev.year - 1, month: 11 }
                        : { year: prev.year, month: prev.month - 1 }
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white hover:border-[#1E2127]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold capitalize text-[#1E2127]">
                  {monthLabel}
                </span>
                <button
                  type="button"
                  aria-label="Mes siguiente"
                  onClick={() =>
                    setCalMonth((prev) =>
                      prev.month === 11
                        ? { year: prev.year + 1, month: 0 }
                        : { year: prev.year, month: prev.month + 1 }
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white hover:border-[#1E2127]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-[#424750]">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
                  <div key={d} className="py-1.5">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((cell, i) => {
                  if (!cell) return <div key={`empty-${i}`} />;
                  const disabled = cell.isPast || cell.isSunday;
                  const active = selectedDate === cell.dateStr;
                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedDate(cell.dateStr)}
                      aria-pressed={active}
                      className={`min-h-[42px] rounded-lg text-sm font-semibold transition-colors ${
                        active
                          ? "bg-[#F50923] text-white"
                          : disabled
                          ? "cursor-not-allowed text-gray-300"
                          : "bg-white text-[#1E2127] hover:border hover:border-[#1E2127]"
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[#424750]">
                Lunes a Viernes: 8:00 a.m.–5:00 p.m. · Sábados: 8:00 a.m.–1:00 p.m. · Domingos
                cerrado.
              </p>
            </div>

            {/* Available Time Slots */}
            <div className="space-y-5 lg:col-span-6">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-[#1E2127]">
                  <CalendarIcon className="h-4 w-4 text-[#F50923]" />
                  {selectedDate
                    ? `Horarios disponibles (${selectedDate.split("-").reverse().join("/")})`
                    : "Selecciona una fecha en el calendario"}
                </h3>

                {loadingSlots && (
                  <p className="mt-3 text-sm text-[#424750]">
                    Consultando disponibilidad real de técnicos y bahías...
                  </p>
                )}

                {!loadingSlots && closedReason && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
                    {closedReason}
                  </div>
                )}

                {!loadingSlots && selectedDate && !closedReason && slots.length === 0 && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-[#FAFAFA] p-3.5 text-sm text-[#424750]">
                    No hay cupos disponibles para la duración requerida ({totalEstimatedDuration}{" "}
                    min) en esta fecha. Prueba otro día.
                  </div>
                )}

                {!loadingSlots && slots.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {slots.map((slot) => {
                      const isSel = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setSelectedTime(slot.time)}
                          aria-pressed={isSel}
                          className={`min-h-[48px] rounded-lg border px-3 py-2 text-center text-sm font-semibold transition-colors ${
                            isSel
                              ? "border-[#F50923] bg-[#F50923] text-white"
                              : "border-gray-200 bg-[#FAFAFA] text-[#1E2127] hover:border-[#1E2127]"
                          }`}
                        >
                          {slot.time}
                          <span className="block text-[11px] font-normal opacity-80">
                            hasta {slot.endTime}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4">
                <label className="flex min-h-[40px] cursor-pointer items-center gap-2.5 text-sm text-[#1E2127]">
                  <input
                    type="checkbox"
                    checked={useMembershipBenefit}
                    onChange={(e) => setUseMembershipBenefit(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Sparkles className="h-4 w-4 text-[#F50923]" />
                    Aplicar beneficios / descuento de mi membresía activa (si corresponde)
                  </span>
                </label>

                <div>
                  <label htmlFor="promo-code" className="mb-1 block text-xs font-semibold">
                    Código promocional (opcional, ej. SOCIOFUNDADOR o REFERIDO5)
                  </label>
                  <p className="mb-1.5 text-[11px] text-[#424750]">
                    Nota: Los beneficios y descuentos de los planes Esencial y Confort aplican en el centro físico; Premium Domicilio aplica tanto a domicilio como en centro.
                  </p>
                  <input
                    id="promo-code"
                    value={promotionCode}
                    onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                    placeholder="Opcional"
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3 text-sm uppercase"
                  />
                </div>

                <div>
                  <label htmlFor="appt-notes" className="mb-1 block text-xs font-semibold">
                    Comentarios o síntomas del vehículo (opcional)
                  </label>
                  <textarea
                    id="appt-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Luz de check engine encendida, ruido leve al frenar..."
                    className="w-full rounded-lg border border-gray-300 bg-[#FAFAFA] p-3 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 5: SUMMARY & CONFIRMATION */}
      {step === 5 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-extrabold text-[#1E2127]">
            Paso 5. Resumen de tu cita
          </h2>
          <p className="mt-1 text-sm text-[#424750]">
            Revisa todos los detalles y el desglose transparente antes de confirmar.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 rounded-xl border border-gray-200 bg-[#FAFAFA] p-5 lg:col-span-7">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase text-[#424750]">Cliente</p>
                  <p className="font-semibold text-[#1E2127]">{session?.user?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-[#424750]">Vehículo</p>
                  <p className="font-semibold text-[#1E2127]">
                    {selectedVehicle?.brand} {selectedVehicle?.model} ({selectedVehicle?.year}) ·{" "}
                    {selectedVehicle?.plate}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-[#424750]">Modalidad</p>
                  <p className="font-semibold text-[#1E2127]">
                    {mode === "HOME_SERVICE"
                      ? "Servicio a domicilio (Unidad Móvil)"
                      : "Atención en nuestro taller"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-[#424750]">Fecha y hora</p>
                  <p className="font-semibold text-[#1E2127]">
                    {selectedDate.split("-").reverse().join("/")} a las {selectedTime} (
                    {totalEstimatedDuration} min)
                  </p>
                </div>
              </div>

              {mode === "HOME_SERVICE" && selectedAddress && (
                <div className="border-t border-gray-200 pt-3 text-sm">
                  <p className="text-xs font-bold uppercase text-[#424750]">
                    Dirección de visita
                  </p>
                  <p className="font-semibold text-[#1E2127]">
                    {selectedAddress.street} #{selectedAddress.number}, {selectedAddress.sector},{" "}
                    {selectedAddress.municipality}, {selectedAddress.province}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3">
                <p className="mb-2 text-xs font-bold uppercase text-[#424750]">
                  Servicios solicitados
                </p>
                <ul className="space-y-1.5 text-sm">
                  {selectedServices.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-[#F50923]" />
                        {s.name}
                      </span>
                      <span className="font-semibold">{formatDOP(s.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-5">
              <h3 className="text-base font-bold text-[#1E2127]">
                Desglose financiero (RD$)
              </h3>
              {loadingQuote || !quote ? (
                <p className="mt-4 text-sm text-[#424750]">Calculando totales e ITBIS...</p>
              ) : (
                <div className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#424750]">Subtotal servicios</span>
                    <span className="font-semibold">{formatDOP(quote.subtotalAmount)}</span>
                  </div>
                  {quote.travelFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#424750]">Desplazamiento unidad móvil</span>
                      <span className="font-semibold">{formatDOP(quote.travelFee)}</span>
                    </div>
                  )}
                  {quote.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>{quote.appliedDiscountLabel || "Descuento aplicado"}</span>
                      <span className="font-semibold">
                        -{formatDOP(quote.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#424750]">
                      ITBIS ({Math.round(quote.itbisRate * 100)}%)
                    </span>
                    <span className="font-semibold">{formatDOP(quote.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-extrabold text-[#1E2127]">
                    <span>Total estimado</span>
                    <span className="text-[#F50923]">{formatDOP(quote.totalAmount)}</span>
                  </div>
                </div>
              )}

              <label className="mt-5 flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] p-3 text-xs text-[#1E2127]">
                <input
                  type="checkbox"
                  checked={confirmedAgree}
                  onChange={(e) => setConfirmedAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span>
                  Confirmo que los datos del vehículo, la modalidad y el horario seleccionado
                  son correctos.
                </span>
              </label>

              <button
                type="button"
                disabled={submittingBooking || loadingQuote || !confirmedAgree}
                onClick={handleConfirmBooking}
                className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#F50923] px-5 py-3 text-sm font-semibold text-white hover:bg-[#CC071D] disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {submittingBooking ? "Registrando cita..." : "Confirmar y reservar cita"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP 6: CONFIRMATION */}
      {step === 6 && confirmedAppt && (
        <section className="mx-auto max-w-2xl rounded-2xl border-2 border-emerald-500 bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mb-5 flex justify-center">
            <DWayLogo variant="dark" size="md" />
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
          </div>
          <span className="inline-block rounded-md bg-[#1E2127] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Reserva Confirmada en Sistema
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
            Código: {confirmedAppt.bookingCode}
          </h2>
          <p className="mt-2 text-sm text-[#424750]">
            Tu cita ya está visible en tu portal de cliente y en la agenda del equipo DWay
            AutoCare. Garantía de 30 días sobre mano de obra incluida al completar el servicio.
          </p>

          <div className="mt-6 space-y-2 rounded-xl border border-gray-200 bg-[#FAFAFA] p-5 text-left text-sm">
            <p>
              <strong>Vehículo:</strong> {confirmedAppt.vehicle.brand}{" "}
              {confirmedAppt.vehicle.model} ({confirmedAppt.vehicle.plate})
            </p>
            <p>
              <strong>Fecha y hora:</strong> {formatDateRD(confirmedAppt.appointmentDate)} ·{" "}
              {formatTimeRD(confirmedAppt.appointmentDate)}
            </p>
            <p>
              <strong>Modalidad:</strong>{" "}
              {confirmedAppt.mode === "HOME_SERVICE"
                ? "Servicio a domicilio (margen de llegada +/- 1 h)"
                : "Atención en taller"}
            </p>
            {confirmedAppt.technician && (
              <p>
                <strong>Técnico asignado:</strong> {confirmedAppt.technician.user.name}
              </p>
            )}
            <p>
              <strong>Total estimado:</strong>{" "}
              <span className="font-bold text-[#F50923]">
                {formatDOP(confirmedAppt.totalAmount)}
              </span>
            </p>
          </div>

          <div className="no-print mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#1E2127] hover:border-[#1E2127]"
            >
              Imprimir comprobante
            </button>
            <a
              href={`/api/appointments/${confirmedAppt.id}/ics`}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-[#1E2127] bg-white px-5 py-3 text-sm font-semibold text-[#1E2127] hover:bg-[#1E2127] hover:text-white"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Agregar al calendario (.ics)
            </a>
            <Link
              href="/portal"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#F50923] px-5 py-3 text-sm font-semibold text-white hover:bg-[#CC071D]"
            >
              Ir a mi portal
            </Link>
          </div>
        </section>
      )}
        </div>
      </StepTransition>

      {/* Wizard Navigation Controls */}
      {step < 6 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => {
              setError(null);
              setStep((s) => Math.max(1, s - 1));
            }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#1E2127] hover:border-[#1E2127] disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Anterior
          </button>

          {step < 5 && (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-[#1E2127] px-6 py-3 text-sm font-semibold text-white hover:bg-[#424750]"
            >
              Siguiente paso
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
