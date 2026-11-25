export interface IcsAppointmentInput {
  bookingCode: string;
  startDate: Date;
  endDate: Date;
  servicesSummary: string;
  vehicleLabel: string;
  mode: "WORKSHOP" | "HOME_SERVICE";
  locationText: string;
  clientName: string;
}

function toIcsUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}` +
    `${pad(date.getUTCSeconds())}Z`
  );
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildAppointmentIcs(input: IcsAppointmentInput): string {
  const now = new Date();
  const modeLabel =
    input.mode === "HOME_SERVICE" ? "Servicio a Domicilio" : "Atención en Taller DWay";

  const description = [
    `Código de reserva: ${input.bookingCode}`,
    `Cliente: ${input.clientName}`,
    `Vehículo: ${input.vehicleLabel}`,
    `Modalidad: ${modeLabel}`,
    `Servicios: ${input.servicesSummary}`,
    "DWay AutoCare — Tú eliges dónde, nosotros cuidamos tu vehículo.",
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DWay AutoCare//Sistema de Citas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.bookingCode}@dwayautocare.do`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(input.startDate)}`,
    `DTEND:${toIcsUtc(input.endDate)}`,
    `SUMMARY:${escapeIcsText(`DWay AutoCare — ${input.vehicleLabel} (${input.bookingCode})`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(input.locationText)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
