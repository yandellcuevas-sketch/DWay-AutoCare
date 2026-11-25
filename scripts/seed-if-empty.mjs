import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const prisma = new PrismaClient();

async function main() {
  const existingUsers = await prisma.user.count();
  const existingServices = await prisma.service.count();
  const existingAppointments = await prisma.appointment.count();

  if (existingUsers > 0 && existingServices > 0) {
    console.log(
      `Base de datos ya inicializada (${existingUsers} usuarios, ${existingServices} servicios, ${existingAppointments} citas). Se preservan todos los registros existentes sin sobrescribir.`
    );
    return;
  }

  if (
    !process.env.SEED_ADMIN_PASSWORD ||
    !process.env.SEED_STAFF_PASSWORD ||
    !process.env.SEED_CLIENT_PASSWORD
  ) {
    console.log(
      "Omitiendo inicializacion automatica de seed (SEED_*_PASSWORD no definidas)."
    );
    return;
  }

  console.log("Base de datos vacia detectada. Ejecutando inicializacion inicial segura...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}

main()
  .catch((err) => {
    console.error("Error verificando inicializacion:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
