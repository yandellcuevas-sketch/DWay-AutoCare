"use client";

import React, { useState } from "react";
import { Building2, CheckCircle2, AlertCircle, Send } from "lucide-react";

const VEHICLE_TYPE_OPTIONS = [
  "Sedanes compactos",
  "Jeepetas / SUV",
  "Camionetas / Pick-up",
  "Furgonetas utilitarias",
];

const SERVICE_OPTIONS = [
  "Cambio de aceite semisintético y filtro",
  "Cambio de aceite sintético y filtro",
  "Inspección preventiva de 20 puntos",
  "Prueba e instalación de baterías",
  "Diagnóstico electrónico básico",
  "Revisión y cambio de pastillas de freno (en taller)",
];

const FREQUENCY_OPTIONS = [
  "Mensual",
  "Bimestral",
  "Trimestral (4 visitas al año — Flota Básica)",
  "Semestral",
];

export function CompanyInquiryForm() {
  const [name, setName] = useState("");
  const [rnc, setRnc] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [vehicleCount, setVehicleCount] = useState("5");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(["Camionetas / Pick-up"]);
  const [servicesRequired, setServicesRequired] = useState<string[]>([
    "Cambio de aceite semisintético y filtro",
    "Inspección preventiva de 20 puntos",
  ]);
  const [estimatedFrequency, setEstimatedFrequency] = useState(
    "Trimestral (4 visitas al año — Flota Básica)"
  );
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleItem = (list: string[], value: string, setter: (v: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (vehicleTypes.length === 0) {
      setError("Selecciona al menos un tipo de vehículo de tu flota.");
      return;
    }
    if (servicesRequired.length === 0) {
      setError("Selecciona al menos un servicio requerido.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rnc: rnc.replace(/\D/g, ""),
          contactName,
          contactEmail,
          contactPhone,
          vehicleCount: Number(vehicleCount),
          vehicleTypes,
          servicesRequired,
          estimatedFrequency,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo enviar la solicitud.");
      } else {
        setSuccessMsg(data.message);
        setName("");
        setRnc("");
        setContactName("");
        setContactEmail("");
        setContactPhone("");
        setVehicleCount("5");
        setNotes("");
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="company-form-title"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1E2127] text-white">
          <Building2 className="h-5 w-5 text-[#F50923]" aria-hidden="true" />
        </div>
        <div>
          <h3 id="company-form-title" className="text-lg font-bold text-[#1E2127]">
            Solicitar propuesta para flota empresarial
          </h3>
          <p className="text-xs text-[#424750]">
            Contrato sugerido desde 5 vehículos · Incluye evaluación inicial sin costo
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <p className="font-semibold">¡Solicitud registrada en DWay AutoCare!</p>
            <p className="mt-0.5 text-emerald-800">{successMsg}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="comp-name" className="mb-1.5 block text-sm font-semibold text-[#1E2127]">
            Nombre de la empresa <span className="text-[#F50923]">*</span>
          </label>
          <input
            id="comp-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Distribuidora Nacional S.R.L."
            className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127] placeholder:text-gray-400"
          />
        </div>

        <div>
          <label htmlFor="comp-rnc" className="mb-1.5 block text-sm font-semibold text-[#1E2127]">
            RNC (sin guiones) <span className="text-[#F50923]">*</span>
          </label>
          <input
            id="comp-rnc"
            name="rnc"
            type="text"
            inputMode="numeric"
            required
            pattern="\d{9}(\d{2})?"
            value={rnc}
            onChange={(e) => setRnc(e.target.value)}
            placeholder="Ej. 131948271 (9 u 11 dígitos)"
            className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127] placeholder:text-gray-400"
          />
        </div>

        <div>
          <label
            htmlFor="comp-contact"
            className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
          >
            Persona de contacto <span className="text-[#F50923]">*</span>
          </label>
          <input
            id="comp-contact"
            name="contactName"
            type="text"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Nombre y apellido"
            className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
          />
        </div>

        <div>
          <label
            htmlFor="comp-email"
            className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
          >
            Correo electrónico <span className="text-[#F50923]">*</span>
          </label>
          <input
            id="comp-email"
            name="contactEmail"
            type="email"
            required
            autoComplete="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="flota@empresa.com.do"
            className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
          />
        </div>

        <div>
          <label
            htmlFor="comp-phone"
            className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
          >
            Teléfono (RD) <span className="text-[#F50923]">*</span>
          </label>
          <input
            id="comp-phone"
            name="contactPhone"
            type="tel"
            required
            autoComplete="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="809-555-0000"
            className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
          />
        </div>

        <div>
          <label
            htmlFor="comp-count"
            className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
          >
            Cantidad de vehículos <span className="text-[#F50923]">*</span>
          </label>
          <input
            id="comp-count"
            name="vehicleCount"
            type="number"
            min={1}
            max={5000}
            required
            value={vehicleCount}
            onChange={(e) => setVehicleCount(e.target.value)}
            className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
          />
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-semibold text-[#1E2127]">
          Tipos de vehículos en la flota <span className="text-[#F50923]">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {VEHICLE_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] px-3 py-2 text-sm text-[#1E2127] hover:border-[#424750]"
            >
              <input
                type="checkbox"
                checked={vehicleTypes.includes(opt)}
                onChange={() => toggleItem(vehicleTypes, opt, setVehicleTypes)}
                className="h-4 w-4"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-semibold text-[#1E2127]">
          Servicios requeridos <span className="text-[#F50923]">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SERVICE_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-[#FAFAFA] px-3 py-2 text-sm text-[#1E2127] hover:border-[#424750]"
            >
              <input
                type="checkbox"
                checked={servicesRequired.includes(opt)}
                onChange={() => toggleItem(servicesRequired, opt, setServicesRequired)}
                className="h-4 w-4"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="comp-freq"
            className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
          >
            Frecuencia estimada <span className="text-[#F50923]">*</span>
          </label>
          <select
            id="comp-freq"
            name="estimatedFrequency"
            value={estimatedFrequency}
            onChange={(e) => setEstimatedFrequency(e.target.value)}
            className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
          >
            {FREQUENCY_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="comp-notes"
            className="mb-1.5 block text-sm font-semibold text-[#1E2127]"
          >
            Observaciones o sector de operación
          </label>
          <input
            id="comp-notes"
            name="notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Parqueo en Naco, horarios preferidos..."
            className="min-h-[48px] w-full rounded-lg border border-gray-300 bg-[#FAFAFA] px-3.5 text-sm text-[#1E2127]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#F50923] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#CC071D] disabled:opacity-60 sm:w-auto"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {submitting ? "Registrando solicitud..." : "Enviar solicitud empresarial"}
      </button>
    </form>
  );
}
