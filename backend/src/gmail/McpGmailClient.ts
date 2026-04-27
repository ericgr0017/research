import type { GmailClient, SendEmailInput } from "./GmailClient.js";

// Skeleton for the real Gmail MCP. Wired up once GMAIL_MCP_URL is set and we
// know the gateway's tool name and schema. V1 demos run through MockGmailClient
// in TEST_MODE.
export class McpGmailClient implements GmailClient {
  constructor(private readonly mcpUrl: string) {
    if (!mcpUrl) {
      throw new Error(
        "McpGmailClient requires GMAIL_MCP_URL. Set TEST_MODE=true to use the console-print mock instead.",
      );
    }
  }

  async sendEmail(_input: SendEmailInput): Promise<{ message_id: string }> {
    throw new Error(
      "McpGmailClient.sendEmail is not implemented yet. Set TEST_MODE=true for V1 development.",
    );
  }
}
