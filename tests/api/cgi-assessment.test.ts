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

function validOpenAiReport(overrides: Record<string, unknown> = {}) {
  const paragraph =
    "As respostas deste executivo indicam sinais especificos de maturidade, mas a leitura deve ser validada com outras liderancas e dados internos antes de virar decisao definitiva.";
  const bottleneck =
    "Título: Foco executivo. Sinal observado: As respostas deste executivo indicam tensao entre ambicao e disciplina. Causa provável: a rotina pode estar absorvendo energia demais. Impacto estratégico: ha risco de dispersao se a hipotese nao for validada.";
  const bet =
    "Título: Sequenciar prioridades. Ação prioritária: concentrar a lideranca em poucas frentes. Resultado esperado: maior previsibilidade executiva. Horizonte: proximo ciclo de 60 dias.";
  const renunciation =
    "Escolha: reduzir dispersao. O que deixar de fazer: abrir novas frentes sem criterio. Recurso ou capacidade protegida: foco da lideranca. Racional estratégico: a partir da perspectiva do respondente, isso protege execucao.";
  const governance =
    "Ritual: revisao executiva. Frequência: semanal. Participantes: liderancas chave. Indicadores: avancos, desvios e decisoes. Decisão esperada: remover bloqueios e validar hipoteses.";
  const recommendation =
    "Recomendação: validar gargalos. Prioridade: alta. Próximo passo: confrontar a leitura com indicadores internos. Condição de validação: confirmar se o sinal aparece alem da percepcao individual.";

  return {
    report_title: "Relatorio CGI",
    report_subtitle: "Diagnostico executivo",
    email_subject: "Relatorio CGI",
    methodology_note: "Nota metodologica do CGI.",
    evidence_summary: ["Evidencia 1", "Evidencia 2"],
    executive_summary:
      "As respostas deste executivo indicam uma organizacao com fundamentos relevantes, mas ainda dependente de validacao com outras liderancas e dados internos. O diagnostico sugere duas forcas reais e uma tensao central entre ambicao e disciplina de execucao.",
    strategic_diagnosis: [paragraph, paragraph, paragraph].join("\n\n"),
    dimension_reading: [
      { dimension: "Estrategia", score: 80, analysis: "As respostas deste executivo indicam clareza.", implication: "A hipotese deve ser validada." },
      { dimension: "Mercado", score: 70, analysis: "As respostas deste executivo indicam leitura parcial.", implication: "A hipotese deve ser validada." },
      { dimension: "Crescimento", score: 60, analysis: "As respostas deste executivo indicam maquina em construcao.", implication: "A hipotese deve ser validada." },
      { dimension: "Execucao", score: 50, analysis: "As respostas deste executivo indicam cadencia irregular.", implication: "A hipotese deve ser validada." },
      { dimension: "Lideranca", score: 40, analysis: "As respostas deste executivo indicam necessidade cultural.", implication: "A hipotese deve ser validada." },
    ],
    critical_bottlenecks: [bottleneck, bottleneck, bottleneck],
    strategic_bets: [bet, bet, bet],
    renunciations: [renunciation, renunciation, renunciation],
    governance_system: [governance, governance, governance],
    hypotheses_to_validate: [
      "Hipotese 1: validar a leitura do CGI com outras liderancas.",
      "Hipotese 2: confrontar percepcao com indicadores internos.",
    ],
    final_recommendations: [recommendation, recommendation, recommendation],
    ...overrides,
  };
}

function openAiJsonResponse(report: Record<string, unknown>) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      id: "resp_test",
      model: "gpt-5.1",
      status: "completed",
      output_text: JSON.stringify(report),
      usage: { output_tokens: 900 },
    }),
  };
}

describe("POST /api/cgi-assessment Supabase completion best-effort", () => {
  beforeEach(() => {
    // Default to a working OpenAI configuration with a successful generation
    // stub. Requirement: a missing OPENAI_API_KEY/OPENAI_MODEL must now be a
    // hard failure (503), not a silent pass-through - so tests that are not
    // specifically about AI generation get a real successful call here
    // instead of relying on "not configured" as a free shortcut. Tests that
    // exercise AI behavior directly override process.env and/or fetch.
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5.1";
    process.env.CONTACT_FORM_URL = "";
    process.env.VITE_CONTACT_FORM_URL = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => openAiJsonResponse(validOpenAiReport()))
    );
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
      ai: { status: "generated" },
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
    const fetchMock = vi.fn(async () => openAiJsonResponse(validOpenAiReport()));
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
      ai_generation_status: "generated",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
      vi.fn(async (url: string) => {
        if (String(url).includes("api.openai.com")) {
          return openAiJsonResponse(validOpenAiReport());
        }
        return {
          ok: true,
          status: 200,
          url: process.env.CONTACT_FORM_URL,
          headers: { get: () => "application/json" },
          text: async () => JSON.stringify({ ok: false, error: "validation" }),
        };
      })
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
      ai: { status: "generated" },
    });
  });

  it("returns a ready report when Apps Script succeeds after handling email internally", async () => {
    process.env.CONTACT_FORM_URL = "https://script.google.test/macros/s/fake/exec";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("api.openai.com")) {
          return openAiJsonResponse(validOpenAiReport());
        }
        return {
          ok: true,
          status: 200,
          url: process.env.CONTACT_FORM_URL,
          headers: { get: () => "application/json" },
          text: async () => JSON.stringify({ ok: true, type: "cgi_assessment" }),
        };
      })
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
    const fetchMock = vi.fn(async () => openAiJsonResponse(validOpenAiReport()));
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

    // Exactly one OpenAI call for the first request; the retried request is
    // served from the idempotency lookup and must not call OpenAI again.
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
    // 500 is a proven-transient HTTP status: exactly one primary attempt plus
    // the single allowed transient retry, never more.
    expect(fetchMock).toHaveBeenCalledTimes(2);
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

  it("logs sanitized structured validation errors when OpenAI returns invalid report JSON", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5.1";
    process.env.CONTACT_FORM_URL = "https://script.google.test/macros/s/fake/exec";
    const invalidReportJson = JSON.stringify({
      report_title: "Relatorio CGI",
      strategic_bets: ["Sem rotulo", "Sem rotulo", "Sem rotulo"],
    });
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        status: "completed",
        output_text: invalidReportJson,
        usage: { output_tokens: 200 },
      }),
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
    // Missing essential sections is a content/validation failure, never a
    // transient one - it must not retry, even though a retry budget exists.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.saveCompletedCgiReport).not.toHaveBeenCalled();
    expect(supabaseMocks.updateCgiReportSecondarySyncStatus).not.toHaveBeenCalled();
    expect(supabaseMocks.markCgiReportFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        publicAssessmentId: "assessment_1",
        errorCode: "ai_generation_failed",
      })
    );

    const validationLog = vi.mocked(console.error).mock.calls.find(
      ([event]) => event === "[CGI OpenAI] cgi_ai_validation_failed"
    );
    expect(validationLog).toBeTruthy();
    const payload = JSON.parse(String(validationLog?.[1] || "{}"));
    expect(payload).toMatchObject({
      event: "cgi_ai_validation_failed",
      attempt: 1,
      model: "gpt-5.1",
    });
    expect(payload.duration_ms).toEqual(expect.any(Number));
    expect(payload.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "strategic_diagnosis",
          code: "missing_required",
          message: "missing_key",
          received_type: "undefined",
        }),
      ])
    );
    expect(payload.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "strategic_bets.0",
          code: "invalid_structure",
          reason_category: "editorial",
        }),
      ])
    );
    expect(String(validationLog?.[1])).not.toContain("Lead Teste");
    expect(String(validationLog?.[1])).not.toContain("Sem rotulo");
    expect(String(validationLog?.[1])).not.toContain("[Object]");
  });

  it("retries transient OpenAI failures and saves the later valid report", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5.1";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "temporary_openai_failure",
      })
      .mockResolvedValueOnce(openAiJsonResponse(validOpenAiReport()));
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
      ai: { status: "generated" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(supabaseMocks.saveCompletedCgiReport).toHaveBeenCalledTimes(1);
  });

  it("accepts a usable report with editorial-only issues as report_ready, without a retry", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5.1";
    const fetchMock = vi.fn(async () =>
      openAiJsonResponse(
        validOpenAiReport({
          strategic_bets: ["Sem rotulo", "Sem rotulo", "Sem rotulo"],
        })
      )
    );
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
      // This version does not persist/return report_ready_with_warnings - a
      // usable report (even with non-blocking warnings) is always
      // report_ready, and it must not trigger an extra OpenAI call.
      report_status: "report_ready",
      ai: { status: "generated" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.saveCompletedCgiReport).toHaveBeenCalledTimes(1);
  });

  it("accepts correctable nonessential issues as warnings without another OpenAI call", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5.1";
    const fetchMock = vi.fn(async () =>
      openAiJsonResponse(validOpenAiReport({ hypotheses_to_validate: [] }))
    );
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
      // This version does not persist/return report_ready_with_warnings - a
      // usable report (even with non-blocking warnings) is always
      // report_ready, and it must not trigger an extra OpenAI call.
      report_status: "report_ready",
      ai: { status: "generated" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.saveCompletedCgiReport).toHaveBeenCalledTimes(1);
  });

  it("uses local normalization to resolve object-shaped arrays without retry", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5.1";
    const fetchMock = vi.fn(async () =>
      openAiJsonResponse(
        validOpenAiReport({
          evidence_summary: { first: "Evidencia 1", second: "Evidencia 2" },
          hypotheses_to_validate: {
            first: "Hipotese 1: validar a leitura do CGI com outras liderancas.",
            second: "Hipotese 2: confrontar percepcao com indicadores internos.",
          },
        })
      )
    );
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
      ai: { status: "generated" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails loudly instead of shipping an empty report when the model is not explicitly configured", async () => {
    // Requirement: a missing OPENAI_API_KEY/OPENAI_MODEL must never be
    // hidden silently behind a 200 response with an empty AI report - it is
    // a hard failure, exactly like any other AI generation failure.
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

    expect(response.statusCode).toBe(503);
    expect(response.body).toMatchObject({
      ok: false,
      error: "report_generation_failed",
      report_status: "report_failed",
      ai_generation_status: "not_configured",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(supabaseMocks.saveCompletedCgiReport).not.toHaveBeenCalled();
    expect(supabaseMocks.markCgiReportFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        publicAssessmentId: "assessment_1",
        errorCode: "ai_not_configured",
      })
    );
  });

  it("retries a proven-transient timeout/abort exactly once, then fails", async () => {
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
    // One primary attempt plus exactly one retry for the proven-transient
    // abort/timeout - never more, per the conservative recovery policy.
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
