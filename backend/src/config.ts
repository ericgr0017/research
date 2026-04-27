import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AllowedUser } from "@zai/shared";

// We run from backend/ but the .env lives at the monorepo root. Walk up two
// levels from this file to find it. This makes the backend insensitive to cwd.
const here = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(here, "../../.env") });

const optional = (name: string, fallback = ""): string => process.env[name] ?? fallback;

const parseAllowedUsers = (raw: string): AllowedUser[] => {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (u): u is AllowedUser =>
        typeof u?.email === "string" &&
        typeof u?.name === "string" &&
        typeof u?.zoho_user_id === "string",
    );
  } catch {
    console.warn("ALLOWED_USERS is not valid JSON. Using empty list.");
    return [];
  }
};

export const config = {
  testMode: optional("TEST_MODE", "false").toLowerCase() === "true",
  port: parseInt(optional("PORT_BACKEND", "3001"), 10),
  frontendOrigin: `http://localhost:${optional("PORT_FRONTEND", "5173")}`,
  sessionSecret: optional(
    "SESSION_SECRET",
    "dev-secret-please-change-this-to-32-chars-min",
  ),
  anthropic: {
    apiKey: optional("ANTHROPIC_API_KEY"),
    model: optional("ANTHROPIC_MODEL", "claude-sonnet-4-5"),
  },
  zaiserverMcpUrl: optional("ZAISERVER_MCP_URL"),
  gmailMcpUrl: optional("GMAIL_MCP_URL"),
  calendlyMcpUrl: optional("CALENDLY_MCP_URL"),
  allowedUsers: parseAllowedUsers(optional("ALLOWED_USERS", "[]")),
} as const;

export type Config = typeof config;
