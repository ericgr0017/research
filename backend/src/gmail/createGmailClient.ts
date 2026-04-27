import { config } from "../config.js";
import { McpGmailClient } from "./McpGmailClient.js";
import { MockGmailClient } from "./MockGmailClient.js";
import type { GmailClient } from "./GmailClient.js";

let cached: GmailClient | null = null;

export const getGmailClient = (): GmailClient => {
  if (cached) return cached;
  if (config.testMode) {
    console.log("[GmailClient] TEST_MODE enabled. Using MockGmailClient.");
    cached = new MockGmailClient();
  } else {
    console.log("[GmailClient] Using McpGmailClient.");
    cached = new McpGmailClient(config.gmailMcpUrl);
  }
  return cached;
};
