import type { ContactSummary, PrepBrief, SchoolSummary } from "@zai/shared";
import { getAnthropic } from "../anthropic.js";
import { config } from "../config.js";

const SYSTEM_PROMPT = `You are preparing an interviewer to conduct a 30-minute research interview with a senior executive. The interviewer will skim your brief in 30 seconds before the call. Write like one operator briefing another. No marketing language. No filler. No "thought leader" or "innovative" gloss. Plain words. Short sentences. Never use em dashes.

You return your output by calling the submit_brief tool with two pieces:

1. brief_text: Three short paragraphs. What this person actually does day to day. What they likely care about right now. Any specific recent moves, public statements, or known perspectives that matter for the topic. About 200 to 250 words total.

2. questions: Five interview questions. Each one open-ended, tailored to this person's likely operating experience, and answerable in 2 to 4 minutes. The questions should pull non-obvious operating insights on the research topic, not generic opinions. Order them so the conversation builds.`;

export interface PrepInputs {
  meeting_id: string;
  contact: ContactSummary;
  school: SchoolSummary | null;
  research_topic: string | null;
  enable_web_search?: boolean; // V2: hook into Anthropic web_search tool
}

interface SubmitBriefInput {
  brief_text: string;
  questions: string[];
}

export const generatePrepBrief = async (input: PrepInputs): Promise<PrepBrief> => {
  const client = getAnthropic();

  const userPrompt = [
    `Executive: ${input.contact.name}`,
    `Title: ${input.contact.title ?? "unknown"}`,
    `Company: ${input.contact.company ?? "unknown"}`,
    `LinkedIn: ${input.contact.linkedin_url ?? "not provided"}`,
    `School context: ${input.school?.name ?? "not specified"}`,
    `Research topic: ${input.research_topic ?? "not specified"}`,
  ].join("\n");

  const response = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "submit_brief",
        description: "Return the prep brief and the five interview questions.",
        input_schema: {
          type: "object",
          properties: {
            brief_text: {
              type: "string",
              description: "Three short paragraphs of plain-language background.",
            },
            questions: {
              type: "array",
              items: { type: "string" },
              minItems: 5,
              maxItems: 5,
              description: "Five tailored interview questions in conversation order.",
            },
          },
          required: ["brief_text", "questions"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_brief" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Prep Agent did not return a tool_use response.");
  }
  const submitted = toolUse.input as SubmitBriefInput;
  if (!submitted.brief_text || !Array.isArray(submitted.questions)) {
    throw new Error("Prep Agent returned malformed output.");
  }

  return {
    meeting_id: input.meeting_id,
    brief_text: submitted.brief_text.trim(),
    questions: submitted.questions.map((q) => q.trim()),
    generated_at: new Date().toISOString(),
  };
};
