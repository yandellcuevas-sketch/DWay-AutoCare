import { z } from "zod";

export const RD_PHONE_REGEX = /^(\+?1[-.\s]?)?(809|829|849)[-.\s]?\d{3}[-.\s]?\d{4}$/;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Ingresa tu nombre (mínimo 2 caracteres).").max(60),
    lastName: z.string().trim().min(2, "Ingresa tus apellidos (mínimo 2 caracteres).").max(80),
    email: z.string().trim().email("Ingresa un correo electrónico válido.").toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(
        RD_PHONE_REGEX,
        "Ingresa un teléfono válido de República Dominicana (ej. 809-555-1234)."
      ),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(100),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar los términos y la política de privacidad." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(2, "Nombre requerido.").max(60),
  lastName: z.string().trim().min(2, "Apellidos requeridos.").max(80),
  phone: z
    .string()
    .trim()
    .regex(RD_PHONE_REGEX, "Teléfono dominicano inválido (ej. 809-555-1234)."),
});

export const vehicleSchema = z.object({
  brand: z.string().trim().min(2, "Marca requerida.").max(50),
  model: z.string().trim().min(1, "Modelo requerido.").max(60),
  year: z.coerce
    .number()
    .int()
    .min(1985, "Año mínimo permitido: 1985.")
    .max(new Date().getFullYear() + 1, "Año inválido."),
  plate: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Placa requerida (ej. A948210).")
    .max(12),
  color: z.string().trim().min(2, "Color requerido.").max(30),
  fuelType: z.enum(["GASOLINA", "DIESEL", "ELECTRICO", "HIBRIDO", "GLP"]),
  mileage: z.coerce.number().int().min(0, "Kilometraje inválido.").max(2000000),
  lastMaintenanceDate: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const addressSchema = z.object({
  label: z.string().trim().min(2, "Etiqueta requerida (ej. Casa, Oficina).").max(50),
  province: z.string().trim().min(2, "Provincia requerida.").max(60),
  municipality: z.string().trim().min(2, "Municipio requerido.").max(60),
  sector: z.string().trim().min(2, "Sector requerido.").max(80),
  street: z.string().trim().min(2, "Calle requerida.").max(120),
  number: z.string().trim().min(1, "Número requerido.").max(30),
  reference: z.string().trim().max(200).optional().nullable(),
  additionalInstructions: z.string().trim().max(300).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const createAppointmentSchema = z.object({
  vehicleId: z.string().min(1, "Selecciona un vehículo."),
  serviceIds: z.array(z.string().min(1)).min(1, "Selecciona al menos un servicio."),
  mode: z.enum(["WORKSHOP", "HOME_SERVICE"]),
  addressId: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD)."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:MM)."),
  notes: z.string().trim().max(500).optional().nullable(),
  useMembershipBenefit: z.boolean().optional(),
  promotionCode: z.string().trim().max(30).optional().nullable(),
  clientIdOverride: z.string().optional().nullable(), // Solo para staff (admin/recepción)
});

export const companyInquirySchema = z.object({
  name: z.string().trim().min(2, "Nombre de la empresa requerido.").max(120),
  rnc: z
    .string()
    .trim()
    .regex(/^\d{9}(\d{2})?$/, "El RNC debe tener 9 u 11 dígitos numéricos sin guiones."),
  contactName: z.string().trim().min(2, "Persona de contacto requerida.").max(100),
  contactEmail: z.string().trim().email("Correo electrónico inválido.").toLowerCase(),
  contactPhone: z
    .string()
    .trim()
    .regex(RD_PHONE_REGEX, "Teléfono dominicano inválido (ej. 809-555-1234)."),
  vehicleCount: z.coerce
    .number()
    .int()
    .min(1, "Indica la cantidad de vehículos.")
    .max(5000),
  vehicleTypes: z.array(z.string()).min(1, "Selecciona al menos un tipo de vehículo."),
  servicesRequired: z.array(z.string()).min(1, "Selecciona al menos un servicio requerido."),
  estimatedFrequency: z.string().trim().min(2, "Selecciona una frecuencia.").max(60),
  notes: z.string().trim().max(800).optional().nullable(),
});

export const maintenanceRecordSchema = z.object({
  appointmentId: z.string().min(1),
  mileageAtService: z.coerce.number().int().min(0),
  servicesPerformed: z.array(z.string().min(1)).min(1),
  productsUsed: z.array(z.string()).optional(),
  checklist: z
    .object({
      fugasRevisadas: z.boolean().default(true),
      nivelesVerificados: z.boolean().default(true),
      taponesAjustados: z.boolean().default(true),
      areaLimpia: z.boolean().default(true),
      piezasMostradas: z.boolean().default(true),
    })
    .optional(),
  totalCost: z.coerce.number().min(0),
  observations: z.string().trim().max(1000).optional().nullable(),
  recommendations: z.string().trim().max(1000).optional().nullable(),
  nextServiceDate: z.string().optional().nullable(),
  nextServiceMileage: z.coerce.number().int().min(0).optional().nullable(),
});
