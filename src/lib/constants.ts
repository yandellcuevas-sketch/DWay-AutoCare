export const APP_TIMEZONE = "America/Santo_Domingo";
export const DEFAULT_ITBIS_RATE = 0.18;

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: "Pendiente de confirmación",
  CONFIRMED: "Confirmada",
  TECHNICIAN_EN_ROUTE: "Técnico en camino",
  CLIENT_RECEIVED: "Cliente recibido",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Completada",
  RESCHEDULED: "Reprogramada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Cliente no asistió",
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  TECHNICIAN_EN_ROUTE: "bg-indigo-100 text-indigo-800 border-indigo-200",
  CLIENT_RECEIVED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  RESCHEDULED: "bg-orange-100 text-orange-800 border-orange-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  NO_SHOW: "bg-gray-200 text-gray-800 border-gray-300",
};

// Estados permitidos según la modalidad (Requisito 7: mostrar únicamente los estados que correspondan)
export const STATUSES_BY_MODE: Record<"WORKSHOP" | "HOME_SERVICE", string[]> = {
  WORKSHOP: [
    "PENDING_CONFIRMATION",
    "CONFIRMED",
    "CLIENT_RECEIVED",
    "IN_PROGRESS",
    "COMPLETED",
    "RESCHEDULED",
    "CANCELLED",
    "NO_SHOW",
  ],
  HOME_SERVICE: [
    "PENDING_CONFIRMATION",
    "CONFIRMED",
    "TECHNICIAN_EN_ROUTE",
    "IN_PROGRESS",
    "COMPLETED",
    "RESCHEDULED",
    "CANCELLED",
    "NO_SHOW",
  ],
};

export const FUEL_TYPE_LABELS: Record<string, string> = {
  GASOLINA: "Gasolina",
  DIESEL: "Diésel",
  ELECTRICO: "Eléctrico",
  HIBRIDO: "Híbrido",
  GLP: "GLP (Gas)",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  RECEPTIONIST: "Recepcionista",
  TECHNICIAN: "Técnico",
  CLIENT: "Cliente",
};

export const DOMINICAN_PROVINCES = [
  "Distrito Nacional",
  "Santo Domingo",
  "Santiago",
  "San Cristóbal",
  "La Altagracia",
  "La Romana",
  "Puerto Plata",
  "La Vega",
  "San Pedro de Macorís",
  "Duarte",
];

export const MUNICIPALITIES_BY_PROVINCE: Record<string, string[]> = {
  "Distrito Nacional": ["Santo Domingo de Guzmán"],
  "Santo Domingo": [
    "Santo Domingo Este",
    "Santo Domingo Norte",
    "Santo Domingo Oeste",
    "Boca Chica",
    "Los Alcarrizos",
    "Pedro Brand",
  ],
};

export function formatDOP(amount: number | string | { toString(): string } | null | undefined): string {
  const num = Number(amount ?? 0);
  return `RD$${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateRD(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-DO", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatTimeRD(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-DO", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatDateTimeRD(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return `${formatDateRD(date)} ${formatTimeRD(date)}`;
}

// Convert YYYY-MM-DD and HH:MM in America/Santo_Domingo (UTC-4, no DST) into a Date object
export function parseRDDateTime(dateStr: string, timeStr: string): Date {
  // Santo Domingo is UTC-04:00 year round
  return new Date(`${dateStr}T${timeStr}:00-04:00`);
}

export function getRDDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function getRDTimeString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;
  return `${hour}:${minute}`;
}

export function getRDDayOfWeek(dateStr: string): number {
  const d = new Date(`${dateStr}T12:00:00-04:00`);
  return d.getUTCDay(); // 12:00 -04:00 is 16:00 UTC on the exact same calendar day
}
