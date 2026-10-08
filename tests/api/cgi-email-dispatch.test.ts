import { afterEach, describe, expect, it, vi } from "vitest";
import { dispatchCgiParticipantEmail } from "../../api/_cgi-email-dispatch";

const content = {
  subject: "Assunto",
  plainText: "Corpo em texto plano",
  htmlBody: "<p>Corpo em html</p>",
};

describe("dispatchCgiParticipantEmail", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("skips with missing_recipient when recipient is empty, never calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await dispatchCgiParticipantEmail({
      appsScriptUrl: "https://script.google.test/exec",
      relayToken: "secret",
      recipient: "",
      content,
      emailKind: "report_ready",
      dryRun: false,
    });
    expect(result).toEqual({ status: "skipped", reason: "missing_recipient" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns dry_run and never calls fetch when dryRun is true", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await dispatchCgiParticipantEmail({
      appsScriptUrl: "https://script.google.test/exec",
      relayToken: "secret",
      recipient: "lead@example.com",
      content,
      emailKind: "abandonment",
      dryRun: true,
    });
    expect(result).toEqual({ status: "dry_run" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips as not_configured when the Apps Script URL is empty", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await dispatchCgiParticipantEmail({
      appsScriptUrl: "",
      relayToken: "secret",
      recipient: "lead@example.com",
      content,
      emailKind: "report_ready",
      dryRun: false,
    });
    expect(result).toEqual({ status: "skipped", reason: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the expected action/token/emailKind/content and reports sent on a real success response", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(url).toBe("https://script.google.test/exec");
      expect(body).toEqual({
        action: "cgi_send_email",
        token: "secret",
        emailKind: "report_ready",
        recipient: "lead@example.com",
        subject: content.subject,
        plainText: content.plainText,
        htmlBody: content.htmlBody,
      });
      return new Response(JSON.stringify({ ok: true, sent: true }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await dispatchCgiParticipantEmail({
      appsScriptUrl: "https://script.google.test/exec",
      relayToken: "secret",
      recipient: "lead@example.com",
      content,
      emailKind: "report_ready",
      dryRun: false,
    });
    expect(result).toEqual({ status: "sent" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports error when Apps Script responds ok:true but sent:false (e.g. disabled flag)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true, sent: false, error: "disabled" }), { status: 200 }))
    );
    const result = await dispatchCgiParticipantEmail({
      appsScriptUrl: "https://script.google.test/exec",
      relayToken: "secret",
      recipient: "lead@example.com",
      content,
      emailKind: "abandonment",
      dryRun: false,
    });
    expect(result).toEqual({ status: "error", error: "disabled" });
  });

  it("reports error on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    const result = await dispatchCgiParticipantEmail({
      appsScriptUrl: "https://script.google.test/exec",
      relayToken: "secret",
      recipient: "lead@example.com",
      content,
      emailKind: "report_ready",
      dryRun: false,
    });
    expect(result).toEqual({ status: "error", error: "http_500" });
  });

  it("reports error (never throws) on a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );
    const result = await dispatchCgiParticipantEmail({
      appsScriptUrl: "https://script.google.test/exec",
      relayToken: "secret",
      recipient: "lead@example.com",
      content,
      emailKind: "report_ready",
      dryRun: false,
    });
    expect(result).toEqual({ status: "error", error: "network down" });
  });

  it("reports error (never throws) on a malformed JSON response body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json", { status: 200 })));
    const result = await dispatchCgiParticipantEmail({
      appsScriptUrl: "https://script.google.test/exec",
      relayToken: "secret",
      recipient: "lead@example.com",
      content,
      emailKind: "report_ready",
      dryRun: false,
    });
    expect(result.status).toBe("error");
  });
});
