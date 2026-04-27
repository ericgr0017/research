# ZAI Research Interview Console

A small web app that lets a ZAI Institute interviewer run a research interview from start to finish in two clicks. The interviewer takes the call, then chooses to send an invitation or not. Everything else (prep brief, CRM updates, thank-you email, research notes) happens automatically in the background.

This is V1. It runs locally with one command.

## What's in this repo

- `frontend/` — React, Vite, TypeScript, Tailwind. Three views: Daily Queue, Live Call, Decision.
- `backend/` — Node, Fastify, TypeScript. Owns all credentials and external calls.
- `shared/` — Types used by both sides.

The frontend never talks to Zoho, Gmail, Anthropic, or Calendly directly. Every external call goes through the backend.

## Prerequisites

- Node 20 or later
- An Anthropic API key (only needed once you turn off test mode)
- Access to the Zaiserver MCP gateway (only needed once you turn off test mode)

## Setup

1. Install dependencies.

   ```
   npm install
   ```

2. Copy the env template and fill in what you need.

   ```
   cp .env.example .env
   ```

   For first-run local development, leave `TEST_MODE=true`. Nothing else is required to boot the app.

3. Start both servers.

   ```
   npm run dev
   ```

   Backend listens on `http://localhost:3001`. Frontend listens on `http://localhost:5173`.

## Test mode

Set `TEST_MODE=true` in `.env` to use built-in fake Zoho data and skip real email sending. The Anthropic API still runs for real, so you see real prep briefs and real generated emails (printed to the backend console). This is the recommended mode while you're building or demoing.

Set `TEST_MODE=false` once Zoho and the LUX-A email template are wired in.

## Custom Zoho fields you must add manually

The console reads and writes these fields. They do not exist by default. Add them in Zoho Setup before turning off test mode. The app will return a clear error naming any field it cannot find.

On `Executive_Meeting_Summary`:

- `Research_Topic` (text)
- `Interview_Decision` (picklist: Pending, Send Invitation, Do Not Send)
- `Decision_Timestamp` (datetime)
- `Transcript` (long text)
- `Signal_Flags` (multi-select picklist: Consulting, Corporate, Speaking, Eric_Review, Other)
- `Interviewer` (lookup to Users)
- `Prep_Brief` (long text)
- `Question_Set` (long text)
- `Research_Insight` (long text)

On `Contacts`:

- `Research_Status` (picklist: Never_Contacted, Scheduled, Completed, Temp_Advisor, Converted_Senior, Converted_Executive, Declined)
- `Temp_Advisor_Until` (date)
- `Last_Research_Touch` (date)

## Project layout

```
zai-console/
  package.json          # workspace root
  .env.example
  tsconfig.base.json
  shared/               # types shared by frontend and backend
  backend/              # Fastify server, ZohoClient, agents
  frontend/             # Vite/React app
```

## Build status

V1 is being built in milestones. See `CHANGELOG.md` for what shipped in each one.
