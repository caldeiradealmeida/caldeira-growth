import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  getAbandonmentCandidates: vi.fn(),
  getAssessmentEmailState: vi.fn(),
  getLeadById: vi.fn(),
  markAbandonmentEmailSent: vi.fn(),
  upsertReportAccessToken: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import handler from "../../api/cgi/abandonment-sweep";

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
    ...overrides,
  };
}

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    id: "assessment_row_1",
    public_assessment_id: "pub_1",
    lead_id: "lead_1",
    current_question: 16,
    last_activity_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function eligibleFreshRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "assessment_row_1",
    public_assessment_id: "pub_1",
    status: "in_progress",
    current_question: 16,
    abandonment_email_sent_at: null,
    report_email_sent_at: null,
    ...overrides,
  };
}

function leadRow(overrides: Record<string, unknown> = {}) {
  return { id: "lead_1", name: "Marines", email: "marines@example.com", ...overrides };
}

describe("POST /api/cgi/abandonment-sweep", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "cron-secret";
    process.env.CGI_ABANDONMENT_EMAIL_ENABLED = "true";
    process.env.CONTACT_FORM_URL = "https://script.google.test/exec";
    process.env.CGI_EMAIL_RELAY_TOKEN = "relay-secret";
    delete process.env.CGI_EMAIL_DRY_RUN;
    delete process.env.CGI_ABANDONMENT_DELAY_HOURS;
    delete process.env.VERCEL_ENV;
    delete process.env.CGI_ABANDONMENT_TEST_ASSESSMENT_ID;

    supabaseMocks.getAbandonmentCandidates.mockReset().mockResolvedValue([]);
    supabaseMocks.getAssessmentEmailState.mockReset();
    supabaseMocks.getLeadById.mockReset();
    supabaseMocks.markAbandonmentEmailSent.mockReset().mockResolvedValue(true);
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

  it("13. rejects a call without the correct Authorization header", async () => {
    const response = createResponse();
    await handler(createRequest({ headers: {} }) as never, response as never);
    expect(response.statusCode).toBe(401);
    expect(supabaseMocks.getAbandonmentCandidates).not.toHaveBeenCalled();
  });

  it("13b. rejects a call with the wrong secret", async () => {
    const response = createResponse();
    await handler(createRequest({ headers: { authorization: "Bearer wrong" } }) as never, response as never);
    expect(response.statusCode).toBe(401);
  });

  it("fails closed when CRON_SECRET itself is unset, even with a matching-looking header", async () => {
    delete process.env.CRON_SECRET;
    const response = createResponse();
    await handler(createRequest({ headers: { authorization: "Bearer undefined" } }) as never, response as never);
    expect(response.statusCode).toBe(401);
  });

  it("rejects non-GET/POST methods", async () => {
    const response = createResponse();
    await handler(createRequest({ method: "DELETE" }) as never, response as never);
    expect(response.statusCode).toBe(405);
  });

  it("1. sends the abandonment email for an eligible candidate and marks it sent", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(eligibleFreshRow());
    supabaseMocks.getLeadById.mockResolvedValue(leadRow());
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      results: [{ publicAssessmentId: "pub_1", outcome: "sent" }],
    });
    expect(supabaseMocks.markAbandonmentEmailSent).toHaveBeenCalledWith("pub_1");
    expect(supabaseMocks.upsertReportAccessToken).toHaveBeenCalledTimes(1);
  });

  it("7. does not send when status changed to completed between query and send (race condition)", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(eligibleFreshRow({ status: "completed" }));
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.body).toMatchObject({
      results: [{ publicAssessmentId: "pub_1", outcome: "skipped_not_eligible_anymore" }],
    });
    expect(supabaseMocks.getLeadById).not.toHaveBeenCalled();
    expect(supabaseMocks.upsertReportAccessToken).not.toHaveBeenCalled();
    expect(supabaseMocks.markAbandonmentEmailSent).not.toHaveBeenCalled();
  });

  it("6. does not send when abandonment_email_sent_at is already set at revalidation time", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(
      eligibleFreshRow({ abandonment_email_sent_at: "2026-08-10T00:00:00.000Z" })
    );
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.body).toMatchObject({
      results: [{ publicAssessmentId: "pub_1", outcome: "skipped_not_eligible_anymore" }],
    });
    expect(supabaseMocks.markAbandonmentEmailSent).not.toHaveBeenCalled();
  });

  it("5. does not send when report_email_sent_at is already set (report_ready reached)", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(
      eligibleFreshRow({ report_email_sent_at: "2026-08-10T00:00:00.000Z" })
    );
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.body).toMatchObject({
      results: [{ publicAssessmentId: "pub_1", outcome: "skipped_not_eligible_anymore" }],
    });
  });

  it("does not send when current_question is 0 at revalidation time", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(eligibleFreshRow({ current_question: 0 }));
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.body).toMatchObject({
      results: [{ publicAssessmentId: "pub_1", outcome: "skipped_not_eligible_anymore" }],
    });
  });

  it("11. skips when the lead lookup returns nothing", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(eligibleFreshRow());
    supabaseMocks.getLeadById.mockResolvedValue(null);
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.body).toMatchObject({
      results: [{ publicAssessmentId: "pub_1", outcome: "skipped_no_lead" }],
    });
    expect(supabaseMocks.upsertReportAccessToken).not.toHaveBeenCalled();
  });

  it("11b. skips when the lead has no email", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(eligibleFreshRow());
    supabaseMocks.getLeadById.mockResolvedValue(leadRow({ email: "" }));
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.body).toMatchObject({
      results: [{ publicAssessmentId: "pub_1", outcome: "skipped_recipient" }],
    });
  });

  it("dry-run identifies the candidate, builds the token, but never calls Apps Script or marks sent", async () => {
    process.env.CGI_EMAIL_DRY_RUN = "true";
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(eligibleFreshRow());
    supabaseMocks.getLeadById.mockResolvedValue(leadRow());
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.body).toMatchObject({
      dryRun: true,
      results: [{ publicAssessmentId: "pub_1", outcome: "dry_run" }],
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(supabaseMocks.markAbandonmentEmailSent).not.toHaveBeenCalled();
  });

  it("error_token: does not mark sent when token issuance fails", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(eligibleFreshRow());
    supabaseMocks.getLeadById.mockResolvedValue(leadRow());
    supabaseMocks.upsertReportAccessToken.mockResolvedValue(false);
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.body).toMatchObject({
      results: [{ publicAssessmentId: "pub_1", outcome: "error_token" }],
    });
    expect(supabaseMocks.markAbandonmentEmailSent).not.toHaveBeenCalled();
  });

  it("error_dispatch: does not mark sent when Apps Script rejects the relay", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(eligibleFreshRow());
    supabaseMocks.getLeadById.mockResolvedValue(leadRow());
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true, sent: false, error: "disabled" }), { status: 200 }))
    );
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.body).toMatchObject({
      results: [{ publicAssessmentId: "pub_1", outcome: "error_dispatch", detail: "disabled" }],
    });
    expect(supabaseMocks.markAbandonmentEmailSent).not.toHaveBeenCalled();
  });

  it("14. one candidate throwing does not interrupt the rest of the batch", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([
      candidate({ public_assessment_id: "pub_bad" }),
      candidate({ public_assessment_id: "pub_good" }),
    ]);
    supabaseMocks.getAssessmentEmailState.mockImplementation(async (id: string) => {
      if (id === "pub_bad") throw new Error("boom");
      return eligibleFreshRow({ public_assessment_id: id });
    });
    supabaseMocks.getLeadById.mockResolvedValue(leadRow());
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.statusCode).toBe(200);
    const outcomes = (response.body as { results: Array<{ publicAssessmentId: string; outcome: string }> }).results;
    expect(outcomes).toHaveLength(2);
    expect(outcomes.find((r) => r.publicAssessmentId === "pub_bad")?.outcome).toBe("error_dispatch");
    expect(outcomes.find((r) => r.publicAssessmentId === "pub_good")?.outcome).toBe("sent");
    expect(supabaseMocks.markAbandonmentEmailSent).toHaveBeenCalledWith("pub_good");
  });

  it("12. queries with a bounded batch limit", async () => {
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(supabaseMocks.getAbandonmentCandidates).toHaveBeenCalledWith(
      expect.objectContaining({ limit: expect.any(Number) })
    );
    const call = supabaseMocks.getAbandonmentCandidates.mock.calls[0][0];
    expect(call.limit).toBeGreaterThan(0);
    expect(call.limit).toBeLessThanOrEqual(100);
  });

  it("respects CGI_ABANDONMENT_DELAY_HOURS as a single configurable constant", async () => {
    process.env.CGI_ABANDONMENT_DELAY_HOURS = "48";
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    const call = supabaseMocks.getAbandonmentCandidates.mock.calls[0][0];
    const hoursAgo = (Date.now() - new Date(call.cutoffIso).getTime()) / (60 * 60 * 1000);
    expect(hoursAgo).toBeGreaterThan(47.9);
    expect(hoursAgo).toBeLessThan(48.1);
    expect(response.statusCode).toBe(200);
  });

  it("candidate query failure returns a clean 500 without throwing", async () => {
    supabaseMocks.getAbandonmentCandidates.mockRejectedValue(new Error("db down"));
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.statusCode).toBe(500);
  });

  it("the CTA link uses the exact same report-access token mechanism (fragment-based /cgi/relatorio#t=)", async () => {
    supabaseMocks.getAbandonmentCandidates.mockResolvedValue([candidate()]);
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(eligibleFreshRow());
    supabaseMocks.getLeadById.mockResolvedValue(leadRow());
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.plainText).toMatch(/https:\/\/www\.caldeiragrowth\.com\/cgi\/relatorio#t=[^\s]+/);
      expect(body.plainText).not.toMatch(/[?&]t=/);
      return new Response(JSON.stringify({ ok: true, sent: true }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(createRequest() as never, response as never);
    expect(response.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  describe("CGI_ABANDONMENT_TEST_ASSESSMENT_ID (preview-only single-candidate override)", () => {
    it("1. preview + override: only the matching technical assessment is processed, real candidates are skipped entirely", async () => {
      process.env.VERCEL_ENV = "preview";
      process.env.CGI_ABANDONMENT_TEST_ASSESSMENT_ID = "pub_technical";
      const technical = candidate({ public_assessment_id: "pub_technical", lead_id: "lead_technical" });
      const real1 = candidate({ public_assessment_id: "pub_real_1", lead_id: "lead_real_1" });
      const real2 = candidate({ public_assessment_id: "pub_real_2", lead_id: "lead_real_2" });
      supabaseMocks.getAbandonmentCandidates.mockResolvedValue([real1, technical, real2]);
      supabaseMocks.getAssessmentEmailState.mockResolvedValue(
        eligibleFreshRow({ public_assessment_id: "pub_technical" })
      );
      supabaseMocks.getLeadById.mockResolvedValue(leadRow({ id: "lead_technical" }));
      const response = createResponse();

      await handler(createRequest() as never, response as never);

      expect(response.statusCode).toBe(200);
      const body = response.body as { candidateCount: number; results: Array<{ publicAssessmentId: string }> };
      expect(body.candidateCount).toBe(1);
      expect(body.results).toHaveLength(1);
      expect(body.results[0].publicAssessmentId).toBe("pub_technical");
      expect(supabaseMocks.getAssessmentEmailState).toHaveBeenCalledTimes(1);
      expect(supabaseMocks.getAssessmentEmailState).toHaveBeenCalledWith("pub_technical");
      expect(supabaseMocks.getLeadById).toHaveBeenCalledTimes(1);
      expect(supabaseMocks.getLeadById).toHaveBeenCalledWith("lead_technical");
    });

    it("2. preview without override: normal batch behavior, every eligible candidate is processed", async () => {
      process.env.VERCEL_ENV = "preview";
      const real1 = candidate({ public_assessment_id: "pub_real_1", lead_id: "lead_real_1" });
      const real2 = candidate({ public_assessment_id: "pub_real_2", lead_id: "lead_real_2" });
      supabaseMocks.getAbandonmentCandidates.mockResolvedValue([real1, real2]);
      supabaseMocks.getAssessmentEmailState.mockImplementation(async (id: string) =>
        eligibleFreshRow({ public_assessment_id: id })
      );
      supabaseMocks.getLeadById.mockImplementation(async (id: string) => leadRow({ id }));
      const response = createResponse();

      await handler(createRequest() as never, response as never);

      expect(response.statusCode).toBe(200);
      const body = response.body as { candidateCount: number; results: Array<{ publicAssessmentId: string }> };
      expect(body.candidateCount).toBe(2);
      expect(body.results.map((r) => r.publicAssessmentId).sort()).toEqual(["pub_real_1", "pub_real_2"]);
    });

    it("3. production + override: override is ignored by construction, every eligible candidate is processed", async () => {
      process.env.VERCEL_ENV = "production";
      process.env.CGI_ABANDONMENT_TEST_ASSESSMENT_ID = "pub_technical";
      const technical = candidate({ public_assessment_id: "pub_technical", lead_id: "lead_technical" });
      const real1 = candidate({ public_assessment_id: "pub_real_1", lead_id: "lead_real_1" });
      supabaseMocks.getAbandonmentCandidates.mockResolvedValue([technical, real1]);
      supabaseMocks.getAssessmentEmailState.mockImplementation(async (id: string) =>
        eligibleFreshRow({ public_assessment_id: id })
      );
      supabaseMocks.getLeadById.mockImplementation(async (id: string) => leadRow({ id }));
      const response = createResponse();

      await handler(createRequest() as never, response as never);

      expect(response.statusCode).toBe(200);
      const body = response.body as { candidateCount: number; results: Array<{ publicAssessmentId: string }> };
      expect(body.candidateCount).toBe(2);
      expect(body.results.map((r) => r.publicAssessmentId).sort()).toEqual(["pub_real_1", "pub_technical"]);
    });

    it("4. preview + override: no real lead is ever looked up, dispatched to, or marked sent", async () => {
      process.env.VERCEL_ENV = "preview";
      process.env.CGI_ABANDONMENT_TEST_ASSESSMENT_ID = "pub_technical";
      const technical = candidate({ public_assessment_id: "pub_technical", lead_id: "lead_technical" });
      const real1 = candidate({ public_assessment_id: "pub_real_1", lead_id: "lead_real_1" });
      supabaseMocks.getAbandonmentCandidates.mockResolvedValue([real1, technical]);
      supabaseMocks.getAssessmentEmailState.mockResolvedValue(
        eligibleFreshRow({ public_assessment_id: "pub_technical" })
      );
      supabaseMocks.getLeadById.mockResolvedValue(leadRow({ id: "lead_technical" }));
      const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, sent: true }), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);
      const response = createResponse();

      await handler(createRequest() as never, response as never);

      expect(response.statusCode).toBe(200);
      expect(supabaseMocks.getLeadById).not.toHaveBeenCalledWith("lead_real_1");
      expect(supabaseMocks.markAbandonmentEmailSent).toHaveBeenCalledTimes(1);
      expect(supabaseMocks.markAbandonmentEmailSent).toHaveBeenCalledWith("pub_technical");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
