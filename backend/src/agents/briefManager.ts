import type { ScheduledMeeting } from "@zai/shared";
import { generatePrepBrief } from "./prepAgent.js";
import { getZohoClient } from "../zoho/createZohoClient.js";

// In-flight set so we never start two prep generations for the same meeting.
const inFlight = new Map<string, Promise<void>>();

// Cool-down on recently failed generations so a missing API key (or any other
// persistent failure) doesn't get retried every 60s on each queue poll.
const recentFailures = new Map<string, number>();
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

export const isBriefInFlight = (meetingId: string): boolean => inFlight.has(meetingId);

const generateAndSave = async (meeting: ScheduledMeeting): Promise<void> => {
  const zoho = getZohoClient();
  console.log(`[PrepAgent] generating brief for ${meeting.id} (${meeting.contact.name})`);
  const brief = await generatePrepBrief({
    meeting_id: meeting.id,
    contact: meeting.contact,
    school: meeting.school,
    research_topic: meeting.research_topic,
  });
  await zoho.saveBrief(brief);
  console.log(`[PrepAgent] saved brief for ${meeting.id}`);
};

// Fire and forget. Used on Daily Queue load to start generation in the
// background. Errors are logged. The next poll will see has_brief still false
// and may retry, which is fine for V1.
export const ensureBriefInBackground = (meeting: ScheduledMeeting): void => {
  if (meeting.has_brief) return;
  if (inFlight.has(meeting.id)) return;
  const failedAt = recentFailures.get(meeting.id);
  if (failedAt && Date.now() - failedAt < FAILURE_COOLDOWN_MS) return;
  const promise = generateAndSave(meeting)
    .then(() => {
      recentFailures.delete(meeting.id);
    })
    .catch((err) => {
      recentFailures.set(meeting.id, Date.now());
      console.error(`[PrepAgent] background generation failed for ${meeting.id}:`, err);
    })
    .finally(() => {
      inFlight.delete(meeting.id);
    });
  inFlight.set(meeting.id, promise);
};

// Blocking version. Used by the Live Call view: if a brief already exists,
// return it immediately. Otherwise wait for either an in-flight generation or
// kick one off and wait for it.
export const ensureBriefNow = async (meeting: ScheduledMeeting): Promise<void> => {
  const zoho = getZohoClient();
  const existing = await zoho.getBrief(meeting.id);
  if (existing) return;

  const pending = inFlight.get(meeting.id);
  if (pending) {
    await pending;
    return;
  }

  const promise = generateAndSave(meeting).finally(() => inFlight.delete(meeting.id));
  inFlight.set(meeting.id, promise);
  await promise;
};
