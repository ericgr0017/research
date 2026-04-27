import type { ContactSummary, SchoolSummary } from "@zai/shared";
import { getAnthropic } from "../anthropic.js";
import { config } from "../config.js";

// TODO(M5): replace these placeholder system prompts with the real LUX-A
// templates. The structure (tool-forced subject + body) stays the same.
const LUX_A_SYSTEM = `You write thank-you emails for ZAI Institute on behalf of an interviewer who just finished a research interview with a senior executive. The voice is the LUX voice: plain, warm, quiet. Short sentences. No marketing words. No "thrilled" or "honored" or "amazing." Never use em dashes.

The email does three things, in order:
1. Thank the executive for their time and one specific thing they said in the conversation.
2. Confirm they have been added to the school's advisory community as a temporary advisor for 90 days, so the school can ask them follow-up questions if anything from the research warrants it.
3. Close briefly. Sign from the interviewer's first name only.

Two paragraphs maximum. Subject line should be short, lowercase except for the recipient's first name, and never use the word "follow-up" or "circling back."`;

const POLITE_DECLINE_SYSTEM = `You write thank-you emails for ZAI Institute on behalf of an interviewer who just finished a research interview with a senior executive. The voice is the LUX voice: plain, warm, quiet. Short sentences. No marketing words. Never use em dashes.

This email is brief and ends the thread cleanly. It thanks them for the time, says their input will inform our research, and closes. Do not promise follow-up. Do not invite them to anything. Do not mention the advisory community. Sign from the interviewer's first name only.

One paragraph. Three to five sentences. Subject line should be short and lowercase except for the recipient's first name.`;

export interface EmailDraftInputs {
  decision: "Send Invitation" | "Do Not Send";
  contact: ContactSummary;
  school: SchoolSummary | null;
  research_topic: string | null;
  transcript_excerpt: string;
  interviewer_name: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

interface SubmitDraftInput {
  subject: string;
  body: string;
}

export const composeThankYouEmail = async (input: EmailDraftInputs): Promise<EmailDraft> => {
  const client = getAnthropic();

  const userPrompt = [
    `Recipient: ${input.contact.name}`,
    `Title: ${input.contact.title ?? "unknown"}`,
    `Company: ${input.contact.company ?? "unknown"}`,
    `School community: ${input.school?.name ?? "the advisory community"}`,
    `Research topic: ${input.research_topic ?? "not specified"}`,
    `Interviewer first name: ${input.interviewer_name.split(" ")[0]}`,
    "",
    "Transcript excerpt (use to pick one specific thing they said):",
    input.transcript_excerpt.slice(0, 2400),
  ].join("\n");

  const system = input.decision === "Send Invitation" ? LUX_A_SYSTEM : POLITE_DECLINE_SYSTEM;

  const response = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 1000,
    system,
    tools: [
      {
        name: "submit_draft",
        description: "Return the thank-you email subject and body.",
        input_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
          },
          required: ["subject", "body"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_draft" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Email composer did not return a tool_use response.");
  }
  const submitted = toolUse.input as SubmitDraftInput;
  if (!submitted.subject || !submitted.body) {
    throw new Error("Email composer returned malformed output.");
  }
  return { subject: submitted.subject.trim(), body: submitted.body.trim() };
};
