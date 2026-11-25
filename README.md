# DWay AutoCare

> «Tú eliges dónde, nosotros cuidamos tu vehículo»

Plataforma web integral para mantenimiento preventivo automotriz en **centro físico** y **unidad móvil a domicilio**, diseñada conforme al Plan de Negocios de **DWay AutoCare**.

## Arquitectura Tecnológica
- **Frontend & Backend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, FullCalendar, Recharts.
- **Autenticación:** NextAuth.js v4 (Credenciales + `bcryptjs` + bloqueo por intentos fallidos + recuperación de contraseña).
- **Base de datos dual con Prisma ORM:**
  - **Entorno local:** SQLite (`prisma/schema.prisma`) para operación sin Internet.
  - **Entorno público:** PostgreSQL en **Neon Free** (`prisma/postgres/schema.prisma` + migraciones en `prisma/postgres/migrations/`) y alojamiento gratuito en **Render Free Web Service** (`render.yaml`).

## Despliegue en Producción (Neon + Render Free)
1. Configura una base de datos gratuita en **Neon** y copia el `DATABASE_URL` (`postgresql://...?sslmode=require`).
2. Ejecuta migraciones de PostgreSQL:
   ```bash
   npx prisma migrate deploy --schema=prisma/postgres/schema.prisma
   ```
3. Inicializa los datos maestros definiendo de forma segura `SEED_ADMIN_PASSWORD`, `SEED_STAFF_PASSWORD` y `SEED_CLIENT_PASSWORD` en el entorno:
   ```bash
   npx tsx prisma/seed.ts
   ```
4. En **Render**, conecta este repositorio y utiliza `render.yaml` o configura:
   - **Build Command:** `npm install && npm run build:render`
   - **Start Command:** `npm run start`
   - **Variables de entorno:** `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_NAME=DWay AutoCare`, `NEXT_PUBLIC_TIMEZONE=America/Santo_Domingo`, `DEFAULT_ITBIS_RATE=0.18`.

Ver detalles operativos completos en [docs/DWAY_AUTOCARE_MANUAL.md](docs/DWAY_AUTOCARE_MANUAL.md).
