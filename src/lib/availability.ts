import { prisma } from "./prisma";
import { isPostgresEnv } from "./db-helpers";
import {
  DEFAULT_ITBIS_RATE,
  getRDDayOfWeek,
  getRDDateString,
  parseRDDateTime,
} from "./constants";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Serializa reservas/reprogramaciones simultáneas de forma segura en SQLite y PostgreSQL (Neon).
 */
export async function acquireBookingLock(tx: DbClient) {
  if (isPostgresEnv()) {
    await (tx as PrismaClient).$executeRawUnsafe("SELECT pg_advisory_xact_lock(982026)");
    return;
  }
  await tx.systemConfig.upsert({
    where: { key: "booking_lock_seq" },
    update: { value: String(Date.now()) },
    create: {
      key: "booking_lock_seq",
      value: "1",
      description: "Control transaccional anti-colisión de citas",
    },
  });
}

export const OCCUPYING_STATUSES = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "TECHNICIAN_EN_ROUTE",
  "CLIENT_RECEIVED",
  "IN_PROGRESS",
  "RESCHEDULED",
];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function getSystemSettings(db: DbClient = prisma) {
  const configs = await db.systemConfig.findMany();
  const map = new Map(configs.map((c) => [c.key, c.value]));
  return {
    itbisRate: Number(map.get("itbis_rate") ?? DEFAULT_ITBIS_RATE),
    workshopBufferMinutes: Number(map.get("workshop_buffer_minutes") ?? 10),
    mobileTravelBufferMinutes: Number(map.get("mobile_travel_buffer_minutes") ?? 30),
    slotStepMinutes: Number(map.get("slot_step_minutes") ?? 30),
    weekdayOpen: map.get("weekday_open") ?? "08:00",
    weekdayClose: map.get("weekday_close") ?? "17:00",
    saturdayOpen: map.get("saturday_open") ?? "08:00",
    saturdayClose: map.get("saturday_close") ?? "13:00",
  };
}

export interface AvailableSlot {
  time: string; // "HH:MM"
  endTime: string;
  availableTechnicians: number;
  availableResources: number;
  label: string;
}

export interface AvailabilityResult {
  date: string;
  isClosed: boolean;
  closedReason?: string;
  totalDuration: number;
  slots: AvailableSlot[];
}

export async function isHolidayDate(dateStr: string, db: DbClient = prisma): Promise<string | null> {
  const holidays = await db.holiday.findMany();
  const [, monthStr, dayStr] = dateStr.split("-");
  for (const h of holidays) {
    const hDateStr = getRDDateString(h.date);
    if (hDateStr === dateStr) return h.name;
    if (h.isRecurring) {
      const [, hMonth, hDay] = hDateStr.split("-");
      if (hMonth === monthStr && hDay === dayStr) return h.name;
    }
  }
  return null;
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Busca recursos reales disponibles (técnico + bahía/elevador o unidad móvil)
 * para un intervalo específico [startDate, endDate).
 */
export async function findAssignableResources(params: {
  startDate: Date;
  durationMinutes: number;
  mode: "WORKSHOP" | "HOME_SERVICE";
  requiresLift: boolean;
  excludeAppointmentId?: string;
  preferredTechnicianId?: string | null;
  db?: DbClient;
}): Promise<{
  available: boolean;
  technicianId: string | null;
  resourceId: string | null;
  mobileUnitId: string | null;
  reason?: string;
}> {
  const db = params.db ?? prisma;
  const settings = await getSystemSettings(db);

  const dateStr = getRDDateString(params.startDate);
  const dayOfWeek = getRDDayOfWeek(dateStr);

  if (dayOfWeek === 0) {
    return {
      available: false,
      technicianId: null,
      resourceId: null,
      mobileUnitId: null,
      reason: "Domingos no laborables.",
    };
  }

  const holidayName = await isHolidayDate(dateStr, db);
  if (holidayName) {
    return {
      available: false,
      technicianId: null,
      resourceId: null,
      mobileUnitId: null,
      reason: `Día feriado: ${holidayName}.`,
    };
  }

  const openStr = dayOfWeek === 6 ? settings.saturdayOpen : settings.weekdayOpen;
  const closeStr = dayOfWeek === 6 ? settings.saturdayClose : settings.weekdayClose;
  const businessOpen = parseRDDateTime(dateStr, openStr);
  const businessClose = parseRDDateTime(dateStr, closeStr);

  const serviceEnd = new Date(params.startDate.getTime() + params.durationMinutes * 60_000);
  if (params.startDate < businessOpen || serviceEnd > businessClose) {
    return {
      available: false,
      technicianId: null,
      resourceId: null,
      mobileUnitId: null,
      reason: `Fuera del horario laboral (${openStr} - ${closeStr}).`,
    };
  }

  if (params.startDate <= new Date()) {
    return {
      available: false,
      technicianId: null,
      resourceId: null,
      mobileUnitId: null,
      reason: "No se pueden reservar horarios en el pasado.",
    };
  }

  const bufferMinutes =
    params.mode === "HOME_SERVICE"
      ? settings.mobileTravelBufferMinutes
      : settings.workshopBufferMinutes;

  // El intervalo ocupado incluye margen de preparación/desplazamiento al finalizar (y previo para domicilio)
  const effectiveStart =
    params.mode === "HOME_SERVICE"
      ? new Date(params.startDate.getTime() - Math.min(15, bufferMinutes) * 60_000)
      : params.startDate;
  const effectiveEnd = new Date(serviceEnd.getTime() + bufferMinutes * 60_000);

  const dayStart = parseRDDateTime(dateStr, "00:00");
  const dayEnd = parseRDDateTime(dateStr, "23:59");

  const [technicians, blockedSlots, existingAppointments, resources, mobileUnits] =
    await Promise.all([
      db.technician.findMany({
        where: {
          isActive: true,
          ...(params.mode === "HOME_SERVICE" ? { canDriveMobileUnit: true } : {}),
        },
        include: {
          workSchedules: { where: { dayOfWeek, isActive: true } },
        },
      }),
      db.blockedSlot.findMany({
        where: {
          date: { gte: dayStart, lte: dayEnd },
        },
      }),
      db.appointment.findMany({
        where: {
          status: { in: OCCUPYING_STATUSES },
          appointmentDate: { gte: dayStart, lte: dayEnd },
          ...(params.excludeAppointmentId
            ? { id: { not: params.excludeAppointmentId } }
            : {}),
        },
      }),
      params.mode === "WORKSHOP"
        ? db.workshopResource.findMany({
            where: {
              isActive: true,
              ...(params.requiresLift ? { type: "HYDRAULIC_LIFT" } : {}),
            },
            // Preferir SERVICE_BAY si no requiere elevador para dejar el elevador libre
            orderBy: { type: "desc" },
          })
        : Promise.resolve([]),
      params.mode === "HOME_SERVICE"
        ? db.mobileUnit.findMany({ where: { isActive: true } })
        : Promise.resolve([]),
    ]);

  // Global blocks (sin técnico, recurso ni unidad móvil específica)
  for (const b of blockedSlots) {
    if (!b.technicianId && !b.resourceId && !b.mobileUnitId) {
      const bStart = parseRDDateTime(dateStr, b.startTime);
      const bEnd = parseRDDateTime(dateStr, b.endTime);
      if (intervalsOverlap(effectiveStart, effectiveEnd, bStart, bEnd)) {
        return {
          available: false,
          technicianId: null,
          resourceId: null,
          mobileUnitId: null,
          reason: b.reason || "Horario bloqueado administrativamente.",
        };
      }
    }
  }

  // Filtrar técnicos disponibles
  const candidateTechs = technicians.filter((tech) => {
    const schedule = tech.workSchedules[0];
    if (!schedule) return false;
    const schedStart = parseRDDateTime(dateStr, schedule.startTime);
    const schedEnd = parseRDDateTime(dateStr, schedule.endTime);
    if (params.startDate < schedStart || serviceEnd > schedEnd) return false;

    const techBlocked = blockedSlots.some((b) => {
      if (b.technicianId !== tech.id) return false;
      const bStart = parseRDDateTime(dateStr, b.startTime);
      const bEnd = parseRDDateTime(dateStr, b.endTime);
      return intervalsOverlap(effectiveStart, effectiveEnd, bStart, bEnd);
    });
    if (techBlocked) return false;

    const techBusy = existingAppointments.some((appt) => {
      if (appt.technicianId !== tech.id) return false;
      const apptBuffer =
        appt.mode === "HOME_SERVICE"
          ? settings.mobileTravelBufferMinutes
          : settings.workshopBufferMinutes;
      const apptStart =
        appt.mode === "HOME_SERVICE"
          ? new Date(appt.appointmentDate.getTime() - Math.min(15, apptBuffer) * 60_000)
          : appt.appointmentDate;
      const apptEnd = new Date(appt.endDate.getTime() + apptBuffer * 60_000);
      return intervalsOverlap(effectiveStart, effectiveEnd, apptStart, apptEnd);
    });
    return !techBusy;
  });

  if (candidateTechs.length === 0) {
    return {
      available: false,
      technicianId: null,
      resourceId: null,
      mobileUnitId: null,
      reason: "No hay técnicos disponibles para ese horario.",
    };
  }

  const chosenTech =
    (params.preferredTechnicianId
      ? candidateTechs.find((t) => t.id === params.preferredTechnicianId)
      : null) ?? candidateTechs[0];

  if (params.mode === "WORKSHOP") {
    const freeResource = resources.find((res) => {
      const resBlocked = blockedSlots.some((b) => {
        if (b.resourceId !== res.id) return false;
        const bStart = parseRDDateTime(dateStr, b.startTime);
        const bEnd = parseRDDateTime(dateStr, b.endTime);
        return intervalsOverlap(effectiveStart, effectiveEnd, bStart, bEnd);
      });
      if (resBlocked) return false;

      const overlappingOnRes = existingAppointments.filter((appt) => {
        if (appt.resourceId !== res.id) return false;
        const apptEnd = new Date(
          appt.endDate.getTime() + settings.workshopBufferMinutes * 60_000
        );
        return intervalsOverlap(effectiveStart, effectiveEnd, appt.appointmentDate, apptEnd);
      }).length;

      return overlappingOnRes < res.capacity;
    });

    if (!freeResource) {
      return {
        available: false,
        technicianId: null,
        resourceId: null,
        mobileUnitId: null,
        reason: params.requiresLift
          ? "El elevador hidráulico no está disponible en ese horario."
          : "No hay bahía de servicio disponible en ese horario.",
      };
    }

    return {
      available: true,
      technicianId: chosenTech.id,
      resourceId: freeResource.id,
      mobileUnitId: null,
    };
  }

  // HOME_SERVICE: requiere unidad móvil libre
  const freeUnit = mobileUnits.find((unit) => {
    const unitBlocked = blockedSlots.some((b) => {
      if (b.mobileUnitId !== unit.id) return false;
      const bStart = parseRDDateTime(dateStr, b.startTime);
      const bEnd = parseRDDateTime(dateStr, b.endTime);
      return intervalsOverlap(effectiveStart, effectiveEnd, bStart, bEnd);
    });
    if (unitBlocked) return false;

    const unitBusy = existingAppointments.some((appt) => {
      if (appt.mobileUnitId !== unit.id) return false;
      const apptBuffer = settings.mobileTravelBufferMinutes;
      const apptStart = new Date(
        appt.appointmentDate.getTime() - Math.min(15, apptBuffer) * 60_000
      );
      const apptEnd = new Date(appt.endDate.getTime() + apptBuffer * 60_000);
      return intervalsOverlap(effectiveStart, effectiveEnd, apptStart, apptEnd);
    });
    return !unitBusy;
  });

  if (!freeUnit) {
    return {
      available: false,
      technicianId: null,
      resourceId: null,
      mobileUnitId: null,
      reason: "La unidad móvil no tiene disponibilidad en ese horario.",
    };
  }

  return {
    available: true,
    technicianId: chosenTech.id,
    resourceId: null,
    mobileUnitId: freeUnit.id,
  };
}

export async function getAvailableSlotsForDate(params: {
  dateStr: string;
  serviceIds: string[];
  mode: "WORKSHOP" | "HOME_SERVICE";
  excludeAppointmentId?: string;
}): Promise<AvailabilityResult> {
  const settings = await getSystemSettings(prisma);
  const services = await prisma.service.findMany({
    where: { id: { in: params.serviceIds }, isActive: true },
  });

  if (services.length === 0) {
    return {
      date: params.dateStr,
      isClosed: true,
      closedReason: "Selecciona al menos un servicio válido.",
      totalDuration: 0,
      slots: [],
    };
  }

  if (params.mode === "HOME_SERVICE" && services.some((s) => !s.isAvailableHome)) {
    return {
      date: params.dateStr,
      isClosed: true,
      closedReason:
        "Uno o más servicios seleccionados solo se realizan en el taller físico.",
      totalDuration: 0,
      slots: [],
    };
  }

  const totalDuration = services.reduce((acc, s) => acc + s.estimatedDuration, 0);
  const requiresLift = services.some((s) => s.requiresLift);
  const dayOfWeek = getRDDayOfWeek(params.dateStr);

  if (dayOfWeek === 0) {
    return {
      date: params.dateStr,
      isClosed: true,
      closedReason: "Cerrado los domingos. Atendemos de lunes a sábado.",
      totalDuration,
      slots: [],
    };
  }

  const holidayName = await isHolidayDate(params.dateStr, prisma);
  if (holidayName) {
    return {
      date: params.dateStr,
      isClosed: true,
      closedReason: `Día feriado en República Dominicana: ${holidayName}.`,
      totalDuration,
      slots: [],
    };
  }

  const openStr = dayOfWeek === 6 ? settings.saturdayOpen : settings.weekdayOpen;
  const closeStr = dayOfWeek === 6 ? settings.saturdayClose : settings.weekdayClose;
  const openMins = timeToMinutes(openStr);
  const closeMins = timeToMinutes(closeStr);

  const slots: AvailableSlot[] = [];

  for (
    let m = openMins;
    m + totalDuration <= closeMins;
    m += settings.slotStepMinutes
  ) {
    const timeStr = minutesToTime(m);
    const startDate = parseRDDateTime(params.dateStr, timeStr);
    const check = await findAssignableResources({
      startDate,
      durationMinutes: totalDuration,
      mode: params.mode,
      requiresLift,
      excludeAppointmentId: params.excludeAppointmentId,
      db: prisma,
    });

    if (check.available) {
      const endStr = minutesToTime(m + totalDuration);
      slots.push({
        time: timeStr,
        endTime: endStr,
        availableTechnicians: 1,
        availableResources: 1,
        label: `${timeStr} - ${endStr}`,
      });
    }
  }

  return {
    date: params.dateStr,
    isClosed: false,
    totalDuration,
    slots,
  };
}

export interface PricingQuote {
  subtotalAmount: number;
  travelFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  itbisRate: number;
  estimatedDuration: number;
  appliedBenefitType: string | null;
  appliedBenefitServiceId: string | null;
  appliedDiscountLabel: string | null;
  subscriptionId: string | null;
  lineItems: Array<{
    serviceId: string;
    name: string;
    basePrice: number;
    duration: number;
    usedMembershipBenefit: boolean;
  }>;
}

export async function calculateAppointmentQuote(params: {
  clientId: string;
  vehicleId?: string | null;
  serviceIds: string[];
  mode: "WORKSHOP" | "HOME_SERVICE";
  zoneSurcharge?: number;
  useMembershipBenefit?: boolean;
  promotionCode?: string | null;
  db?: DbClient;
}): Promise<PricingQuote> {
  const db = params.db ?? prisma;
  const settings = await getSystemSettings(db);

  const services = await db.service.findMany({
    where: { id: { in: params.serviceIds }, isActive: true },
  });

  if (services.length !== params.serviceIds.length) {
    throw new Error("Uno o más servicios seleccionados no están disponibles.");
  }

  if (params.mode === "HOME_SERVICE" && services.some((s) => !s.isAvailableHome)) {
    throw new Error(
      "Uno o más servicios seleccionados no están disponibles para servicio a domicilio."
    );
  }
  if (params.mode === "WORKSHOP" && services.some((s) => !s.isAvailableWorkshop)) {
    throw new Error(
      "Uno o más servicios seleccionados no están disponibles en el taller."
    );
  }

  const estimatedDuration = services.reduce((acc, s) => acc + s.estimatedDuration, 0);

  // Subtotal usando precio base del servicio (taller) y desplazamiento separado para domicilio
  // De forma que para 1 servicio a domicilio: base + desplazamiento = homePrice exacto del plan de negocios.
  const lineItems = services.map((s) => ({
    serviceId: s.id,
    slug: s.slug,
    name: s.name,
    basePrice: Number(s.price),
    homeDiff:
      params.mode === "HOME_SERVICE" && s.homePrice
        ? Math.max(0, Number(s.homePrice) - Number(s.price))
        : 0,
    duration: s.estimatedDuration,
    usedMembershipBenefit: false,
  }));

  const subtotalAmount = lineItems.reduce((acc, item) => acc + item.basePrice, 0);
  let travelFee =
    params.mode === "HOME_SERVICE"
      ? Math.max(...lineItems.map((i) => i.homeDiff), 0) + Number(params.zoneSurcharge ?? 0)
      : 0;

  let discountAmount = 0;
  let appliedBenefitType: string | null = null;
  let appliedBenefitServiceId: string | null = null;
  let appliedDiscountLabel: string | null = null;
  let subscriptionId: string | null = null;

  // Buscar membresía activa del cliente (priorizando la del vehículo seleccionado o general)
  const activeSub = await db.subscription.findFirst({
    where: {
      clientId: params.clientId,
      status: "ACTIVE",
      endDate: { gte: new Date() },
      OR: params.vehicleId
        ? [{ vehicleId: params.vehicleId }, { vehicleId: null }]
        : undefined,
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  if (activeSub) {
    subscriptionId = activeSub.id;
    const modeAllowedForBenefit =
      activeSub.plan.targetMode === "A domicilio"
        ? params.mode === "HOME_SERVICE" || params.mode === "WORKSHOP"
        : params.mode === "WORKSHOP";

    if (params.useMembershipBenefit && modeAllowedForBenefit) {
      // Verificar si algún servicio seleccionado califica para un beneficio incluido disponible
      for (const item of lineItems) {
        if (
          item.slug === "revision-preventiva-20-puntos" &&
          activeSub.reviewsUsed < activeSub.plan.includedReviews
        ) {
          appliedBenefitType = "REVIEW";
          appliedBenefitServiceId = item.serviceId;
          item.usedMembershipBenefit = true;
          discountAmount += item.basePrice;
          if (params.mode === "HOME_SERVICE" && activeSub.plan.targetMode === "A domicilio") {
            travelFee = 0;
          }
          appliedDiscountLabel = `Beneficio incluido (${activeSub.plan.name}): Revisión preventiva`;
          break;
        }
        if (
          item.slug === "prueba-bateria-sistema-carga" &&
          activeSub.batteryTestsUsed < activeSub.plan.includedBatteryTests
        ) {
          appliedBenefitType = "BATTERY_TEST";
          appliedBenefitServiceId = item.serviceId;
          item.usedMembershipBenefit = true;
          discountAmount += item.basePrice;
          if (params.mode === "HOME_SERVICE" && activeSub.plan.targetMode === "A domicilio") {
            travelFee = 0;
          }
          appliedDiscountLabel = `Beneficio incluido (${activeSub.plan.name}): Prueba de batería`;
          break;
        }
        if (
          item.slug === "diagnostico-electronico-basico" &&
          activeSub.diagnosticsUsed < activeSub.plan.includedDiagnostics
        ) {
          appliedBenefitType = "DIAGNOSTIC";
          appliedBenefitServiceId = item.serviceId;
          item.usedMembershipBenefit = true;
          discountAmount += item.basePrice;
          if (params.mode === "HOME_SERVICE" && activeSub.plan.targetMode === "A domicilio") {
            travelFee = 0;
          }
          appliedDiscountLabel = `Beneficio incluido (${activeSub.plan.name}): Diagnóstico electrónico`;
          break;
        }
        if (
          item.slug === "cambio-aceite-semisintetico" &&
          activeSub.oilChangesUsed < activeSub.plan.includedOilChanges
        ) {
          appliedBenefitType = "OIL_CHANGE";
          appliedBenefitServiceId = item.serviceId;
          item.usedMembershipBenefit = true;
          discountAmount += item.basePrice;
          if (params.mode === "HOME_SERVICE" && activeSub.plan.targetMode === "A domicilio") {
            travelFee = 0;
          }
          appliedDiscountLabel = `Beneficio incluido (${activeSub.plan.name}): Cambio de aceite semisintético`;
          break;
        }
      }
    }

    // Aplicar descuento porcentual de la membresía únicamente cuando la modalidad es elegible según el plan (Centro vs. Domicilio)
    const remainingPaidBase = lineItems
      .filter((i) => !i.usedMembershipBenefit)
      .reduce((acc, i) => acc + i.basePrice, 0);

    if (remainingPaidBase > 0 && activeSub.plan.discountPercent > 0 && modeAllowedForBenefit) {
      const pctDiscount = Number(
        ((remainingPaidBase * activeSub.plan.discountPercent) / 100).toFixed(2)
      );
      discountAmount += pctDiscount;
      appliedDiscountLabel = appliedDiscountLabel
        ? `${appliedDiscountLabel} + ${activeSub.plan.discountPercent}% desc. miembro`
        : `Descuento membresía ${activeSub.plan.name} (${activeSub.plan.discountPercent}%)`;
    }
  }

  if (discountAmount === 0 && params.promotionCode) {
    const promo = await db.promotion.findFirst({
      where: {
        code: params.promotionCode.trim().toUpperCase(),
        isActive: true,
      },
    });
    const now = new Date();
    if (
      promo &&
      (!promo.validFrom || promo.validFrom <= now) &&
      (!promo.validUntil || promo.validUntil >= now) &&
      (!promo.maxUses || promo.currentUses < promo.maxUses)
    ) {
      discountAmount = Number(((subtotalAmount * promo.discountPercent) / 100).toFixed(2));
      appliedDiscountLabel = `Código ${promo.code} (${promo.discountPercent}% desc.)`;
    }
  }

  const taxableAmount = Math.max(0, subtotalAmount + travelFee - discountAmount);
  const taxAmount = Number((taxableAmount * settings.itbisRate).toFixed(2));
  const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

  return {
    subtotalAmount: Number(subtotalAmount.toFixed(2)),
    travelFee: Number(travelFee.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxAmount,
    totalAmount,
    itbisRate: settings.itbisRate,
    estimatedDuration,
    appliedBenefitType,
    appliedBenefitServiceId,
    appliedDiscountLabel,
    subscriptionId,
    lineItems: lineItems.map((i) => ({
      serviceId: i.serviceId,
      name: i.name,
      basePrice: i.basePrice,
      duration: i.duration,
      usedMembershipBenefit: i.usedMembershipBenefit,
    })),
  };
}
