# Changelog

## Unreleased

### M2 — Auth and Daily Queue
- Session-based auth with @fastify/cookie + @fastify/session.
- Endpoints: `/api/auth/whoami`, `/api/auth/sign-in`, `/api/auth/sign-out`, `/api/auth/allowed-users`.
- `/api/meetings/today` now requires a session and derives the interviewer from it.
- `getTodayMeetings` returns every meeting today; the route splits into `pending` plus `scheduled_count` and `completed_count` so the header can show real numbers.
- React Router with a `RequireAuth` outlet, sign-in dropdown over `ALLOWED_USERS`, header with date, counts, refresh, and sign-out.
- React Query is the single source of truth for the session (`useWhoami`, `useSetSessionUser`).
- Daily Queue polls every 60 seconds and supports manual refresh.
- A fourth fixture meeting is already decided so completed-count is non-zero out of the box.
- `api()` helper now omits `Content-Type` on body-less requests so empty POSTs don't trip Fastify's JSON parser.

### M1 — Scaffold and ZohoClient
- Monorepo set up with npm workspaces: `shared`, `backend`, `frontend`.
- Fastify backend with `/health` and `/api/meetings/today` routes.
- `ZohoClient` interface with `MockZohoClient` (TEST_MODE fixtures) and `McpZohoClient` (real Zaiserver gateway).
- Vite/React/TS frontend shell with Tailwind.
- `.env.example` documents every required setting.
