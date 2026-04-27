import type { PrepBrief, ScheduledMeeting } from "@zai/shared";

// Thin typed surface over Zoho. All callers go through this.
// The two implementations are MockZohoClient (TEST_MODE fixtures) and
// McpZohoClient (real Zaiserver gateway).
export interface ZohoClient {
  getTodayMeetings(interviewerId: string): Promise<ScheduledMeeting[]>;
  getMeeting(id: string): Promise<ScheduledMeeting | null>;
  getBrief(meetingId: string): Promise<PrepBrief | null>;
  saveBrief(brief: PrepBrief): Promise<void>;
  updateMeeting(id: string, fields: Record<string, unknown>): Promise<void>;
  updateContact(id: string, fields: Record<string, unknown>): Promise<void>;
}

export class MissingZohoFieldError extends Error {
  constructor(public readonly fieldName: string, public readonly module: string) {
    super(`Missing custom field "${fieldName}" on Zoho module "${module}". Add it in Zoho Setup, then retry.`);
    this.name = "MissingZohoFieldError";
  }
}
