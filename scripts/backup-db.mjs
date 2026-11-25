import fs from "fs";
import path from "path";

const root = process.cwd();
const dbPath = path.join(root, "prisma", "dev.db");
const backupsDir = path.join(root, "backups");

if (!fs.existsSync(dbPath)) {
  console.error("No se encontró la base de datos en:", dbPath);
  process.exit(1);
}

fs.mkdirSync(backupsDir, { recursive: true });

const now = new Date();
const stamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
  "-",
  String(now.getHours()).padStart(2, "0"),
  String(now.getMinutes()).padStart(2, "0"),
  String(now.getSeconds()).padStart(2, "0"),
].join("");

const dest = path.join(backupsDir, `dway-backup-${stamp}.db`);
fs.copyFileSync(dbPath, dest);
console.log("Respaldo creado exitosamente:", dest);
