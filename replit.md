# Samba

Samba is a mobile-first beauty services app for discovering providers, booking in-home or in-shop services, and managing bookings and messages.

## Run & Operate

- `pnpm install --frozen-lockfile` — install the pinned workspace dependencies
- `pnpm --filter @workspace/samba run dev` — run the Expo app through the managed mobile workflow
- `pnpm --filter @workspace/api-server run dev` — run the Express API through the managed API workflow
- `pnpm --filter @workspace/mockup-sandbox run dev` — run the component preview server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-server run build` — build the API bundle
- `PORT=5173 BASE_PATH=/__mockup pnpm --filter @workspace/mockup-sandbox run build` — build the component preview
- `pnpm --filter @workspace/samba run build` — build the Expo static deployment
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `DATABASE_URL` is provided by Replit's managed development database; the imported schema is currently up to date.
- Clerk development credentials are provisioned as Replit Secrets (`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) and are injected into the Expo workflow.

## Stack

- pnpm workspaces, Replit-managed Node.js, TypeScript 5.9
- Expo SDK 57, React Native, Expo Router, NativeWind
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/samba` — Expo mobile/web client; preview path `/samba/`
- `artifacts/api-server` — Express API; preview path `/api`
- `artifacts/mockup-sandbox` — component preview server; preview path `/__mockup`
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema` — database schema source of truth
- `lib/api-client-react` — generated client hooks and request setup

## Architecture decisions

- The existing pnpm workspace and artifact boundaries are preserved.
- The Expo client uses generated API client code from `lib/api-client-react` rather than app-local request wrappers.
- Replit-managed PostgreSQL and Clerk are used for development environment services.

## Product

- Browse nearby beauty providers by service and location.
- Compare provider profiles, services, ratings, and prices.
- Book in-home or in-shop services and track house calls.
- Manage bookings, profile details, provider portfolios, and messages.

## User preferences

No project-specific preferences recorded.

## Gotchas

- The mockup Vite config requires `PORT` and `BASE_PATH`; provide both for standalone build commands.
- Expo's React Native DevTools binary may warn about a missing GLib library in this environment; Metro and the Expo web preview still run successfully.
- Use the managed artifact workflows for preview startup so Replit injects `PORT`, routing, and Expo environment variables.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
