import { config } from "../config.js";
import { McpZohoClient } from "./McpZohoClient.js";
import { MockZohoClient } from "./MockZohoClient.js";
import type { ZohoClient } from "./ZohoClient.js";

let cached: ZohoClient | null = null;

export const getZohoClient = (): ZohoClient => {
  if (cached) return cached;
  if (config.testMode) {
    console.log("[ZohoClient] TEST_MODE enabled. Using MockZohoClient.");
    cached = new MockZohoClient();
  } else {
    console.log("[ZohoClient] Using McpZohoClient against Zaiserver.");
    cached = new McpZohoClient(config.zaiserverMcpUrl);
  }
  return cached;
};
