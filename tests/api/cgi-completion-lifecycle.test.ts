import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Regressões do caso Mara / Domo (21/08/2026).
//
// Dois defeitos distintos, ambos disparados por UMA falha de geração de IA:
//
//  1. LIFECYCLE -- a persistência da conclusão ficava depois da geração, atrás
//     do early return de falha. Uma falha de provider congelava o assessment
//     em `in_progress` com completed_at nulo, mesmo com as 40 respostas
//     gravadas. Consequência operacional: o Pipe não via a conclusão e a
//     varredura de abandono passava a considerar a pessoa elegível a um
//     lembrete de "seu diagnóstico ficou em aberto".
//
//  2. VÍNCULO -- a retentativa do cliente (forceNewAttempt) chega com um
//     public_assessment_id novo, sem lead_id, e a guarda anti-phantom
//     corretamente recusa o e-mail. A pessoa via o relatório na tela e nunca
//     recebia nada.

const supabaseMocks = vi.hoisted(() => ({
  createEventId: vi.fn(() => "completion_event_generated"),
  getCgiReportState: vi.fn(),
  getReadyCgiReport: vi.fn(),
  insertFunnelEvent: vi.fn(),
  markCgiReportFailed: vi.fn(),
  saveCompletedCgiReport: vi.fn(),
  tryCreateCgiReportGenerationLock: vi.fn(),
  updateCgiReportSecondarySyncStatus: vi.fn(),
  updateLeadComments: vi.fn(),
  upsertAnswers: vi.fn(),
  upsertAssessment: vi.fn(),
  findLeadIdByAnonymousSession: vi.fn(),
  getAssessmentEmailState: vi.fn(),
  markReportEmailSent: vi.fn(),
  upsertReportAccessToken: vi.fn(),
  getReportEmailState: vi.fn(),
  getLeadById: vi.fn(),
  getCrmOpportunityByLeadId: vi.fn(),
  supabaseInsert: vi.fn(),
  logSupabaseFailure: vi.fn(),
}));

vi.mock("node:dns/promises", () => ({
  resolveMx: vi.fn(async () => [{ exchange: "mail.example.com", priority: 10 }]),
  resolve4: vi.fn(async () => ["93.184.216.34"]),
  resolve6: vi.fn(async () => []),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import handler from "../../api/cgi-assessment";

function createResponse() {
  return {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
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

/** Todas as chamadas de upsertAssessment que carimbam a conclusão. */
function completionUpserts() {
  return supabaseMocks.upsertAssessment.mock.calls
    .map(([arg]) => arg as Record<string, unknown>)
    .filter((arg) => arg?.completedAt);
}

describe("Conclusão do CGI -- persistência independente do relatório", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5.1";
    process.env.CONTACT_FORM_URL = "";
    process.env.VITE_CONTACT_FORM_URL = "";
    delete process.env.CGI_REPORT_EMAIL_ENABLED;
    delete process.env.CGI_COMMUNICATIONS_LEDGER_ENABLED;

    supabaseMocks.createEventId.mockReturnValue("completion_event_generated");
    supabaseMocks.getCgiReportState.mockResolvedValue(null);
    supabaseMocks.getReadyCgiReport.mockResolvedValue(null);
    supabaseMocks.insertFunnelEvent.mockResolvedValue("completion_event_1");
    supabaseMocks.markCgiReportFailed.mockResolvedValue(true);
    supabaseMocks.saveCompletedCgiReport.mockResolvedValue(true);
    supabaseMocks.tryCreateCgiReportGenerationLock.mockResolvedValue({ status: "acquired" });
    supabaseMocks.updateCgiReportSecondarySyncStatus.mockResolvedValue(true);
    supabaseMocks.updateLeadComments.mockResolvedValue(true);
    supabaseMocks.upsertAnswers.mockResolvedValue(undefined);
    supabaseMocks.upsertAssessment.mockResolvedValue({ id: "row_1", lead_id: "lead_1" });
    supabaseMocks.findLeadIdByAnonymousSession.mockResolvedValue(null);
    vi.stubGlobal("fetch", vi.fn(async () => openAiJsonResponse(validOpenAiReport())));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("persiste a conclusão mesmo quando a geração do relatório FALHA", async () => {
    // A falha de provider: a chamada ao modelo não devolve nada utilizável.
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    const response = createResponse();
    await handler({ method: "POST", body: createValidPayload(), headers: {} } as never, response as never);

    // O relatório falhou -- isso continua sendo verdade e continua devolvendo 503.
    expect(response.statusCode).toBe(503);
    expect(supabaseMocks.markCgiReportFailed).toHaveBeenCalled();

    // ...mas a conclusão foi persistida assim mesmo. Era este o bug.
    const upserts = completionUpserts();
    expect(upserts).toHaveLength(1);
    expect(upserts[0]).toMatchObject({
      publicAssessmentId: "assessment_1",
      status: "completed",
      progressPercent: 100,
      currentQuestion: 40,
    });
    expect(upserts[0].cgiScore).toEqual(expect.any(Number));
    expect(supabaseMocks.upsertAnswers).toHaveBeenCalled();
  });

  it("continua persistindo a conclusão quando o relatório é gerado com sucesso", async () => {
    const response = createResponse();
    await handler({ method: "POST", body: createValidPayload(), headers: {} } as never, response as never);
    expect(response.statusCode).toBe(200);
    expect(completionUpserts()).toHaveLength(1);
    expect(supabaseMocks.saveCompletedCgiReport).toHaveBeenCalled();
  });

  it("um assessment concluído nunca é candidato a abandono -- completed_at é escrito antes da IA", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    const response = createResponse();
    await handler({ method: "POST", body: createValidPayload(), headers: {} } as never, response as never);
    // O seletor de abandono exige completed_at IS NULL. Persistir aqui é o que
    // tira a pessoa da fila de "seu diagnóstico ficou em aberto".
    expect(completionUpserts()[0]).toMatchObject({ completedAt: expect.any(String) });
    expect(response.statusCode).toBe(503);
  });
});

describe("Conclusão do CGI -- recuperação do vínculo com o lead na retentativa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-5.1";
    process.env.CONTACT_FORM_URL = "";
    process.env.VITE_CONTACT_FORM_URL = "";
    supabaseMocks.createEventId.mockReturnValue("completion_event_generated");
    supabaseMocks.getCgiReportState.mockResolvedValue(null);
    supabaseMocks.getReadyCgiReport.mockResolvedValue(null);
    supabaseMocks.insertFunnelEvent.mockResolvedValue("completion_event_1");
    supabaseMocks.saveCompletedCgiReport.mockResolvedValue(true);
    supabaseMocks.tryCreateCgiReportGenerationLock.mockResolvedValue({ status: "acquired" });
    supabaseMocks.updateCgiReportSecondarySyncStatus.mockResolvedValue(true);
    supabaseMocks.updateLeadComments.mockResolvedValue(true);
    supabaseMocks.upsertAnswers.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn(async () => openAiJsonResponse(validOpenAiReport())));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("recupera o lead pela sessão anônima quando a retentativa nasce sem vínculo", async () => {
    // A linha criada pela retentativa não tem lead_id...
    supabaseMocks.upsertAssessment
      .mockResolvedValueOnce({ id: "row_retry", lead_id: null })
      .mockResolvedValue({ id: "row_retry", lead_id: "lead_1" });
    // ...mas a mesma sessão anônima identificou-se minutos antes.
    supabaseMocks.findLeadIdByAnonymousSession.mockResolvedValue("lead_1");

    const response = createResponse();
    await handler({ method: "POST", body: createValidPayload(), headers: {} } as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(supabaseMocks.findLeadIdByAnonymousSession).toHaveBeenCalledWith("session_1");
    const relink = supabaseMocks.upsertAssessment.mock.calls
      .map(([a]) => a as Record<string, unknown>)
      .find((a) => a?.leadId === "lead_1");
    expect(relink).toBeTruthy();
    expect(relink).toMatchObject({ publicAssessmentId: "assessment_1", status: "completed" });
    expect(supabaseMocks.updateLeadComments).toHaveBeenCalledWith("lead_1", expect.anything());
  });

  it("NÃO recupera quando a sessão é ambígua -- prefere não enviar a enviar errado", async () => {
    supabaseMocks.upsertAssessment.mockResolvedValue({ id: "row_retry", lead_id: null });
    // O helper devolve null quando a sessão tem mais de um lead.
    supabaseMocks.findLeadIdByAnonymousSession.mockResolvedValue(null);

    const response = createResponse();
    await handler({ method: "POST", body: createValidPayload(), headers: {} } as never, response as never);

    expect(response.statusCode).toBe(200);
    const comLead = supabaseMocks.upsertAssessment.mock.calls
      .map(([a]) => a as Record<string, unknown>)
      .filter((a) => a?.leadId);
    expect(comLead).toHaveLength(0);
    expect(supabaseMocks.updateLeadComments).not.toHaveBeenCalled();
  });

  it("nunca sobrescreve um vínculo que já existe", async () => {
    supabaseMocks.upsertAssessment.mockResolvedValue({ id: "row_1", lead_id: "lead_original" });
    supabaseMocks.findLeadIdByAnonymousSession.mockResolvedValue("lead_outro");

    const response = createResponse();
    await handler({ method: "POST", body: createValidPayload(), headers: {} } as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(supabaseMocks.findLeadIdByAnonymousSession).not.toHaveBeenCalled();
    expect(supabaseMocks.updateLeadComments).toHaveBeenCalledWith("lead_original", expect.anything());
  });
});
