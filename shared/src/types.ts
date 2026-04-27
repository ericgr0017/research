// Domain types shared by frontend and backend.

export type InterviewDecision = "Pending" | "Send Invitation" | "Do Not Send";

export type ResearchStatus =
  | "Never_Contacted"
  | "Scheduled"
  | "Completed"
  | "Temp_Advisor"
  | "Converted_Senior"
  | "Converted_Executive"
  | "Declined";

export type SignalFlag =
  | "Consulting"
  | "Corporate"
  | "Speaking"
  | "Eric_Review"
  | "Other";

export interface AllowedUser {
  email: string;
  name: string;
  zoho_user_id: string;
}

export interface ContactSummary {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
}

export interface SchoolSummary {
  id: string;
  name: string;
}

export interface ScheduledMeeting {
  id: string;
  scheduled_time: string; // ISO 8601
  research_topic: string | null;
  interview_decision: InterviewDecision;
  interviewer_id: string | null;
  contact: ContactSummary;
  school: SchoolSummary | null;
  has_brief: boolean;
}

export interface PrepBrief {
  meeting_id: string;
  brief_text: string;
  questions: string[];
  generated_at: string;
}

export interface DecisionPayload {
  meeting_id: string;
  decision: "Send Invitation" | "Do Not Send";
  transcript: string;
  notes: string | null;
}

export interface SessionUser {
  email: string;
  name: string;
  zoho_user_id: string;
}

export interface ApiError {
  error: string;
  detail?: string;
  missing_field?: string;
}
