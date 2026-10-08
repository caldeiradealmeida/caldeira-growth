import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  getReportEmailCandidates: vi.fn(),
  getReportEmailState: vi.fn(),
  getReadyCgiReport: vi.fn(),
  getLeadById: vi.fn(),
  getCrmOpportunityByLeadId: vi.fn(),
  markReportEmailSent: vi.fn(),
  upsertReportAccessToken: vi.fn(),
  getReportAccessTokenByHash: vi.fn(),
  touchReportAccessToken: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import handler from "../../api/cgi/report-email-sweep";

function createResponse() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

function createRequest(overrides: Record<string, unknown> = {}) {
  return {
    method: "POST",
    headers: { authorization: "Bearer cron-secret" },
    query: {},
    ...overrides,
  };
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function stateRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "assessment_row_1",
    public_assessment_id: "KrjNnuPHmv2Rcv8j",
    lead_id: "lead_1",
    status: "completed",
    completed_at: hoursAgo(1),
    report_email_sent_at: null,
    ...overrides,
  };
}

function readyReport(overrides: Record<string, unknown> = {}) {
  return {
    publicAssessmentId: "KrjNnuPHmv2Rcv8j",
    reportStatus: "report_ready",
    aiReport: JSON.stringify({ executive_summary: "Uma leitura inicial do sistema de crescimento." }),
    aiReportText: "texto",
    ...overrides,
  };
}

function leadRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead_1",
    name: "Andre Pimentel",
    email: "andre@example.com",
    company: "Pesc Brasil",
    ...overrides,
  };
}

function results(response: ReturnType<typeof createResponse>) {
  return (response.body as { results: Array<{ outcome: string; detail?: string }> }).results;
}

describe("/api/cgi/report-email-sweep", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "cron-secret";
    process.env.CGI_REPORT_EMAIL_ENABLED = "true";
    process.env.CONTACT_FORM_URL = "https://script.google.test/exec";
    process.env.CGI_EMAIL_RELAY_TOKEN = "relay-secret";
    delete process.env.CGI_EMAIL_DRY_RUN;
    delete process.env.CGI_REPORT_EMAIL_FRESHNESS_HOURS;

    supabaseMocks.getReportEmailCandidates.mockReset().mockResolvedValue([stateRow()]);
    supabaseMocks.getReportEmailState.mockReset().mockResolvedValue(stateRow());
    supabaseMocks.getReadyCgiReport.mockReset().mockResolvedValue(readyReport());
    supabaseMocks.getLeadById.mockReset().mockResolvedValue(leadRow());
    supabaseMocks.getCrmOpportunityByLeadId
      .mockReset()
      .mockResolvedValue({ ok: true, opportunity: null });
    supabaseMocks.markReportEmailSent.mockReset().mockResolvedValue(true);
    supabaseMocks.upsertReportAccessToken.mockReset().mockResolvedValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true, sent: true }), { status: 200 }))
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects a call without the correct Authorization header", async () => {
    const response = createResponse();
    await handler(createRequest({ headers: {} }) as never, response as never);
    expect(response.statusCode).toBe(401);
    expect(supabaseMocks.getReportEmailCandidates).not.toHaveBeenCalled();
  });

  it("fails closed when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const response = createResponse();
    await handler(createRequest({ headers: { authorization: "Bearer undefined" } }) as never, response as never);
    expect(response.statusCode).toBe(401);
  });

  // 1 + 7 + 8
  it("sends once for a freshly completed report, issues a token and writes the marker", async () => {
    const response = createResponse();
    await handler(createRequest() as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(results(response)).toEqual([{ publicAssessmentId: "KrjNnuPHmv2Rcv8j", outcome: "sent" }]);
    expect(supabaseMocks.upsertReportAccessToken).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.upsertReportAccessToken.mock.calls[0][0]).toMatchObject({
      publicAssessmentId: "KrjNnuPHmv2Rcv8j",
    });
    expect(supabaseMocks.markReportEmailSent).toHaveBeenCalledExactlyOnceWith("KrjNnuPHmv2Rcv8j");

    const [, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const payload = JSON.parse(String((init as RequestInit).body));
    expect(payload.emailKind).toBe("report_ready");
    expect(payload.recipient).toBe("andre@example.com");
    expect(payload.subject).toContain("Pesc Brasil");
    // The token travels only inside the rendered link, never as an id.
    expect(payload.plainText).toContain("/cgi/relatorio#t=");
    expect(payload.plainText).not.toContain("lead_1");
    expect(payload.plainText).not.toContain("assessment_row_1");
  });

  // 2
  it("still sends when the lead declined marketing consent (report delivery is transactional)", async () => {
    supabaseMocks.getLeadById.mockResolvedValue(leadRow({ consent_marketing: false }));
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(results(response)[0].outcome).toBe("sent");
    expect(supabaseMocks.markReportEmailSent).toHaveBeenCalledTimes(1);
  });

  // 3
  it("does not send when the report is not ready, and issues no token", async () => {
    supabaseMocks.getReadyCgiReport.mockResolvedValue(null);
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(results(response)[0].outcome).toBe("skipped_report_not_ready");
    expect(supabaseMocks.upsertReportAccessToken).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("does not send when the report has no executive summary to quote", async () => {
    supabaseMocks.getReadyCgiReport.mockResolvedValue(readyReport({ aiReport: "{}" }));
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(results(response)[0].outcome).toBe("skipped_missing_executive_summary");
    expect(supabaseMocks.upsertReportAccessToken).not.toHaveBeenCalled();
  });

  // 4
  it("does not send a report completed outside the freshness window in recovery mode", async () => {
    supabaseMocks.getReportEmailState.mockResolvedValue(stateRow({ completed_at: hoursAgo(100) }));
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(results(response)[0].outcome).toBe("skipped_stale");
    expect(supabaseMocks.upsertReportAccessToken).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("honours a configured freshness window", async () => {
    process.env.CGI_REPORT_EMAIL_FRESHNESS_HOURS = "2";
    supabaseMocks.getReportEmailState.mockResolvedValue(stateRow({ completed_at: hoursAgo(5) }));
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(results(response)[0].outcome).toBe("skipped_stale");
  });

  // 5
  it("never sends twice for the same assessment", async () => {
    supabaseMocks.getReportEmailState.mockResolvedValue(
      stateRow({ report_email_sent_at: "2026-08-18T00:00:00.000Z" })
    );
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(results(response)[0].outcome).toBe("skipped_already_sent");
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(supabaseMocks.markReportEmailSent).not.toHaveBeenCalled();
  });

  // 6
  it("does not write the marker when the relay reports a failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: false, error: "send_failed" }), { status: 200 }))
    );
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(results(response)[0]).toMatchObject({ outcome: "error_dispatch", detail: "send_failed" });
    expect(supabaseMocks.markReportEmailSent).not.toHaveBeenCalled();
  });

  it("does not write the marker when the relay is disabled on the Apps Script side", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true, sent: false, error: "disabled" }), { status: 200 }))
    );
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(results(response)[0]).toMatchObject({ outcome: "error_dispatch", detail: "disabled" });
    expect(supabaseMocks.markReportEmailSent).not.toHaveBeenCalled();
  });

  it("does not send when the feature flag is off", async () => {
    delete process.env.CGI_REPORT_EMAIL_ENABLED;
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(results(response)[0].outcome).toBe("skipped_feature_disabled");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("does not write the marker in dry-run", async () => {
    process.env.CGI_EMAIL_DRY_RUN = "true";
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(results(response)[0].outcome).toBe("dry_run");
    expect(supabaseMocks.markReportEmailSent).not.toHaveBeenCalled();
  });

  describe("backfill mode", () => {
    it("refuses to run without an explicit id list -- it can never scan the base", async () => {
      const response = createResponse();
      await handler(createRequest({ query: { mode: "backfill" } }) as never, response as never);
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({ error: "ids_required" });
      expect(supabaseMocks.getReportEmailCandidates).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("ignores the freshness window for an explicitly authorized old assessment", async () => {
      supabaseMocks.getReportEmailState.mockResolvedValue(stateRow({ completed_at: hoursAgo(500) }));
      const response = createResponse();
      await handler(
        createRequest({ query: { mode: "backfill", ids: "KrjNnuPHmv2Rcv8j" } }) as never,
        response as never
      );
      expect(supabaseMocks.getReportEmailCandidates).not.toHaveBeenCalled();
      expect(results(response)[0].outcome).toBe("sent");
    });

    it("sends when the lead has no CRM row at all (nobody ever worked it)", async () => {
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: true, opportunity: null });
      const response = createResponse();
      await handler(createRequest({ query: { mode: "backfill", ids: "KrjNnuPHmv2Rcv8j" } }) as never, response as never);
      expect(results(response)[0].outcome).toBe("sent");
    });

    it("skips a lead whose commercial status moved past novo", async () => {
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({
        ok: true,
        opportunity: { lead_id: "lead_1", status: "contato_realizado" },
      });
      const response = createResponse();
      await handler(createRequest({ query: { mode: "backfill", ids: "KrjNnuPHmv2Rcv8j" } }) as never, response as never);
      expect(results(response)[0]).toMatchObject({
        outcome: "skipped_commercial_contact",
        detail: "crm_status:contato_realizado",
      });
      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(supabaseMocks.upsertReportAccessToken).not.toHaveBeenCalled();
    });

    it("skips a lead marked novo that nevertheless records a human contact", async () => {
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({
        ok: true,
        opportunity: { lead_id: "lead_1", status: "novo", last_contact_at: "2026-08-06T00:00:00.000Z" },
      });
      const response = createResponse();
      await handler(createRequest({ query: { mode: "backfill", ids: "KrjNnuPHmv2Rcv8j" } }) as never, response as never);
      expect(results(response)[0]).toMatchObject({ detail: "last_contact_at" });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("fails closed when the commercial state cannot be read", async () => {
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: false });
      const response = createResponse();
      await handler(createRequest({ query: { mode: "backfill", ids: "KrjNnuPHmv2Rcv8j" } }) as never, response as never);
      expect(results(response)[0].outcome).toBe("skipped_commercial_state_unknown");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("still refuses an already-sent assessment, so a rerun cannot duplicate", async () => {
      supabaseMocks.getReportEmailState.mockResolvedValue(
        stateRow({ completed_at: hoursAgo(500), report_email_sent_at: "2026-08-18T10:00:00.000Z" })
      );
      const response = createResponse();
      await handler(createRequest({ query: { mode: "backfill", ids: "KrjNnuPHmv2Rcv8j" } }) as never, response as never);
      expect(results(response)[0].outcome).toBe("skipped_already_sent");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("ignores malformed ids and de-duplicates the list", async () => {
      const response = createResponse();
      await handler(
        createRequest({ query: { mode: "backfill", ids: "KrjNnuPHmv2Rcv8j, KrjNnuPHmv2Rcv8j ,,bad id!" } }) as never,
        response as never
      );
      expect((response.body as { candidateCount: number }).candidateCount).toBe(1);
    });
  });
});
