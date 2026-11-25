import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de DWay AutoCare...");

  // 1. Configuraciones del sistema (República Dominicana)
  const configs = [
    { key: "itbis_rate", value: "0.18", description: "Tasa de ITBIS vigente (18%)" },
    { key: "workshop_buffer_minutes", value: "10", description: "Tiempo de limpieza/preparación entre citas en taller (min)" },
    { key: "mobile_travel_buffer_minutes", value: "30", description: "Margen de desplazamiento de la unidad móvil entre citas (min)" },
    { key: "slot_step_minutes", value: "30", description: "Intervalo de horarios mostrados en agenda (min)" },
    { key: "weekday_open", value: "08:00", description: "Hora de apertura lunes a viernes" },
    { key: "weekday_close", value: "17:00", description: "Hora de cierre lunes a viernes" },
    { key: "saturday_open", value: "08:00", description: "Hora de apertura sábados" },
    { key: "saturday_close", value: "13:00", description: "Hora de cierre sábados" },
    { key: "warranty_days", value: "30", description: "Garantía en mano de obra (días)" },
    { key: "company_name", value: "DWay AutoCare S.R.L.", description: "Razón social" },
    { key: "company_slogan", value: "Tú eliges dónde, nosotros cuidamos tu vehículo", description: "Lema corporativo" },
    { key: "company_zone", value: "Distrito Nacional (Naco / Piantini), Santo Domingo, RD", description: "Ubicación propuesta en el plan de negocios" },
  ];

  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: {},
      create: c,
    });
  }

  // 2. Recursos del taller y Unidad Móvil (Plan Sec. 2.1, 2.10 y 5.2)
  await prisma.workshopResource.upsert({
    where: { name: "Elevador Hidráulico #1" },
    update: { type: "HYDRAULIC_LIFT", capacity: 1, isActive: true },
    create: {
      name: "Elevador Hidráulico #1",
      type: "HYDRAULIC_LIFT",
      capacity: 1,
      isActive: true,
      notes: "Elevador de dos columnas para cambio de pastillas, drenaje y servicios bajo chasis.",
    },
  });

  await prisma.workshopResource.upsert({
    where: { name: "Bahía Preventiva #1 (Gatos y Soportes)" },
    update: { type: "SERVICE_BAY", capacity: 1, isActive: true },
    create: {
      name: "Bahía Preventiva #1 (Gatos y Soportes)",
      type: "SERVICE_BAY",
      capacity: 1,
      isActive: true,
      notes: "Área equipada con gatos hidráulicos, soportes, compresor y escáner multimarca.",
    },
  });

  await prisma.mobileUnit.upsert({
    where: { name: "Unidad Móvil DWay #01" },
    update: { isActive: true },
    create: {
      name: "Unidad Móvil DWay #01",
      plate: "L428910",
      vehicleModel: "Vehículo utilitario adaptado DWay",
      equipmentNotes: "Equipada con herramientas portátiles, bomba de extracción, escáner OBD-II y recipientes de aceite usado.",
      isActive: true,
    },
  });

  // 3. Zonas de Cobertura (Distrito Nacional - Plan Sec. 1.2 y 3.2)
  const zones = [
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Naco", travelTimeMinutes: 20, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Piantini", travelTimeMinutes: 20, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Ensanche Paraíso", travelTimeMinutes: 25, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Evaristo Morales", travelTimeMinutes: 25, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Serrallés", travelTimeMinutes: 20, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Julieta Morales", travelTimeMinutes: 25, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Bella Vista", travelTimeMinutes: 30, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "La Julia", travelTimeMinutes: 25, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Gazcue", travelTimeMinutes: 30, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Zona Universitaria", travelTimeMinutes: 30, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Mirador Sur", travelTimeMinutes: 35, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Los Prados", travelTimeMinutes: 30, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "El Millón", travelTimeMinutes: 35, surchargeFee: 0 },
    { province: "Distrito Nacional", municipality: "Santo Domingo de Guzmán", sector: "Arroyo Hondo", travelTimeMinutes: 35, surchargeFee: 0 },
    // Zonas extendidas de Gran Santo Domingo (con cargo adicional por desplazamiento según Plan Sec. 1.2 / 2.6)
    { province: "Santo Domingo", municipality: "Santo Domingo Este", sector: "Alma Rosa I", travelTimeMinutes: 45, surchargeFee: 400 },
    { province: "Santo Domingo", municipality: "Santo Domingo Este", sector: "Ensanche Ozama", travelTimeMinutes: 45, surchargeFee: 400 },
    { province: "Santo Domingo", municipality: "Santo Domingo Oeste", sector: "Herrera / Zona Industrial", travelTimeMinutes: 45, surchargeFee: 400 },
    { province: "Santo Domingo", municipality: "Santo Domingo Norte", sector: "Villa Mella (Av. Hermanas Mirabal)", travelTimeMinutes: 50, surchargeFee: 450 },
  ];

  for (const z of zones) {
    await prisma.coverageZone.upsert({
      where: {
        province_municipality_sector: {
          province: z.province,
          municipality: z.municipality,
          sector: z.sector,
        },
      },
      update: { travelTimeMinutes: z.travelTimeMinutes, surchargeFee: z.surchargeFee, isActive: true },
      create: z,
    });
  }

  // 4. Días feriados de República Dominicana (2026–2027)
  const holidays = [
    { date: new Date("2026-01-01T12:00:00-04:00"), name: "Año Nuevo", isRecurring: true },
    { date: new Date("2026-01-21T12:00:00-04:00"), name: "Día de la Altagracia", isRecurring: true },
    { date: new Date("2026-02-27T12:00:00-04:00"), name: "Día de la Independencia Nacional", isRecurring: true },
    { date: new Date("2026-08-16T12:00:00-04:00"), name: "Día de la Restauración", isRecurring: true },
    { date: new Date("2026-09-24T12:00:00-04:00"), name: "Día de Las Mercedes", isRecurring: true },
    { date: new Date("2026-12-25T12:00:00-04:00"), name: "Día de Navidad", isRecurring: true },
  ];

  const existingHolidayCount = await prisma.holiday.count();
  if (existingHolidayCount === 0) {
    await prisma.holiday.createMany({ data: holidays });
  }

  // 5. Usuarios iniciales (Admin, Recepcionista, Jefe de Taller, Técnico Taller, Técnico Móvil, Cliente)
  const adminPass = process.env.SEED_ADMIN_PASSWORD;
  const staffPass = process.env.SEED_STAFF_PASSWORD;
  const clientPass = process.env.SEED_CLIENT_PASSWORD;
  if (!adminPass || !staffPass || !clientPass) {
    throw new Error(
      "Define SEED_ADMIN_PASSWORD, SEED_STAFF_PASSWORD y SEED_CLIENT_PASSWORD en las variables de entorno antes de ejecutar el seed."
    );
  }
  const adminPasswordHash = await bcrypt.hash(adminPass, 10);
  const staffPasswordHash = await bcrypt.hash(staffPass, 10);
  const clientPasswordHash = await bcrypt.hash(clientPass, 10);

  await prisma.user.upsert({
    where: { email: "admin@dwayautocare.do" },
    update: { role: "ADMIN", isActive: true },
    create: {
      email: "admin@dwayautocare.do",
      passwordHash: adminPasswordHash,
      name: "Yandell Cuevas",
      firstName: "Ángel Yandell",
      lastName: "Cuevas Mora",
      phone: "809-555-0101",
      role: "ADMIN",
      termsAcceptedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "recepcion@dwayautocare.do" },
    update: { role: "RECEPTIONIST", isActive: true },
    create: {
      email: "recepcion@dwayautocare.do",
      passwordHash: staffPasswordHash,
      name: "Laura Martínez",
      firstName: "Laura",
      lastName: "Martínez",
      phone: "809-555-0102",
      role: "RECEPTIONIST",
      termsAcceptedAt: new Date(),
    },
  });

  // Técnicos según Tabla 4 del Plan: Jefe de taller, Técnico de taller, Técnico móvil
  const techChiefUser = await prisma.user.upsert({
    where: { email: "jefe.taller@dwayautocare.do" },
    update: { role: "TECHNICIAN", isActive: true },
    create: {
      email: "jefe.taller@dwayautocare.do",
      passwordHash: staffPasswordHash,
      name: "Roberto Almonte",
      firstName: "Roberto",
      lastName: "Almonte",
      phone: "809-555-0103",
      role: "TECHNICIAN",
      termsAcceptedAt: new Date(),
    },
  });

  const techBayUser = await prisma.user.upsert({
    where: { email: "tecnico.taller@dwayautocare.do" },
    update: { role: "TECHNICIAN", isActive: true },
    create: {
      email: "tecnico.taller@dwayautocare.do",
      passwordHash: staffPasswordHash,
      name: "Miguel Ángel Peña",
      firstName: "Miguel Ángel",
      lastName: "Peña",
      phone: "809-555-0104",
      role: "TECHNICIAN",
      termsAcceptedAt: new Date(),
    },
  });

  const techMobileUser = await prisma.user.upsert({
    where: { email: "tecnico.movil@dwayautocare.do" },
    update: { role: "TECHNICIAN", isActive: true },
    create: {
      email: "tecnico.movil@dwayautocare.do",
      passwordHash: staffPasswordHash,
      name: "José Luis Santana",
      firstName: "José Luis",
      lastName: "Santana",
      phone: "809-555-0105",
      role: "TECHNICIAN",
      termsAcceptedAt: new Date(),
    },
  });

  const techChief = await prisma.technician.upsert({
    where: { userId: techChiefUser.id },
    update: { isActive: true, canDriveMobileUnit: false },
    create: {
      userId: techChiefUser.id,
      specializations: JSON.stringify([
        "Control de calidad",
        "Frenos y fluidos",
        "Diagnóstico electrónico",
        "Lubricación y filtros",
      ]),
      canDriveMobileUnit: false,
      isActive: true,
    },
  });

  const techBay = await prisma.technician.upsert({
    where: { userId: techBayUser.id },
    update: { isActive: true, canDriveMobileUnit: false },
    create: {
      userId: techBayUser.id,
      specializations: JSON.stringify([
        "Cambio de aceite y filtros",
        "Revisión preventiva 20 puntos",
        "Baterías y sistema de carga",
        "Frenos",
      ]),
      canDriveMobileUnit: false,
      isActive: true,
    },
  });

  const techMobile = await prisma.technician.upsert({
    where: { userId: techMobileUser.id },
    update: { isActive: true, canDriveMobileUnit: true },
    create: {
      userId: techMobileUser.id,
      specializations: JSON.stringify([
        "Unidad móvil a domicilio",
        "Cambio de aceite y filtros",
        "Baterías",
        "Diagnóstico básico OBD-II",
        "Flotas empresariales",
      ]),
      canDriveMobileUnit: true,
      isActive: true,
    },
  });

  // Horarios laborales Lunes (1) a Viernes (5) 08:00-17:00 y Sábado (6) 08:00-13:00
  for (const tech of [techChief, techBay, techMobile]) {
    const count = await prisma.workSchedule.count({ where: { technicianId: tech.id } });
    if (count === 0) {
      const days = [1, 2, 3, 4, 5, 6];
      await prisma.workSchedule.createMany({
        data: days.map((dayOfWeek) => ({
          technicianId: tech.id,
          dayOfWeek,
          startTime: "08:00",
          endTime: dayOfWeek === 6 ? "13:00" : "17:00",
          isActive: true,
        })),
      });
    }
  }

  // 6. Catálogo de Servicios (Tablas 5, 6 y 7 del Plan de Negocios — precios exactos sin ITBIS)
  const services = [
    {
      slug: "cambio-aceite-semisintetico",
      category: "Lubricación y Filtros",
      name: "Cambio de aceite semisintético y filtro",
      description:
        "Sustitución de aceite semisintético según especificación del fabricante (hasta 4 litros) y cambio de filtro de aceite con revisión visual de fugas.",
      price: 2800,
      homePrice: 3300,
      estimatedDuration: 45,
      isAvailableWorkshop: true,
      isAvailableHome: true,
      requiresLift: false,
      imageUrl: "/images/services/service-oil.jpg",
      iconName: "Droplets",
      conditions:
        "Incluye hasta 4 litros de aceite semisintético y filtro estándar. A domicilio requiere espacio plano, seguro y ventilado.",
      sortOrder: 1,
    },
    {
      slug: "cambio-aceite-sintetico",
      category: "Lubricación y Filtros",
      name: "Cambio de aceite sintético y filtro",
      description:
        "Cambio de aceite 100% sintético de alto rendimiento y filtro nuevo de aceite, ideal para máxima protección del motor en el tránsito urbano.",
      price: 4200,
      homePrice: 4800,
      estimatedDuration: 45,
      isAvailableWorkshop: true,
      isAvailableHome: true,
      requiresLift: false,
      imageUrl: "/images/services/service-oil.jpg",
      iconName: "Droplet",
      conditions:
        "Incluye hasta 4 litros de aceite sintético y filtro estándar. Litros adicionales según capacidad del motor.",
      sortOrder: 2,
    },
    {
      slug: "revision-preventiva-20-puntos",
      category: "Inspección Preventiva",
      name: "Inspección preventiva de 20 puntos",
      description:
        "Revisión integral de niveles de fluidos, correas, mangueras, luces, neumáticos, suspensión visible, sistema de frenos y reporte del estado del vehículo.",
      price: 1200,
      homePrice: 1600,
      estimatedDuration: 40,
      isAvailableWorkshop: true,
      isAvailableHome: true,
      requiresLift: false,
      imageUrl: "/images/workshop/workshop-branded.jpg",
      iconName: "ClipboardCheck",
      conditions:
        "En servicio a domicilio la inspección de frenos y parte inferior es visual sin elevador.",
      sortOrder: 3,
    },
    {
      slug: "cambio-filtros-aire-cabina",
      category: "Lubricación y Filtros",
      name: "Cambio de filtros de aire y de cabina",
      description:
        "Reemplazo de filtro de aire del motor y filtro de aire acondicionado de cabina para optimizar el consumo de combustible y la calidad del aire interior.",
      price: 1900,
      homePrice: 2200,
      estimatedDuration: 30,
      isAvailableWorkshop: true,
      isAvailableHome: true,
      requiresLift: false,
      imageUrl: "/images/mobile-service/mobile-unit-branded.jpg",
      iconName: "Wind",
      conditions: "Aplica para vehículos ligeros, sedanes, jeepetas y camionetas comunes.",
      sortOrder: 4,
    },
    {
      slug: "revision-limpieza-frenos",
      category: "Sistema de Frenos",
      name: "Revisión y limpieza del sistema de frenos",
      description:
        "Desmontaje de ruedas en taller, inspección de espesor de pastillas y discos, limpieza de mordazas y verificación de fugas en líneas de freno.",
      price: 1500,
      homePrice: null,
      estimatedDuration: 50,
      isAvailableWorkshop: true,
      isAvailableHome: false,
      requiresLift: true,
      imageUrl: "/images/services/service-inspection.jpg",
      iconName: "Disc",
      conditions:
        "Exclusivo en nuestro taller físico porque requiere elevador hidráulico por seguridad.",
      sortOrder: 5,
    },
    {
      slug: "cambio-pastillas-freno-delantero",
      category: "Sistema de Frenos",
      name: "Cambio de pastillas de freno (eje delantero)",
      description:
        "Sustitución del juego de pastillas de freno delanteras, limpieza de caliper, lubricación de pernos guía y prueba de frenado.",
      price: 4500,
      homePrice: null,
      estimatedDuration: 60,
      isAvailableWorkshop: true,
      isAvailableHome: false,
      requiresLift: true,
      imageUrl: "/images/services/service-inspection.jpg",
      iconName: "ShieldCheck",
      conditions:
        "Exclusivo en el taller (requiere elevador hidráulico). No incluye rectificación ni cambio de discos si presentan desgaste severo.",
      sortOrder: 6,
    },
    {
      slug: "prueba-bateria-sistema-carga",
      category: "Batería y Eléctrico",
      name: "Prueba de batería y sistema de carga",
      description:
        "Diagnóstico digital de estado de salud (SOH), capacidad de arranque (CCA), alternador y limpieza básica de bornes.",
      price: 500,
      homePrice: 800,
      estimatedDuration: 25,
      isAvailableWorkshop: true,
      isAvailableHome: true,
      requiresLift: false,
      imageUrl: "/images/services/service-inspection.jpg",
      iconName: "BatteryCharging",
      conditions: "Disponible tanto en el taller como mediante unidad móvil.",
      sortOrder: 7,
    },
    {
      slug: "instalacion-bateria-nueva",
      category: "Batería y Eléctrico",
      name: "Revisión e instalación de batería nueva",
      description:
        "Suministro e instalación de batería nueva con respaldo de memoria eléctrica, verificación de alternador y disposición responsable de la batería usada.",
      price: 9500,
      homePrice: 10500,
      estimatedDuration: 35,
      isAvailableWorkshop: true,
      isAvailableHome: true,
      requiresLift: false,
      imageUrl: "/images/services/service-diagnostics.jpg",
      iconName: "BatteryFull",
      conditions:
        "Precio referencial para batería estándar; modelos AGM o de alta capacidad pueden variar previa aprobación del cliente. Garantía del fabricante.",
      sortOrder: 8,
    },
    {
      slug: "cambio-liquido-frenos-refrigerante",
      category: "Fluidos Preventivos",
      name: "Cambio de líquido de frenos o refrigerante",
      description:
        "Renovación y purgado profesional de líquido de frenos (DOT 3/4) o refrigerante/anticongelante del radiador para evitar corrosión y sobrecalentamiento.",
      price: 2400,
      homePrice: null,
      estimatedDuration: 55,
      isAvailableWorkshop: true,
      isAvailableHome: false,
      requiresLift: true,
      imageUrl: "/images/workshop/workshop-branded.jpg",
      iconName: "Thermometer",
      conditions:
        "Se realiza únicamente en el centro físico para garantizar manejo seguro y ambiental de fluidos.",
      sortOrder: 9,
    },
    {
      slug: "diagnostico-electronico-basico",
      category: "Diagnóstico",
      name: "Diagnóstico básico mediante escáner",
      description:
        "Lectura de códigos de falla OBD-II multimarca, evaluación de sensores principales, borrado preventivo tras verificación y reporte técnico.",
      price: 1500,
      homePrice: 1900,
      estimatedDuration: 30,
      isAvailableWorkshop: true,
      isAvailableHome: true,
      requiresLift: false,
      imageUrl: "/images/services/service-diagnostics.jpg",
      iconName: "Cpu",
      conditions:
        "Diagnóstico preventivo básico. Si se detecta avería compleja de motor o transmisión, se orienta al cliente hacia un taller especializado.",
      sortOrder: 10,
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
  }

  // 7. Planes de Membresía (Tabla 8 del Plan de Negocios — precios exactos sin ITBIS)
  const plans = [
    {
      slug: "esencial",
      name: "Esencial",
      monthlyPrice: 350, // + ITBIS = RD$413
      annualPrice: 3800, // + ITBIS = RD$4,484
      description:
        "Ideal para dueños de vehículos particulares que quieren organizar su mantenimiento en el centro con una cuota mensual accesible.",
      targetMode: "Centro",
      includedReviews: 3,
      includedBatteryTests: 2,
      includedDiagnostics: 0,
      includedOilChanges: 0,
      discountPercent: 5,
      benefits: JSON.stringify([
        "3 revisiones preventivas de 20 puntos al año en el centro",
        "2 pruebas de batería y sistema de carga al año en el centro",
        "5% de descuento en demás servicios y cambios de aceite",
        "Recordatorios de mantenimiento y prioridad en citas",
      ]),
      restrictions: JSON.stringify([
        "Aplica por vehículo registrado",
        "Atención exclusiva en nuestro centro físico",
        "Permanencia mínima de 12 meses en modalidad mensual",
        "Los beneficios se reservan por cita y no se acumulan de un año a otro",
      ]),
      sortOrder: 1,
    },
    {
      slug: "confort",
      name: "Confort",
      monthlyPrice: 600, // + ITBIS = RD$708
      annualPrice: 6500, // + ITBIS = RD$7,670
      description:
        "Pensado para conductores frecuentes y familias con uso diario que buscan control completo y diagnóstico electrónico anual.",
      targetMode: "Centro",
      includedReviews: 4,
      includedBatteryTests: 2,
      includedDiagnostics: 1,
      includedOilChanges: 0,
      discountPercent: 10,
      benefits: JSON.stringify([
        "4 revisiones preventivas de 20 puntos al año en el centro",
        "2 pruebas de batería y sistema de carga al año en el centro",
        "1 diagnóstico electrónico básico con escáner al año",
        "10% de descuento en demás servicios preventivos",
        "Recordatorios programados y prioridad en agenda",
      ]),
      restrictions: JSON.stringify([
        "Aplica por vehículo registrado",
        "Atención exclusiva en nuestro centro físico",
        "No incluye cambios de aceite ni piezas de desgaste",
        "Permanencia mínima de 12 meses en modalidad mensual; beneficios no acumulables",
      ]),
      sortOrder: 2,
    },
    {
      slug: "premium-domicilio",
      name: "Premium Domicilio",
      monthlyPrice: 1000, // + ITBIS = RD$1,180
      annualPrice: 10800, // + ITBIS = RD$12,744
      description:
        "Diseñado para profesionales ocupados que prefieren que la unidad móvil DWay cuide su vehículo en casa o en la oficina.",
      targetMode: "A domicilio",
      includedReviews: 4,
      includedBatteryTests: 2,
      includedDiagnostics: 1,
      includedOilChanges: 1,
      discountPercent: 12,
      benefits: JSON.stringify([
        "4 revisiones preventivas al año a domicilio (o en centro)",
        "2 pruebas de batería al año a domicilio",
        "1 diagnóstico electrónico básico al año a domicilio",
        "1 cambio de aceite semisintético y filtro al año a domicilio",
        "12% de descuento en demás servicios preventivos",
        "Prioridad en citas y recordatorios automáticos",
      ]),
      restrictions: JSON.stringify([
        "Aplica por vehículo dentro de la zona de cobertura en el Distrito Nacional",
        "Requiere espacio plano, seguro y ventilado para la unidad móvil",
        "Permanencia mínima de 12 meses en modalidad mensual; beneficios no acumulables",
      ]),
      sortOrder: 3,
    },
  ];

  for (const p of plans) {
    await prisma.membershipPlan.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // 8. Promociones activas (Plan Sec. 4.2 - 4.3)
  await prisma.promotion.upsert({
    where: { code: "SOCIOFUNDADOR" },
    update: { isActive: true },
    create: {
      code: "SOCIOFUNDADOR",
      name: "Preventa Socios Fundadores",
      description: "5% de descuento promocional de lanzamiento para clientes fundadores (tarifa congelada 12 meses).",
      discountPercent: 5,
      isActive: true,
    },
  });

  await prisma.promotion.upsert({
    where: { code: "REFERIDO5" },
    update: { isActive: true },
    create: {
      code: "REFERIDO5",
      name: "Programa de Referidos DWay",
      description: "5% de descuento en cita preventiva al asistir recomendado por un cliente o miembro activo.",
      discountPercent: 5,
      isActive: true,
    },
  });

  // 9. Cuenta de Cliente Demo + 2 Vehículos + Dirección + Membresía Activa + Historial + Cita Futura
  const demoClient = await prisma.user.upsert({
    where: { email: "cliente.demo@dwayautocare.do" },
    update: {},
    create: {
      email: "cliente.demo@dwayautocare.do",
      passwordHash: clientPasswordHash,
      name: "Carlos Mendoza",
      firstName: "Carlos",
      lastName: "Mendoza",
      phone: "809-555-2040",
      role: "CLIENT",
      termsAcceptedAt: new Date(),
    },
  });

  const demoAddress =
    (await prisma.address.findFirst({ where: { userId: demoClient.id } })) ??
    (await prisma.address.create({
      data: {
        userId: demoClient.id,
        label: "Oficina Piantini",
        province: "Distrito Nacional",
        municipality: "Santo Domingo de Guzmán",
        sector: "Piantini",
        street: "Calle Agustín Lara",
        number: "48, Torre Empresarial",
        reference: "Frente al parqueo corporativo, nivel 1",
        additionalInstructions: "Preguntar en garita por Carlos Mendoza.",
        isDefault: true,
      },
    }));

  const vehicle1 = await prisma.vehicle.upsert({
    where: { plate: "A948210" },
    update: {},
    create: {
      clientId: demoClient.id,
      brand: "Toyota",
      model: "Corolla LE",
      year: 2021,
      plate: "A948210",
      color: "Gris Metálico",
      fuelType: "GASOLINA",
      mileage: 54200,
      lastMaintenanceDate: new Date("2026-09-10T10:00:00-04:00"),
      notes: "Vehículo de uso diario en ciudad.",
    },
  });

  const vehicle2 = await prisma.vehicle.upsert({
    where: { plate: "G612045" },
    update: {},
    create: {
      clientId: demoClient.id,
      brand: "Honda",
      model: "CR-V EX",
      year: 2022,
      plate: "G612045",
      color: "Blanco Perla",
      fuelType: "GASOLINA",
      mileage: 38900,
      lastMaintenanceDate: new Date("2026-08-20T14:00:00-04:00"),
      notes: "SUV familiar para viajes de fin de semana.",
    },
  });

  const confortPlan = await prisma.membershipPlan.findUnique({ where: { slug: "confort" } });
  let demoSubscription = await prisma.subscription.findFirst({
    where: { clientId: demoClient.id, status: "ACTIVE" },
  });

  if (!demoSubscription && confortPlan) {
    demoSubscription = await prisma.subscription.create({
      data: {
        clientId: demoClient.id,
        vehicleId: vehicle1.id,
        planId: confortPlan.id,
        billingCycle: "MONTHLY",
        status: "ACTIVE",
        startDate: new Date("2026-09-01T08:00:00-04:00"),
        endDate: new Date("2027-09-01T23:59:59-04:00"),
        autoRenew: true,
        reviewsUsed: 1,
        batteryTestsUsed: 0,
        diagnosticsUsed: 0,
        oilChangesUsed: 0,
      },
    });

    await prisma.payment.create({
      data: {
        subscriptionId: demoSubscription.id,
        clientId: demoClient.id,
        amount: 708,
        taxAmount: 108,
        status: "PAID",
        method: "DEMO",
        reference: "DEMO-MEM-2026-001",
        isDemoPayment: true,
        notes: "Pago inicial membresía Confort (entorno de demostración)",
      },
    });
  }

  // Cita completada + historial de mantenimiento real
  const oilService = await prisma.service.findUnique({
    where: { slug: "cambio-aceite-semisintetico" },
  });
  const reviewService = await prisma.service.findUnique({
    where: { slug: "revision-preventiva-20-puntos" },
  });
  const liftResource = await prisma.workshopResource.findFirst({
    where: { type: "HYDRAULIC_LIFT" },
  });
  const bayResource = await prisma.workshopResource.findFirst({
    where: { type: "SERVICE_BAY" },
  });
  const mobileUnit = await prisma.mobileUnit.findFirst();

  const pastAppt = await prisma.appointment.findUnique({
    where: { bookingCode: "DWA-2026-000001" },
  });

  if (!pastAppt && oilService && reviewService && bayResource) {
    const completedDate = new Date("2026-09-10T09:30:00-04:00");
    const completedEnd = new Date("2026-09-10T10:55:00-04:00");

    const createdPast = await prisma.appointment.create({
      data: {
        bookingCode: "DWA-2026-000001",
        clientId: demoClient.id,
        vehicleId: vehicle1.id,
        mode: "WORKSHOP",
        appointmentDate: completedDate,
        endDate: completedEnd,
        estimatedDuration: 85,
        status: "COMPLETED",
        technicianId: techBay.id,
        resourceId: bayResource.id,
        subscriptionId: demoSubscription?.id ?? null,
        membershipBenefitUsed: "REVIEW",
        subtotalAmount: 4000,
        discountAmount: 1480,
        travelFee: 0,
        taxAmount: 453.6,
        totalAmount: 2973.6,
        notes: "Primer mantenimiento preventivo en centro DWay.",
        appointmentServices: {
          create: [
            {
              serviceId: oilService.id,
              price: 2800,
              duration: 45,
              usedMembershipBenefit: false,
            },
            {
              serviceId: reviewService.id,
              price: 1200,
              duration: 40,
              usedMembershipBenefit: true,
            },
          ],
        },
        statusHistory: {
          create: [
            {
              status: "PENDING_CONFIRMATION",
              changedById: demoClient.id,
              changedAt: new Date("2026-09-09T14:00:00-04:00"),
              notes: "Reserva creada por el cliente desde el portal web.",
            },
            {
              status: "CONFIRMED",
              changedById: techChiefUser.id,
              changedAt: new Date("2026-09-09T14:15:00-04:00"),
              notes: "Cita confirmada y técnico asignado.",
            },
            {
              status: "CLIENT_RECEIVED",
              changedById: techBayUser.id,
              changedAt: completedDate,
              notes: "Recepción del vehículo con orden firmada.",
            },
            {
              status: "IN_PROGRESS",
              changedById: techBayUser.id,
              changedAt: new Date("2026-09-10T09:40:00-04:00"),
              notes: "Ejecución de cambio de aceite y revisión 20 puntos.",
            },
            {
              status: "COMPLETED",
              changedById: techChiefUser.id,
              changedAt: completedEnd,
              notes: "Control de calidad aprobado por jefe de taller.",
            },
          ],
        },
      },
    });

    await prisma.maintenanceRecord.create({
      data: {
        appointmentId: createdPast.id,
        vehicleId: vehicle1.id,
        clientId: demoClient.id,
        technicianId: techBay.id,
        receiptNumber: "COMP-DWA-2026-000001",
        serviceDate: completedDate,
        mileageAtService: 54200,
        servicesPerformed: JSON.stringify([
          "Cambio de aceite semisintético y filtro",
          "Inspección preventiva de 20 puntos (beneficio membresía Confort)",
        ]),
        productsUsed: JSON.stringify([
          "4 L Aceite semisintético 5W-30 API SP",
          "1 Filtro de aceite OEM Toyota",
          "Consumibles de limpieza y arandela de tapón",
        ]),
        checklistJson: JSON.stringify({
          fugasRevisadas: true,
          nivelesVerificados: true,
          taponesAjustados: true,
          areaLimpia: true,
          piezasMostradas: true,
        }),
        totalCost: 2973.6,
        observations:
          "Motor sin fugas visibles. Pastillas de freno delanteras con aproximadamente 65% de vida útil. Batería en 12.6V.",
        recommendations:
          "Realizar próximo cambio de aceite semisintético a los 59,200 km o dentro de 3 meses.",
        nextServiceDate: new Date("2026-12-10T09:30:00-04:00"),
        nextServiceMileage: 59200,
        warrantyExpiresAt: new Date("2026-10-10T23:59:59-04:00"),
      },
    });

    await prisma.payment.create({
      data: {
        appointmentId: createdPast.id,
        clientId: demoClient.id,
        amount: 2973.6,
        taxAmount: 453.6,
        status: "PAID",
        method: "TARJETA",
        reference: "DEMO-PAY-000001",
        isDemoPayment: true,
        notes: "Pago de servicio en taller (demostración)",
      },
    });
  }

  // Cita futura confirmada (próximo día hábil a las 10:00 AM en RD)
  const futureAppt = await prisma.appointment.findUnique({
    where: { bookingCode: "DWA-2026-000002" },
  });

  if (!futureAppt && oilService && mobileUnit) {
    // Buscar próximo día hábil (lunes-viernes) a partir de mañana
    const target = new Date();
    target.setDate(target.getDate() + 2);
    while (target.getDay() === 0 || target.getDay() === 6) {
      target.setDate(target.getDate() + 1);
    }
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const d = String(target.getDate()).padStart(2, "0");
    const futureStart = new Date(`${y}-${m}-${d}T10:00:00-04:00`);
    const futureEnd = new Date(`${y}-${m}-${d}T10:45:00-04:00`);

    await prisma.appointment.create({
      data: {
        bookingCode: "DWA-2026-000002",
        clientId: demoClient.id,
        vehicleId: vehicle2.id,
        addressId: demoAddress.id,
        mode: "HOME_SERVICE",
        appointmentDate: futureStart,
        endDate: futureEnd,
        estimatedDuration: 45,
        status: "CONFIRMED",
        technicianId: techMobile.id,
        mobileUnitId: mobileUnit.id,
        subtotalAmount: 2800,
        discountAmount: 0,
        travelFee: 500,
        taxAmount: 594,
        totalAmount: 3894,
        notes: "Parqueo techado plano en nivel 1 de la torre.",
        appointmentServices: {
          create: [
            {
              serviceId: oilService.id,
              price: 2800,
              duration: 45,
              usedMembershipBenefit: false,
            },
          ],
        },
        statusHistory: {
          create: [
            {
              status: "PENDING_CONFIRMATION",
              changedById: demoClient.id,
              notes: "Cita a domicilio solicitada por el cliente.",
            },
            {
              status: "CONFIRMED",
              changedById: techChiefUser.id,
              notes: "Unidad móvil #01 y técnico José Luis Santana asignados.",
            },
          ],
        },
      },
    });
  }

  // 10. Empresa y Contrato Empresarial Demo (Tabla 10: Flota Básica)
  const demoCompany = await prisma.company.upsert({
    where: { rnc: "131948271" },
    update: {},
    create: {
      name: "Mensajería Express del Caribe S.R.L.",
      rnc: "131948271",
      contactName: "Ricardo Valenzuela",
      contactEmail: "flota@mensajeriaexpress.do",
      contactPhone: "809-555-4410",
      vehicleCount: 6,
      vehicleTypes: JSON.stringify(["Camionetas ligeras", "Sedanes utilitarios"]),
      servicesRequired: JSON.stringify([
        "Cambio de aceite semisintético y filtro",
        "Inspección preventiva de 20 puntos",
        "Prueba de batería y sistema de carga",
      ]),
      estimatedFrequency: "Trimestral (4 visitas al año por vehículo)",
      notes: "Flota opera en Piantini y Naco. Requiere visita móvil en parqueo central.",
      status: "ACTIVE",
    },
  });

  const existingContract = await prisma.corporateContract.findUnique({
    where: { contractCode: "CONT-FLOTA-2026-001" },
  });

  if (!existingContract) {
    await prisma.corporateContract.create({
      data: {
        companyId: demoCompany.id,
        contractCode: "CONT-FLOTA-2026-001",
        planName: "Flota Básica",
        monthlyFeePerVehicle: 1500, // + ITBIS = RD$1,770/vehículo
        vehicleCount: 6,
        discountPercent: 10,
        includedVisitsPerYear: 4,
        startDate: new Date("2026-10-01T08:00:00-04:00"),
        endDate: new Date("2027-10-01T23:59:59-04:00"),
        paymentTermsDays: 30,
        status: "ACTIVE",
        notes:
          "Incluye 4 visitas anuales con aceite semisintético, revisión preventiva y 2 pruebas de batería por vehículo en instalaciones del cliente.",
      },
    });
  }

  // Notificación inicial de demostración para Carlos Mendoza
  await prisma.notification.upsert({
    where: { dedupeKey: "seed-welcome-demo-client:INTERNAL" },
    update: {},
    create: {
      userId: demoClient.id,
      type: "APPOINTMENT_CONFIRMED",
      channel: "INTERNAL",
      title: "Cita DWA-2026-000002 confirmada",
      body: "Tu cita de servicio a domicilio para tu Honda CR-V EX ha sido confirmada con la Unidad Móvil DWay #01.",
      deliveryStatus: "DELIVERED",
      sentAt: new Date(),
      dedupeKey: "seed-welcome-demo-client:INTERNAL",
    },
  });

  // Referencia para evitar warning de variable sin usar si liftResource se utiliza más adelante
  void liftResource;

  console.log("Seed de DWay AutoCare completado con éxito.");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
