# Changelog

## Unreleased

### M1 — Scaffold and ZohoClient (in progress)
- Monorepo set up with npm workspaces: `shared`, `backend`, `frontend`.
- Fastify backend with `/health` and `/api/meetings/today` routes.
- `ZohoClient` interface with `MockZohoClient` (TEST_MODE fixtures) and `McpZohoClient` (real Zaiserver gateway).
- Vite/React/TS frontend shell with Tailwind.
- `.env.example` documents every required setting.
