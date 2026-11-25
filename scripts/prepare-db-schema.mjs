import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dbUrl = process.env.DATABASE_URL || "";
const isPostgres =
  dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

if (isPostgres) {
  const pgSchema = path.join(root, "prisma", "postgres", "schema.prisma");
  const targetSchema = path.join(root, "prisma", "schema.prisma");
  const pgMigrations = path.join(root, "prisma", "postgres", "migrations");
  const targetMigrations = path.join(root, "prisma", "migrations");

  if (!fs.existsSync(pgSchema)) {
    throw new Error("No se encontró prisma/postgres/schema.prisma.");
  }
  fs.copyFileSync(pgSchema, targetSchema);

  if (fs.existsSync(pgMigrations)) {
    fs.rmSync(targetMigrations, { recursive: true, force: true });
    fs.cpSync(pgMigrations, targetMigrations, { recursive: true });
  }
  console.log("Prisma configurado automáticamente para PostgreSQL (Neon / Render).");
} else {
  console.log("Prisma mantenido en modo SQLite local (prisma/dev.db).");
}
