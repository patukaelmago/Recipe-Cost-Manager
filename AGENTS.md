# Base44 Dev Environment

## Stack
- **Frontend-only**: Vite 7 + React 18 + TypeScript. Client-side app, no backend server.
- **Data/Auth**: Firebase (Firestore + Google Auth) accessed directly from the client. Config is hardcoded in `client/src/lib/firebase.ts`.
- **Routing**: `wouter` (client-side). Routes use `/:tenant/...` segments.
- **UI**: shadcn/ui (Radix), Tailwind CSS 3, TanStack Query.

## Running
```
docker compose -f docker-compose.base44.yml up -d --build
```
- Vite dev server runs on container port 5173, mapped to host port 3000.
- `npm install` runs on container start (deps in a named volume).
- Live reload is active; edits appear without rebuilds.

## Notes / Quirks
- No Postgres/Drizzle backend is used at runtime despite `drizzle.config.ts` and `shared/schema.ts` existing — all data goes through Firebase. No DB service is needed.
- `vite.config.ts` sets `server.host: true` and `allowedHosts: true` so the preview's external hostname is accepted.
- The `.env` file has empty `VITE_FIREBASE_*` vars, but they are unused — Firebase config is hardcoded in source.
- Login uses Firebase Google popup auth; in the preview iframe this may be blocked by popup/origin restrictions.
- Replit-specific Vite plugins are conditionally loaded only when `REPL_ID` is set, so they don't interfere here.

## Verification
- `curl -sf http://localhost:3000/` returns the Vite-served HTML.
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` also succeeds (host allowlist works).
