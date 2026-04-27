import { getZohoClient } from "../zoho/createZohoClient.js";
import { getGmailClient } from "../gmail/createGmailClient.js";
import { composeThankYouEmail } from "./emailComposer.js";
import { extractResearchInsight } from "./insightExtractor.js";
import {
  dueRetries,
  enqueueRetry,
  markRetryDone,
  markRetryFailed,
  updateRetryPayload,
  type OutcomeJobPayload,
} from "../storage/retryQueue.js";

const TODAY_ISO = (): string => new Date().toISOString().slice(0, 10);
const PLUS_90_DAYS_ISO = (): string =>
  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export interface OutcomeStepResult {
  step: "meeting_update" | "contact_update" | "email_sent" | "insight_saved";
  ok: boolean;
  error?: string;
}

export interface OutcomeRunResult {
  meeting_id: string;
  decision: OutcomeJobPayload["decision"];
  steps: OutcomeStepResult[];
  retry_id?: number;
  fully_succeeded: boolean;
}

const log = (...args: unknown[]): void => console.log("[OutcomeAgent]", ...args);

// Runs the five-step sequence. Each step is idempotent (or de-dupable on the
// remote side) so a retry can re-run the whole job. We track which steps have
// already completed in the job payload itself, so the retry worker can skip
// finished work.
export const runOutcome = async (
  initial: OutcomeJobPayload,
  retryId?: number,
): Promise<OutcomeRunResult> => {
  const job: OutcomeJobPayload = structuredClone(initial);
  const steps: OutcomeStepResult[] = [];
  const firstError: { step: string; message: string }[] = [];

  const zoho = getZohoClient();
  const gmail = getGmailClient();
  const meeting = await zoho.getMeeting(job.meeting_id);
  if (!meeting) {
    throw new Error(`Meeting ${job.meeting_id} not found, cannot run Outcome Agent.`);
  }

  const recordStep = async (
    name: OutcomeStepResult["step"],
    fn: () => Promise<void>,
  ): Promise<void> => {
    if (job.steps_complete[name]) {
      steps.push({ step: name, ok: true });
      return;
    }
    try {
      await fn();
      job.steps_complete[name] = true;
      steps.push({ step: name, ok: true });
      if (retryId !== undefined) updateRetryPayload(retryId, job);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log(`step ${name} failed:`, message);
      steps.push({ step: name, ok: false, error: message });
      if (firstError.length === 0) firstError.push({ step: name, message });
    }
  };

  // Step 1: meeting update
  await recordStep("meeting_update", async () => {
    await zoho.updateMeeting(meeting.id, {
      Interview_Decision: job.decision,
      Decision_Timestamp: new Date().toISOString(),
      Transcript: job.transcript,
      Interviewer: job.interviewer.zoho_user_id,
    });
  });

  // Step 2: contact update
  await recordStep("contact_update", async () => {
    if (job.decision === "Send Invitation") {
      await zoho.updateContact(meeting.contact.id, {
        Research_Status: "Temp_Advisor",
        Temp_Advisor_Until: PLUS_90_DAYS_ISO(),
        Last_Research_Touch: TODAY_ISO(),
      });
    } else {
      await zoho.updateContact(meeting.contact.id, {
        Research_Status: "Completed",
        Last_Research_Touch: TODAY_ISO(),
      });
    }
  });

  // Step 3 + 4: compose and send email (kept logically together; email_sent
  // covers both since composing without sending is just wasted spend).
  await recordStep("email_sent", async () => {
    const draft = await composeThankYouEmail({
      decision: job.decision,
      contact: meeting.contact,
      school: meeting.school,
      research_topic: meeting.research_topic,
      transcript_excerpt: job.transcript,
      interviewer_name: job.interviewer.name,
    });
    // Note: in V1 we don't have the executive's email address from the contact
    // summary type. Address that when McpZohoClient.getMeeting returns email.
    // For TEST_MODE the mock just logs.
    await gmail.sendEmail({
      to: `${meeting.contact.name.replace(/\s+/g, ".").toLowerCase()}@example.com`,
      subject: draft.subject,
      body: draft.body,
      meeting_id: meeting.id,
      reason:
        job.decision === "Send Invitation"
          ? "thank_you_send_invitation"
          : "thank_you_polite_decline",
    });
  });

  // Step 5: research insight (only on Send Invitation per spec; Do Not Send
  // still stores the transcript via step 1).
  if (job.decision === "Send Invitation") {
    await recordStep("insight_saved", async () => {
      const insight = await extractResearchInsight(job.transcript, meeting.research_topic);
      await zoho.updateMeeting(meeting.id, { Research_Insight: insight });
    });
  } else {
    job.steps_complete.insight_saved = true;
    steps.push({ step: "insight_saved", ok: true });
  }

  const fullySucceeded = steps.every((s) => s.ok);

  if (!fullySucceeded) {
    const errMessage = firstError[0]?.message ?? "unknown";
    if (retryId !== undefined) {
      markRetryFailed(retryId, errMessage);
      return { meeting_id: meeting.id, decision: job.decision, steps, retry_id: retryId, fully_succeeded: false };
    }
    const newId = enqueueRetry(job, errMessage);
    log(`enqueued retry id=${newId} for meeting ${meeting.id}`);
    return { meeting_id: meeting.id, decision: job.decision, steps, retry_id: newId, fully_succeeded: false };
  }

  if (retryId !== undefined) markRetryDone(retryId);
  return { meeting_id: meeting.id, decision: job.decision, steps, fully_succeeded: true };
};

// Background worker. Polls the retry queue every 30s.
let workerHandle: NodeJS.Timeout | null = null;
let workerRunning = false;

export const startRetryWorker = (): void => {
  if (workerHandle) return;
  workerHandle = setInterval(async () => {
    if (workerRunning) return; // guard against overlapping ticks
    workerRunning = true;
    try {
      const due = dueRetries(5);
      for (const row of due) {
        try {
          const payload = JSON.parse(row.payload_json) as OutcomeJobPayload;
          log(`retrying job ${row.id} for meeting ${row.meeting_id} (attempt ${row.attempts + 1})`);
          await runOutcome(payload, row.id);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log(`retry ${row.id} threw at top level:`, message);
          markRetryFailed(row.id, message);
        }
      }
    } finally {
      workerRunning = false;
    }
  }, 30_000);
  log("retry worker started (30s interval)");
};

export const stopRetryWorker = (): void => {
  if (workerHandle) clearInterval(workerHandle);
  workerHandle = null;
};
