# AGENTS.md

Guidance for coding agents working on Expensia Frontend.

## Project Overview

Expensia Frontend is a Next.js application for Expensia, a personal-finance API (manual expenses,
recurring expenses, a monthly budget, and per-user catalogs of currencies/tags/payment methods).
The app covers five screens: Resumen (dashboard), Gastos (expenses), Recurrentes (recurring
expenses), Presupuesto (budget) and Catálogos (catalogs), plus login.

The backend lives in the sibling `expensia` project. The full API contract is in
`init-instructions/api/project-description-and-endpoints.md` and takes precedence over any
assumption in the design bundle. The approved visual/behavioral reference is
`init-instructions/design/expensia-standalone.html` (open it in a browser); screenshots of every
screen and state are in `init-instructions/screenshots/`. Do not copy that HTML into production —
it is a design reference with mock data, not a source file.

## Commands

Use Yarn. The lockfile is `yarn.lock`.

```bash
yarn dev             # Start Next.js dev server with Turbopack
yarn build           # Production build
yarn start           # Start production server
yarn type-check      # TypeScript check with tsc --noEmit
yarn lint            # ESLint check
yarn lint:fix        # ESLint auto-fix
yarn format          # Prettier write
yarn format:check    # Prettier check
```

Before finishing a behavior or UI change, run at least:

```bash
yarn type-check && yarn format:check
```

Run `yarn build` when touching routing, layouts, environment handling, or code that may behave
differently in production. There is no test runner in this project.

## Tech Stack

- Next.js 15.3.9 with App Router and `src/`
- React 19
- TypeScript 5 with strict mode
- Tailwind CSS 4 via `src/app/globals.css` (no `tailwind.config.*`; CSS-first config)
- shadcn v4 configured for Base UI primitives (`@base-ui/react`), used directly (no `ui/dialog.tsx`
  wrapper) plus a couple of thin `ui/` wrappers copied from the reference project
- TanStack Query 5 for server state
- Zustand 5 for the auth store and local UI state
- `@t3-oss/env-nextjs` and Zod for environment validation
- `@phosphor-icons/react` for icons (the design is specified in Phosphor icon names)
- Sonner for toasts
- `next-themes` for light/dark mode (class strategy — `.dark`)

## Project Structure

```text
src/
  app/
    layout.tsx            # Root layout, lang="es", wraps Providers
    globals.css            # Tailwind v4 + Expensia design tokens + Nocturne component layer
    page.tsx              # Redirects to /resumen
    login/page.tsx        # Public login screen
    (app)/layout.tsx      # AuthGuard + AppShell for protected routes
    (app)/*/page.tsx      # Protected feature pages (resumen, gastos, recurrentes, presupuesto, catalogos)
  components/
    auth/                 # Auth guard
    layout/               # App shell, sidebar, theme toggle
    states/               # Loading skeleton, error panel, empty panel — shared across screens
    summary/ expenses/ recurring/ budget/ catalog/   # per-screen UI
    ui/                    # thin wrappers (tooltip, sonner, button)
  lib/
    api-fetch.ts          # Authenticated fetch wrapper
    auth-client.ts        # Login call + apiUrl()
    problem.ts            # RFC 9457 problem+json parsing and ApiProblemError
    decimal.ts            # Exact scaled-integer arithmetic over amount strings (no float sums)
    format.ts             # es-AR amount/date formatting
    month.ts              # Current-month helpers
    navigation.ts         # Sidebar nav entries
    query-keys.ts         # Centralized TanStack Query keys
    api/                  # One file per resource: fetchX/createX/updateX/deleteX over apiFetch
    utils.ts              # cn() helper
  hooks/                  # useQuery wrappers per resource, built on lib/api/*
  providers/              # Theme, Query, Auth
  stores/                 # Zustand stores (auth, expense filters)
  types/api.ts            # Types mirroring the API contract exactly
  env.ts                  # Validated env vars
```

## Routing And Access

- Public routes live outside `src/app/(app)` (currently just `/login`).
- Protected pages live under `src/app/(app)` and are wrapped by `AuthGuard` and `AppShell`.
- The root page redirects to `/resumen`.
- There is no permission model in Expensia (single-tenant-per-user, no roles): all five screens are
  always visible to an authenticated user.

## Auth And API Rules

- Use `apiFetch` from `@/lib/api-fetch` for authenticated backend calls.
- Use `login` from `@/lib/auth-client` for the login call.
- Do not call `fetch` directly for authenticated app APIs.
- `apiFetch` reads the token from `useAuthStore.getState()` and sends
  `Authorization: Bearer <token>`. There is no refresh token and no cookie: a `401` clears the
  session and the caller lets `AuthGuard` redirect to `/login`.
- Backend paths are built from `NEXT_PUBLIC_API_BASE_URL` using `apiUrl()`. Do not concatenate raw
  environment variables in feature code, and never read `process.env` directly outside `src/env.ts`.
- Errors are RFC 9457 `application/problem+json`. Use `readProblem()` / `ApiProblemError` from
  `@/lib/problem` and always show the backend's `detail` verbatim — never invent error copy.
- `GET /api/budgets/current` can return `200` with an **empty body** when the user has no budget for
  the current month. That is not an error: treat it as the empty state, never throw on it.
- Amounts are exact decimal strings in every request/response. Never do `Number(amount)` to sum or
  persist a value — use `@/lib/decimal` (scaled `BigInt` arithmetic) for any client-side total.
  `Number()` is only acceptable for purely visual ratios (bar widths, percentages) where a float
  error is invisible.
- `PUT /api/expenses/{id}` is a full replace: the edit dialog must preload the complete
  `ExpenseResponse` and resend every field, or the omitted ones get cleared.
- A budget is immutable (create-only) and unique per (user, month); never build an edit/delete flow
  for it.

## State Management

- Remote/server state belongs in TanStack Query hooks under `hooks/`.
- Local UI state belongs in component state or Zustand stores (`stores/`).
- Auth state lives in `src/stores/auth-store.ts`, persisted to `localStorage` (the JWT lasts 24h and
  there is no refresh — persisting it is what survives a reload).
- **Do not use `useMutation`.** Writes are plain async functions in `lib/api/*` called directly from
  a `handleSubmit`, with local `isSubmitting`/`errorMessage` state, followed by
  `queryClient.invalidateQueries(...)` + `toast.success(...)` + an `onSuccess()` callback. This
  matches the reference project's convention.
- Creating, editing or deleting an expense must invalidate both `['expenses', month]` and
  `['budget', 'current']` — the backend recalculates the budget summary from live expenses, there is
  no recompute endpoint.
- Changing a recurring expense's price or cancelling it must invalidate `['recurring-expenses']` and
  `['expenses', month]`.
- Reuse the query keys in `@/lib/query-keys` rather than inlining key arrays.

## UI Conventions

- User-facing UI text is Spanish, Rioplatense tone (`Cargá`, `Elegí`, `Guardá`).
- Code identifiers, filenames, component names, types, and comments are English.
- Use the `@/` alias for imports from `src`; never use `../` relative imports.
- Files are kebab-case; components use named exports (`export function Foo`) except route
  `page.tsx` files, which use `export default`.
- Use Tailwind utilities and `cn()` from `@/lib/utils` for conditional classes.
- All visual tokens (color, spacing, radius, shadow) come from the CSS variables declared in
  `globals.css`, ported from `init-instructions/design/nocturne-styles.css` and re-themed to
  Expensia's green/cream palette. Never hardcode a hex or a raw px spacing value the tokens already
  cover. The Nocturne component classes (`.btn`, `.input`, `.card`, `.tag`, `.seg`, `.field`,
  `.table`, `.dialog*`) live in `@layer components` of `globals.css` — use them instead of
  reinventing markup for a button/card/tag/dialog.
- Primary buttons are outlined, never filled. The only saturated fill allowed is the green budget
  band (`--color-band`).
- All numeric values use `font-variant-numeric: tabular-nums`.
- The three cross-cutting states (loading skeleton, error panel, empty panel) are shared components
  under `components/states/` and reused by every screen — do not build a one-off per screen.
- Error routing: network/5xx replaces the screen with the shared error panel; `401` clears the
  session and redirects to `/login` (no panel); `409`/`422` from a user action never replace the
  screen — show the `detail` in the dialog/form banner or a toast.

## Formatting And Style

Prettier is configured in `.prettierrc.json`:

- Semicolons
- Single quotes
- 2-space indentation
- Trailing commas where valid in ES5
- 100-character print width
- `prettier-plugin-tailwindcss`

## Working Safely

- `init-instructions/` is a read-only design/API reference bundle — never edit it, and exclude it
  from lint/format tooling.
- `.env` is local and should not be committed. Keep secrets out of docs and examples.
- Do not edit generated/build output such as `.next`, `node_modules`, or `tsconfig.tsbuildinfo`.

## Adding Features

1. Add the typed fetch function(s) in `lib/api/<resource>.ts` and a `useQuery` hook in
   `hooks/use-<resource>.ts`.
2. Add page UI under `src/app/(app)/...` for protected routes.
3. Add reusable domain UI under `src/components/<feature>/...`.
4. Add navigation in `src/lib/navigation.ts` only if the feature should be accessible from the
   sidebar.
5. Add or update environment variables through `src/env.ts` and `.env.example`.
6. Run `yarn type-check && yarn lint && yarn format:check` before finishing.
