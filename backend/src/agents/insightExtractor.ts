import { getAnthropic } from "../anthropic.js";
import { config } from "../config.js";

const SYSTEM = `You read research interview transcripts and extract the single most useful operating insight in one short paragraph. The audience is an internal team aggregating themes across many interviews.

Rules:
- One paragraph, three to five sentences.
- Quote the executive when a phrase is sharp; otherwise paraphrase.
- Plain language. No filler. Never use em dashes.
- If the transcript is too sparse to draw a real insight, say so plainly. Do not invent.`;

export const extractResearchInsight = async (
  transcript: string,
  research_topic: string | null,
): Promise<string> => {
  if (!transcript.trim()) return "Transcript was empty. No insight extracted.";

  const client = getAnthropic();
  const response = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 600,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `Research topic: ${research_topic ?? "not specified"}`,
          "",
          "Transcript:",
          transcript.slice(0, 8000),
        ].join("\n"),
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();

  return text || "No insight could be extracted from the transcript.";
};
