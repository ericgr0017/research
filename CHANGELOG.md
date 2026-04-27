# Changelog

## Unreleased

### M4 — Decision view and Outcome Agent
- Decision view at `/call/:id/decision` reads transcript via router state, shows the school-name prompt, optional notes, and two large buttons.
- 60s cooldown before buttons enable. Drops to 5s when `TEST_MODE=true` so dev cycles aren't slow.
- Outcome Agent runs the five-step sequence per spec, with idempotent step handling and a per-step success/failure record on the response.
- Failed runs go to a SQLite-backed retry queue at `backend/.data/outcome-retries.db`. A 30s background worker retries due jobs, with exponential backoff capped at 10 attempts.
- Email composer uses Anthropic with separate placeholder system prompts for `Send Invitation` and `Do Not Send`. Real LUX-A template plugs in here later.
- Research insight extractor pulls one paragraph from the transcript on `Send Invitation` only.
- Gmail client interface with `MockGmailClient` (formatted console print) and `McpGmailClient` skeleton for the real gateway.
- Auto-advance: after a decision, the queue refetches and the operator is taken straight to the next pending meeting (or back to the queue if there is none).

### M3 — Prep Agent and Live Call view
- Anthropic SDK wired with `ANTHROPIC_MODEL` from env (defaults to `claude-sonnet-4-5`).
- Prep Agent uses tool-forcing for structured output (`submit_brief` tool), returning the 90-second brief and exactly five tailored questions.
- `briefManager` deduplicates in-flight generations, supports both fire-and-forget and blocking modes.
- New endpoints: `GET /api/meetings/:id/brief` (generates if missing), `POST /api/meetings/:id/take-call` (logs call_start).
- Daily Queue route now kicks off background brief generation for any pending meeting without a brief.
- `whoami` returns `test_mode` so the frontend can gate dev-only affordances.
- ZohoClient interface adds `getBrief` / `saveBrief`. McpZohoClient writes briefs to `Prep_Brief` and `Question_Set` fields. MockZohoClient stores briefs in memory.
- One fixture meeting (Marcus Weld) ships with a pre-seeded brief so the Live Call view demos instantly without an Anthropic key.
- `LiveCallPage`: 60/40 split, count-up timer, current-question highlight with "Next question" advance, transcript textarea with TEST_MODE-only "Insert fake lines" helper, End call button that posts state to the future Decision view.

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
