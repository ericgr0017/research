import type { ScheduledMeeting } from "@zai/shared";
import { fixtureMeetings } from "../testMode/fixtures.js";
import type { ZohoClient } from "./ZohoClient.js";

// In-memory store seeded from fixtures. Mutations stay in process memory and
// reset on every restart, which is what we want for development and demos.
export class MockZohoClient implements ZohoClient {
  private readonly meetings = new Map<string, ScheduledMeeting>();
  private readonly contactPatches = new Map<string, Record<string, unknown>>();
  private readonly meetingPatches = new Map<string, Record<string, unknown>>();

  constructor() {
    for (const m of fixtureMeetings()) {
      this.meetings.set(m.id, structuredClone(m));
    }
  }

  async getTodayMeetings(interviewerId: string): Promise<ScheduledMeeting[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return [...this.meetings.values()]
      .filter((m) => m.interviewer_id === interviewerId)
      .filter((m) => {
        const t = new Date(m.scheduled_time).getTime();
        return t >= startOfDay.getTime() && t <= endOfDay.getTime();
      })
      .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
  }

  async getMeeting(id: string): Promise<ScheduledMeeting | null> {
    const m = this.meetings.get(id);
    return m ? structuredClone(m) : null;
  }

  async updateMeeting(id: string, fields: Record<string, unknown>): Promise<void> {
    const existing = this.meetingPatches.get(id) ?? {};
    this.meetingPatches.set(id, { ...existing, ...fields });
    console.log(`[MockZoho] updateMeeting ${id}`, fields);

    // Mirror common fields back into the in-memory record so the queue reflects
    // post-decision state on the next poll.
    const meeting = this.meetings.get(id);
    if (meeting && typeof fields["Interview_Decision"] === "string") {
      meeting.interview_decision = fields["Interview_Decision"] as ScheduledMeeting["interview_decision"];
    }
  }

  async updateContact(id: string, fields: Record<string, unknown>): Promise<void> {
    const existing = this.contactPatches.get(id) ?? {};
    this.contactPatches.set(id, { ...existing, ...fields });
    console.log(`[MockZoho] updateContact ${id}`, fields);
  }
}
