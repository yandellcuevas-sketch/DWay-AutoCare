"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Car,
  Wrench,
  UserCog,
  CreditCard,
  Building2,
  FileSignature,
  DollarSign,
  History,
  BarChart3,
  Settings,
  DatabaseBackup,
  AlertCircle,
  CheckCircle2,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { formatDOP, formatDateTimeRD, ROLE_LABELS } from "@/lib/constants";
import { DWayLogo } from "@/components/DWayLogo";
import {
  AdminCalendarAndAppointments,
  type AdminAppointment,
} from "./AdminCalendarAndAppointments";
import { AdminClientsAndCommercial } from "./AdminClientsAndCommercial";
import { AdminServicesAndOperations } from "./AdminServicesAndOperations";
import { AdminModulesExtended } from "./AdminModulesExtended";

export type AdminSectionId =
  | "inicio"
  | "calendario"
  | "citas"
  | "clientes"
  | "vehiculos"
  | "servicios"
  | "tecnicos"
  | "membresias"
  | "empresas"
  | "contratos"
  | "pagos"
  | "historial"
  | "reportes"
  | "configuracion"
  | "respaldos";

export function AdminPanel() {
  const { data: session } = useSession();
  const role = session?.user?.role || "TECHNICIAN";
  const isAdmin = role === "ADMIN";
  const isReceptionOrAdmin = role === "ADMIN" || role === "RECEPTIONIST";

  const [section, setSection] = useState<AdminSectionId>("inicio");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Data states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashData, setDashData] = useState<any>(null);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clients, setClients] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vehicles, setVehicles] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [services, setServices] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [companies, setCompanies] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [records, setRecords] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [membershipsData, setMembershipsData] = useState<{ plans: any[]; subscriptions: any[] }>({
    plans: [],
    subscriptions: [],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [operations, setOperations] = useState<any>({
    technicians: [],
    resources: [],
    mobileUnits: [],
    holidays: [],
    blockedSlots: [],
    zones: [],
    promotions: [],
    configs: [],
    payments: [],
  });

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const baseRequests: Array<Promise<Response>> = [
        fetch("/api/admin/dashboard"),
        fetch("/api/appointments?scope=all"),
        fetch("/api/services?includeInactive=true"),
        fetch("/api/vehicles"),
        fetch("/api/maintenance-records"),
      ];

      if (isReceptionOrAdmin) {
        baseRequests.push(fetch("/api/admin/clients"));
        baseRequests.push(fetch("/api/companies"));
        baseRequests.push(fetch("/api/admin/operations"));
        baseRequests.push(fetch("/api/memberships"));
      }

      const [dRes, aRes, sRes, vRes, rRes, cRes, compRes, opRes, memRes] =
        await Promise.all(baseRequests);

      if (dRes?.ok) setDashData(await dRes.json());
      if (aRes?.ok) setAppointments((await aRes.json()).appointments || []);
      if (sRes?.ok) setServices((await sRes.json()).services || []);
      if (vRes?.ok) setVehicles((await vRes.json()).vehicles || []);
      if (rRes?.ok) setRecords((await rRes.json()).records || []);
      if (cRes?.ok) setClients((await cRes.json()).clients || []);
      if (compRes?.ok) setCompanies((await compRes.json()).companies || []);
      if (opRes?.ok) setOperations(await opRes.json());
      if (memRes?.ok) {
        const mJson = await memRes.json();
        setMembershipsData({
          plans: mJson.plans || [],
          subscriptions: mJson.subscriptions || [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isReceptionOrAdmin]);

  useEffect(() => {
    if (session?.user?.id) {
      loadAdminData();
    }
  }, [session?.user?.id, loadAdminData]);

  const notify = (type: "ok" | "err", text: string) => {
    setBanner({ type, text });
  };

  const navItems: Array<{
    id: AdminSectionId;
    label: string;
    icon: React.ElementType;
    show: boolean;
    badge?: number | string;
  }> = [
    { id: "inicio", label: "Inicio", icon: LayoutDashboard, show: true },
    { id: "calendario", label: "Calendario", icon: CalendarDays, show: true },
    {
      id: "citas",
      label: "Citas",
      icon: ClipboardList,
      show: true,
      badge: dashData?.kpis?.pendingCount || undefined,
    },
    { id: "clientes", label: "Clientes", icon: Users, show: isReceptionOrAdmin },
    { id: "vehiculos", label: "Vehículos", icon: Car, show: isReceptionOrAdmin },
    { id: "servicios", label: "Servicios", icon: Wrench, show: isAdmin },
    { id: "tecnicos", label: "Técnicos", icon: UserCog, show: isAdmin },
    { id: "membresias", label: "Membresías", icon: CreditCard, show: isReceptionOrAdmin },
    { id: "empresas", label: "Empresas", icon: Building2, show: isReceptionOrAdmin },
    { id: "contratos", label: "Contratos", icon: FileSignature, show: isReceptionOrAdmin },
    { id: "pagos", label: "Pagos", icon: DollarSign, show: isReceptionOrAdmin },
    { id: "historial", label: "Historial", icon: History, show: true },
    { id: "reportes", label: "Reportes", icon: BarChart3, show: isReceptionOrAdmin },
    { id: "configuracion", label: "Configuración", icon: Settings, show: isAdmin },
    { id: "respaldos", label: "Respaldos", icon: DatabaseBackup, show: isAdmin },
  ];

  const visibleNav = navItems.filter((item) => item.show);
  const activeItem = visibleNav.find((n) => n.id === section) || visibleNav[0];

  const selectSection = (id: AdminSectionId) => {
    setSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Mobile Sidebar Bar */}
      <div className="flex items-center justify-between rounded-xl border border-[#424750]/20 bg-[#1E2127] px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-3">
          <DWayLogo variant="light" size="sm" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
            {activeItem?.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Abrir menú administrativo"
          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#424750] bg-[#15171B]"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Collapsible Responsive Sidebar (15 sections) */}
      <aside
        aria-label="Navegación administrativa"
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } shrink-0 rounded-2xl border border-[#424750]/25 bg-[#1E2127] text-white transition-all duration-200 lg:sticky lg:top-20 lg:block ${
          sidebarCollapsed ? "lg:w-[78px]" : "lg:w-[260px]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#424750]/40 px-4 py-4">
          {!sidebarCollapsed && <DWayLogo variant="light" size="sm" />}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
            className="hidden min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-[#424750]/60 bg-[#15171B] text-gray-200 hover:border-[#F50923] lg:inline-flex"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="max-h-[75dvh] space-y-1 overflow-y-auto p-2.5">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectSection(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#F50923] text-white shadow-xs"
                    : "text-gray-300 hover:bg-[#15171B] hover:text-white"
                } ${sidebarCollapsed ? "justify-center px-2" : "justify-between"}`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? "text-white" : "text-[#F50923]"
                    }`}
                    aria-hidden="true"
                  />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!sidebarCollapsed && item.badge !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? "bg-white text-[#F50923]" : "bg-[#F50923] text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="border-t border-[#424750]/40 px-4 py-3 text-[11px] text-gray-400">
            <p className="font-bold text-white">{session?.user?.name}</p>
            <p>{ROLE_LABELS[role] ?? role}</p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 space-y-5">
        {/* Top Status Header */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#1E2127] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  <Shield className="h-3.5 w-3.5 text-[#F50923]" aria-hidden="true" />
                  {ROLE_LABELS[role] ?? role}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F50923]">
                  Módulo: {activeItem?.label}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold text-[#1E2127] sm:text-3xl">
                Panel Administrativo DWay AutoCare
              </h1>
            </div>

            {dashData?.kpis && (
              <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] px-4 py-3 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#424750]">
                  Capacidad operativa hoy
                </p>
                <p className="text-base font-extrabold text-[#1E2127] sm:text-lg">
                  {dashData.kpis.availableTodaySlots} cupos libres ({dashData.kpis.capacityUsagePercent}% usado)
                </p>
              </div>
            )}
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

        {loading && !dashData ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-[#424750]">
            Cargando métricas reales desde la base de datos...
          </div>
        ) : (
          <>
            {/* 1. INICIO (DASHBOARD) */}
            {section === "inicio" && dashData && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    { label: "Citas hoy", val: dashData.kpis.todayAppointments },
                    { label: "Pendientes", val: dashData.kpis.pendingCount, highlight: true },
                    { label: "Confirmadas / Activas", val: dashData.kpis.confirmedCount },
                    { label: "Servicios completados", val: dashData.kpis.completedCount },
                    { label: "Clientes registrados", val: dashData.kpis.clientsCount },
                    { label: "Vehículos registrados", val: dashData.kpis.vehiclesCount },
                    {
                      label: "Membresías activas",
                      val: dashData.kpis.activeSubscriptionsCount,
                    },
                    {
                      label: "Ingresos registrados",
                      val: formatDOP(dashData.kpis.totalRevenue),
                      highlight: true,
                    },
                    {
                      label: "Solicitudes empresas",
                      val: dashData.kpis.pendingCompanyCount,
                    },
                    {
                      label: "Técnicos activos",
                      val: dashData.kpis.activeTechCount,
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-xs"
                    >
                      <p className="text-xs font-semibold text-[#424750]">{kpi.label}</p>
                      <p
                        className={`mt-1.5 text-2xl font-extrabold ${
                          kpi.highlight ? "text-[#F50923]" : "text-[#1E2127]"
                        }`}
                      >
                        {kpi.val}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-6">
                    <h2 className="mb-4 text-base font-bold text-[#1E2127]">
                      Distribución de Citas por Modalidad
                    </h2>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashData.charts.modeDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="citas" name="Citas" fill="#1E2127" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-6">
                    <h2 className="mb-4 text-base font-bold text-[#1E2127]">
                      Ingresos Completados por Mes (RD$)
                    </h2>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashData.charts.monthlySeries}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar
                            dataKey="ingresos"
                            name="Ingresos RD$"
                            fill="#F50923"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#1E2127]">
                    <Building2 className="h-4 w-4 text-[#F50923]" />
                    Registro reciente de auditoría del sistema
                  </h2>
                  <div className="space-y-2 text-xs">
                    {dashData.recentAuditLogs.map(
                      (log: {
                        id: string;
                        action: string;
                        details: string | null;
                        createdAt: string;
                        user: { name: string } | null;
                      }) => (
                        <div
                          key={log.id}
                          className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#FAFAFA] p-2.5"
                        >
                          <span>
                            <strong className="text-[#1E2127]">{log.action}</strong> —{" "}
                            {log.details} ({log.user?.name || "Sistema"})
                          </span>
                          <span className="text-gray-500">
                            {formatDateTimeRD(log.createdAt)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2 & 3. CALENDARIO Y CITAS */}
            {(section === "calendario" || section === "citas") && (
              <AdminCalendarAndAppointments
                appointments={appointments}
                technicians={operations.technicians || []}
                services={services}
                clients={clients}
                userRole={role}
                initialView={section === "calendario" ? "calendar" : "table"}
                onRefresh={loadAdminData}
                onNotify={notify}
              />
            )}

            {/* 4 & 9. CLIENTES Y EMPRESAS */}
            {(section === "clientes" || section === "empresas") && isReceptionOrAdmin && (
              <AdminClientsAndCommercial
                clients={clients}
                companies={companies}
                promotions={operations.promotions || []}
                payments={operations.payments || []}
                notificationsLog={dashData?.notificationsLog || []}
                forcedTab={section === "clientes" ? "clientes" : "empresas"}
                onRefresh={loadAdminData}
                onNotify={notify}
              />
            )}

            {/* 6. SERVICIOS */}
            {section === "servicios" && isAdmin && (
              <AdminServicesAndOperations
                mode="servicios"
                services={services}
                operations={operations}
                onRefresh={loadAdminData}
                onNotify={notify}
              />
            )}

            {/* 7. TÉCNICOS Y OPERATIVA */}
            {section === "tecnicos" && isAdmin && (
              <AdminServicesAndOperations
                mode="operativa"
                services={services}
                operations={operations}
                onRefresh={loadAdminData}
                onNotify={notify}
              />
            )}

            {/* 5, 8, 10, 11, 12, 13, 14, 15: EXTENDED MODULES */}
            {(section === "vehiculos" ||
              section === "membresias" ||
              section === "contratos" ||
              section === "pagos" ||
              section === "historial" ||
              section === "reportes" ||
              section === "configuracion" ||
              section === "respaldos") && (
              <AdminModulesExtended
                section={section}
                vehicles={vehicles}
                plans={membershipsData.plans}
                subscriptions={membershipsData.subscriptions}
                companies={companies}
                payments={operations.payments || []}
                records={records}
                appointments={appointments}
                configs={operations.configs || []}
                onRefresh={loadAdminData}
                onNotify={notify}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
