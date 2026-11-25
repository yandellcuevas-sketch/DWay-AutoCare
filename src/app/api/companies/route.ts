import { NextResponse } from "next/server";
import { getAuthSession, isAdminOrReceptionist } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companyInquirySchema } from "@/lib/validations";
import { createSystemNotification } from "@/lib/notifications";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminOrReceptionist(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const companies = await prisma.company.findMany({
    include: {
      contracts: { orderBy: { createdAt: "desc" } },
      vehicles: true,
      appointments: {
        orderBy: { appointmentDate: "desc" },
        take: 10,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    companies: companies.map((c) => ({
      ...c,
      contracts: c.contracts.map((ct) => ({
        ...ct,
        monthlyFeePerVehicle: Number(ct.monthlyFeePerVehicle),
      })),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = companyInquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Datos de la empresa inválidos.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const existingByRnc = await prisma.company.findUnique({ where: { rnc: d.rnc } });

    const company = existingByRnc
      ? await prisma.company.update({
          where: { id: existingByRnc.id },
          data: {
            name: d.name,
            contactName: d.contactName,
            contactEmail: d.contactEmail,
            contactPhone: d.contactPhone,
            vehicleCount: d.vehicleCount,
            vehicleTypes: JSON.stringify(d.vehicleTypes),
            servicesRequired: JSON.stringify(d.servicesRequired),
            estimatedFrequency: d.estimatedFrequency,
            notes: d.notes ?? null,
            status: existingByRnc.status === "ARCHIVED" ? "PENDING" : existingByRnc.status,
          },
        })
      : await prisma.company.create({
          data: {
            name: d.name,
            rnc: d.rnc,
            contactName: d.contactName,
            contactEmail: d.contactEmail,
            contactPhone: d.contactPhone,
            vehicleCount: d.vehicleCount,
            vehicleTypes: JSON.stringify(d.vehicleTypes),
            servicesRequired: JSON.stringify(d.servicesRequired),
            estimatedFrequency: d.estimatedFrequency,
            notes: d.notes ?? null,
            status: "PENDING",
          },
        });

    // Notificar a administradores
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "RECEPTIONIST"] }, isActive: true },
      select: { id: true },
    });

    await Promise.all([
      ...admins.map((admin) =>
        createSystemNotification({
          userId: admin.id,
          type: "STATUS_CHANGE",
          title: `Nueva solicitud empresarial: ${company.name}`,
          body: `RNC ${company.rnc} · ${d.vehicleCount} vehículos · Contacto: ${d.contactName} (${d.contactPhone}).`,
          dedupeKey: `company-req-${company.id}-${Date.now()}`,
        })
      ),
      prisma.auditLog.create({
        data: {
          action: "COMPANY_INQUIRY_SUBMITTED",
          entityType: "Company",
          entityId: company.id,
          details: `Oportunidad comercial registrada: ${company.name} (RNC ${company.rnc}, ${d.vehicleCount} vehículos).`,
        },
      }),
    ]);

    return NextResponse.json(
      {
        message:
          "Solicitud empresarial registrada correctamente. Nuestro equipo comercial te contactará para coordinar la evaluación gratuita de tu flota.",
        company,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/companies:", error);
    return NextResponse.json(
      { error: "No se pudo registrar la solicitud empresarial." },
      { status: 500 }
    );
  }
}
