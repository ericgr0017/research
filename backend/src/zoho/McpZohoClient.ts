import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { ScheduledMeeting } from "@zai/shared";
import type { ZohoClient } from "./ZohoClient.js";

const ZOHO_SERVER_ID = "zoho-crm-data-metadata";
const GATEWAY_TOOL = "zschool_zoho_call_tool";

interface CallToolResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

// Real implementation that talks to the Zaiserver MCP gateway.
//
// The exact field names on Executive_Meeting_Summary (scheduled time field,
// Universities lookup, etc.) are discovered at runtime in M3 via
// zschool_zoho_get_tool_schema before the real-Zoho path is exercised. Until
// then this client is the structural skeleton. TEST_MODE uses MockZohoClient.
export class McpZohoClient implements ZohoClient {
  private client: Client | null = null;
  private connecting: Promise<Client> | null = null;

  constructor(private readonly mcpUrl: string) {
    if (!mcpUrl) {
      throw new Error(
        "McpZohoClient requires ZAISERVER_MCP_URL. Set TEST_MODE=true to use fixtures instead.",
      );
    }
  }

  private async getClient(): Promise<Client> {
    if (this.client) return this.client;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      const transport = new StreamableHTTPClientTransport(new URL(this.mcpUrl));
      const client = new Client({ name: "zai-console-backend", version: "0.1.0" });
      await client.connect(transport);
      this.client = client;
      return client;
    })();

    return this.connecting;
  }

  private async callZohoTool(args: {
    toolName: string;
    arguments: Record<string, unknown>;
    confirmWrite: boolean;
    reason: string;
  }): Promise<unknown> {
    const client = await this.getClient();
    const result = (await client.callTool({
      name: GATEWAY_TOOL,
      arguments: {
        server_id: ZOHO_SERVER_ID,
        tool_name: args.toolName,
        arguments: args.arguments,
        confirm_write: args.confirmWrite,
        reason: args.reason,
      },
    })) as CallToolResult;

    if (result.isError) {
      const detail = result.content.map((c) => c.text ?? "").join("\n");
      throw new Error(`Zaiserver tool call failed: ${detail}`);
    }

    const text = result.content.map((c) => c.text ?? "").join("\n");
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async getTodayMeetings(_interviewerId: string): Promise<ScheduledMeeting[]> {
    throw new Error(
      "McpZohoClient.getTodayMeetings is not implemented yet. Set TEST_MODE=true for V1 development. M3 finishes field discovery and wires this up against the real Zaiserver.",
    );
  }

  async getMeeting(_id: string): Promise<ScheduledMeeting | null> {
    throw new Error("McpZohoClient.getMeeting is not implemented yet. See M3 plan.");
  }

  async updateMeeting(id: string, fields: Record<string, unknown>): Promise<void> {
    await this.callZohoTool({
      toolName: "ZohoCRM_updateRecord",
      arguments: {
        module: "Executive_Meeting_Summary",
        id,
        data: fields,
      },
      confirmWrite: true,
      reason: `Update Executive_Meeting_Summary ${id} from interview console`,
    });
  }

  async updateContact(id: string, fields: Record<string, unknown>): Promise<void> {
    await this.callZohoTool({
      toolName: "ZohoCRM_updateRecord",
      arguments: {
        module: "Contacts",
        id,
        data: fields,
      },
      confirmWrite: true,
      reason: `Update Contact ${id} from interview console`,
    });
  }
}
