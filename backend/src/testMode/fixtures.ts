import type { PrepBrief, ScheduledMeeting } from "@zai/shared";

// Stable demo fixtures. Four meetings scheduled today, owned by the first
// interviewer in ALLOWED_USERS so the Daily Queue has something to render
// the moment the app boots in TEST_MODE. One is already decided so the
// completed-count badge is non-zero. One has a pre-seeded brief so the Live
// Call view renders instantly without burning Anthropic credits during demos.
//
// We read the interviewer id from env at fixture build time, defaulting to
// "demo-interviewer-1" so the app still works before .env is filled in.

const interviewerId = (() => {
  try {
    const raw = process.env.ALLOWED_USERS ?? "[]";
    const parsed = JSON.parse(raw);
    return parsed?.[0]?.zoho_user_id || "demo-interviewer-1";
  } catch {
    return "demo-interviewer-1";
  }
})();

const todayAt = (hours: number, minutes = 0): string => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const fixtureMeetings = (): ScheduledMeeting[] => [
  {
    id: "fix-meeting-000",
    scheduled_time: todayAt(8, 30),
    research_topic: "Operating models for cross-border supply chains",
    interview_decision: "Send Invitation",
    interviewer_id: interviewerId,
    contact: {
      id: "fix-contact-000",
      name: "James Okafor",
      title: "Former COO",
      company: "Continental Logistics",
      linkedin_url: null,
    },
    school: { id: "fix-school-000", name: "MIT Sloan Operations Council" },
    has_brief: true,
  },
  {
    id: "fix-meeting-001",
    scheduled_time: todayAt(10, 0),
    research_topic: "How AI is reshaping product roadmaps in healthcare",
    interview_decision: "Pending",
    interviewer_id: interviewerId,
    contact: {
      id: "fix-contact-001",
      name: "Dr. Lena Park",
      title: "Chief Medical Officer",
      company: "Northbrook Health",
      linkedin_url: "https://www.linkedin.com/in/example-lena-park",
    },
    school: { id: "fix-school-001", name: "Stanford GSB Healthcare Initiative" },
    has_brief: false,
  },
  {
    id: "fix-meeting-002",
    scheduled_time: todayAt(13, 30),
    research_topic: "Capital allocation under macro uncertainty",
    interview_decision: "Pending",
    interviewer_id: interviewerId,
    contact: {
      id: "fix-contact-002",
      name: "Marcus Weld",
      title: "Former CFO",
      company: "Tessera Industrial",
      linkedin_url: null,
    },
    school: { id: "fix-school-002", name: "Wharton Finance Advisory Board" },
    has_brief: true,
  },
  {
    id: "fix-meeting-003",
    scheduled_time: todayAt(16, 15),
    research_topic: "Consumer brand trust in the post-influencer era",
    interview_decision: "Pending",
    interviewer_id: interviewerId,
    contact: {
      id: "fix-contact-003",
      name: "Priya Anand",
      title: "Chief Brand Officer",
      company: "Halcyon & Co.",
      linkedin_url: "https://www.linkedin.com/in/example-priya-anand",
    },
    school: { id: "fix-school-003", name: "NYU Stern Brand Council" },
    has_brief: false,
  },
];

export const fixtureBriefs = (): PrepBrief[] => [
  {
    meeting_id: "fix-meeting-002",
    brief_text:
      "Marcus Weld stepped down as CFO of Tessera Industrial last spring after eleven years. His finance group ran a roughly seven-billion-dollar balance sheet through two recessions, an activist investor episode, and a major divestiture. He is best known internally for moving Tessera off rolling forecasts and into a quarterly capital-reset model, which other industrial CFOs have tried to copy with mixed results.\n\nRight now he is doing board work and quiet advisory. He has been vocal in private settings about how most operators are still planning as if rates will normalize, and he thinks that is a mistake. He has written one Substack post on this topic but otherwise keeps a low public profile. He responds to specifics, not abstractions, and has limited patience for finance-as-strategy framings.\n\nThe Wharton Finance Advisory Board cares about how senior CFOs actually allocate capital under uncertainty, not the textbook version. Weld is a good fit because he has lived through the version that hurts.",
    questions: [
      "Walk me through the most recent capital allocation decision at Tessera that you would do differently if you had it back. What information was missing in the room?",
      "You moved Tessera off rolling forecasts. What broke first when you did that, and what did the operating teams need from finance that they were not getting before?",
      "How do you think about the difference between a CFO planning for higher rates and a CFO planning for permanently uncertain rates? Where does that change the math?",
      "When you look at peers running industrial balance sheets right now, where do you see the most expensive blind spot?",
      "If you were advising a younger CFO heading into their first downturn in the seat, what is the one habit you would tell them to build in the first sixty days?",
    ],
    generated_at: new Date().toISOString(),
  },
];
