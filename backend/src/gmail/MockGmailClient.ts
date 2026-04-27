import type { GmailClient, SendEmailInput } from "./GmailClient.js";

// In TEST_MODE we don't actually send. We log enough for the operator to see
// exactly what would have gone out, and return a deterministic id so retry
// logic can de-dupe.
export class MockGmailClient implements GmailClient {
  async sendEmail(input: SendEmailInput): Promise<{ message_id: string }> {
    const banner = "=".repeat(72);
    const rule = "-".repeat(72);
    console.log(`\n${banner}`);
    console.log(`[MockGmail] Would send (${input.reason}) for meeting ${input.meeting_id}`);
    console.log(rule);
    console.log(`To:      ${input.to}`);
    console.log(`Subject: ${input.subject}`);
    console.log(rule);
    console.log(input.body);
    console.log(`${banner}\n`);
    return { message_id: `mock-${input.meeting_id}-${input.reason}` };
  }
}
