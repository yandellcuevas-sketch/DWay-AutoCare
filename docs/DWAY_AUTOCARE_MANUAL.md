# DWay AutoCare — Guía de Despliegue Local, Respaldo y Auditoría Técnica

## 1. Identidad Corporativa Oficial
- **Marca:** DWay AutoCare
- **Lema:** «Tú eliges dónde, nosotros cuidamos tu vehículo»
- **Logotipo oficial:** Almacenado íntegramente en `public/images/branding/dway-logo-original.jpg`, acompañado de derivados limpios sin alterar colores ni proporciones (`dway-logo-cropped.png`, `dway-logo-transparent.png`) e isotipo favicon (`public/icons/icon.png` / `src/app/icon.png`).
- **Paleta oficial:** Rojo corporativo `#F50923`, Gris grafito `#1E2127`, Blanco `#FAFAFA`, Gris secundario `#424750`.
- **Tipografía:** `Montserrat` (400, 500, 600, 700, 800) servida 100% localmente desde `src/app/fonts/` mediante `next/font/local` (cero dependencia de Internet).

## 2. Arquitectura Organizada
```
dway-autocare/
├── docs/                           # Documentación operativa
├── prisma/                         # Esquema SQLite (schema.prisma), seed no destructivo y dev.db
├── public/
│   ├── fonts/                      # Fuentes locales Montserrat .woff2
│   ├── icons/                      # Favicon e íconos adaptados del isotipo oficial
│   └── images/
│       ├── branding/               # Logotipo oficial original y versión transparente
│       ├── workshop/               # Fotografías conceptuales del centro físico
│       ├── mobile-service/         # Fotografías conceptuales de la unidad móvil
│       ├── services/               # Fotografías preventivas (aceite, frenos, diagnóstico)
│       └── memberships/            # Banner editorial de membresías
├── scripts/                        # Respaldo y restauración automatizada SQLite
├── src/                            # Código fuente Next.js 14 + Prisma + NextAuth
└── tests/                          # Suite integral de auditoría y E2E Playwright
```

## 3. Reglas del Plan de Negocios Implementadas
- **Servicios:** 10 servicios preventivos con tarifas exactas en RD$ (taller y domicilio por separado) + ITBIS (18%) desglosado.
- **Restricciones:** Frenos y purgado de fluidos habilitados únicamente en taller (requieren elevador hidráulico). Excluye reparaciones mayores de motor o transmisión.
- **Atención a domicilio:** Ventana estimada de llegada +/- 1 hora, requisito de espacio plano/seguro, recargo transparente para sectores extendidos fuera del Distrito Nacional.
- **Membresías (`Esencial`, `Confort`, `Premium Domicilio`):** Cuotas mensuales/anuales exactas, beneficios anuales rastreados por vehículo y aplicación de descuento restringida a modalidad elegible (`Centro` vs. `Domicilio`), permanencia 12 meses en modalidad mensual.
- **Promociones:** Códigos activos `SOCIOFUNDADOR` (5% Socios Fundadores, tarifa congelada 12 meses) y `REFERIDO5` (5% Programa de Referidos).
- **Empresas:** Plan «Flota Básica» desde 5 vehículos (RD$1,500 + ITBIS/vehículo), crédito a 30 días, 10%–15% de descuento por volumen y primera revisión preventiva de evaluación sin costo.
- **Garantía y Horarios:** 30 días sobre mano de obra; Lunes a Viernes 8:00 a. m.–5:00 p. m., Sábados 8:00 a. m.–1:00 p. m., domingos y feriados nacionales cerrado.

## 4. Cuentas Iniciales y Seguridad
Las cuentas administrativas, técnicas y de recepción se crean al inicializar la base de datos mediante las variables de entorno `SEED_ADMIN_PASSWORD`, `SEED_STAFF_PASSWORD` y `SEED_CLIENT_PASSWORD` definidas de forma privada en `.env` (local) o en Render Environment Variables (producción):
- Administrador: `admin@dwayautocare.do`
- Recepción: `recepcion@dwayautocare.do`
- Jefe de Taller / Técnicos: `jefe.taller@dwayautocare.do`, `tecnico.taller@dwayautocare.do`, `tecnico.movil@dwayautocare.do`
- Cliente de demostración local: `cliente.demo@dwayautocare.do`

Ninguna contraseña real debe versionarse en GitHub.

## 5. Despliegue Dual (SQLite Local + Neon PostgreSQL / Render Free)
- **Modo local (presentación sin Internet):** Utiliza `prisma/schema.prisma` (`provider = "sqlite"`) contra `prisma/dev.db`, fuentes locales en `src/app/fonts/` y acceso vía `http://localhost:3000` o red local.
- **Modo nube pública (Neon PostgreSQL + Render):** Utiliza `prisma/postgres/schema.prisma` y migraciones en `prisma/postgres/migrations/`, activado automáticamente por `scripts/prepare-db-schema.mjs` cuando `DATABASE_URL` apunta a `postgresql://`.
- **Auditoría automatizada:** Configura `E2E_CLIENT_EMAIL`, `E2E_CLIENT_PASSWORD`, `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD` en tu entorno local y ejecuta `node tests/e2e-audit.mjs`.
