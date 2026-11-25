import { prisma } from "./prisma";

export type NotificationPayload = {
  userId: string;
  type:
    | "ACCOUNT_CREATED"
    | "APPOINTMENT_CONFIRMED"
    | "APPOINTMENT_REMINDER"
    | "APPOINTMENT_RESCHEDULED"
    | "APPOINTMENT_CANCELLED"
    | "STATUS_CHANGE"
    | "SERVICE_COMPLETED"
    | "MAINTENANCE_DUE"
    | "MEMBERSHIP_EXPIRING";
  title: string;
  body: string;
  dedupeKey?: string;
  dispatchExternal?: boolean;
};

/**
 * Crea la notificación interna en la base de datos y registra el estado real
 * de los canales configurables (EMAIL / WHATSAPP) sin simular envíos falsos.
 */
export async function createSystemNotification(payload: NotificationPayload) {
  const internalDedupe = payload.dedupeKey ? `${payload.dedupeKey}:INTERNAL` : undefined;

  if (internalDedupe) {
    const existing = await prisma.notification.findUnique({
      where: { dedupeKey: internalDedupe },
    });
    if (existing) {
      return existing;
    }
  }

  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      channel: "INTERNAL",
      title: payload.title,
      body: payload.body,
      deliveryStatus: "DELIVERED",
      sentAt: new Date(),
      dedupeKey: internalDedupe,
    },
  });

  if (payload.dispatchExternal) {
    const emailConfigured = Boolean(
      process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM_ADDRESS
    );
    const whatsappConfigured = Boolean(
      process.env.WHATSAPP_PROVIDER_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
    );

    const channels: Array<{
      channel: "EMAIL" | "WHATSAPP";
      configured: boolean;
    }> = [
      { channel: "EMAIL", configured: emailConfigured },
      { channel: "WHATSAPP", configured: whatsappConfigured },
    ];

    for (const ch of channels) {
      const chDedupe = payload.dedupeKey ? `${payload.dedupeKey}:${ch.channel}` : undefined;
      if (chDedupe) {
        const dup = await prisma.notification.findUnique({ where: { dedupeKey: chDedupe } });
        if (dup) continue;
      }

      // Nota de transparencia: si el proveedor externo no está configurado en variables de entorno,
      // se registra NOT_CONFIGURED en lugar de simular un envío exitoso.
      await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          channel: ch.channel,
          title: payload.title,
          body: payload.body,
          deliveryStatus: ch.configured ? "PENDING_PROVIDER" : "NOT_CONFIGURED",
          providerResponse: ch.configured
            ? "En cola para despacho por proveedor autorizado."
            : `Canal ${ch.channel} no configurado en variables de entorno (.env).`,
          dedupeKey: chDedupe,
          isRead: true, // Evita duplicar la bandeja visual del cliente; queda en historial de envíos
        },
      });
    }
  }

  return notification;
}
