# SmartTable — Gestión de mesas por QR

Sistema profesional para restaurantes: cada mesa tiene su propio QR. El comensal lo escanea
y puede **llamar al mozo** o **pedir la cuenta** al instante, sin instalar nada. Las alertas
llegan en tiempo real al panel del restaurante, que muestra el estado de todas las mesas.

La aplicación vive en [`control-mesas/`](./control-mesas), junto a su configuración, migraciones y tests.

## Funcionalidades

- **Panel en tiempo real**: estado de cada mesa (libre, ocupada, alerta) actualizado por Supabase Realtime.
- **Vista del comensal** (`/m/[id]`): pantalla con el logo y los colores del restaurante para llamar al mozo o pedir la cuenta.
- **QR estáticos** por mesa, listos para imprimir.
- **Múltiples sucursales** por restaurante, con numeración de mesas independiente por local.
- **Configuración de marca**: logo y colores por restaurante (storage + theming).
- **Panel de administración** (`/admin`) para crear y gestionar restaurantes, sus sucursales y sus mesas.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Backend | Supabase — Auth, PostgreSQL con RLS, Realtime, Storage (bucket `logos`) |
| Testing | Vitest (unit/componentes) + Playwright (e2e) |

## Estructura del proyecto

```
control-mesas/app/
  page.tsx                    Landing pública
  login/                      Acceso al panel
  reset-password/             Recuperación de contraseña
  configurar-restaurante/     Onboarding / selector de marcas
  admin/                      Panel de administración (crear/gestionar restaurantes)
  dashboard/[restauranteID]/  Tablero de mesas, QRs, sucursales y configuración
  m/[id]/                     Vista pública del comensal (QR)
  api/admin/restaurantes/     API de administración (CRUD restaurantes, sucursales, mesas, logos)
control-mesas/src/lib/
  supabase.ts                 Cliente Supabase (browser)
  supabase-server.ts          Cliente Supabase (server components / RSC)
  supabase-admin.ts           Cliente con service role (solo API interna)
  database.types.ts           Tipos generados de la base de datos
  admin.ts                    Identificación del administrador de la plataforma
  useProtegerAdmin.ts         Hook de protección de rutas de admin
  useProtegerRestaurante.ts   Hook de protección de rutas de dashboard
control-mesas/supabase/migrations/   Migraciones SQL (esquema, RPCs, RLS, realtime, storage)
control-mesas/e2e/            Test de flujo completo (Playwright)
```

## Roles

- **Administrador de plataforma**: desde el email configurado en `control-mesas/src/lib/admin.ts` (`ADMIN_EMAIL`)
  el login redirige a `/admin`, donde puede crear restaurantes, sucursales y mesas.
- **Usuario de restaurante**: cuenta registrada que posee uno o varios restaurantes; el login
  lo lleva a `/dashboard/{restauranteId}` (o al selector si tiene varias marcas).

## Requisitos

- Node.js 18+ y npm
- Proyecto de Supabase (hosteado o local con la CLI de Supabase)

## Puesta en marcha

```bash
cd control-mesas
npm install
```

1. Configurar las variables de entorno (ver [Variables de entorno](#variables-de-entorno))
   en un archivo `.env.local` dentro de `control-mesas/`.

2. Aplicar el esquema de la base de datos (si la base está vacía):

   ```bash
   supabase link --project-ref <tu-proyecto>
   supabase db push
   ```

   Para desarrollo local con la CLI:

   ```bash
   supabase start
   ```

3. Levantar el servidor:

   ```bash
   npm run dev
   ```

4. (Opcional) Regenerar los tipos de la base de datos después de cambios en el esquema:

   ```bash
   supabase gen types typescript --project-id <tu-proyecto> > src/lib/database.types.ts
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo backend, no exponer) | `eyJhbGci...` |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (para links de recuperación) | `https://app.smarttable.com` |

Solo para tests e2e:

| Variable | Descripción |
|----------|-------------|
| `E2E_BASE_URL` | URL base (si no se define, levanta `npm run dev` automáticamente) |
| `E2E_EMAIL` / `E2E_PASSWORD` | Credenciales de una cuenta de prueba |

## Scripts

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # ESLint
npm test             # Tests unitarios (Vitest)
npm run test:watch   # Vitest en modo watch
npm run test:e2e     # Tests end-to-end (Playwright)
```