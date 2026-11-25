import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
let playwrightCore;
try {
  playwrightCore = require("playwright-core");
} catch {
  playwrightCore = require(
    "C:\\Users\\yande\\.gemini\\antigravity\\brain\\f4f45f6b-205d-46cb-9f76-6103a3ea57e9\\scratch\\e2e\\node_modules\\playwright-core"
  );
}
const { chromium } = playwrightCore;

const BASE_URL = process.env.SHOT_BASE_URL || "http://127.0.0.1:3005";
const OUT_DIR = "c:\\Users\\yande\\Downloads\\DWay Web\\capturas-finales";
const CLIENT_EMAIL = process.env.E2E_CLIENT_EMAIL || "cliente.demo@dwayautocare.do";
const CLIENT_PASS = process.env.E2E_CLIENT_PASSWORD || "";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@dwayautocare.do";
const ADMIN_PASS = process.env.E2E_ADMIN_PASSWORD || "";
fs.mkdirSync(OUT_DIR, { recursive: true });

async function settleAndShot(page, filename, fullPage = false) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(450);
  const outPath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: outPath, fullPage });
  console.log(`📸 ${filename} guardado (${outPath})`);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
      locale: "es-DO",
    });
    const page = await context.newPage();

    // 1. Página principal
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await settleAndShot(page, "01-pagina-principal.png", false);

    // 2. Catálogo de servicios
    await page.goto(`${BASE_URL}/servicios`, { waitUntil: "networkidle" });
    await settleAndShot(page, "02-servicios-catalogo.png", false);

    // 3. Membresías y tabla comparativa
    await page.goto(`${BASE_URL}/membresias`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await settleAndShot(page, "03-membresias-comparativa.png", true);

    // 4. Empresas y flotas
    await page.goto(`${BASE_URL}/empresas`, { waitUntil: "networkidle" });
    await settleAndShot(page, "04-empresas-flotas.png", false);

    // 5. Registro de clientes
    await page.goto(`${BASE_URL}/auth/registro`, { waitUntil: "networkidle" });
    await settleAndShot(page, "05-registro-clientes.png", false);

    // 6. Login de cuentas
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });
    await settleAndShot(page, "06-login-cuentas.png", false);

    // Iniciar sesión como Cliente Demo (Carlos Mendoza)
    await page.fill("#login-email", CLIENT_EMAIL);
    await page.fill("#login-password", CLIENT_PASS);
    await Promise.all([
      page.waitForURL("**/portal", { timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("text=¡Hola, Carlos!", { timeout: 10000 });

    // 10. Portal del cliente
    await settleAndShot(page, "10-portal-cliente.png", false);

    // 11. Comprobante oficial de mantenimiento
    await page.click('button:has-text("Consultar historial")');
    await page.waitForSelector('button:has-text("Comprobante")', { timeout: 10000 });
    await page.click('button:has-text("Comprobante")');
    await page.waitForSelector("#dlg-rcpt-title", { timeout: 10000 });
    await settleAndShot(page, "11-comprobante-mantenimiento.png", false);
    await page.click('dialog[open] button:has-text("Cerrar")');

    // 7, 8, 9: Agendar flujo con Carlos Mendoza
    await page.goto(`${BASE_URL}/agendar`, { waitUntil: "networkidle" });
    await page.waitForSelector("text=A948210", { timeout: 10000 });
    await settleAndShot(page, "07-agendar-vehiculo.png", false);

    // Siguiente -> Servicios
    await page.click('button:has-text("Siguiente paso")');
    await page.click('label:has-text("Cambio de aceite semisintético y filtro")');
    await page.click('button:has-text("Siguiente paso")');
    // Step 3 -> Taller (para capturar descuento Confort 10%!)
    await page.click('button:has-text("Siguiente paso")');

    // Step 4 -> Calendario disponibilidad y cotización en vivo
    const dayButtons = page.locator("section button:not([disabled])").filter({ hasText: /^\d{1,2}$/ });
    const cnt = await dayButtons.count();
    for (let i = Math.min(2, cnt - 1); i < cnt; i++) {
      await dayButtons.nth(i).click();
      await page.waitForTimeout(450);
      const slots = page.locator("button:has-text('hasta ')");
      if ((await slots.count()) > 0) {
        await slots.first().click();
        break;
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await settleAndShot(page, "08-agendar-calendario-resumen.png", false);

    // Step 5 -> Step 6 Confirmación
    await page.click('button:has-text("Siguiente paso")');
    await page.waitForSelector("text=Total estimado", { timeout: 10000 });
    await page.check('label:has-text("Confirmo que los datos") input[type="checkbox"]');
    await Promise.all([
      page.waitForSelector("text=Código: DWA-", { timeout: 15000 }),
      page.click('button:has-text("Confirmar y reservar cita")'),
    ]);
    await settleAndShot(page, "09-confirmacion-cita.png", false);

    // Cerrar sesión y entrar como Administrador
    await page.click('button[aria-label="Cerrar sesión"]');
    await page.waitForTimeout(600);
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });
    await page.fill("#login-email", ADMIN_EMAIL);
    await page.fill("#login-password", ADMIN_PASS);
    await Promise.all([
      page.waitForURL("**/admin", { timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("text=Panel Administrativo DWay AutoCare", { timeout: 10000 });
    await page.waitForTimeout(800); // Recharts transitions

    // 12. Admin Dashboard con Sidebar 15 secciones
    await settleAndShot(page, "12-admin-dashboard-sidebar.png", false);

    // 13. Admin Calendario Taller vs Domicilio
    await page.locator('aside[aria-label="Navegación administrativa"] button', { hasText: "Calendario" }).click();
    await page.waitForSelector(".fc-daygrid", { timeout: 10000 });
    await settleAndShot(page, "13-admin-calendario-citas.png", false);

    await context.close();

    // 14. Vista móvil responsive (390x844)
    const mContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: "es-DO",
    });
    const mPage = await mContext.newPage();
    await mPage.goto(BASE_URL, { waitUntil: "networkidle" });
    await settleAndShot(mPage, "14-vista-movil.png", false);
    await mContext.close();

    console.log("🎉 LAS 14 CAPTURAS FINALES DE ALTA RESOLUCIÓN FUERON GENERADAS!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("❌ Error capturando pantallas finales:", err);
  process.exit(1);
});
