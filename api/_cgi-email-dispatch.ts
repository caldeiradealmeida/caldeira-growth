import type { CgiEmailContent } from "./_cgi-email-content.js";

// Thin, shared relay to Apps Script's new "cgi_send_email" action -- both
// the report-ready flow (api/cgi-assessment.ts) and the abandonment sweep
// (api/cgi/abandonment-sweep.ts) send an already fully-rendered
// {subject, plainText, htmlBody} here; Apps Script does no templating of
// its own, it only calls MailApp.sendEmail. Never throws -- every failure
// mode (network, non-2xx, malformed response, explicit ok:false) is
// reported back as a typed result instead.

export type CgiEmailDispatchResult =
  | { status: "dry_run" }
  | { status: "skipped"; reason: "missing_recipient" | "not_configured" }
  | { status: "sent" }
  | { status: "error"; error: string };

export async function dispatchCgiParticipantEmail(input: {
  appsScriptUrl: string;
  relayToken: string;
  recipient: string;
  content: CgiEmailContent;
  emailKind: "report_ready" | "abandonment";
  dryRun: boolean;
}): Promise<CgiEmailDispatchResult> {
  if (!input.recipient) return { status: "skipped", reason: "missing_recipient" };
  if (input.dryRun) return { status: "dry_run" };
  if (!input.appsScriptUrl) return { status: "skipped", reason: "not_configured" };

  try {
    const response = await fetch(input.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "cgi_send_email",
        token: input.relayToken,
        emailKind: input.emailKind,
        recipient: input.recipient,
        subject: input.content.subject,
        plainText: input.content.plainText,
        htmlBody: input.content.htmlBody,
      }),
    });
    const text = await response.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    const record = data as { ok?: boolean; sent?: boolean; error?: string };
    if (response.ok && record.ok === true && record.sent === true) {
      return { status: "sent" };
    }
    return { status: "error", error: record.error || `http_${response.status}` };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}
