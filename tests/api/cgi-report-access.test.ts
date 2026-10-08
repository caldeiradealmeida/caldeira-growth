import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tokenMocks = vi.hoisted(() => ({
  resolveReportAccessToken: vi.fn(),
}));
vi.mock("../../api/_cgi-report-token.js", () => tokenMocks);

const supabaseMocks = vi.hoisted(() => ({
  getAssessmentByPublicId: vi.fn(),
  getAnswersByAssessmentId: vi.fn(),
  getLeadById: vi.fn(),
  getCgiReportState: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import handler from "../../api/cgi-report-access";

function createResponse() {
  const headers: Record<string, string> = {};
  return {
    statusCode: 0,
    body: undefined as unknown,
    headers,
    setHeader(key: string, value: string) {
      headers[key] = value;
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
    headers: { "content-type": "application/json" },
    body: { t: "sometoken" },
    ...overrides,
  };
}

function inProgressAssessment(overrides: Record<string, unknown> = {}) {
  return {
    id: "assessment_row_1",
    lead_id: "lead_1",
    public_assessment_id: "pub_1",
    status: "in_progress",
    current_question: 16,
    progress_percent: 40,
    ...overrides,
  };
}

function leadRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead_1",
    name: "Marines",
    email: "marines@example.com",
    phone: "+5511999999999",
    company: "Empresa Teste",
    company_website: "https://example.com",
    role: "CEO",
    sector: "Tecnologia e software",
    commercial_relationship_model: "B2B",
    employee_count: "1-10",
    annual_revenue_range: "Prefiro não informar",
    current_challenge: "Crescer receita",
    growth_goal: "11-25%",
    investment_intent: "Ainda avaliando",
    comments: "",
    ...overrides,
  };
}

describe("POST /api/cgi-report-access", () => {
  beforeEach(() => {
    tokenMocks.resolveReportAccessToken.mockReset();
    supabaseMocks.getAssessmentByPublicId.mockReset();
    supabaseMocks.getAnswersByAssessmentId.mockReset();
    supabaseMocks.getLeadById.mockReset();
    supabaseMocks.getCgiReportState.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects non-POST methods with 405", async () => {
    const response = createResponse();
    await handler(createRequest({ method: "GET" }) as never, response as never);
    expect(response.statusCode).toBe(405);
  });

  it("rejects a non-JSON content type", async () => {
    const response = createResponse();
    await handler(
      createRequest({ headers: { "content-type": "text/plain" } }) as never,
      response as never
    );
    expect(response.statusCode).toBe(415);
  });

  it("rejects a request with an oversized content-length before parsing", async () => {
    const response = createResponse();
    await handler(
      createRequest({ headers: { "content-type": "application/json", "content-length": "999999" } }) as never,
      response as never
    );
    expect(response.statusCode).toBe(400);
    expect(tokenMocks.resolveReportAccessToken).not.toHaveBeenCalled();
  });

  it("returns a safe response for a missing/malformed body", async () => {
    const response = createResponse();
    await handler(createRequest({ body: null }) as never, response as never);
    expect(response.statusCode).toBe(400);
  });

  it("ignores a token supplied only via query string", async () => {
    const response = createResponse();
    await handler(
      createRequest({ body: {}, query: { t: "sometoken" } }) as never,
      response as never
    );
    expect(response.body).toEqual({ ok: true, state: "link_unavailable" });
    expect(tokenMocks.resolveReportAccessToken).not.toHaveBeenCalled();
  });

  it("rejects a token longer than the strict length limit before hashing", async () => {
    const response = createResponse();
    await handler(createRequest({ body: { t: "x".repeat(600) } }) as never, response as never);
    expect(response.body).toEqual({ ok: true, state: "link_unavailable" });
    expect(tokenMocks.resolveReportAccessToken).not.toHaveBeenCalled();
  });

  it("sets Cache-Control, Referrer-Policy and X-Robots-Tag on every response", async () => {
    tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "link_unavailable" });
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.headers["Cache-Control"]).toBe("no-store, private");
    expect(response.headers["Referrer-Policy"]).toBe("no-referrer");
    expect(response.headers["X-Robots-Tag"]).toBe("noindex, nofollow");
  });

  it("returns link_unavailable for an invalid token, without revealing why", async () => {
    tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "link_unavailable" });
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.body).toEqual({ ok: true, state: "link_unavailable" });
    expect(supabaseMocks.getAssessmentByPublicId).not.toHaveBeenCalled();
  });

  it("returns link_unavailable (not a distinct error) when the token resolves but the assessment is gone", async () => {
    tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(null);
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.body).toEqual({ ok: true, state: "link_unavailable" });
  });

  it("never exposes public_assessment_id anywhere in the link_unavailable response body", async () => {
    tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1_secret" });
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(null);
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(JSON.stringify(response.body)).not.toContain("pub_1_secret");
  });

  describe("report_ready regression (unchanged behavior)", () => {
    it("returns report_unavailable when completed but the report isn't ready", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment({ status: "completed" }));
      supabaseMocks.getCgiReportState.mockResolvedValue(null);
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toEqual({ ok: true, state: "report_unavailable" });
    });

    it("returns report_generating while the report is still being produced", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment({ status: "completed" }));
      supabaseMocks.getCgiReportState.mockResolvedValue({
        status: "generating",
        publicAssessmentId: "pub_1",
        completionEventId: "evt_1",
      });
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toEqual({ ok: true, state: "report_generating" });
    });

    it("returns report_failed as a distinct, safe state for a genuinely failed report", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment({ status: "completed" }));
      supabaseMocks.getCgiReportState.mockResolvedValue({
        status: "failed",
        publicAssessmentId: "pub_1",
        completionEventId: "evt_1",
        errorCode: "generation_error",
      });
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toEqual({ ok: true, state: "report_failed" });
    });

    it("returns the report data on a valid token with a ready report, never leaking public_assessment_id, and shows the latest version (getCgiReportState semantics)", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment({ status: "completed" }));
      supabaseMocks.getCgiReportState.mockResolvedValue({
        status: "ready",
        report: {
          publicAssessmentId: "pub_1",
          language: "pt",
          score: { finalScore: 84 },
          lead: { name: "Marines" },
          reportJson: { report_title: "Relatório" },
          aiReportText: "texto",
        },
      });
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toMatchObject({
        ok: true,
        state: "ready",
        data: {
          language: "pt",
          score: { finalScore: 84 },
          lead: { name: "Marines" },
          reportJson: { report_title: "Relatório" },
        },
      });
      expect(JSON.stringify(response.body)).not.toContain("pub_1");
      expect(supabaseMocks.getCgiReportState).toHaveBeenCalledWith({ publicAssessmentId: "pub_1" });
    });

    it("returns a generic error state if report-state lookup throws", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment({ status: "completed" }));
      supabaseMocks.getCgiReportState.mockRejectedValue(new Error("boom"));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toEqual({ ok: true, state: "error" });
    });
  });

  describe("cross-device resume (Etapa 3)", () => {
    it("resumes an in_progress assessment with persisted answers and lead", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment());
      supabaseMocks.getAnswersByAssessmentId.mockResolvedValue({ q1: 4, q2: 3 });
      supabaseMocks.getLeadById.mockResolvedValue(leadRow());
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toMatchObject({
        ok: true,
        state: "resume",
        data: {
          publicAssessmentId: "pub_1",
          status: "in_progress",
          answers: { q1: 4, q2: 3 },
          currentQuestion: 16,
          progressPercent: 40,
          lead: { name: "Marines", email: "marines@example.com", company: "Empresa Teste" },
        },
      });
      expect(supabaseMocks.getAnswersByAssessmentId).toHaveBeenCalledWith("assessment_row_1");
      expect(supabaseMocks.getLeadById).toHaveBeenCalledWith("lead_1");
    });

    it("never touches report generation/cgi_reports for a non-completed assessment", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment());
      supabaseMocks.getAnswersByAssessmentId.mockResolvedValue({ q1: 4 });
      supabaseMocks.getLeadById.mockResolvedValue(leadRow());
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.statusCode).toBe(200);
      expect(supabaseMocks.getCgiReportState).not.toHaveBeenCalled();
    });

    it("returns lead: null when the assessment has no lead_id yet (status created)", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(
        inProgressAssessment({ status: "created", lead_id: null, current_question: 0, progress_percent: 0 })
      );
      supabaseMocks.getAnswersByAssessmentId.mockResolvedValue({});
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toMatchObject({
        ok: true,
        state: "resume",
        data: { status: "created", answers: {}, lead: null },
      });
      expect(supabaseMocks.getLeadById).not.toHaveBeenCalled();
    });

    it("resumes a lead_captured assessment (identification done, no answers yet)", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(
        inProgressAssessment({ status: "lead_captured", current_question: 0, progress_percent: 0 })
      );
      supabaseMocks.getAnswersByAssessmentId.mockResolvedValue({});
      supabaseMocks.getLeadById.mockResolvedValue(leadRow());
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toMatchObject({
        ok: true,
        state: "resume",
        data: { status: "lead_captured", answers: {} },
      });
    });

    it("treats an abandoned assessment as resumable too", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment({ status: "abandoned" }));
      supabaseMocks.getAnswersByAssessmentId.mockResolvedValue({ q1: 4 });
      supabaseMocks.getLeadById.mockResolvedValue(leadRow());
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toMatchObject({ ok: true, state: "resume", data: { status: "abandoned" } });
    });

    it("returns a generic error state if fetching answers/lead throws", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment());
      supabaseMocks.getAnswersByAssessmentId.mockRejectedValue(new Error("boom"));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toEqual({ ok: true, state: "error" });
    });

    it("never creates a new assessment or a new lead -- only read functions are mocked/available, so any create attempt would surface as state: error instead of resume", async () => {
      // _cgi-supabase.js is fully mocked to exactly these four read
      // functions (see supabaseMocks above). If the handler ever called
      // upsertAssessment/createPublicAssessmentId/persistLeadForAssessment,
      // that call would throw ("... is not a function") and the handler's
      // catch block would turn this into state: "error", not "resume".
      // Asserting the happy-path "resume" result is therefore already proof
      // no creation path was touched; this test documents that guarantee.
      expect(Object.keys(supabaseMocks).sort()).toEqual(
        ["getAnswersByAssessmentId", "getAssessmentByPublicId", "getCgiReportState", "getLeadById"].sort()
      );
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment());
      supabaseMocks.getAnswersByAssessmentId.mockResolvedValue({ q1: 4 });
      supabaseMocks.getLeadById.mockResolvedValue(leadRow());
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toMatchObject({ ok: true, state: "resume" });
    });

    it("returns a generic error state if the initial assessment lookup throws", async () => {
      tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
      supabaseMocks.getAssessmentByPublicId.mockRejectedValue(new Error("boom"));
      const response = createResponse();
      await handler(createRequest() as never, response as never);
      expect(response.body).toEqual({ ok: true, state: "error" });
    });
  });

  it("returns a generic error state if token resolution throws", async () => {
    tokenMocks.resolveReportAccessToken.mockRejectedValue(new Error("boom"));
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.body).toEqual({ ok: true, state: "error" });
  });
});
