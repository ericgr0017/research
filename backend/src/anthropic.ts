import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";

let cached: Anthropic | null = null;

export const getAnthropic = (): Anthropic => {
  if (cached) return cached;
  if (!config.anthropic.apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env to run Prep or Outcome agents.",
    );
  }
  cached = new Anthropic({ apiKey: config.anthropic.apiKey });
  return cached;
};
