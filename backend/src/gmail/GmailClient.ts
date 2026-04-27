export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  meeting_id: string; // for idempotency / audit
  reason: "thank_you_send_invitation" | "thank_you_polite_decline";
}

export interface GmailClient {
  sendEmail(input: SendEmailInput): Promise<{ message_id: string }>;
}
