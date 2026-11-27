"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { StepTransition } from "@/components/MotionPrimitives";
import {
  CalendarPlus,
  Car,
  History,
  CreditCard,
  MapPin,
  Bell,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Edit3,
  Trash2,
  RefreshCw,
  XCircle,
  Printer,
  Sparkles,
  Wrench,
  Plus,
} from "lucide-react";
import { DWayLogo } from "@/components/DWayLogo";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  DOMINICAN_PROVINCES,
  FUEL_TYPE_LABELS,
  MUNICIPALITIES_BY_PROVINCE,
  STATUSES_BY_MODE,
  formatDOP,
  formatDateRD,
  formatDateTimeRD,
  formatTimeRD,
} from "@/lib/constants";

type TabId =
  | "resumen"
  | "citas"
  | "vehiculos"
  | "historial"
  | "membresias"
  | "direcciones"
  | "perfil";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  fuelType: string;
  mileage: number;
  lastMaintenanceDate: string | null;
  notes: string | null;
  _count?: { appointments: number; maintenanceRecords: number };
}

interface Appointment {
  id: string;
  bookingCode: string;
  mode: "WORKSHOP" | "HOME_SERVICE";
  appointmentDate: string;
  endDate: string;
  estimatedDuration: number;
  status: string;
  notes: string | null;
  subtotalAmount: number;
  discountAmount: number;
  travelFee: number;
  taxAmount: number;
  totalAmount: number;
  vehicle: Vehicle;
  address?: {
    label: string;
    street: string;
    number: string;
    sector: string;
    province: string;
  } | null;
  technician?: { user: { name: string; phone?: string | null } } | null;
  appointmentServices: Array<{
    id: string;
    serviceId: string;
    price: number;
    usedMembershipBenefit: boolean;
    service: { id: string; name: string };
  }>;
  statusHistory: Array<{
    id: string;
    status: string;
    changedAt: string;
    notes: string | null;
    changedBy: { name: string; role: string };
  }>;
}

interface MaintenanceRecord {
  id: string;
  receiptNumber: string;
  serviceDate: string;
  mileageAtService: number;
  servicesPerformed: string;
  productsUsed: string | null;
  checklistJson: string | null;
  totalCost: number;
  observations: string | null;
  recommendations: string | null;
  nextServiceDate: string | null;
  nextServiceMileage: number | null;
  warrantyExpiresAt: string | null;
  vehicle: Vehicle;
  technician: { user: { name: string } };
  appointment: { bookingCode: string; mode: string };
}

interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  targetMode: string;
  includedReviews: number;
  includedBatteryTests: number;
  includedDiagnostics: number;
  includedOilChanges: number;
  discountPercent: number;
  benefits: string;
  restrictions: string;
}

interface Subscription {
  id: string;
  billingCycle: "MONTHLY" | "ANNUAL";
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  reviewsUsed: number;
  batteryTestsUsed: number;
  diagnosticsUsed: number;
  oilChangesUsed: number;
  plan: MembershipPlan;
  vehicle?: Vehicle | null;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string | null;
    reference: string | null;
    isDemoPayment: boolean;
    createdAt: string;
  }>;
}

interface Address {
  id: string;
  label: string;
  province: string;
  municipality: string;
  sector: string;
  street: string;
  number: string;
  reference: string | null;
  isDefault: boolean;
  isCovered: boolean;
}

interface NotificationItem {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function ClientPortal({
  initialTab = "resumen",
  preselectedPlanId,
  preselectedCycle,
}: {
  initialTab?: string;
  preselectedPlanId?: string;
  preselectedCycle?: string;
}) {
  const { data: session, update: updateSession } = useSession();

  const validTabs: TabId[] = [
    "resumen",
    "citas",
    "vehiculos",
    "historial",
    "membresias",
    "direcciones",
    "perfil",
  ];
  const [activeTab, setActiveTab] = useState<TabId>(
    validTabs.includes(initialTab as TabId) ? (initialTab as TabId) : "resumen"
  );

  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [zones, setZones] = useState<Array<{ id: string; sector: string }>>([]);

  const [historyVehicleFilter, setHistoryVehicleFilter] = useState<string>("ALL");

  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  // Vehicle modal/form
  const vehicleDialogRef = useRef<HTMLDialogElement>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
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

  // Reschedule modal
  const reschedDialogRef = useRef<HTMLDialogElement>(null);
  const [reschedTarget, setReschedTarget] = useState<Appointment | null>(null);
  const [reschedDate, setReschedDate] = useState("");
  const [reschedSlots, setReschedSlots] = useState<Array<{ time: string; endTime: string }>>([]);
  const [reschedTime, setReschedTime] = useState("");
  const [loadingReschedSlots, setLoadingReschedSlots] = useState(false);

  // Cancel modal
  const cancelDialogRef = useRef<HTMLDialogElement>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  // Receipt printable modal
  const receiptDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<MaintenanceRecord | null>(null);

  // Membership subscription modal
  const subDialogRef = useRef<HTMLDialogElement>(null);
  const [subPlan, setSubPlan] = useState<MembershipPlan | null>(null);
  const [subCycle, setSubCycle] = useState<"MONTHLY" | "ANNUAL">(
    preselectedCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY"
  );
  const [subVehicleId, setSubVehicleId] = useState<string>("");

  // New Address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [aForm, setAForm] = useState({
    label: "Casa",
    province: "Distrito Nacional",
    municipality: "Santo Domingo de Guzmán",
    sector: "Naco",
    street: "",
    number: "",
    reference: "",
    isDefault: true,
  });

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, aRes, mRes, memRes, addrRes, nRes, pRes, zRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/appointments"),
        fetch("/api/maintenance-records"),
        fetch("/api/memberships"),
        fetch("/api/addresses"),
        fetch("/api/notifications"),
        fetch("/api/profile"),
        fetch("/api/coverage-zones"),
      ]);

      if (vRes.ok) setVehicles((await vRes.json()).vehicles || []);
      if (aRes.ok) setAppointments((await aRes.json()).appointments || []);
      if (mRes.ok) setRecords((await mRes.json()).records || []);
      if (memRes.ok) {
        const memData = await memRes.json();
        setPlans(memData.plans || []);
        setSubscriptions(memData.subscriptions || []);
      }
      if (addrRes.ok) setAddresses((await addrRes.json()).addresses || []);
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotifications((nData.notifications || []).filter((n: NotificationItem) => n.channel === "INTERNAL"));
        setUnreadCount(nData.unreadCount || 0);
      }
      if (pRes.ok) {
        const u = (await pRes.json()).user;
        if (u) {
          setProfileForm({
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            phone: u.phone || "",
            email: u.email || "",
          });
        }
      }
      if (zRes.ok) setZones((await zRes.json()).zones || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Open preselected plan modal if navigated from /membresias
  useEffect(() => {
    if (preselectedPlanId && plans.length > 0 && vehicles.length > 0 && !subPlan) {
      const match = plans.find((p) => p.id === preselectedPlanId);
      if (match) {
        setSubPlan(match);
        setSubVehicleId(vehicles[0].id);
        subDialogRef.current?.showModal();
      }
    }
  }, [preselectedPlanId, plans, vehicles, subPlan]);

  // Next upcoming appointment
  const nextAppointment = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(
        (a) =>
          !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status) &&
          new Date(a.appointmentDate) >= new Date(now.getTime() - 2 * 60 * 60 * 1000)
      )
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      )[0];
  }, [appointments]);

  const activeSubscription = useMemo(
    () =>
      subscriptions.find(
        (s) => s.status === "ACTIVE" && new Date(s.endDate) >= new Date()
      ) ?? null,
    [subscriptions]
  );

  // Recommended upcoming maintenance based on real MaintenanceRecords
  const upcomingRecommendations = useMemo(() => {
    return records.filter((r) => r.nextServiceDate || r.nextServiceMileage);
  }, [records]);

  const openVehicleModal = (v?: Vehicle) => {
    if (v) {
      setEditingVehicle(v);
      setVForm({
        brand: v.brand,
        model: v.model,
        year: String(v.year),
        plate: v.plate,
        color: v.color,
        mileage: String(v.mileage),
        fuelType: v.fuelType,
        lastMaintenanceDate: v.lastMaintenanceDate
          ? v.lastMaintenanceDate.slice(0, 10)
          : "",
        notes: v.notes || "",
      });
    } else {
      setEditingVehicle(null);
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
    vehicleDialogRef.current?.showModal();
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : "/api/vehicles";
    const method = editingVehicle ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
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
      setBanner({ type: "err", text: data.error || "No se pudo guardar el vehículo." });
    } else {
      vehicleDialogRef.current?.close();
      setBanner({
        type: "ok",
        text: editingVehicle
          ? "Vehículo actualizado correctamente."
          : "Vehículo registrado correctamente.",
      });
      await loadAllData();
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error });
    } else {
      setBanner({ type: "ok", text: "Vehículo eliminado." });
      await loadAllData();
    }
  };

  // Reschedule handlers
  const openReschedule = (appt: Appointment) => {
    setReschedTarget(appt);
    setReschedDate("");
    setReschedSlots([]);
    setReschedTime("");
    reschedDialogRef.current?.showModal();
  };

  useEffect(() => {
    if (!reschedTarget || !reschedDate) return;
    setLoadingReschedSlots(true);
    setReschedTime("");
    const serviceIds = reschedTarget.appointmentServices.map((s) => s.serviceId);
    const params = new URLSearchParams({
      date: reschedDate,
      serviceIds: serviceIds.join(","),
      mode: reschedTarget.mode,
      excludeAppointmentId: reschedTarget.id,
    });
    fetch(`/api/availability?${params.toString()}`)
      .then(async (r) => {
        const d = await r.json();
        setReschedSlots(d.isClosed ? [] : d.slots || []);
      })
      .finally(() => setLoadingReschedSlots(false));
  }, [reschedTarget, reschedDate]);

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedTarget || !reschedDate || !reschedTime) return;
    const res = await fetch(`/api/appointments/${reschedTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "RESCHEDULE",
        date: reschedDate,
        time: reschedTime,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error || "No se pudo reprogramar." });
    } else {
      reschedDialogRef.current?.close();
      setBanner({
        type: "ok",
        text: `Cita ${reschedTarget.bookingCode} reprogramada correctamente.`,
      });
      await loadAllData();
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const res = await fetch(`/api/appointments/${cancelTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CANCEL" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error });
    } else {
      cancelDialogRef.current?.close();
      setBanner({ type: "ok", text: `Cita ${cancelTarget.bookingCode} cancelada.` });
      await loadAllData();
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subPlan) return;
    const res = await fetch("/api/memberships/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: subPlan.id,
        billingCycle: subCycle,
        vehicleId: subVehicleId || null,
        method: "DEMO",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error });
    } else {
      subDialogRef.current?.close();
      setBanner({
        type: "ok",
        text: `Membresía ${subPlan.name} activada en tu cuenta (entorno demo).`,
      });
      await loadAllData();
    }
  };

  const handleSubAction = async (id: string, action: "CANCEL" | "RENEW") => {
    const res = await fetch(`/api/memberships/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error });
    } else {
      setBanner({
        type: "ok",
        text: action === "RENEW" ? "Membresía renovada." : "Membresía cancelada.",
      });
      await loadAllData();
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error });
    } else {
      setShowAddrForm(false);
      setBanner({ type: "ok", text: "Dirección guardada." });
      await loadAllData();
    }
  };

  const handleDeleteAddress = async (id: string) => {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    await loadAllData();
  };

  const handleMarkNotificationsRead = async (id?: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { markAll: true }),
    });
    await loadAllData();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBanner({ type: "err", text: data.error });
    } else {
      await updateSession({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        name: data.user.name,
      });
      setBanner({ type: "ok", text: "Tus datos personales fueron actualizados." });
    }
  };

  const filteredRecords = records.filter((r) =>
    historyVehicleFilter === "ALL" ? true : r.vehicle.id === historyVehicleFilter
  );

  const displayName =
    profileForm.firstName || session?.user?.firstName || session?.user?.name || "Cliente";

  return (
    <div className="space-y-6">
      {/* Greeting & Quick Actions Header */}
      <section className="animate-dway-enter rounded-2xl border border-[#424750]/20 bg-[#1E2127] p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <DWayLogo variant="light" size="sm" />
              <span className="inline-block rounded-md bg-[#F50923] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Portal del Cliente
              </span>
            </div>
            <h1 className="mt-2.5 text-2xl font-extrabold text-white sm:text-3xl">
              ¡Hola, {displayName}!
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Administra tus vehículos, próximas citas, historial preventivo y beneficios de
              membresía desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/agendar"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#F50923] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#CC071D]"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Agendar nueva cita
            </Link>
            <button
              type="button"
              onClick={() => openVehicleModal()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-500 bg-[#15171B] px-4 py-2.5 text-sm font-semibold text-white hover:border-white"
            >
              <Plus className="h-4 w-4 text-[#F50923]" aria-hidden="true" />
              Registrar vehículo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("historial")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-500 bg-transparent px-4 py-2.5 text-sm font-semibold text-white hover:border-white"
            >
              <History className="h-4 w-4" aria-hidden="true" />
              Consultar historial
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("membresias")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-500 bg-transparent px-4 py-2.5 text-sm font-semibold text-white hover:border-white"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Consultar membresías
            </button>
          </div>
        </div>
      </section>

      {banner && (
        <div
          role={banner.type === "err" ? "alert" : "status"}
          className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm ${
            banner.type === "err"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {banner.type === "err" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          )}
          <span>{banner.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Secciones del portal del cliente"
        className="flex gap-1.5 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 sm:flex-wrap"
      >
        {[
          { id: "resumen", label: "Resumen", icon: Sparkles },
          { id: "citas", label: `Mis citas (${appointments.length})`, icon: Clock },
          { id: "vehiculos", label: `Vehículos (${vehicles.length})`, icon: Car },
          { id: "historial", label: `Historial (${records.length})`, icon: History },
          { id: "membresias", label: "Membresías", icon: CreditCard },
          { id: "direcciones", label: "Direcciones", icon: MapPin },
          {
            id: "perfil",
            label: unreadCount > 0 ? `Notificaciones y Perfil (${unreadCount})` : "Notificaciones y Perfil",
            icon: User,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold sm:text-sm ${
                active
                  ? "bg-[#1E2127] text-white"
                  : "text-[#424750] hover:bg-gray-100 hover:text-[#1E2127]"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-[#F50923]" : ""}`} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-[#424750]">
          Cargando información de tu cuenta...
        </div>
      ) : (
        <StepTransition stepKey={activeTab}>
          <div>
          {/* TAB 1: RESUMEN */}
          {activeTab === "resumen" && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-7">
                {/* Next Appointment */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="text-lg font-bold text-[#1E2127]">Tu próxima cita</h2>
                  {nextAppointment ? (
                    <div className="mt-4 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-base font-extrabold text-[#1E2127]">
                          {nextAppointment.bookingCode}
                        </span>
                        <span
                          className={`rounded-md border px-2.5 py-1 text-xs font-bold ${
                            APPOINTMENT_STATUS_COLORS[nextAppointment.status] ??
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {APPOINTMENT_STATUS_LABELS[nextAppointment.status] ??
                            nextAppointment.status}
                        </span>
                      </div>

                      <div className="grid gap-2 rounded-lg border border-gray-100 bg-[#FAFAFA] p-4 text-sm sm:grid-cols-2">
                        <p>
                          <strong>Vehículo:</strong> {nextAppointment.vehicle.brand}{" "}
                          {nextAppointment.vehicle.model} ({nextAppointment.vehicle.plate})
                        </p>
                        <p>
                          <strong>Fecha:</strong> {formatDateRD(nextAppointment.appointmentDate)}{" "}
                          · {formatTimeRD(nextAppointment.appointmentDate)}
                        </p>
                        <p>
                          <strong>Modalidad:</strong>{" "}
                          {nextAppointment.mode === "HOME_SERVICE"
                            ? "A domicilio (Unidad Móvil)"
                            : "En taller físico"}
                        </p>
                        <p>
                          <strong>Técnico:</strong>{" "}
                          {nextAppointment.technician?.user.name || "Por asignar"}
                        </p>
                      </div>

                      {/* Valid status progression for selected mode */}
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase text-[#424750]">
                          Flujo de atención ({nextAppointment.mode === "HOME_SERVICE" ? "Domicilio" : "Taller"})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {STATUSES_BY_MODE[nextAppointment.mode]
                            .filter((st) => !["RESCHEDULED", "CANCELLED", "NO_SHOW"].includes(st))
                            .map((st) => (
                              <span
                                key={st}
                                className={`rounded px-2 py-1 text-[11px] font-semibold ${
                                  st === nextAppointment.status
                                    ? "bg-[#F50923] text-white"
                                    : "bg-gray-100 text-[#424750]"
                                }`}
                              >
                                {APPOINTMENT_STATUS_LABELS[st]}
                              </span>
                            ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href={`/api/appointments/${nextAppointment.id}/ics`}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-[#1E2127] hover:border-[#1E2127]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Calendario (.ics)
                        </a>
                        <button
                          type="button"
                          onClick={() => openReschedule(nextAppointment)}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#1E2127] px-3 py-2 text-xs font-semibold text-[#1E2127] hover:bg-[#1E2127] hover:text-white"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Reprogramar cita
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCancelTarget(nextAppointment);
                            cancelDialogRef.current?.showModal();
                          }}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancelar cita
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-[#FAFAFA] p-6 text-center">
                      <p className="text-sm text-[#424750]">
                        No tienes citas próximas agendadas en este momento.
                      </p>
                      <Link
                        href="/agendar"
                        className="mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#F50923] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Agendar mantenimiento
                      </Link>
                    </div>
                  )}
                </div>

                {/* Recommended Upcoming Maintenance */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="text-lg font-bold text-[#1E2127]">
                    Próximos mantenimientos recomendados
                  </h2>
                  <p className="mt-1 text-xs text-[#424750]">
                    Calculado a partir de las recomendaciones reales registradas por nuestros
                    técnicos.
                  </p>
                  {upcomingRecommendations.length === 0 ? (
                    <p className="mt-4 text-sm text-[#424750]">
                      Aún no hay recomendaciones registradas. Se generarán tras completar tu
                      primer servicio.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {upcomingRecommendations.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 bg-[#FAFAFA] p-4 sm:flex-row sm:items-center"
                        >
                          <div>
                            <p className="text-sm font-bold text-[#1E2127]">
                              {r.vehicle.brand} {r.vehicle.model} ({r.vehicle.plate})
                            </p>
                            <p className="mt-0.5 text-xs text-[#424750]">
                              {r.recommendations || "Mantenimiento preventivo programado"}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-[#F50923]">
                              {r.nextServiceDate
                                ? `Fecha sugerida: ${formatDateRD(r.nextServiceDate)}`
                                : ""}
                              {r.nextServiceMileage
                                ? ` · Kilometraje sugerido: ${r.nextServiceMileage.toLocaleString()} km`
                                : ""}
                            </p>
                          </div>
                          <Link
                            href="/agendar"
                            className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-lg bg-[#1E2127] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#424750]"
                          >
                            Agendar
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 lg:col-span-5">
                {/* Active Membership Summary */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#1E2127]">Membresía activa</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("membresias")}
                      className="text-xs font-semibold text-[#F50923] hover:underline"
                    >
                      Gestionar
                    </button>
                  </div>
                  {activeSubscription ? (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-lg bg-[#1E2127] p-4 text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-extrabold">
                            Plan {activeSubscription.plan.name}
                          </span>
                          <span className="rounded bg-[#F50923] px-2 py-0.5 text-[11px] font-bold">
                            {activeSubscription.plan.discountPercent}% desc.
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-300">
                          Vigente hasta {formatDateRD(activeSubscription.endDate)}
                          {activeSubscription.vehicle
                            ? ` · ${activeSubscription.vehicle.brand} ${activeSubscription.vehicle.plate}`
                            : ""}
                        </p>
                      </div>
                      <div className="space-y-2 text-xs text-[#424750]">
                        <div className="flex justify-between">
                          <span>Revisiones 20 pts usadas:</span>
                          <span className="font-bold text-[#1E2127]">
                            {activeSubscription.reviewsUsed} /{" "}
                            {activeSubscription.plan.includedReviews}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pruebas de batería usadas:</span>
                          <span className="font-bold text-[#1E2127]">
                            {activeSubscription.batteryTestsUsed} /{" "}
                            {activeSubscription.plan.includedBatteryTests}
                          </span>
                        </div>
                        {activeSubscription.plan.includedDiagnostics > 0 && (
                          <div className="flex justify-between">
                            <span>Diagnósticos escáner usados:</span>
                            <span className="font-bold text-[#1E2127]">
                              {activeSubscription.diagnosticsUsed} /{" "}
                              {activeSubscription.plan.includedDiagnostics}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-[#424750]">
                      No tienes una membresía activa actualmente.{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("membresias")}
                        className="font-bold text-[#F50923] hover:underline"
                      >
                        Explorar planes
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent Notifications */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-[#1E2127]">
                      <Bell className="h-4 w-4 text-[#F50923]" />
                      Notificaciones ({unreadCount})
                    </h2>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMarkNotificationsRead()}
                        className="text-xs font-semibold text-[#1E2127] hover:underline"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {notifications.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        className={`rounded-lg border p-3 text-xs ${
                          n.isRead
                            ? "border-gray-100 bg-[#FAFAFA] text-[#424750]"
                            : "border-[#F50923]/30 bg-[#F50923]/5 text-[#1E2127]"
                        }`}
                      >
                        <p className="font-bold">{n.title}</p>
                        <p className="mt-0.5">{n.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MIS CITAS */}
          {activeTab === "citas" && (
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-[#424750]">
                  Aún no has agendado citas.{" "}
                  <Link href="/agendar" className="font-bold text-[#F50923] underline">
                    Agenda tu primera cita
                  </Link>
                </div>
              ) : (
                appointments.map((a) => (
                  <article
                    key={a.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-extrabold text-[#1E2127]">
                            {a.bookingCode}
                          </span>
                          <span
                            className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${
                              APPOINTMENT_STATUS_COLORS[a.status] ?? "bg-gray-100"
                            }`}
                          >
                            {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
                          </span>
                          <span className="rounded bg-[#1E2127] px-2 py-0.5 text-xs font-semibold text-white">
                            {a.mode === "HOME_SERVICE" ? "Domicilio" : "Taller"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#424750]">
                          {a.vehicle.brand} {a.vehicle.model} ({a.vehicle.plate}) ·{" "}
                          <strong>{formatDateTimeRD(a.appointmentDate)}</strong> (
                          {a.estimatedDuration} min)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#424750]">Total estimado</p>
                        <p className="text-lg font-extrabold text-[#F50923]">
                          {formatDOP(a.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase text-[#424750]">
                          Servicios
                        </p>
                        <ul className="mt-1.5 space-y-1 text-sm">
                          {a.appointmentServices.map((s) => (
                            <li key={s.id} className="flex items-center gap-1.5">
                              <Wrench className="h-3.5 w-3.5 text-[#F50923]" />
                              <span>{s.service.name}</span>
                              {s.usedMembershipBenefit && (
                                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                  Incluido membresía
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        {a.address && (
                          <p className="mt-2 text-xs text-[#424750]">
                            <strong>Dirección:</strong> {a.address.street} #{a.address.number}
                            , {a.address.sector}
                          </p>
                        )}
                        {a.technician && (
                          <p className="mt-1 text-xs text-[#424750]">
                            <strong>Técnico asignado:</strong> {a.technician.user.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-[#424750]">
                          Bitácora de estados
                        </p>
                        <ul className="mt-1.5 space-y-1 text-xs text-[#424750]">
                          {a.statusHistory.slice(0, 4).map((h) => (
                            <li key={h.id}>
                              •{" "}
                              <strong>
                                {APPOINTMENT_STATUS_LABELS[h.status] ?? h.status}
                              </strong>{" "}
                              — {formatDateTimeRD(h.changedAt)} ({h.changedBy.name})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                      <a
                        href={`/api/appointments/${a.id}/ics`}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-[#1E2127]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Descargar .ics
                      </a>
                      {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status) && (
                        <>
                          <button
                            type="button"
                            onClick={() => openReschedule(a)}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#1E2127] px-3 py-2 text-xs font-semibold text-[#1E2127]"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Reprogramar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCancelTarget(a);
                              cancelDialogRef.current?.showModal();
                            }}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {/* TAB 3: VEHICULOS */}
          {activeTab === "vehiculos" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => openVehicleModal()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#F50923] px-4 py-2 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Agregar vehículo
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-[#1E2127]">
                            {v.brand} {v.model} ({v.year})
                          </h3>
                          <p className="text-xs font-bold uppercase text-[#F50923]">
                            Placa: {v.plate}
                          </p>
                        </div>
                        <span className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold text-[#1E2127]">
                          {FUEL_TYPE_LABELS[v.fuelType] ?? v.fuelType}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#424750]">
                        <p>
                          <strong>Color:</strong> {v.color}
                        </p>
                        <p>
                          <strong>Kilometraje:</strong> {v.mileage.toLocaleString()} km
                        </p>
                        <p>
                          <strong>Últ. mantenimiento:</strong>{" "}
                          {formatDateRD(v.lastMaintenanceDate)}
                        </p>
                        <p>
                          <strong>Servicios:</strong> {v._count?.maintenanceRecords ?? 0}
                        </p>
                      </div>
                      {v.notes && (
                        <p className="mt-2 text-xs text-gray-500">Notas: {v.notes}</p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryVehicleFilter(v.id);
                          setActiveTab("historial");
                        }}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#1E2127]"
                      >
                        <History className="h-3.5 w-3.5" />
                        Ver historial
                      </button>
                      <button
                        type="button"
                        onClick={() => openVehicleModal(v)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#1E2127]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      {(v._count?.appointments ?? 0) === 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HISTORIAL DE MANTENIMIENTO */}
          {activeTab === "historial" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <label htmlFor="hist-filter" className="text-sm font-semibold text-[#1E2127]">
                  Filtrar por vehículo:
                </label>
                <select
                  id="hist-filter"
                  value={historyVehicleFilter}
                  onChange={(e) => setHistoryVehicleFilter(e.target.value)}
                  className="min-h-[42px] rounded-lg border border-gray-300 bg-[#FAFAFA] px-3 text-sm"
                >
                  <option value="ALL">Todos mis vehículos</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.plate})
                    </option>
                  ))}
                </select>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-[#424750]">
                  No hay registros de mantenimiento completados para el filtro seleccionado.
                </div>
              ) : (
                filteredRecords.map((r) => {
                  const servicesList: string[] = JSON.parse(r.servicesPerformed || "[]");
                  const productsList: string[] = r.productsUsed
                    ? JSON.parse(r.productsUsed)
                    : [];
                  return (
                    <article
                      key={r.id}
                      className="rounded-xl border border-gray-200 bg-white p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                          <span className="text-xs font-bold uppercase text-[#F50923]">
                            Comprobante {r.receiptNumber}
                          </span>
                          <h3 className="text-lg font-bold text-[#1E2127]">
                            {r.vehicle.brand} {r.vehicle.model} ({r.vehicle.plate})
                          </h3>
                          <p className="text-xs text-[#424750]">
                            Fecha: {formatDateRD(r.serviceDate)} · Kilometraje:{" "}
                            {r.mileageAtService.toLocaleString()} km · Técnico:{" "}
                            {r.technician.user.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-extrabold text-[#1E2127]">
                            {formatDOP(r.totalCost)}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceipt(r);
                              receiptDialogRef.current?.showModal();
                            }}
                            className="mt-1 inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1E2127] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#424750]"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Comprobante
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
                        <div>
                          <p className="text-xs font-bold uppercase text-[#424750]">
                            Servicios realizados
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs text-[#1E2127]">
                            {servicesList.map((s) => (
                              <li key={s}>✓ {s}</li>
                            ))}
                          </ul>
                          {productsList.length > 0 && (
                            <>
                              <p className="mt-3 text-xs font-bold uppercase text-[#424750]">
                                Productos utilizados
                              </p>
                              <ul className="mt-1 space-y-1 text-xs text-[#424750]">
                                {productsList.map((p) => (
                                  <li key={p}>• {p}</li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>

                        <div className="space-y-2 text-xs">
                          {r.observations && (
                            <div>
                              <p className="font-bold uppercase text-[#424750]">
                                Observaciones técnicas
                              </p>
                              <p className="mt-0.5 text-[#1E2127]">{r.observations}</p>
                            </div>
                          )}
                          {r.recommendations && (
                            <div>
                              <p className="font-bold uppercase text-[#424750]">
                                Recomendaciones
                              </p>
                              <p className="mt-0.5 text-[#1E2127]">{r.recommendations}</p>
                            </div>
                          )}
                          {(r.nextServiceDate || r.nextServiceMileage) && (
                            <p className="font-semibold text-[#F50923]">
                              Próximo mantenimiento: {formatDateRD(r.nextServiceDate)}{" "}
                              {r.nextServiceMileage
                                ? `(${r.nextServiceMileage.toLocaleString()} km)`
                                : ""}
                            </p>
                          )}
                          {r.warrantyExpiresAt && (
                            <p className="text-emerald-700 font-semibold">
                              Garantía mano de obra vigente hasta:{" "}
                              {formatDateRD(r.warrantyExpiresAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 5: MEMBRESÍAS */}
          {activeTab === "membresias" && (
            <div className="space-y-8">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <strong>Entorno de demostración:</strong> No hay una pasarela de pago
                bancaria conectada en este entorno local. Al contratar o renovar una membresía
                se registra una transacción de demostración identificada claramente en la base
                de datos.
              </div>

              {subscriptions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#1E2127]">Mis suscripciones</h2>
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-gray-200 bg-white p-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-[#1E2127]">
                              Plan {sub.plan.name}
                            </h3>
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-bold ${
                                sub.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {sub.status === "ACTIVE" ? "Activa" : sub.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#424750]">
                            Ciclo: {sub.billingCycle === "ANNUAL" ? "Anual" : "Mensual"} ·
                            Vigencia: {formatDateRD(sub.startDate)} al{" "}
                            {formatDateRD(sub.endDate)}
                            {sub.vehicle
                              ? ` · Vehículo: ${sub.vehicle.brand} ${sub.vehicle.plate}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSubAction(sub.id, "RENEW")}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1E2127] px-3.5 py-1.5 text-xs font-semibold text-white"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Renovar
                          </button>
                          {sub.status === "ACTIVE" && (
                            <button
                              type="button"
                              onClick={() => handleSubAction(sub.id, "CANCEL")}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-red-300 px-3.5 py-1.5 text-xs font-semibold text-red-700"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-4 text-xs">
                        <div className="rounded-lg bg-[#FAFAFA] p-3">
                          <p className="text-[#424750]">Revisiones 20 pts</p>
                          <p className="mt-1 text-sm font-bold text-[#1E2127]">
                            {sub.reviewsUsed} / {sub.plan.includedReviews} usadas
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#FAFAFA] p-3">
                          <p className="text-[#424750]">Pruebas batería</p>
                          <p className="mt-1 text-sm font-bold text-[#1E2127]">
                            {sub.batteryTestsUsed} / {sub.plan.includedBatteryTests} usadas
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#FAFAFA] p-3">
                          <p className="text-[#424750]">Diagnósticos OBD</p>
                          <p className="mt-1 text-sm font-bold text-[#1E2127]">
                            {sub.diagnosticsUsed} / {sub.plan.includedDiagnostics} usados
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#FAFAFA] p-3">
                          <p className="text-[#424750]">Cambio de aceite</p>
                          <p className="mt-1 text-sm font-bold text-[#1E2127]">
                            {sub.oilChangesUsed} / {sub.plan.includedOilChanges} usado
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h2 className="mb-4 text-lg font-bold text-[#1E2127]">
                  Contratar un plan de membresía
                </h2>
                <div className="grid gap-4 lg:grid-cols-3">
                  {plans.map((p) => {
                    const benefits: string[] = JSON.parse(p.benefits || "[]");
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5"
                      >
                        <div>
                          <span className="rounded bg-[#1E2127] px-2 py-0.5 text-[11px] font-bold text-white">
                            {p.targetMode}
                          </span>
                          <h3 className="mt-2 text-lg font-extrabold text-[#1E2127]">
                            {p.name}
                          </h3>
                          <p className="mt-1 text-xs text-[#424750]">{p.description}</p>
                          <p className="mt-3 text-xl font-extrabold text-[#F50923]">
                            {formatDOP(p.monthlyPrice * 1.18)}{" "}
                            <span className="text-xs font-normal text-[#424750]">
                              / mes (ITBIS incl.)
                            </span>
                          </p>
                          <p className="text-xs text-[#424750]">
                            O {formatDOP(p.annualPrice * 1.18)} / año
                          </p>
                          <ul className="mt-3 space-y-1 text-xs text-[#1E2127]">
                            {benefits.map((b) => (
                              <li key={b}>✓ {b}</li>
                            ))}
                          </ul>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSubPlan(p);
                            setSubVehicleId(vehicles[0]?.id || "");
                            subDialogRef.current?.showModal();
                          }}
                          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[#F50923] px-4 py-2 text-sm font-semibold text-white hover:bg-[#CC071D]"
                        >
                          Activar plan {p.name}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DIRECCIONES */}
          {activeTab === "direcciones" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddrForm((prev) => !prev)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#1E2127] px-4 py-2 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  {showAddrForm ? "Cerrar formulario" : "Nueva dirección"}
                </button>
              </div>

              {showAddrForm && (
                <form
                  onSubmit={handleSaveAddress}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="pa-lbl" className="mb-1 block text-xs font-semibold">
                        Etiqueta
                      </label>
                      <input
                        id="pa-lbl"
                        required
                        value={aForm.label}
                        onChange={(e) => setAForm({ ...aForm, label: e.target.value })}
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="pa-prov" className="mb-1 block text-xs font-semibold">
                        Provincia
                      </label>
                      <select
                        id="pa-prov"
                        value={aForm.province}
                        onChange={(e) => {
                          const p = e.target.value;
                          const m = MUNICIPALITIES_BY_PROVINCE[p] || [p];
                          setAForm({ ...aForm, province: p, municipality: m[0] });
                        }}
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                      >
                        {DOMINICAN_PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="pa-sec" className="mb-1 block text-xs font-semibold">
                        Sector
                      </label>
                      <input
                        id="pa-sec"
                        list="portal-sectors"
                        required
                        value={aForm.sector}
                        onChange={(e) => setAForm({ ...aForm, sector: e.target.value })}
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                      />
                      <datalist id="portal-sectors">
                        {zones.map((z) => (
                          <option key={z.id} value={z.sector} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label htmlFor="pa-st" className="mb-1 block text-xs font-semibold">
                        Calle
                      </label>
                      <input
                        id="pa-st"
                        required
                        value={aForm.street}
                        onChange={(e) => setAForm({ ...aForm, street: e.target.value })}
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="pa-num" className="mb-1 block text-xs font-semibold">
                        Número
                      </label>
                      <input
                        id="pa-num"
                        required
                        value={aForm.number}
                        onChange={(e) => setAForm({ ...aForm, number: e.target.value })}
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="pa-ref" className="mb-1 block text-xs font-semibold">
                        Referencia
                      </label>
                      <input
                        id="pa-ref"
                        value={aForm.reference}
                        onChange={(e) => setAForm({ ...aForm, reference: e.target.value })}
                        className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-[#F50923] px-5 py-2 text-sm font-semibold text-white"
                  >
                    Guardar dirección
                  </button>
                </form>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#1E2127]">{addr.label}</h3>
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                            addr.isCovered
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {addr.isCovered ? "En cobertura" : "Fuera de cobertura"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#424750]">
                        {addr.street} #{addr.number}, {addr.sector}, {addr.province}
                      </p>
                      {addr.reference && (
                        <p className="mt-0.5 text-xs text-gray-500">Ref: {addr.reference}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      aria-label={`Eliminar dirección ${addr.label}`}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: NOTIFICACIONES Y PERFIL */}
          {activeTab === "perfil" && (
            <div className="grid gap-6 lg:grid-cols-12">
              <form
                onSubmit={handleSaveProfile}
                className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 lg:col-span-5"
              >
                <h2 className="text-lg font-bold text-[#1E2127]">Datos personales</h2>
                <div>
                  <label htmlFor="pf-fn" className="mb-1 block text-xs font-semibold">
                    Nombre
                  </label>
                  <input
                    id="pf-fn"
                    required
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, firstName: e.target.value })
                    }
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="pf-ln" className="mb-1 block text-xs font-semibold">
                    Apellidos
                  </label>
                  <input
                    id="pf-ln"
                    required
                    value={profileForm.lastName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, lastName: e.target.value })
                    }
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="pf-ph" className="mb-1 block text-xs font-semibold">
                    Teléfono
                  </label>
                  <input
                    id="pf-ph"
                    required
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="pf-em" className="mb-1 block text-xs font-semibold">
                    Correo electrónico
                  </label>
                  <input
                    id="pf-em"
                    disabled
                    value={profileForm.email}
                    className="min-h-[44px] w-full rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center rounded-lg bg-[#F50923] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Guardar cambios
                </button>
              </form>

              <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-7">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1E2127]">
                    Centro de notificaciones
                  </h2>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMarkNotificationsRead()}
                      className="text-xs font-semibold text-[#F50923] hover:underline"
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-[#424750]">No tienes notificaciones.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start justify-between gap-3 rounded-lg border p-3.5 text-sm ${
                          n.isRead
                            ? "border-gray-100 bg-[#FAFAFA]"
                            : "border-[#F50923]/30 bg-[#F50923]/5"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-[#1E2127]">{n.title}</p>
                          <p className="mt-0.5 text-xs text-[#424750]">{n.body}</p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            {formatDateTimeRD(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkNotificationsRead(n.id)}
                            className="shrink-0 text-xs font-semibold text-[#F50923]"
                          >
                            Leída
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </StepTransition>
      )}

      {/* NATIVE DIALOGS */}
      {/* 1. Vehicle Add/Edit Dialog */}
      <dialog
        ref={vehicleDialogRef}
        aria-labelledby="dlg-vehicle-title"
        className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h1 id="dlg-vehicle-title" className="text-lg font-extrabold text-[#1E2127]">
          {editingVehicle ? "Editar vehículo" : "Registrar vehículo nuevo"}
        </h1>
        <form onSubmit={handleSaveVehicle} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="dv-b" className="mb-1 block text-xs font-semibold">
                Marca *
              </label>
              <input
                id="dv-b"
                required
                value={vForm.brand}
                onChange={(e) => setVForm({ ...vForm, brand: e.target.value })}
                className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="dv-m" className="mb-1 block text-xs font-semibold">
                Modelo *
              </label>
              <input
                id="dv-m"
                required
                value={vForm.model}
                onChange={(e) => setVForm({ ...vForm, model: e.target.value })}
                className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="dv-y" className="mb-1 block text-xs font-semibold">
                Año *
              </label>
              <input
                id="dv-y"
                type="number"
                required
                value={vForm.year}
                onChange={(e) => setVForm({ ...vForm, year: e.target.value })}
                className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="dv-p" className="mb-1 block text-xs font-semibold">
                Placa *
              </label>
              <input
                id="dv-p"
                required
                value={vForm.plate}
                onChange={(e) => setVForm({ ...vForm, plate: e.target.value.toUpperCase() })}
                className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm uppercase"
              />
            </div>
            <div>
              <label htmlFor="dv-c" className="mb-1 block text-xs font-semibold">
                Color *
              </label>
              <input
                id="dv-c"
                required
                value={vForm.color}
                onChange={(e) => setVForm({ ...vForm, color: e.target.value })}
                className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="dv-km" className="mb-1 block text-xs font-semibold">
                Kilometraje actual *
              </label>
              <input
                id="dv-km"
                type="number"
                required
                value={vForm.mileage}
                onChange={(e) => setVForm({ ...vForm, mileage: e.target.value })}
                className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="dv-f" className="mb-1 block text-xs font-semibold">
                Combustible *
              </label>
              <select
                id="dv-f"
                value={vForm.fuelType}
                onChange={(e) => setVForm({ ...vForm, fuelType: e.target.value })}
                className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              >
                {Object.entries(FUEL_TYPE_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dv-lm" className="mb-1 block text-xs font-semibold">
                Último mantenimiento
              </label>
              <input
                id="dv-lm"
                type="date"
                value={vForm.lastMaintenanceDate}
                onChange={(e) =>
                  setVForm({ ...vForm, lastMaintenanceDate: e.target.value })
                }
                className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="dv-n" className="mb-1 block text-xs font-semibold">
              Observaciones opcionales
            </label>
            <textarea
              id="dv-n"
              rows={2}
              value={vForm.notes}
              onChange={(e) => setVForm({ ...vForm, notes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => vehicleDialogRef.current?.close()}
              className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-lg bg-[#F50923] px-5 py-2 text-sm font-semibold text-white"
            >
              Guardar vehículo
            </button>
          </div>
        </form>
      </dialog>

      {/* 2. Reschedule Dialog */}
      <dialog
        ref={reschedDialogRef}
        aria-labelledby="dlg-resched-title"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h1 id="dlg-resched-title" className="text-lg font-extrabold text-[#1E2127]">
          Reprogramar cita {reschedTarget?.bookingCode}
        </h1>
        <form onSubmit={handleConfirmReschedule} className="mt-4 space-y-4">
          <div>
            <label htmlFor="rs-date" className="mb-1 block text-xs font-semibold">
              Nueva fecha
            </label>
            <input
              id="rs-date"
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={reschedDate}
              onChange={(e) => setReschedDate(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            />
          </div>

          {reschedDate && (
            <div>
              <p className="mb-2 text-xs font-semibold text-[#1E2127]">
                Horarios disponibles reales:
              </p>
              {loadingReschedSlots ? (
                <p className="text-xs text-[#424750]">Consultando...</p>
              ) : reschedSlots.length === 0 ? (
                <p className="text-xs text-red-700">
                  No hay horarios disponibles en esa fecha.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {reschedSlots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => setReschedTime(s.time)}
                      className={`min-h-[40px] rounded-lg border text-xs font-semibold ${
                        reschedTime === s.time
                          ? "border-[#F50923] bg-[#F50923] text-white"
                          : "border-gray-200 bg-[#FAFAFA]"
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => reschedDialogRef.current?.close()}
              className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={!reschedTime}
              className="min-h-[44px] rounded-lg bg-[#1E2127] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Confirmar cambio
            </button>
          </div>
        </form>
      </dialog>

      {/* 3. Cancel Confirmation Dialog */}
      <dialog
        ref={cancelDialogRef}
        aria-labelledby="dlg-cancel-title"
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h1 id="dlg-cancel-title" className="text-lg font-extrabold text-[#1E2127]">
          ¿Cancelar cita {cancelTarget?.bookingCode}?
        </h1>
        <p className="mt-2 text-sm text-[#424750]">
          Esta acción liberará el horario reservado para otros clientes.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => cancelDialogRef.current?.close()}
            className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
          >
            Mantener cita
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            className="min-h-[44px] rounded-lg bg-[#F50923] px-4 py-2 text-sm font-semibold text-white"
          >
            Sí, cancelar
          </button>
        </div>
      </dialog>

      {/* 4. Membership Activation Dialog */}
      <dialog
        ref={subDialogRef}
        aria-labelledby="dlg-sub-title"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h1 id="dlg-sub-title" className="text-lg font-extrabold text-[#1E2127]">
          Activar Membresía {subPlan?.name}
        </h1>
        <form onSubmit={handleSubscribe} className="mt-4 space-y-4">
          <div>
            <label htmlFor="sub-veh" className="mb-1 block text-xs font-semibold">
              Vehículo vinculado
            </label>
            <select
              id="sub-veh"
              value={subVehicleId}
              onChange={(e) => setSubVehicleId(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.plate})
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1 block text-xs font-semibold">Ciclo de facturación</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSubCycle("MONTHLY")}
                className={`min-h-[44px] rounded-lg border p-2 text-xs font-semibold ${
                  subCycle === "MONTHLY"
                    ? "border-[#1E2127] bg-[#1E2127] text-white"
                    : "border-gray-200"
                }`}
              >
                Mensual ({formatDOP((subPlan?.monthlyPrice ?? 0) * 1.18)})
              </button>
              <button
                type="button"
                onClick={() => setSubCycle("ANNUAL")}
                className={`min-h-[44px] rounded-lg border p-2 text-xs font-semibold ${
                  subCycle === "ANNUAL"
                    ? "border-[#F50923] bg-[#F50923] text-white"
                    : "border-gray-200"
                }`}
              >
                Anual ({formatDOP((subPlan?.annualPrice ?? 0) * 1.18)})
              </button>
            </div>
          </div>
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            Entorno de demostración: se registrará el pago como{" "}
            <strong>DEMO (sin cobro real)</strong> y la membresía quedará activa de inmediato.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => subDialogRef.current?.close()}
              className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-lg bg-[#F50923] px-5 py-2 text-sm font-semibold text-white"
            >
              Confirmar activación
            </button>
          </div>
        </form>
      </dialog>

      {/* 5. Printable Maintenance Receipt Dialog */}
      <dialog
        ref={receiptDialogRef}
        aria-labelledby="dlg-rcpt-title"
        className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
              <div className="space-y-1.5">
                <DWayLogo variant="dark" size="sm" />
                <p className="text-xs font-bold uppercase text-[#F50923]">
                  DWay AutoCare — Comprobante Oficial
                </p>
                <h1 id="dlg-rcpt-title" className="text-xl font-extrabold text-[#1E2127]">
                  {selectedReceipt.receiptNumber}
                </h1>
              </div>
              <div className="text-right text-xs text-[#424750]">
                <p>Fecha: {formatDateRD(selectedReceipt.serviceDate)}</p>
                <p>Cita: {selectedReceipt.appointment.bookingCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#FAFAFA] p-4 text-xs">
              <p>
                <strong>Vehículo:</strong> {selectedReceipt.vehicle.brand}{" "}
                {selectedReceipt.vehicle.model} ({selectedReceipt.vehicle.plate})
              </p>
              <p>
                <strong>Kilometraje:</strong>{" "}
                {selectedReceipt.mileageAtService.toLocaleString()} km
              </p>
              <p>
                <strong>Técnico responsable:</strong>{" "}
                {selectedReceipt.technician.user.name}
              </p>
              <p>
                <strong>Garantía mano de obra:</strong> Hasta{" "}
                {formatDateRD(selectedReceipt.warrantyExpiresAt)}
              </p>
            </div>

            <div className="text-xs">
              <p className="font-bold uppercase text-[#424750]">Servicios realizados</p>
              <ul className="mt-1 space-y-1">
                {(JSON.parse(selectedReceipt.servicesPerformed || "[]") as string[]).map(
                  (s) => (
                    <li key={s}>• {s}</li>
                  )
                )}
              </ul>
              {selectedReceipt.productsUsed && (
                <>
                  <p className="mt-3 font-bold uppercase text-[#424750]">
                    Productos utilizados
                  </p>
                  <ul className="mt-1 space-y-1">
                    {(JSON.parse(selectedReceipt.productsUsed) as string[]).map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                </>
              )}
              {selectedReceipt.observations && (
                <p className="mt-3">
                  <strong>Observaciones:</strong> {selectedReceipt.observations}
                </p>
              )}
              {selectedReceipt.recommendations && (
                <p className="mt-1">
                  <strong>Recomendaciones:</strong> {selectedReceipt.recommendations}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 pt-3">
              <span className="text-sm font-bold text-[#1E2127]">Total facturado</span>
              <span className="text-xl font-extrabold text-[#F50923]">
                {formatDOP(selectedReceipt.totalCost)}
              </span>
            </div>

            <div className="no-print flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => receiptDialogRef.current?.close()}
                className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#1E2127] px-5 py-2 text-sm font-semibold text-white"
              >
                <Printer className="h-4 w-4" />
                Imprimir / Guardar PDF
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
