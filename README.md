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

To exercise the Prep Agent end to end, set `ANTHROPIC_API_KEY`. Without it, meetings that don't have a pre-seeded brief will show "Could not load brief" with a retry button. One fixture meeting (Marcus Weld) ships with a pre-seeded brief so you can demo the Live Call view without burning Anthropic credits.

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
  backend/              # Fastify server, ZohoClient, agents, retry queue
  frontend/             # Vite/React app
```

## Five-minute walkthrough for a new interviewer

This is what an interviewer sees on day one.

**1. Sign in.** Open `http://localhost:5173`. You will land on the sign-in screen. Pick your name from the dropdown. There is no password. The dropdown is populated from `ALLOWED_USERS` in `.env`.

**2. Look at today's queue.** You will see one card per scheduled interview for today. Each card shows the executive's name, title, company, the school they would be advising, the research topic, and whether the prep brief is ready or still generating. The header shows how many interviews are scheduled and how many you have completed. The queue refreshes itself every 60 seconds and you can also hit Refresh.

**3. Take the call.** When it is time for an interview, click "Take call" on that card. You will land on the Live Call view. The left side shows the executive's prep brief (three short paragraphs of plain-language background). The right side shows the five interview questions, with the current one highlighted, and a transcript pane below. A timer at the bottom of the screen counts up from when you took the call.

**4. Conduct the interview.** Read or skim the brief while you wait for the executive to join. Use the questions on the right as a guide. Click "Next question" to advance the highlight as you move through them. Type or paste the transcript into the text area as the conversation goes. The order of questions is a suggestion, not a script.

**5. End the call.** When the interview is over, click "End call" at the bottom right. You will land on the Decision screen.

**6. Make the call.** The Decision screen asks one question: was this person substantive, professional, and a fit for the school's advisory community? You have two buttons: "Send invitation" or "Do not send." The buttons are disabled for 60 seconds after the screen loads (5 seconds in test mode) so you have time to think before clicking. There is an optional notes field that gets saved either way. Click your choice.

**7. Move on.** Behind the scenes the system updates Zoho, sends the thank-you email, and (for "Send invitation") writes a research insight summary back to the meeting record. The screen briefly shows the result and then takes you straight to the next interview on your queue. If a step failed, the system records it for a background retry and tells you so. You move on either way. You do not have to wait.

That is the whole flow. If something looks wrong, contact Stephene.

## What test mode actually does

When `TEST_MODE=true`:

- All Zoho reads and writes go to an in-memory mock seeded with four sample meetings for "today." Mutations are logged to the backend console. Restarting the backend resets the data.
- All Gmail sends are printed to the backend console instead of going out. The console output shows exactly what would have been sent.
- The Anthropic API still runs for real if `ANTHROPIC_API_KEY` is set. This means real prep briefs, real thank-you emails, and real research insights, all visible without touching production data. If the key is not set, the agent steps fail gracefully and a one-line error appears in the UI with a retry button.
- The Decision view's 60-second cooldown drops to 5 seconds so you can iterate quickly.
- A "TEST MODE" pill shows in the header so it is always obvious which mode you are in.

When `TEST_MODE=false`:

- Reads and writes go to the real Zaiserver MCP gateway against production Zoho. Make sure the custom fields above exist first.
- Emails go through the real Gmail MCP.
- The Anthropic API key is required.

## Build status

V1 is being built in milestones. See `CHANGELOG.md` for what shipped in each one.
