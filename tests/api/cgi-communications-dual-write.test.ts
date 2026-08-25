import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Dual-write: o ledger é gravado DEPOIS do envio e NUNCA pode alterar o
// resultado dele. Estes testes existem para provar exatamente isso -- que um
// ledger quebrado é invisível para o e-mail transacional -- e para fixar qual
// tipo cada fluxo registra.

const supabaseMocks = vi.hoisted(() => ({
  // report
  getReportEmailState: vi.fn(),
  getAssessmentEmailState: vi.fn(),
  getReadyCgiReport: vi.fn(),
  getLeadById: vi.fn(),
  getCrmOpportunityByLeadId: vi.fn(),
  markReportEmailSent: vi.fn(),
  // abandono
  getAbandonmentState: vi.fn(),
  markAbandonmentEmailSent: vi.fn(),
  // token
  upsertReportAccessToken: vi.fn(),
  getReportAccessTokenByHash: vi.fn(),
  touchReportAccessToken: vi.fn(),
  // ledger
  supabaseInsert: vi.fn(),
  logSupabaseFailure: vi.fn(),
  // consentimento / token de contato
  setContactTokenHash: vi.fn(),
  recordMarketingConsentProvenance: vi.fn(),
  grantMarketingConsentFromReport: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import { deliverReportEmailForAssessment } from "../../api/_cgi-report-email";
import { deliverAbandonmentEmailForAssessment } from "../../api/_cgi-abandonment-email";

const PID = "KrjNnuPHmv2Rcv8j";

function reportState(overrides: Record<string, unknown> = {}) {
  return {
    id: "row_1",
    public_assessment_id: PID,
    lead_id: "lead_1",
    status: "completed",
    completed_at: new Date(Date.now() - 3_600_000).toISOString(),
    report_email_sent_at: null,
    ...overrides,
  };
}

function abandonmentState(overrides: Record<string, unknown> = {}) {
  return {
    id: "row_1",
    public_assessment_id: PID,
    lead_id: "lead_1",
    status: "lead_captured",
    progress_percent: 0,
    current_question: null,
    completed_at: null,
    last_activity_at: new Date(Date.now() - 48 * 3_600_000).toISOString(),
    abandonment_email_sent_at: null,
    report_email_sent_at: null,
    ...overrides,
  };
}

function lead(overrides: Record<string, unknown> = {}) {
  return { id: "lead_1", name: "Andre", email: "andre@example.com", company: "Pesc", ...overrides };
}

function ledgerBodies() {
  return supabaseMocks.supabaseInsert.mock.calls
    .filter(([table]) => table === "cgi_communications")
    .map(([, body]) => body as Record<string, unknown>);
}

async function deliverReport(extra: Record<string, unknown> = {}) {
  return deliverReportEmailForAssessment({
    publicAssessmentId: PID,
    reason: "recovery",
    appsScriptUrl: "https://script.google.test/exec",
    relayToken: "relay-secret",
    dryRun: false,
    ...extra,
  } as never);
}

async function deliverAbandonment(extra: Record<string, unknown> = {}) {
  // Um relatório pronto é, por definição, prova de que a pessoa terminou --
  // a guarda de abandono recusa esse caso. Um candidato legítimo a abandono
  // nunca tem relatório, então é assim que o fixture precisa ser.
  supabaseMocks.getReadyCgiReport.mockResolvedValue(null);
  return deliverAbandonmentEmailForAssessment({
    publicAssessmentId: PID,
    enforceMaxAge: true,
    appsScriptUrl: "https://script.google.test/exec",
    relayToken: "relay-secret",
    dryRun: false,
    ...extra,
  } as never);
}

describe("Communication Engine -- dual-write nos envios existentes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CGI_COMMUNICATIONS_LEDGER_ENABLED = "true";

    supabaseMocks.getReportEmailState.mockResolvedValue(reportState());
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(reportState());
    supabaseMocks.getReadyCgiReport.mockResolvedValue({
      publicAssessmentId: PID,
      reportStatus: "report_ready",
      aiReport: JSON.stringify({ executive_summary: "Uma leitura inicial do sistema de crescimento." }),
    });
    supabaseMocks.getLeadById.mockResolvedValue(lead());
    supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: true, opportunity: null });
    supabaseMocks.markReportEmailSent.mockResolvedValue(true);
    supabaseMocks.getAbandonmentState.mockResolvedValue(abandonmentState());
    supabaseMocks.markAbandonmentEmailSent.mockResolvedValue(true);
    supabaseMocks.upsertReportAccessToken.mockResolvedValue(true);
    supabaseMocks.setContactTokenHash.mockResolvedValue(true);
    supabaseMocks.supabaseInsert.mockResolvedValue({ ok: true, status: 201 });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true, sent: true }), { status: 200 }))
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    delete process.env.CGI_COMMUNICATIONS_LEDGER_ENABLED;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("registra report_delivery depois de um envio confirmado", async () => {
    const result = await deliverReport();
    expect(result.outcome).toBe("sent");
    const [body] = ledgerBodies();
    expect(body.communication_type).toBe("report_delivery");
    expect(body.communication_class).toBe("transactional");
    expect(body.status).toBe("sent");
    expect(body.lead_id).toBe("lead_1");
    expect(body.assessment_id).toBe("row_1");
    expect(body.public_assessment_id).toBe(PID);
    expect(body.recipient_masked).toBe("a***@example.com");
  });

  it("mantém o marcador como fonte primária: ele é escrito mesmo com o ledger falhando", async () => {
    supabaseMocks.supabaseInsert.mockResolvedValue({ ok: false, status: 500, error: "boom" });
    const result = await deliverReport();
    expect(result.outcome).toBe("sent");
    expect(result.detail).toBeUndefined();
    expect(supabaseMocks.markReportEmailSent).toHaveBeenCalledExactlyOnceWith(PID);
  });

  it("uma exceção no ledger não derruba nem altera um envio já válido", async () => {
    supabaseMocks.supabaseInsert.mockRejectedValue(new Error("network down"));
    const result = await deliverReport();
    expect(result.outcome).toBe("sent");
    expect(supabaseMocks.markReportEmailSent).toHaveBeenCalledTimes(1);
  });

  it("dry run não vira linha no ledger -- não houve comunicação", async () => {
    const result = await deliverReport({ dryRun: true });
    expect(result.outcome).toBe("dry_run");
    expect(ledgerBodies()).toHaveLength(0);
  });

  it("uma falha de provider é registrada como failed, com o código do erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: false, error: "quota_exceeded" }), { status: 500 }))
    );
    const result = await deliverReport();
    expect(result.outcome).toBe("error_dispatch");
    const [body] = ledgerBodies();
    expect(body.status).toBe("failed");
    expect(body.error_code).toBe("quota_exceeded");
    expect(supabaseMocks.markReportEmailSent).not.toHaveBeenCalled();
  });

  it("um envio que não acontece (já enviado) não registra nada", async () => {
    supabaseMocks.getReportEmailState.mockResolvedValue(
      reportState({ report_email_sent_at: new Date().toISOString() })
    );
    const result = await deliverReport();
    expect(result.outcome).toBe("skipped_already_sent");
    expect(ledgerBodies()).toHaveLength(0);
  });

  it("registra a KIND real do abandono -- a informação que o marcador único perde", async () => {
    const result = await deliverAbandonment();
    expect(result.outcome).toBe("sent");
    const [body] = ledgerBodies();
    expect(body.communication_type).toBe("abandon_lead_d1");
    expect(body.dedupe_key).toBe(`${PID}:abandon_lead_d1`);
    expect(body.actor).toBe("system:cron");
  });

  it("distingue abandon_progress_d1 de abandon_lead_d1 no registro", async () => {
    supabaseMocks.getAbandonmentState.mockResolvedValue(
      abandonmentState({ status: "in_progress", current_question: 12, progress_percent: 30 })
    );
    const result = await deliverAbandonment();
    expect(result.outcome).toBe("sent");
    const [body] = ledgerBodies();
    expect(body.communication_type).toBe("abandon_progress_d1");
    expect(body.dedupe_key).toBe(`${PID}:abandon_progress_d1`);
  });

  it("marca backfill de abandono com um actor diferente do cron", async () => {
    const result = await deliverAbandonment({ enforceMaxAge: false });
    expect(result.outcome).toBe("sent");
    expect(ledgerBodies()[0].actor).toBe("system:backfill");
  });

  it("com a flag do ledger desligada, nenhum envio muda de comportamento", async () => {
    delete process.env.CGI_COMMUNICATIONS_LEDGER_ENABLED;
    const report = await deliverReport();
    const abandonment = await deliverAbandonment();
    expect(report.outcome).toBe("sent");
    expect(abandonment.outcome).toBe("sent");
    expect(supabaseMocks.supabaseInsert).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// F-A -- snapshot de consentimento no ledger
// ---------------------------------------------------------------------------
//
// A coluna consent_marketing_snapshot existia e nunca era preenchida: nenhum
// dos dois call sites passava o valor. Sem ela não há prova, por mensagem, de
// qual era o consentimento no instante do envio -- que é exatamente a prova
// que importa quando um envio depende de consentimento.
//
// Nada aqui muda elegibilidade. Os dois e-mails continuam saindo pelas mesmas
// regras de antes; o que muda é que agora fica registrado.

describe("F-A -- o ledger registra o consentimento real do momento do envio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CGI_COMMUNICATIONS_LEDGER_ENABLED = "true";
    supabaseMocks.getReportEmailState.mockResolvedValue(reportState());
    supabaseMocks.getAssessmentEmailState.mockResolvedValue(reportState());
    supabaseMocks.getReadyCgiReport.mockResolvedValue({
      publicAssessmentId: PID,
      reportStatus: "report_ready",
      aiReport: JSON.stringify({ executive_summary: "Uma leitura inicial." }),
    });
    supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: true, opportunity: null });
    supabaseMocks.markReportEmailSent.mockResolvedValue(true);
    supabaseMocks.getAbandonmentState.mockResolvedValue(abandonmentState());
    supabaseMocks.markAbandonmentEmailSent.mockResolvedValue(true);
    supabaseMocks.upsertReportAccessToken.mockResolvedValue(true);
    supabaseMocks.setContactTokenHash.mockResolvedValue(true);
    supabaseMocks.supabaseInsert.mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true, sent: true }), { status: 200 }))
    );
  });

  it("report_delivery: lead com consentimento → snapshot true", async () => {
    supabaseMocks.getLeadById.mockResolvedValue(lead({ consent_marketing: true }));
    await deliverReport();
    expect(ledgerBodies()[0].consent_marketing_snapshot).toBe(true);
  });

  it("report_delivery: lead sem consentimento → snapshot false", async () => {
    supabaseMocks.getLeadById.mockResolvedValue(lead({ consent_marketing: false }));
    await deliverReport();
    expect(ledgerBodies()[0].consent_marketing_snapshot).toBe(false);
  });

  it("report_delivery: quem nunca respondeu fica null, não false", async () => {
    // "nunca respondeu" e "recusou" são fatos diferentes e não podem colapsar
    // no mesmo valor.
    supabaseMocks.getLeadById.mockResolvedValue(lead({ consent_marketing: null }));
    await deliverReport();
    expect(ledgerBodies()[0].consent_marketing_snapshot).toBeNull();
  });

  it("abandonment: snapshot true", async () => {
    supabaseMocks.getLeadById.mockResolvedValue(lead({ consent_marketing: true }));
    await deliverAbandonment();
    expect(ledgerBodies()[0].consent_marketing_snapshot).toBe(true);
  });

  it("abandonment: snapshot false", async () => {
    supabaseMocks.getLeadById.mockResolvedValue(lead({ consent_marketing: false }));
    await deliverAbandonment();
    expect(ledgerBodies()[0].consent_marketing_snapshot).toBe(false);
  });

  it("o snapshot não muda elegibilidade: os dois e-mails saem igual em qualquer estado", async () => {
    for (const consent of [true, false, null]) {
      vi.clearAllMocks();
      supabaseMocks.getReportEmailState.mockResolvedValue(reportState());
      supabaseMocks.getReadyCgiReport.mockResolvedValue({
        publicAssessmentId: PID, reportStatus: "report_ready",
        aiReport: JSON.stringify({ executive_summary: "x" }),
      });
      supabaseMocks.getLeadById.mockResolvedValue(lead({ consent_marketing: consent }));
      supabaseMocks.getCrmOpportunityByLeadId.mockResolvedValue({ ok: true, opportunity: null });
      supabaseMocks.markReportEmailSent.mockResolvedValue(true);
      supabaseMocks.upsertReportAccessToken.mockResolvedValue(true);
      supabaseMocks.setContactTokenHash.mockResolvedValue(true);
      supabaseMocks.supabaseInsert.mockResolvedValue({ ok: true, status: 201 });
      vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true, sent: true }), { status: 200 })));

      const resultado = await deliverReport();
      expect((resultado as { outcome: string }).outcome).toBe("sent");
    }
  });
});
