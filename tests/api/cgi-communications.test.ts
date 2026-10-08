import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  supabaseInsert: vi.fn(),
  logSupabaseFailure: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import {
  COMMUNICATION_CLASS_BY_TYPE,
  COMMUNICATION_TYPES,
  buildCommunicationDedupeKey,
  getCommunicationClass,
  isCommunicationAllowedByConsent,
  isCommunicationsLedgerEnabled,
  isRepeatableCommunicationType,
  recordCommunication,
  recordCommunicationSafely,
  requiresMarketingConsent,
} from "../../api/_cgi-communications";

const PID = "KrjNnuPHmv2Rcv8j";

function enableLedger() {
  process.env.CGI_COMMUNICATIONS_LEDGER_ENABLED = "true";
}

describe("Communication Engine -- classificação e consentimento", () => {
  it("classifica todo tipo conhecido", () => {
    for (const type of COMMUNICATION_TYPES) {
      expect(COMMUNICATION_CLASS_BY_TYPE[type]).toBeTruthy();
    }
  });

  it("mantém os dois e-mails automáticos de hoje como transacionais", () => {
    expect(getCommunicationClass("report_delivery")).toBe("transactional");
    expect(getCommunicationClass("abandon_lead_d1")).toBe("transactional");
    expect(getCommunicationClass("abandon_progress_d1")).toBe("transactional");
  });

  it("classifica a régua de nutrição como nurturing", () => {
    for (const type of ["insight_d2", "howto_d7", "strategic_d21", "checkin_d45", "revisit_d90"] as const) {
      expect(getCommunicationClass(type)).toBe("nurturing");
    }
  });

  it("não exige consentimento de marketing para transacional (regra vigente preservada)", () => {
    expect(requiresMarketingConsent("report_delivery")).toBe(false);
    expect(requiresMarketingConsent("abandon_lead_d1")).toBe(false);
    expect(isCommunicationAllowedByConsent({ type: "report_delivery", consentMarketing: false })).toBe(true);
    expect(isCommunicationAllowedByConsent({ type: "abandon_progress_d1", consentMarketing: null })).toBe(true);
  });

  it("exige opt-in explícito para nurturing e falha fechado quando o consentimento é desconhecido", () => {
    expect(requiresMarketingConsent("insight_d2")).toBe(true);
    expect(isCommunicationAllowedByConsent({ type: "insight_d2", consentMarketing: true })).toBe(true);
    expect(isCommunicationAllowedByConsent({ type: "insight_d2", consentMarketing: false })).toBe(false);
    expect(isCommunicationAllowedByConsent({ type: "insight_d2", consentMarketing: null })).toBe(false);
    expect(isCommunicationAllowedByConsent({ type: "insight_d2" })).toBe(false);
  });

  it("trata toque comercial como comercial, não como nurturing", () => {
    expect(getCommunicationClass("commercial_followup")).toBe("commercial");
    expect(getCommunicationClass("manual_email")).toBe("commercial");
    expect(requiresMarketingConsent("manual_email")).toBe(false);
  });
});

describe("Communication Engine -- idempotência (dedupe key)", () => {
  it("gera a MESMA chave para um tipo one-shot no mesmo assessment", () => {
    const a = buildCommunicationDedupeKey({ type: "report_delivery", publicAssessmentId: PID });
    const b = buildCommunicationDedupeKey({ type: "report_delivery", publicAssessmentId: PID });
    expect(a).toBe(b);
    expect(a).toBe(`${PID}:report_delivery`);
  });

  it("separa kinds diferentes de abandono no mesmo assessment", () => {
    expect(buildCommunicationDedupeKey({ type: "abandon_lead_d1", publicAssessmentId: PID })).not.toBe(
      buildCommunicationDedupeKey({ type: "abandon_progress_d1", publicAssessmentId: PID })
    );
  });

  it("gera chaves DIFERENTES a cada ocorrência de um tipo repetível", () => {
    expect(isRepeatableCommunicationType("manual_email")).toBe(true);
    const a = buildCommunicationDedupeKey({ type: "manual_email", publicAssessmentId: PID });
    const b = buildCommunicationDedupeKey({ type: "manual_email", publicAssessmentId: PID });
    expect(a).not.toBe(b);
  });

  it("permite deduplicar um retry da MESMA ocorrência repetível via occurrenceKey", () => {
    const a = buildCommunicationDedupeKey({ type: "commercial_followup", publicAssessmentId: PID, occurrenceKey: "call-2026-08-20" });
    const b = buildCommunicationDedupeKey({ type: "commercial_followup", publicAssessmentId: PID, occurrenceKey: "call-2026-08-20" });
    expect(a).toBe(b);
  });

  it("usa o lead como escopo quando não há assessment", () => {
    expect(buildCommunicationDedupeKey({ type: "report_delivery", leadId: "lead_9" })).toBe("lead:lead_9:report_delivery");
  });
});

describe("Communication Engine -- gravação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CGI_COMMUNICATIONS_LEDGER_ENABLED;
    supabaseMocks.supabaseInsert.mockResolvedValue({ ok: true, status: 201 });
  });

  afterEach(() => {
    delete process.env.CGI_COMMUNICATIONS_LEDGER_ENABLED;
  });

  it("é fail-closed: com a flag desligada não escreve nada", async () => {
    expect(isCommunicationsLedgerEnabled()).toBe(false);
    const result = await recordCommunication({ type: "report_delivery", status: "sent", publicAssessmentId: PID });
    expect(result.outcome).toBe("skipped_disabled");
    expect(supabaseMocks.supabaseInsert).not.toHaveBeenCalled();
  });

  it("grava uma linha completa quando habilitado", async () => {
    enableLedger();
    const result = await recordCommunication({
      type: "report_delivery",
      status: "sent",
      publicAssessmentId: PID,
      leadId: "lead_1",
      assessmentId: "row_1",
      recipient: "andre@example.com",
      subject: "Seu CGI",
      provider: "apps_script_mailapp",
      actor: "system:completion",
      now: Date.parse("2026-08-20T13:00:00.000Z"),
    });
    expect(result.outcome).toBe("recorded");
    const [table, body] = supabaseMocks.supabaseInsert.mock.calls[0];
    expect(table).toBe("cgi_communications");
    expect(body.communication_type).toBe("report_delivery");
    expect(body.communication_class).toBe("transactional");
    expect(body.status).toBe("sent");
    expect(body.dedupe_key).toBe(`${PID}:report_delivery`);
    expect(body.sent_at).toBe("2026-08-20T13:00:00.000Z");
    expect(body.channel).toBe("email");
  });

  it("nunca grava o e-mail em claro -- só a forma mascarada", async () => {
    enableLedger();
    await recordCommunication({ type: "report_delivery", status: "sent", publicAssessmentId: PID, recipient: "andre@example.com" });
    const [, body] = supabaseMocks.supabaseInsert.mock.calls[0];
    expect(body.recipient_masked).toBe("a***@example.com");
    expect(JSON.stringify(body)).not.toContain("andre@example.com");
  });

  it("carimba o timestamp correspondente a cada estado", async () => {
    enableLedger();
    const at = Date.parse("2026-08-20T13:00:00.000Z");
    await recordCommunication({ type: "abandon_lead_d1", status: "failed", publicAssessmentId: PID, errorCode: "http_500", now: at });
    const [, failedBody] = supabaseMocks.supabaseInsert.mock.calls[0];
    expect(failedBody.failed_at).toBe("2026-08-20T13:00:00.000Z");
    expect(failedBody.sent_at).toBeUndefined();
    expect(failedBody.error_code).toBe("http_500");

    supabaseMocks.supabaseInsert.mockClear();
    await recordCommunication({ type: "insight_d2", status: "scheduled", publicAssessmentId: PID, scheduledAt: "2026-08-22T13:00:00.000Z" });
    const [, scheduledBody] = supabaseMocks.supabaseInsert.mock.calls[0];
    expect(scheduledBody.scheduled_at).toBe("2026-08-22T13:00:00.000Z");
    expect(scheduledBody.sent_at).toBeUndefined();
  });

  it("trata 409 como duplicata silenciosa, não como erro", async () => {
    enableLedger();
    supabaseMocks.supabaseInsert.mockResolvedValue({ ok: false, status: 409, error: "duplicate key" });
    const result = await recordCommunication({ type: "report_delivery", status: "sent", publicAssessmentId: PID });
    expect(result.outcome).toBe("duplicate");
    expect(supabaseMocks.logSupabaseFailure).not.toHaveBeenCalled();
  });

  it("registra telemetria quando a gravação falha de verdade", async () => {
    enableLedger();
    supabaseMocks.supabaseInsert.mockResolvedValue({ ok: false, status: 500, error: "boom" });
    const result = await recordCommunication({ type: "report_delivery", status: "sent", publicAssessmentId: PID });
    expect(result.outcome).toBe("error");
    expect(supabaseMocks.logSupabaseFailure).toHaveBeenCalledWith("record_communication", expect.objectContaining({ status: 500 }));
  });

  it("guarda a foto do consentimento sem deixar que ela bloqueie transacional", async () => {
    enableLedger();
    await recordCommunication({ type: "report_delivery", status: "sent", publicAssessmentId: PID, consentMarketing: false });
    const [, body] = supabaseMocks.supabaseInsert.mock.calls[0];
    expect(body.consent_marketing_snapshot).toBe(false);
    expect(body.status).toBe("sent");
  });

  it("recordCommunicationSafely engole qualquer exceção inesperada", async () => {
    enableLedger();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseMocks.supabaseInsert.mockRejectedValue(new Error("network down"));
    const result = await recordCommunicationSafely({ type: "report_delivery", status: "sent", publicAssessmentId: PID });
    expect(result.outcome).toBe("error");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
