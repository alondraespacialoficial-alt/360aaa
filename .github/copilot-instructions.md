# Copilot Instructions - Charlitron Eventos 360 Panel

## Project Overview
This is a React/TypeScript event service provider directory platform for "Charlitron Eventos 360" built with Vite, Supabase, and React Router. The app manages suppliers, categories, reviews, and admin functionality for event planning services.

## Architecture & Data Flow

### Frontend Structure
- **Public Pages**: Event supplier directory (`/embed`, `/categoria/:slug`, `/proveedor/:id`)
- **Admin Panel**: Protected routes (`/admin/*`) with authentication via `AdminLayout.tsx`
- **Authentication**: Supabase Auth context in `AuthContext.tsx` wraps entire app

### Database Pattern (Supabase)
- Core tables: `providers`, `provider_services`, `provider_reviews`, `provider_media`, `provider_categories`
- Use `getProviderFullDetail()` from `services/supabaseClient.ts` for complete supplier data queries
- Authentication handled through Supabase Auth with session management

### Key Components
- `CategoryIcons.tsx`: Maps category names to emoji/icons using Heroicons and emoji fallbacks
- `AdminLayout.tsx`: Layout wrapper for protected admin routes
- `ErrorBoundary.tsx`: Top-level error handling component

## Development Patterns

### Environment Setup
```bash
npm install
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
npm run dev  # Runs on localhost:3000
```

### Supabase Client Usage
- Import from `services/supabaseClient.ts`
- Use `getProviderFullDetail(provider_id)` for complete supplier queries with related data
- Follow existing patterns for table relationships and data fetching

### Routing Convention
- Public routes: Direct component rendering
- Admin routes: Nested under `AdminLayout` element for authentication
- Use descriptive paths: `/categoria/:slug`, `/proveedor/:id`, `/proveedores/planes`

### TypeScript Types
- Core interfaces defined in `types.ts`: `ContactDetails`, `Category`, `Supplier`
- Supabase types auto-generated (use existing patterns for new queries)

### Styling & Icons
- Uses Heroicons (`@heroicons/react/24/solid`) for UI icons
- Category icons: Emoji first, Heroicon fallback in `CategoryIcons.tsx`
- Color scheme: Purple theme (`text-purple-700`, etc.) for branding

## Critical Files
- `App.tsx`: Main routing configuration and app structure
- `services/supabaseClient.ts`: Database queries and Supabase client setup
- `context/AuthContext.tsx`: Authentication state management
- `pages/admin/AdminPanel.tsx`: Main admin interface with CRUD operations
- `vite.config.ts`: Development server config (port 3000, host 0.0.0.0)

## Development Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview production build
```

## Common Patterns
- Admin operations: Confirm dialogs before delete operations
- Data fetching: useEffect with async functions and state management
- Error handling: Wrapped in ErrorBoundary, check Supabase response errors
- Forms: Controlled components with local state, Supabase mutations on submit