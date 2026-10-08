import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/crm/regenerate-cgi-report";
import { calculateCgiScore } from "../../api/_cgi-core";

const supabaseMocks = vi.hoisted(() => ({
  getAssessmentById: vi.fn(),
  getLeadById: vi.fn(),
  getAnswersByAssessmentId: vi.fn(),
  getMaxCgiReportVersion: vi.fn(),
  insertRegeneratedCgiReport: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

const assessmentMocks = vi.hoisted(() => ({
  enrichCompanyWebsite: vi.fn(async () => ({ status: "not_provided" })),
  generateAiDiagnostic: vi.fn(),
  getConfiguredOpenAiModel: vi.fn(() => "gpt-5.1"),
}));
vi.mock("../../api/cgi-assessment.js", () => assessmentMocks);

const originalEnv = { ...process.env };

function createResponse() {
  return {
    statusCode: 0,
    body: undefined as unknown,
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

function fullAnswers(overrides: Record<string, number> = {}) {
  const answers = Object.fromEntries(
    Array.from({ length: 40 }, (_, index) => [`q${index + 1}`, 4])
  );
  return { ...answers, ...overrides };
}

function mockFetchAsAdmin(isAdmin: boolean) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ email: "deniscaldeira@caldeiragrowth.com" }), { status: 200 });
    }
    if (url.includes("/rest/v1/crm_admins")) {
      return new Response(JSON.stringify(isAdmin ? [{ email: "deniscaldeira@caldeiragrowth.com" }] : []), {
        status: 200,
      });
    }
    throw new Error(`Unexpected fetch in test: ${url}`);
  });
}

function completedAssessment(overrides: Record<string, unknown> = {}) {
  return {
    id: "assessment_1",
    lead_id: "lead_1",
    public_assessment_id: "pub_1",
    status: "completed",
    cgi_score: 84,
    strategy_score: 80,
    market_customer_score: 84,
    growth_engine_score: 84,
    execution_management_score: 84,
    leadership_culture_score: 88,
    cgi_level: "structured",
    lowest_dimension: "strategy",
    highest_dimension: "leadership",
    ...overrides,
  };
}

function leadRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead_1",
    name: "Marines Menegatti",
    email: "marines@gabelseguros.com",
    phone: "+5511999999999",
    company: "Gabel Seguros",
    company_website: "",
    role: "Proprietária",
    sector: "Seguros",
    commercial_relationship_model: "B2B",
    employee_count: "11-50",
    annual_revenue_range: "R$ 1-10 milhões",
    current_challenge: "Escalar vendas",
    growth_goal: "Acima de 50%",
    investment_intent: "Sim",
    comments: null,
    ...overrides,
  };
}

describe("POST /api/crm/regenerate-cgi-report", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
    process.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
    supabaseMocks.getAssessmentById.mockReset();
    supabaseMocks.getLeadById.mockReset();
    supabaseMocks.getAnswersByAssessmentId.mockReset();
    supabaseMocks.getMaxCgiReportVersion.mockReset();
    supabaseMocks.insertRegeneratedCgiReport.mockReset();
    assessmentMocks.enrichCompanyWebsite.mockClear();
    assessmentMocks.generateAiDiagnostic.mockReset();
    assessmentMocks.getConfiguredOpenAiModel.mockReturnValue("gpt-5.1");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("rejects requests without a bearer token", async () => {
    vi.stubGlobal("fetch", mockFetchAsAdmin(true));
    const response = createResponse();

    await handler(
      { method: "POST", headers: {}, body: { assessment_id: "assessment_1" } } as never,
      response as never
    );

    expect(response.statusCode).toBe(403);
    expect(supabaseMocks.getAssessmentById).not.toHaveBeenCalled();
  });

  it("rejects a valid session that is not in crm_admins", async () => {
    vi.stubGlobal("fetch", mockFetchAsAdmin(false));
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: { authorization: "Bearer faketoken" },
        body: { assessment_id: "assessment_1" },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(403);
    expect(supabaseMocks.getAssessmentById).not.toHaveBeenCalled();
  });

  it("refuses to regenerate an assessment that is not completed", async () => {
    vi.stubGlobal("fetch", mockFetchAsAdmin(true));
    supabaseMocks.getAssessmentById.mockResolvedValue(completedAssessment({ status: "in_progress" }));
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: { authorization: "Bearer faketoken" },
        body: { assessment_id: "assessment_1" },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(422);
    expect(assessmentMocks.generateAiDiagnostic).not.toHaveBeenCalled();
  });

  it("blocks regeneration when the recomputed score does not match the original (methodology drift guard)", async () => {
    vi.stubGlobal("fetch", mockFetchAsAdmin(true));
    supabaseMocks.getAssessmentById.mockResolvedValue(completedAssessment({ cgi_score: 10 }));
    supabaseMocks.getLeadById.mockResolvedValue(leadRow());
    supabaseMocks.getAnswersByAssessmentId.mockResolvedValue(fullAnswers());
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: { authorization: "Bearer faketoken" },
        body: { assessment_id: "assessment_1" },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(409);
    expect(assessmentMocks.generateAiDiagnostic).not.toHaveBeenCalled();
    expect(supabaseMocks.insertRegeneratedCgiReport).not.toHaveBeenCalled();
  });

  it("uses the original answers and score, never a previous report, and never touches Apps Script or email", async () => {
    const fetchMock = mockFetchAsAdmin(true);
    vi.stubGlobal("fetch", fetchMock);
    const originalAnswers = fullAnswers({ q22: 2 });
    const originalScore = calculateCgiScore(originalAnswers);
    supabaseMocks.getAssessmentById.mockResolvedValue(
      completedAssessment({ cgi_score: Math.round(originalScore.finalScore) })
    );
    supabaseMocks.getLeadById.mockResolvedValue(leadRow({ comments: "Comentário original." }));
    supabaseMocks.getAnswersByAssessmentId.mockResolvedValue(originalAnswers);
    supabaseMocks.getMaxCgiReportVersion.mockResolvedValue(0);
    assessmentMocks.generateAiDiagnostic.mockResolvedValue({
      status: "generated",
      text: JSON.stringify({ report_title: "Novo relatório" }),
      plainText: "Novo relatório em texto plano.",
    });
    supabaseMocks.insertRegeneratedCgiReport.mockResolvedValue({
      ok: true,
      report: {
        id: "report_2",
        version: 1,
        aiReportText: "Novo relatório em texto plano.",
        reportJson: { report_title: "Novo relatório" },
        model: "gpt-5.1",
        language: "pt",
        generationCompletedAt: "2026-08-06T12:00:00.000Z",
      },
    });

    const response = createResponse();
    await handler(
      {
        method: "POST",
        headers: { authorization: "Bearer faketoken" },
        body: { assessment_id: "assessment_1" },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ ok: true, report: { version: 1, id: "report_2" } });

    // Original answers/score reused verbatim -- no recalculation with new methodology beyond
    // the pure, deterministic recompute that must match the persisted score exactly.
    const diagnosticCall = assessmentMocks.generateAiDiagnostic.mock.calls[0][0];
    expect(diagnosticCall.answers).toEqual(originalAnswers);
    expect(diagnosticCall.score.finalScore).toBe(originalScore.finalScore);
    expect(diagnosticCall.lead.comments).toBe("Comentário original.");

    // insertRegeneratedCgiReport receives the same original lead/answers/score, not any
    // content derived from a previous report -- and next version is max(version)+1.
    const insertCall = supabaseMocks.insertRegeneratedCgiReport.mock.calls[0][0];
    expect(insertCall.version).toBe(1);
    expect(insertCall.answers).toEqual(originalAnswers);

    // Never calls Apps Script or any email-sending endpoint -- every fetch call in this
    // test is accounted for by the admin-auth mock (auth/v1/user + crm_admins lookup).
    for (const call of fetchMock.mock.calls) {
      const url = String(call[0]);
      expect(url).not.toContain("script.google.com");
      expect(url.includes("/auth/v1/user") || url.includes("/rest/v1/crm_admins")).toBe(true);
    }
  });

  it("does not persist anything when AI generation fails, preserving whatever report already existed", async () => {
    vi.stubGlobal("fetch", mockFetchAsAdmin(true));
    const answers = fullAnswers();
    const score = calculateCgiScore(answers);
    supabaseMocks.getAssessmentById.mockResolvedValue(
      completedAssessment({ cgi_score: Math.round(score.finalScore) })
    );
    supabaseMocks.getLeadById.mockResolvedValue(leadRow());
    supabaseMocks.getAnswersByAssessmentId.mockResolvedValue(answers);
    supabaseMocks.getMaxCgiReportVersion.mockResolvedValue(1);
    assessmentMocks.generateAiDiagnostic.mockResolvedValue({ status: "error", text: "", plainText: "" });

    const response = createResponse();
    await handler(
      {
        method: "POST",
        headers: { authorization: "Bearer faketoken" },
        body: { assessment_id: "assessment_1" },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(503);
    expect(supabaseMocks.insertRegeneratedCgiReport).not.toHaveBeenCalled();
  });

  it("fails clearly and safely (409, no overwrite) when the legacy single-row constraint still blocks a second version", async () => {
    vi.stubGlobal("fetch", mockFetchAsAdmin(true));
    const answers = fullAnswers();
    const score = calculateCgiScore(answers);
    supabaseMocks.getAssessmentById.mockResolvedValue(
      completedAssessment({ cgi_score: Math.round(score.finalScore) })
    );
    supabaseMocks.getLeadById.mockResolvedValue(leadRow());
    supabaseMocks.getAnswersByAssessmentId.mockResolvedValue(answers);
    supabaseMocks.getMaxCgiReportVersion.mockResolvedValue(1);
    assessmentMocks.generateAiDiagnostic.mockResolvedValue({
      status: "generated",
      text: JSON.stringify({ report_title: "Novo" }),
      plainText: "Novo texto.",
    });
    // Simulates Phase 1/2 of the rollout: cgi_reports_public_assessment_id_key
    // still exists, so the plain INSERT for version 2 is rejected by Postgres.
    supabaseMocks.insertRegeneratedCgiReport.mockResolvedValue({ ok: false, reason: "conflict" });

    const response = createResponse();
    await handler(
      {
        method: "POST",
        headers: { authorization: "Bearer faketoken" },
        body: { assessment_id: "assessment_1" },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(409);
    expect(response.body).toMatchObject({ ok: false, error: "versioning_not_enabled" });
  });
});
