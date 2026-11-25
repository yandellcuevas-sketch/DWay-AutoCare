import fs from "fs";
import path from "path";

const root = process.cwd();
const dbPath = path.join(root, "prisma", "dev.db");
const backupsDir = path.join(root, "backups");

const targetArg = process.argv[2];

if (!fs.existsSync(backupsDir)) {
  console.error("No existe la carpeta de respaldos:", backupsDir);
  process.exit(1);
}

const files = fs
  .readdirSync(backupsDir)
  .filter((f) => f.endsWith(".db"))
  .sort()
  .reverse();

if (files.length === 0) {
  console.error("No hay archivos de respaldo .db en", backupsDir);
  process.exit(1);
}

const chosen = targetArg
  ? path.isAbsolute(targetArg)
    ? targetArg
    : path.join(backupsDir, targetArg)
  : path.join(backupsDir, files[0]);

if (!fs.existsSync(chosen)) {
  console.error("El archivo de respaldo especificado no existe:", chosen);
  process.exit(1);
}

if (fs.existsSync(dbPath)) {
  const safetyPath = path.join(backupsDir, `pre-restore-${Date.now()}.db`);
  fs.copyFileSync(dbPath, safetyPath);
  console.log("Copia de seguridad previa creada en:", safetyPath);
}

fs.copyFileSync(chosen, dbPath);
console.log("Base de datos restaurada exitosamente desde:", chosen);
