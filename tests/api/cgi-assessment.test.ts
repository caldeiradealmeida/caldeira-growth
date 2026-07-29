import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/cgi-assessment";

const supabaseMocks = vi.hoisted(() => ({
  createEventId: vi.fn(() => "completion_event_generated"),
  getCgiReportState: vi.fn(),
  getReadyCgiReport: vi.fn(),
  insertFunnelEvent: vi.fn(),
  markCgiReportFailed: vi.fn(),
  saveCompletedCgiReport: vi.fn(),
  tryCreateCgiReportGenerationLock: vi.fn(),
  updateCgiReportSecondarySyncStatus: vi.fn(),
  upsertAnswers: vi.fn(),
  upsertAssessment: vi.fn(),
}));

vi.mock("node:dns/promises", () => ({
  resolveMx: vi.fn(async () => [{ exchange: "mail.example.com", priority: 10 }]),
  resolve4: vi.fn(async () => ["93.184.216.34"]),
  resolve6: vi.fn(async () => []),
}));

vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

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

function createValidPayload() {
  const answers = Object.fromEntries(
    Array.from({ length: 40 }, (_, index) => [`q${index + 1}`, 4])
  );

  return {
    action: "cgi_assessment",
    language: "pt",
    lead: {
      name: "Lead Teste",
      email: "lead@example.com",
      phone: "+5511999999999",
      company: "Empresa Teste",
      companyWebsite: "",
      role: "CEO",
      sector: "Tecnologia e software",
      commercialRelationshipModel: "B2B",
      employeeCount: "11-50",
      annualRevenue: "R$ 1-10 milhões",
      currentChallenge: "Escalar vendas",
      growthGoal: "Acima de 50%",
      investmentIntent: "Sim",
      comments: "",
    },
    answers,
    startedAt: String(Date.now() - 10000),
    website: "",
    anonymous_session_id: "session_1",
    public_assessment_id: "assessment_1",
    completion_event_id: "completion_event_1",
  };
}

function createStoredReport() {
  return {
    publicAssessmentId: "assessment_1",
    completionEventId: "completion_event_1",
    reportStatus: "report_ready",
    secondarySyncStatus: "secondary_sync_succeeded",
    aiStatus: "generated",
    aiGenerationStatus: "generated",
    aiReport: JSON.stringify({
      report_title: "Relatório CGI",
      executive_summary: "Resumo executivo existente.",
    }),
    aiReportText: "Resumo executivo existente.",
    reportJson: {
      report_title: "Relatório CGI",
      executive_summary: "Resumo executivo existente.",
    },
    lead: createValidPayload().lead,
    answers: createValidPayload().answers,
    score: { finalScore: 80 },
    websiteEnrichment: { status: "not_provided" },
    requestContext: { country: "BR" },
    language: "pt",
  };
}

describe("POST /api/cgi-assessment Supabase completion best-effort", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "";
    process.env.OPENAI_MODEL = "gpt-5.1";
    process.env.CONTACT_FORM_URL = "";
    process.env.VITE_CONTACT_FORM_URL = "";
    supabaseMocks.createEventId.mockReturnValue("completion_event_generated");
    supabaseMocks.getCgiReportState.mockResolvedValue(null);
    supabaseMocks.getReadyCgiReport.mockResolvedValue(null);
    supabaseMocks.insertFunnelEvent.mockResolvedValue("completion_event_1");
    supabaseMocks.markCgiReportFailed.mockResolvedValue(true);
    supabaseMocks.saveCompletedCgiReport.mockResolvedValue(true);
    supabaseMocks.tryCreateCgiReportGenerationLock.mockResolvedValue({ status: "acquired" });
    supabaseMocks.updateCgiReportSecondarySyncStatus.mockResolvedValue(true);
    supabaseMocks.upsertAnswers.mockResolvedValue(undefined);
    supabaseMocks.upsertAssessment.mockRejectedValue(
      new Error("unexpected_supabase_failure")
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Object.values(supabaseMocks).forEach((mock) => mock.mockReset());
  });

  it("continues the main flow when Supabase completion persistence throws", async () => {
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      save: { ok: false, error: "not_configured" },
      ai: { status: "not_configured" },
    });
    expect(console.error).toHaveBeenCalledWith(
      "[CGI Supabase]",
      expect.objectContaining({
        operation: "persist_completed_assessment",
        public_assessment_id: "assessment_1",
      })
    );
  });

  it("blocks abusive professional content before generation or secondary sync", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();
    const payload = createValidPayload();

    await handler(
      {
        method: "POST",
        headers: {},
        body: {
          ...payload,
          lead: {
            ...payload.lead,
            name: "m.e.r.d.a",
          },
        },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(422);
    expect(response.body).toEqual({
      ok: false,
      error: "invalid_professional_content",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks honeypot spam before generation or secondary sync", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: {
          ...createValidPayload(),
          website: "https://bot-filled-hidden-field.example",
        },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ ok: false, error: "spam_honeypot" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses elapsed time as an early spam signal before generation", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: {
          ...createValidPayload(),
          startedAt: String(Date.now()),
        },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ ok: false, error: "spam_too_fast" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 503 without OpenAI or Sheets when the report lock is unavailable", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.CONTACT_FORM_URL = "https://script.google.test/macros/s/fake/exec";
    supabaseMocks.tryCreateCgiReportGenerationLock.mockResolvedValue({
      status: "unavailable",
      error: "relation_not_found",
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({
      ok: false,
      error: "report_persistence_unavailable",
      report_status: "report_failed",
      message:
        "Não foi possível iniciar a geração do relatório neste momento. Tente novamente em alguns instantes.",
    });
    expect(JSON.stringify(response.body)).not.toContain("relation_not_found");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(supabaseMocks.insertFunnelEvent).not.toHaveBeenCalled();
    expect(supabaseMocks.upsertAssessment).not.toHaveBeenCalled();
    expect(supabaseMocks.upsertAnswers).not.toHaveBeenCalled();
    expect(supabaseMocks.saveCompletedCgiReport).not.toHaveBeenCalled();
    expect(supabaseMocks.markCgiReportFailed).not.toHaveBeenCalled();
    expect(supabaseMocks.updateCgiReportSecondarySyncStatus).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      "[CGI Flow]",
      expect.objectContaining({
        operation: "report_idempotency_lock",
        success: false,
        error_code: "report_persistence_unavailable",
      })
    );
    expect(JSON.stringify((console.info as unknown as { mock: { calls: unknown[][] } }).mock.calls)).not.toContain(
      "relation_not_found"
    );
  });

  it("allows a later manual retry after an unavailable report lock", async () => {
    supabaseMocks.tryCreateCgiReportGenerationLock
      .mockResolvedValueOnce({
        status: "unavailable",
        error: "supabase_internal_detail",
      })
      .mockResolvedValueOnce({ status: "acquired" });
    const firstResponse = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      firstResponse as never
    );

    const retryResponse = createResponse();
    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      retryResponse as never
    );

    expect(firstResponse.statusCode).toBe(503);
    expect(retryResponse.statusCode).toBe(200);
    expect(retryResponse.body).toMatchObject({
      ok: true,
      report_status: "report_ready",
    });
    expect(supabaseMocks.tryCreateCgiReportGenerationLock).toHaveBeenCalledTimes(2);
    expect(supabaseMocks.saveCompletedCgiReport).toHaveBeenCalledTimes(1);
  });

  it("does not return report_ready or call Sheets when final report persistence fails", async () => {
    process.env.CONTACT_FORM_URL = "https://script.google.test/macros/s/fake/exec";
    supabaseMocks.saveCompletedCgiReport.mockResolvedValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(503);
    expect(response.body).toMatchObject({
      ok: false,
      error: "report_persistence_unavailable",
      report_status: "report_failed",
      ai_generation_status: "not_configured",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(supabaseMocks.markCgiReportFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        publicAssessmentId: "assessment_1",
        errorCode: "report_persistence_unavailable",
      })
    );
  });

  it("returns a ready report when Google Sheets secondary sync fails", async () => {
    process.env.CONTACT_FORM_URL = "https://script.google.test/macros/s/fake/exec";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        url: process.env.CONTACT_FORM_URL,
        headers: { get: () => "application/json" },
        text: async () => JSON.stringify({ ok: false, error: "validation" }),
      }))
    );
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      public_assessment_id: "assessment_1",
      completion_event_id: "completion_event_1",
      report_status: "report_ready",
      secondary_sync_status: "secondary_sync_failed",
      save: {
        ok: false,
        error: "apps_script_outdated_or_wrong_deployment",
      },
      ai: { status: "not_configured" },
    });
  });

  it("returns a ready report when Apps Script succeeds after handling email internally", async () => {
    process.env.CONTACT_FORM_URL = "https://script.google.test/macros/s/fake/exec";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        url: process.env.CONTACT_FORM_URL,
        headers: { get: () => "application/json" },
        text: async () => JSON.stringify({ ok: true, type: "cgi_assessment" }),
      }))
    );
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      report_status: "report_ready",
      secondary_sync_status: "secondary_sync_succeeded",
      save: { ok: true },
    });
  });

  it("returns an existing ready report without calling OpenAI or Sheets", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.CONTACT_FORM_URL = "https://script.google.test/macros/s/fake/exec";
    supabaseMocks.getReadyCgiReport.mockResolvedValue(createStoredReport());
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      reused: true,
      public_assessment_id: "assessment_1",
      completion_event_id: "completion_event_1",
      report_status: "report_ready",
      ai: { status: "generated", text: expect.stringContaining("Relatório CGI") },
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(supabaseMocks.tryCreateCgiReportGenerationLock).not.toHaveBeenCalled();
    expect(supabaseMocks.insertFunnelEvent).not.toHaveBeenCalled();
    expect(supabaseMocks.updateCgiReportSecondarySyncStatus).not.toHaveBeenCalled();
  });

  it("reuses a ready report found by completion_event_id even if the request is retried", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const storedReport = createStoredReport();
    supabaseMocks.getReadyCgiReport.mockImplementation(async (input) =>
      input.completionEventId === "completion_event_1" ? storedReport : null
    );
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: {
          ...createValidPayload(),
          public_assessment_id: "assessment_retry",
          completion_event_id: "completion_event_1",
        },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      reused: true,
      public_assessment_id: "assessment_1",
      completion_event_id: "completion_event_1",
      report_status: "report_ready",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(supabaseMocks.tryCreateCgiReportGenerationLock).not.toHaveBeenCalled();
  });

  it("recovers a ready report by public_assessment_id on refresh", async () => {
    supabaseMocks.getCgiReportState.mockResolvedValue({
      status: "ready",
      report: createStoredReport(),
    });
    const response = createResponse();

    await handler(
      {
        method: "GET",
        query: { public_assessment_id: "assessment_1" },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      reused: true,
      public_assessment_id: "assessment_1",
      report_status: "report_ready",
    });
  });

  it("returns report_generating on refresh while another request is still generating", async () => {
    supabaseMocks.getCgiReportState.mockResolvedValue({
      status: "generating",
      publicAssessmentId: "assessment_1",
      completionEventId: "completion_event_1",
    });
    const response = createResponse();

    await handler(
      {
        method: "GET",
        query: { public_assessment_id: "assessment_1" },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(202);
    expect(response.body).toMatchObject({
      ok: true,
      public_assessment_id: "assessment_1",
      report_status: "report_generating",
    });
  });

  it("returns report_failed on refresh after a failed persisted state", async () => {
    supabaseMocks.getCgiReportState.mockResolvedValue({
      status: "failed",
      publicAssessmentId: "assessment_1",
      completionEventId: "completion_event_1",
      errorCode: "report_persistence_unavailable",
    });
    const response = createResponse();

    await handler(
      {
        method: "GET",
        query: { public_assessment_id: "assessment_1" },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(503);
    expect(response.body).toMatchObject({
      ok: false,
      public_assessment_id: "assessment_1",
      report_status: "report_failed",
    });
  });

  it("does not generate again when the client lost the first response after report persistence", async () => {
    let storedReport: ReturnType<typeof createStoredReport> | null = null;
    supabaseMocks.getReadyCgiReport.mockImplementation(async () => storedReport);
    supabaseMocks.tryCreateCgiReportGenerationLock.mockResolvedValue({ status: "acquired" });
    supabaseMocks.saveCompletedCgiReport.mockImplementation(async () => {
      storedReport = createStoredReport();
      return true;
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      createResponse() as never
    );
    const retryResponse = createResponse();
    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      retryResponse as never
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(retryResponse.body).toMatchObject({
      ok: true,
      reused: true,
      report_status: "report_ready",
    });
  });

  it("does not mark the report ready or call Sheets when OpenAI generation fails", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5.1";
    process.env.CONTACT_FORM_URL = "https://script.google.test/macros/s/fake/exec";
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => "temporary_openai_failure",
    }));
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(503);
    expect(response.body).toMatchObject({
      ok: false,
      error: "report_generation_failed",
      report_status: "report_failed",
      ai_generation_status: "error",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("api.openai.com");
    expect(supabaseMocks.saveCompletedCgiReport).not.toHaveBeenCalled();
    expect(supabaseMocks.updateCgiReportSecondarySyncStatus).not.toHaveBeenCalled();
    expect(supabaseMocks.markCgiReportFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        publicAssessmentId: "assessment_1",
        errorCode: "ai_generation_failed",
      })
    );
  });

  it("does not call OpenAI when the model is not explicitly configured", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      report_status: "report_ready",
      ai: { status: "not_configured" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats OpenAI timeout or abort as a generation failure", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5.1";
    process.env.CONTACT_FORM_URL = "https://script.google.test/macros/s/fake/exec";
    const fetchMock = vi.fn(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    });
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(503);
    expect(response.body).toMatchObject({
      ok: false,
      error: "report_generation_failed",
      report_status: "report_failed",
      ai_generation_status: "error",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.saveCompletedCgiReport).not.toHaveBeenCalled();
    expect(supabaseMocks.updateCgiReportSecondarySyncStatus).not.toHaveBeenCalled();
    expect(supabaseMocks.markCgiReportFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        publicAssessmentId: "assessment_1",
        errorCode: "ai_generation_failed",
      })
    );
  });

  it("returns report_generating without calling OpenAI when another tab owns the lock", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    supabaseMocks.tryCreateCgiReportGenerationLock.mockResolvedValue({
      status: "in_progress",
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(202);
    expect(response.body).toMatchObject({
      ok: true,
      report_status: "report_generating",
      secondary_sync_status: "secondary_sync_pending",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns report_failed without calling OpenAI when the persisted lock is failed", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    supabaseMocks.tryCreateCgiReportGenerationLock.mockResolvedValue({
      status: "failed",
      errorCode: "report_persistence_unavailable",
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: createValidPayload(),
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(503);
    expect(response.body).toMatchObject({
      ok: false,
      error: "report_failed",
      report_status: "report_failed",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
