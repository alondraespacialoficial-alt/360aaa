# Copilot Instructions - Charlitron Eventos 360 Panel

## Project Overview
React/TypeScript event service provider directory for "Charlitron Eventos 360". Built with Vite, Supabase, React Router. Manages suppliers, categories, reviews, analytics, and AI assistant with budget controls.

## Architecture & Critical Data Flows

### Context Hierarchy (App.tsx wrapping order)
```tsx
ErrorBoundary > ThemeProvider > AuthProvider > AIStatusProvider > BrowserRouter
```
- **AIStatusProvider** (`context/AIStatusContext.tsx`): Manages AI enable/disable state globally with Supabase Realtime subscriptions
- **AuthProvider** (`context/AuthContext.tsx`): Supabase Auth session management
- **ThemeProvider** (`context/ThemeContext.tsx`): Dark/light mode toggle

### Route Protection Pattern
- Public routes: Direct component rendering
- Admin routes: Nested under `<Route element={<AdminLayout />}>` which checks `user` from `useAuth()` and redirects to `/admin` login if null
- Example: `/admin/panel`, `/admin/blog`, `/admin/blog-posts` are protected

### Database Schema (Supabase)
**Core Tables:**
- `providers`, `provider_services`, `provider_media`, `provider_categories`, `categories`
- `provider_reviews` (with user authentication via `user_id` FK to `profiles`)
- `provider_analytics` (tracks events: `profile_view`, `whatsapp_click`, `phone_click`, etc.)
- `ai_settings` (single row: `is_enabled`, budget limits, rate limits, welcome message)
- `ai_usage_tracking` (logs AI queries with tokens, cost, processing time)

**Critical RLS Policies:**
- `ai_settings`: Public read access, admin-only modify (check `auth.jwt() ->> 'role' = 'admin'`)
- Analytics: Public insert (anonymous tracking), admin read

### AI Assistant System
**Components:**
- `AIFloatingChat.tsx`: Floating chat bubble (visible app-wide via `App.tsx`)
- `AIAdminPanel.tsx`: Admin toggle & settings for AI (embedded in `/admin/panel`)
- `services/aiAssistant.ts`: Gemini API integration with FAQ cache, rate limiting, budget tracking

**State Management:**
- Uses `useAIStatus()` hook from `AIStatusContext` to reactively enable/disable AI
- Supabase Realtime subscription on `ai_settings` table updates all clients instantly
- To disable AI: `UPDATE ai_settings SET is_enabled = false;` in Supabase SQL Editor

**Budget & Rate Limits:**
- Daily/monthly USD budgets tracked in `ai_usage_tracking.cost_usd`
- Per-minute/hour/day question limits enforced via RPC function checks
- FAQ responses bypass API calls (see `FAQ_RESPONSES` in `aiAssistant.ts`)

### Provider Analytics Flow
**Tracking Pattern** (`hooks/useProviderTracking.ts`):
```tsx
const { trackWhatsAppClick, trackPhoneClick, ... } = useProviderTracking(providerId);
// Auto-tracks 'profile_view' on mount
// Manual tracking: trackWhatsAppClick(phoneNumber)
```
**Event Types:** `profile_view`, `whatsapp_click`, `phone_click`, `website_click`, `instagram_click`, `facebook_click`, `service_view`, `gallery_view`, `category_click`

**Storage:** `provider_analytics` table with metadata (IP, user agent, session, device type, geo data)

### Data Fetching Pattern
**Single Provider Query:**
```tsx
const { provider, services, reviews, media, providerCategories } = 
  await getProviderFullDetail(provider_id);
```
Returns all related data in one call (see `services/supabaseClient.ts`).

**List Queries:** Direct Supabase client usage:
```tsx
const { data } = await supabase.from('providers').select('*').eq('is_active', true);
```

## Development Workflow

### Environment Setup
```bash
npm install
# Required in .env.local:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
# VITE_GEMINI_API_KEY=your_gemini_key (for AI assistant)
npm run dev  # Runs on localhost:3004 (0.0.0.0 host for container access)
```

### Database Migrations
SQL files in `database/` folder:
- `provider_analytics_schema.sql`: Analytics tables, indexes, materialized views
- `reviews_authentication_upgrade.sql`: Review system with user auth
- `ai_assistant_setup.sql`: AI settings, usage tracking, RLS policies
- Run via Supabase SQL Editor (copy/paste entire file)

### Admin Operations Pattern
```tsx
const handleDelete = async (id: string) => {
  if (window.confirm('¿Seguro?')) {  // Always confirm destructive actions
    const { error } = await supabase.from('table').delete().eq('id', id);
    if (!error) setItems(items.filter(i => i.id !== id));
  }
};
```

### TypeScript Types
Core interfaces in `types.ts`: `ContactDetails`, `Category`, `Supplier`, `Service`, `ProviderReview`
- `ContactDetails`: `{ whatsapp?, phone?, email?, instagram?, maps_url?, facebook? }`
- Always null-check optional fields before rendering

### Styling Conventions
- Purple theme: `text-purple-700`, `bg-purple-600`, `border-purple-500`
- Dark mode: Use `theme-` prefixed classes (see `ThemeContext.tsx`)
- Icons: Heroicons (`@heroicons/react/24/solid`, `/24/outline`)
- Category icons: Emoji preferred, Heroicon fallback in `CategoryIcons.tsx`

## Common Issues & Solutions

### AI Toggle Not Working
1. Check `ai_settings` table: `SELECT is_enabled FROM ai_settings;`
2. Verify RLS policies allow public read: See `database/fix_rls_policies_final.sql`
3. Force context refresh: Hard reload browser (Ctrl+Shift+R)
4. Check `AIStatusContext.tsx` Realtime subscription is active (console logs)

### Provider Not Showing
1. Check `is_active = true` on provider
2. Verify category relationship: `provider_categories` junction table must have entry
3. Use `getProviderFullDetail()` to inspect all related data

### Review Not Saving
1. User must be authenticated (`useAuth().user` must exist)
2. Check `profiles` table has entry for `user_id`
3. Verify RLS policies on `provider_reviews` allow insert for authenticated users

## Key Files Reference
- `App.tsx`: Routing & context hierarchy
- `services/supabaseClient.ts`: `getProviderFullDetail()` and DB client
- `services/aiAssistant.ts`: AI logic, FAQ cache, Gemini integration
- `context/AIStatusContext.tsx`: AI enable/disable state with Realtime
# Copilot instructions — Charlitron Eventos 360 (consolidado)

Resumen rápido: proyecto React + TypeScript creado con Vite que usa Supabase como backend. Tiene una UI pública y un panel admin, tracking de analytics por proveedor y un asistente AI con control de presupuesto y rate-limits.

Puntos imprescindibles para un agente:
- Context/envoltorio (ver `App.tsx`): ErrorBoundary > ThemeProvider > AuthProvider > AIStatusProvider > BrowserRouter. Cambios en `ai_settings` se propagan por Realtime.
- AI: `services/aiAssistant.ts` (lógica de Gemini/FAQ, `FAQ_RESPONSES`, control de tokens/costo). Interfaz: `components/AIFloatingChat.tsx`. Panel admin: `components/AIAdminPanel.tsx`.
- Bases de datos (Supabase): tablas clave `ai_settings` (fila única), `ai_usage_tracking`, `provider_analytics`, `provider_reviews`, `providers` y relaciones (`provider_categories`). RLS importante: `ai_settings` lectura pública, sólo admin modifica.
- Tracking: `hooks/useProviderTracking.ts` auto-trackea `profile_view` al montar y expone `trackWhatsAppClick`, `trackPhoneClick`, etc. Los eventos se insertan en `provider_analytics` con metadata (IP, UA, geo).
- Fetching: usar `getProviderFullDetail(provider_id)` en `services/supabaseClient.ts` para obtener provider + relaciones en una sola llamada.
- Protecciones de rutas: admin routes usan `layouts/AdminLayout.tsx` y `useAuth()` para redirigir si no hay sesión.

Comandos y configuración de desarrollo (ver `package.json`):
- npm install
- Crear `.env.local` con: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY` (opcional para AI)
- npm run dev  # servidor en localhost:3004 (vite config)
- npm run build / npm run preview

Pequeños ejemplos detectables en el código:
- Llamada para obtener todo el detalle de un proveedor:
  `const { provider, services, reviews, media } = await getProviderFullDetail(provider_id)`
- Tracking manual (desde UI):
  `const { trackWhatsAppClick } = useProviderTracking(providerId); trackWhatsAppClick(phone)`
- Desactivar AI rápidamente (SQL):
  `UPDATE ai_settings SET is_enabled = false;` (ejecutar en Supabase SQL Editor)

Convenciones del repo:
- Tipos centrales en `types.ts` (`ContactDetails`, `Category`, `Supplier`, `Service`, `ProviderReview`). Null-check obligatorio para campos opcionales.
- Estilo: paleta morada; dark-mode usa clases `theme-*`. Iconos: Heroicons; categorías prefieren emoji (`components/CategoryIcons.tsx`).
- Confirmaciones UI para acciones destructivas (ver `pages/admin/*` y patrón `handleDelete`).

Dónde mirar primero cuando se cambia comportamiento AI o tracking:
- `context/AIStatusContext.tsx` (suscripciones Realtime)
- `services/aiAssistant.ts` (costo, rate-limits, FAQ)
- `hooks/useProviderTracking.ts` y `database/provider_analytics_schema.sql`

Si algo no está claro o necesitas más ejemplos concretos (tests, flujos de PR, o scripts de migración SQL), dime qué parte quieres ampliar y lo añado.
