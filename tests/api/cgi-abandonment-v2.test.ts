import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  // V2
  getAbandonmentState: vi.fn(),
  getAbandonmentCandidatesV2: vi.fn(),
  getReadyCgiReport: vi.fn(),
  getLeadById: vi.fn(),
  getCrmOpportunityByLeadId: vi.fn(),
  markAbandonmentEmailSent: vi.fn(),
  upsertReportAccessToken: vi.fn(),
  getReportAccessTokenByHash: vi.fn(),
  touchReportAccessToken: vi.fn(),
  // legado, ainda importado pelo endpoint
  getAbandonmentCandidates: vi.fn(),
  getAssessmentEmailState: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import handler from "../../api/cgi/abandonment-sweep";
import {
  ABANDONMENT_SUBJECTS,
  classifyAbandonmentKind,
  maskEmail,
} from "../../api/_cgi-abandonment-email";
import {
  buildCgiLeadCaptureAbandonmentEmail,
  buildCgiProgressAbandonmentEmail,
} from "../../api/_cgi-email-content";

function createResponse() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(k: string, v: string) { this.headers[k] = v; },
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
}

function createRequest(overrides: Record<string, unknown> = {}) {
  return { method: "GET", headers: { authorization: "Bearer cron-secret" }, query: {}, ...overrides };
}

const PID = "eKFHZUYCU5PTho3U";

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function state(overrides: Record<string, unknown> = {}) {
  return {
    id: "row_1",
    public_assessment_id: PID,
    lead_id: "lead_1",
    status: "lead_captured",
    progress_percent: 0,
    current_question: null,
    completed_at: null,
    last_activity_at: hoursAgo(48),
    abandonment_email_sent_at: null,
    report_email_sent_at: null,
    ...overrides,
  };
}

function lead(overrides: Record<string, unknown> = {}) {
  return { id: "lead_1", name: "Larissa", company: "Sawana", email: "larii@example.com", ...overrides };
}

function results(r: ReturnType<typeof createResponse>) {
  return (r.body as { results: Array<Record<string, unknown>> }).results;
}

describe("abandonment V2", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "cron-secret";
    process.env.CGI_ABANDONMENT_V2_ENABLED = "true";
    process.env.CGI_ABANDONMENT_EMAIL_ENABLED = "true";
    process.env.CONTACT_FORM_URL = "https://script.google.test/exec";
    process.env.CGI_EMAIL_RELAY_TOKEN = "relay-secret";
    delete process.env.CGI_EMAIL_DRY_RUN;
    delete process.env.CGI_ABANDONMENT_DELAY_HOURS;
    delete process.env.CGI_ABANDONMENT_MAX_AGE_HOURS;

    supabaseMocks.getAbandonmentState.mockReset().mockResolvedValue(state());
    supabaseMocks.getAbandonmentCandidatesV2.mockReset().mockResolvedValue([state()]);
    supabaseMocks.getReadyCgiReport.mockReset().mockResolvedValue(null);
    supabaseMocks.getLeadById.mockReset().mockResolvedValue(lead());
    supabaseMocks.getCrmOpportunityByLeadId.mockReset().mockResolvedValue({ ok: true, opportunity: null });
    supabaseMocks.markAbandonmentEmailSent.mockReset().mockResolvedValue(true);
    supabaseMocks.upsertReportAccessToken.mockReset().mockResolvedValue(true);
    supabaseMocks.getAbandonmentCandidates.mockReset().mockResolvedValue([]);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true, sent: true }), { status: 200 })));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  describe("classification", () => {
    it("classifies a lead who answered nothing as abandon_lead_d1", () => {
      expect(classifyAbandonmentKind({ current_question: null, progress_percent: 0 })).toBe("abandon_lead_d1");
      expect(classifyAbandonmentKind({ current_question: 0, progress_percent: 0 })).toBe("abandon_lead_d1");
    });

    it("classifies any real progress as abandon_progress_d1", () => {
      expect(classifyAbandonmentKind({ current_question: 8, progress_percent: 20 })).toBe("abandon_progress_d1");
      expect(classifyAbandonmentKind({ current_question: 0, progress_percent: 20 })).toBe("abandon_progress_d1");
    });

    it("keeps the advertised subjects in sync with the actual builders", () => {
      expect(buildCgiLeadCaptureAbandonmentEmail({ name: "x", company: "y", reportAccessUrl: "u" }).subject)
        .toBe(ABANDONMENT_SUBJECTS.abandon_lead_d1);
      expect(buildCgiProgressAbandonmentEmail({ name: "x", reportAccessUrl: "u" }).subject)
        .toBe(ABANDONMENT_SUBJECTS.abandon_progress_d1);
    });

    it("masks the recipient for inspect output", () => {
      expect(maskEmail("larii_amaro@hotmail.com")).toBe("l***@hotmail.com");
      expect(maskEmail("")).toBe("***");
    });
  });

  describe("eligibility guards", () => {
    const cases: Array<[string, Record<string, unknown>, string]> = [
      ["a finished assessment", { completed_at: "2026-08-18T12:51:44.085Z" }, "skipped_completed"],
      ["an assessment that already got an abandonment email", { abandonment_email_sent_at: "2026-08-17T13:52:37.590Z" }, "skipped_already_sent"],
      ["an assessment whose report email already went out", { report_email_sent_at: "2026-08-18T22:11:10.708Z" }, "skipped_report_email_sent"],
    ];
    for (const [label, overrides, expected] of cases) {
      it(`blocks ${label}`, async () => {
        supabaseMocks.getAbandonmentState.mockResolvedValue(state(overrides));
        const response = createResponse();
        await handler(createRequest() as never, response as never);
        expect(results(response)[0].outcome).toBe(expected);
        expect(globalThis.fetch).not.toHaveBeenCalled();
        expect(supabaseMocks.upsertReportAccessToken).not.toHaveBeenCalled();
      });
    }

    it("blocks an assessment that already has a ready report", async () => {
      supabaseMocks.getReadyCgiReport.mockResolvedValue({ publicAssessmentId: PID, aiReport: "{}" });
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("skipped_report_ready");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("blocks when the commercial status moved past novo", async () => {
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: true, opportunity: { lead_id: "lead_1", status: "enviar_proposta" } });
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0]).toMatchObject({ outcome: "skipped_commercial_contact", detail: "crm_status:enviar_proposta" });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("blocks when a human contact is recorded", async () => {
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: true, opportunity: { lead_id: "lead_1", status: "novo", last_contact_at: "2026-08-06T00:00:00Z" } });
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0]).toMatchObject({ detail: "last_contact_at" });
    });

    it("blocks when a next action is scheduled", async () => {
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: true, opportunity: { lead_id: "lead_1", status: "novo", next_action_at: "2026-08-25T00:00:00Z" } });
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0]).toMatchObject({ detail: "next_action_at" });
    });

    it("fails closed when the commercial state cannot be read", async () => {
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: false });
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("skipped_commercial_state_unknown");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("sends with no crm row at all -- absence means nobody worked the lead", async () => {
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: true, opportunity: null });
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("sent");
    });

    it("does not treat consent_marketing=false as a blocker (operational email)", async () => {
      supabaseMocks.getLeadById.mockResolvedValue(lead({ consent_marketing: false }));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("sent");
    });
  });

  describe("time window", () => {
    it("does not select an assessment idle for 23h59", async () => {
      supabaseMocks.getAbandonmentState.mockResolvedValue(state({ last_activity_at: hoursAgo(23.98) }));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("skipped_too_recent");
    });

    it("selects an assessment idle for 24h", async () => {
      supabaseMocks.getAbandonmentState.mockResolvedValue(state({ last_activity_at: hoursAgo(24.1) }));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("sent");
    });

    it("still handles an assessment inside the 168h ceiling", async () => {
      supabaseMocks.getAbandonmentState.mockResolvedValue(state({ last_activity_at: hoursAgo(160) }));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("sent");
    });

    it("refuses an assessment past the ceiling in the automatic sweep", async () => {
      supabaseMocks.getAbandonmentState.mockResolvedValue(state({ last_activity_at: hoursAgo(300) }));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("skipped_outside_window");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("accepts the same old assessment through nominal backfill", async () => {
      supabaseMocks.getAbandonmentState.mockResolvedValue(state({ last_activity_at: hoursAgo(516) }));
      const response = createResponse();
      await handler(createRequest({ query: { mode: "backfill", ids: PID } }) as never, response as never);
      expect(results(response)[0].outcome).toBe("sent");
      expect(supabaseMocks.getAbandonmentCandidatesV2).not.toHaveBeenCalled();
    });

    it("backfill never skips the commercial guard, however old the row is", async () => {
      supabaseMocks.getAbandonmentState.mockResolvedValue(state({ last_activity_at: hoursAgo(516) }));
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: true, opportunity: { lead_id: "lead_1", status: "reuniao_agendada" } });
      const response = createResponse();
      await handler(createRequest({ query: { mode: "backfill", ids: PID } }) as never, response as never);
      expect(results(response)[0].outcome).toBe("skipped_commercial_contact");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe("backfill safety", () => {
    it("refuses to run without an explicit id list", async () => {
      const response = createResponse();
      await handler(createRequest({ query: { mode: "backfill" } }) as never, response as never);
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({ error: "ids_required" });
      expect(supabaseMocks.getAbandonmentCandidatesV2).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("rejects backfill entirely while V2 is off", async () => {
      delete process.env.CGI_ABANDONMENT_V2_ENABLED;
      const response = createResponse();
      await handler(createRequest({ query: { mode: "backfill", ids: PID } }) as never, response as never);
      expect(response.statusCode).toBe(409);
      expect(response.body).toMatchObject({ error: "abandonment_v2_disabled" });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe("inspect is read-only by construction", () => {
    it("reports decisions without issuing a token, calling the relay or writing", async () => {
      const response = createResponse();
      await handler(createRequest({ query: { mode: "inspect" } }) as never, response as never);

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({ mode: "inspect", readOnly: true });
      expect(results(response)[0]).toMatchObject({
        publicAssessmentId: PID,
        outcome: "would_send",
        abandonmentKind: "abandon_lead_d1",
        maskedRecipient: "l***@example.com",
        subject: ABANDONMENT_SUBJECTS.abandon_lead_d1,
      });
      expect(typeof results(response)[0].inactiveHours).toBe("number");

      expect(supabaseMocks.upsertReportAccessToken).not.toHaveBeenCalled();
      expect(supabaseMocks.markAbandonmentEmailSent).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("works while V2 is off, which is the whole point of looking first", async () => {
      delete process.env.CGI_ABANDONMENT_V2_ENABLED;
      const response = createResponse();
      await handler(createRequest({ query: { mode: "inspect" } }) as never, response as never);
      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({ v2Enabled: false, readOnly: true });
      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(supabaseMocks.markAbandonmentEmailSent).not.toHaveBeenCalled();
    });

    it("never writes even for a candidate that would be blocked", async () => {
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: false });
      const response = createResponse();
      await handler(createRequest({ query: { mode: "inspect" } }) as never, response as never);
      expect(results(response)[0].outcome).toBe("skipped_commercial_state_unknown");
      expect(supabaseMocks.upsertReportAccessToken).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe("delivery, writeback and idempotency", () => {
    it("writes the marker only after the relay confirms", async () => {
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("sent");
      expect(supabaseMocks.markAbandonmentEmailSent).toHaveBeenCalledExactlyOnceWith(PID);
      const [, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(String((init as RequestInit).body));
      // Both kinds ride the existing relay channel -- no Apps Script change.
      expect(payload.emailKind).toBe("abandonment");
      expect(payload.subject).toBe(ABANDONMENT_SUBJECTS.abandon_lead_d1);
      expect(payload.plainText).not.toContain("progresso que já ficou salvo");
      expect(payload.plainText).toContain("ainda não foi iniciado");
    });

    it("sends the resume copy for someone who had started", async () => {
      supabaseMocks.getAbandonmentState.mockResolvedValue(state({ status: "in_progress", progress_percent: 20, current_question: 8 }));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      const [, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(String((init as RequestInit).body));
      expect(payload.subject).toBe(ABANDONMENT_SUBJECTS.abandon_progress_d1);
      expect(payload.plainText).toContain("progresso que já ficou salvo");
    });

    it("does not write the marker when the relay reports failure", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true, sent: false, error: "disabled" }), { status: 200 })));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0]).toMatchObject({ outcome: "error_dispatch", detail: "disabled" });
      expect(supabaseMocks.markAbandonmentEmailSent).not.toHaveBeenCalled();
    });

    it("does not write the marker when token issuance fails", async () => {
      supabaseMocks.upsertReportAccessToken.mockResolvedValue(false);
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("error_token");
      expect(supabaseMocks.markAbandonmentEmailSent).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("a second run does not duplicate", async () => {
      supabaseMocks.getAbandonmentState.mockResolvedValue(state({ abandonment_email_sent_at: new Date().toISOString() }));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("skipped_already_sent");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    // DELIBERATE LIMITATION OF THIS PHASE: one abandonment email per assessment,
    // ever. Someone who received abandon_lead_d1 and then started answering does
    // NOT receive abandon_progress_d1 -- abandonment_email_sent_at is the single
    // canonical marker. The future communication engine can lift this.
    it("does not send a second kind after the person starts answering", async () => {
      supabaseMocks.getAbandonmentState.mockResolvedValue(state({
        status: "in_progress",
        progress_percent: 20,
        current_question: 8,
        abandonment_email_sent_at: "2026-08-17T13:52:37.590Z",
      }));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(results(response)[0].outcome).toBe("skipped_already_sent");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe("legacy path is untouched while V2 is off", () => {
    it("falls through to the original sweep, which finds no candidates here", async () => {
      delete process.env.CGI_ABANDONMENT_V2_ENABLED;
      const response = createResponse();
      await handler(createRequest({ method: "POST" }) as never, response as never);
      expect(response.statusCode).toBe(200);
      expect(supabaseMocks.getAbandonmentCandidates).toHaveBeenCalledTimes(1);
      expect(supabaseMocks.getAbandonmentCandidatesV2).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe("auth", () => {
    it("rejects every mode without a valid secret", async () => {
      for (const query of [{}, { mode: "inspect" }, { mode: "backfill", ids: PID }]) {
        const response = createResponse();
        await handler(createRequest({ headers: {}, query }) as never, response as never);
        expect(response.statusCode).toBe(401);
      }
      expect(supabaseMocks.getAbandonmentCandidatesV2).not.toHaveBeenCalled();
      expect(supabaseMocks.getAbandonmentState).not.toHaveBeenCalled();
    });
  });
});
