import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OFFER_TYPE,
  decideNurture,
  isOfferQuietPeriod,
  readOfferCutoffMs,
  shouldRecordSuppression,
  type NurtureCandidate,
} from "../../api/_cgi-nurture";
import { buildCgiOfferD14Email } from "../../api/_cgi-email-content";

// D+14 -- oferta (livro + sessão CGI).
//
// Duas camadas: a decisão pura (quem recebe e por quê não) e o sweep inteiro,
// do HTTP ao ledger, com o banco e o provider simulados.

const DIA = 86_400_000;
const AGORA = Date.parse("2026-10-20T12:00:00Z");
const CORTE = "2026-10-01T00:00:00Z";
const ENV = { CGI_OFFER_D14_ENABLED: "true", CGI_OFFER_D14_DELIVERED_SINCE: CORTE };

function candidato(over: Partial<NurtureCandidate> = {}): NurtureCandidate {
  return {
    publicAssessmentId: "PID1",
    leadId: "lead_1",
    reportEmailSentAtIso: new Date(AGORA - 15 * DIA).toISOString(), // 05/10, depois do corte
    reportOpenedAtIso: null,
    consentMarketing: true,
    unsubscribedAtIso: null,
    crmStatus: "novo",
    lastContactAtIso: null,
    lowestDimensionId: "growthMachine",
    alreadyRecordedTypes: [],
    leadClassification: "legitimate",
    reportLanguage: "pt",
    ...over,
  };
}

const decidir = (over: Partial<NurtureCandidate> = {}, env: Record<string, string | undefined> = ENV, now = AGORA) =>
  decideNurture(OFFER_TYPE, candidato(over), { now, env });

const motivo = (d: ReturnType<typeof decidir>) => (d.decision === "suppress" ? d.reason : "send");

describe("D+14 -- decisão", () => {
  it("o caminho feliz envia, com chave de dedupe do tipo da oferta", () => {
    const d = decidir();
    expect(d.decision).toBe("send");
    expect(d.decision === "send" && d.dedupeKey).toContain("strategic_d21");
  });

  it("flag ausente ou diferente de 'true' não envia", () => {
    expect(motivo(decidir({}, { CGI_OFFER_D14_DELIVERED_SINCE: CORTE }))).toBe("flag_disabled");
    expect(motivo(decidir({}, { ...ENV, CGI_OFFER_D14_ENABLED: "1" }))).toBe("flag_disabled");
  });

  it("sem data de corte, ninguém recebe (fail-closed)", () => {
    expect(motivo(decidir({}, { CGI_OFFER_D14_ENABLED: "true" }))).toBe("before_offer_cutoff");
    expect(motivo(decidir({}, { ...ENV, CGI_OFFER_D14_DELIVERED_SINCE: "amanhã" }))).toBe("before_offer_cutoff");
  });

  it("relatório entregue antes do corte não recebe -- essa base é do e-mail pessoal", () => {
    const antes = new Date(Date.parse(CORTE) - 1000).toISOString();
    expect(motivo(decidir({ reportEmailSentAtIso: antes }, ENV, Date.parse(CORTE) + 15 * DIA))).toBe(
      "before_offer_cutoff"
    );
  });

  it("janela: antes do D+14 e depois do D+30, fora", () => {
    expect(motivo(decidir({ reportEmailSentAtIso: new Date(AGORA - 13 * DIA).toISOString() }))).toBe("outside_window");
    const tarde = Date.parse(CORTE) + 31 * DIA;
    expect(motivo(decidir({ reportEmailSentAtIso: CORTE }, ENV, tarde))).toBe("outside_window");
  });

  it("exige consentimento de marketing explícito (NULL não autoriza)", () => {
    expect(motivo(decidir({ consentMarketing: null }))).toBe("no_marketing_consent");
    expect(motivo(decidir({ consentMarketing: false }))).toBe("no_marketing_consent");
  });

  it("descadastro, conversa humana e classificação vencem a oferta", () => {
    expect(motivo(decidir({ unsubscribedAtIso: new Date(AGORA - DIA).toISOString() }))).toBe("unsubscribed");
    expect(motivo(decidir({ crmStatus: "proposta_enviada" }))).toBe("human_contact");
    expect(motivo(decidir({ lastContactAtIso: new Date(AGORA - 3 * DIA).toISOString() }))).toBe("human_contact");
    expect(motivo(decidir({ leadClassification: "spam" }))).toBe("lead_spam");
    expect(motivo(decidir({ leadClassification: null }))).toBe("lead_classification_unknown");
  });

  it("só português, e precisa saber a dimensão mais frágil", () => {
    expect(motivo(decidir({ reportLanguage: "en" }))).toBe("unsupported_language");
    expect(motivo(decidir({ reportLanguage: null }))).toBe("unsupported_language");
    expect(motivo(decidir({ lowestDimensionId: null }))).toBe("unknown_dimension");
  });

  it("já registrado não envia de novo", () => {
    expect(motivo(decidir({ alreadyRecordedTypes: ["strategic_d21"] }))).toBe("already_recorded");
  });

  it("silêncio de 20/12 a 05/01 (horário de São Paulo) adia, e a janela de 30 dias pega a volta", () => {
    expect(isOfferQuietPeriod(Date.parse("2026-12-20T03:00:00Z"))).toBe(true); // 00:00 em SP
    expect(isOfferQuietPeriod(Date.parse("2026-12-20T02:59:00Z"))).toBe(false); // 23:59 de 19/12 em SP
    expect(isOfferQuietPeriod(Date.parse("2027-01-05T23:00:00Z"))).toBe(true);
    expect(isOfferQuietPeriod(Date.parse("2027-01-06T03:00:00Z"))).toBe(false);

    const entregue = "2026-12-05T12:00:00Z"; // D+14 em 19/12, D+30 em 04/01
    const env = { ...ENV, CGI_OFFER_D14_DELIVERED_SINCE: "2026-12-01" };
    expect(motivo(decidir({ reportEmailSentAtIso: entregue }, env, Date.parse("2026-12-22T15:00:00Z")))).toBe(
      "quiet_period"
    );
    const entregue2 = "2026-12-10T12:00:00Z"; // D+27 em 06/01
    expect(motivo(decidir({ reportEmailSentAtIso: entregue2 }, env, Date.parse("2027-01-06T15:00:00Z")))).toBe("send");
  });

  it("corte e silêncio não viram linha no ledger; idioma vira", () => {
    expect(shouldRecordSuppression("before_offer_cutoff")).toBe(false);
    expect(shouldRecordSuppression("quiet_period")).toBe(false);
    expect(shouldRecordSuppression("unsupported_language")).toBe(true);
  });

  it("readOfferCutoffMs aceita data ISO e rejeita lixo", () => {
    expect(readOfferCutoffMs({ CGI_OFFER_D14_DELIVERED_SINCE: "2026-10-07" })).toBe(Date.parse("2026-10-07"));
    expect(readOfferCutoffMs({ CGI_OFFER_D14_DELIVERED_SINCE: "" })).toBeNull();
    expect(readOfferCutoffMs({})).toBeNull();
  });
});

describe("D+14 -- conteúdo", () => {
  const base = {
    name: "Ana",
    company: "ACME",
    dimensionId: "growthMachine" as const,
    unsubscribeUrl: "https://x/cgi/descadastrar#t=abc",
  };

  it("assunto com a empresa, dimensão no corpo, 20 livros e descadastro", () => {
    const c = buildCgiOfferD14Email({ ...base, cgiLevel: "intentional" });
    expect(c.subject).toBe("Seu time já viu o diagnóstico da ACME?");
    expect(c.plainText).toContain("Máquina de Crescimento");
    expect(c.plainText).toContain("20 livros");
    expect(c.plainText).toContain("ganhos estruturados");
    expect(c.plainText).toContain("descadastrar#t=abc");
    expect(c.htmlBody).toContain("descadastrar#t=abc");
  });

  it("níveis estruturado/escalável recebem a leitura de escala", () => {
    const c = buildCgiOfferD14Email({ ...base, cgiLevel: "scalable" });
    expect(c.plainText).toContain("O desafio agora é de escala");
    expect(c.plainText).not.toContain("ganhos estruturados");
  });

  it("escapa HTML vindo do lead", () => {
    const c = buildCgiOfferD14Email({ ...base, name: "<b>x</b>", cgiLevel: null });
    expect(c.htmlBody).not.toContain("<b>x</b>");
  });
});

// ---------------------------------------------------------------------------
// Sweep
// ---------------------------------------------------------------------------

const db = vi.hoisted(() => ({
  getReportFollowupCandidates: vi.fn(),
  getReportAccessTimestamps: vi.fn(),
  getNurtureLeads: vi.fn(),
  getNurtureOpportunities: vi.fn(),
  getRecordedCommunicationTypes: vi.fn(),
  getReportLanguages: vi.fn(),
  updateCommunicationByDedupeKey: vi.fn(),
  supabaseInsert: vi.fn(),
  logSupabaseFailure: vi.fn(),
  setContactTokenHash: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => db);

const token = vi.hoisted(() => ({
  issueReportAccessToken: vi.fn(),
  buildReportAccessUrl: vi.fn((t: string) => `https://x/cgi/relatorio#t=${t}`),
}));
vi.mock("../../api/_cgi-report-token.js", () => token);

const contato = vi.hoisted(() => ({ ensureContactToken: vi.fn() }));
vi.mock("../../api/_cgi-contact-token.js", () => contato);

const mail = vi.hoisted(() => ({ dispatchCgiParticipantEmail: vi.fn() }));
vi.mock("../../api/_cgi-email-dispatch.js", () => mail);

import handler from "../../api/cgi/report-followup-sweep";

const SECRET = "segredo-do-cron";
const req = (query: Record<string, string> = {}) =>
  ({ method: "GET", headers: { authorization: `Bearer ${SECRET}` }, query, body: {} }) as never;
function res() {
  const r = {
    statusCode: 0,
    payload: null as Record<string, any> | null,
    status(code: number) { r.statusCode = code; return r; },
    json(p: Record<string, any>) { r.payload = p; return r; },
  };
  return r;
}

const linha = (over: Record<string, unknown> = {}) => ({
  id: "assess_1",
  public_assessment_id: "PID1",
  lead_id: "lead_1",
  completed_at: new Date(AGORA - 16 * DIA).toISOString(),
  report_email_sent_at: new Date(AGORA - 15 * DIA).toISOString(),
  lowest_dimension: "growthMachine",
  cgi_level: "structured",
  ...over,
});
const leadRow = (over: Record<string, unknown> = {}) => ({
  id: "lead_1", name: "Ana", email: "ana@acme.com", company: "ACME",
  consent_marketing: true, unsubscribed_at: null, contact_token_hash: null, classification: "legitimate",
  ...over,
});

const ledger = () => db.supabaseInsert.mock.calls.map((c: unknown[]) => c[1] as Record<string, unknown>);

describe("D+14 -- sweep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AGORA);
    vi.stubEnv("CRON_SECRET", SECRET);
    vi.stubEnv("CGI_REPORT_FOLLOWUP_D2_ENABLED", "");
    vi.stubEnv("CGI_OFFER_D14_ENABLED", "true");
    vi.stubEnv("CGI_OFFER_D14_DELIVERED_SINCE", CORTE);
    vi.stubEnv("CGI_EMAIL_DRY_RUN", "");
    vi.stubEnv("CONTACT_FORM_URL", "https://script/x");
    vi.stubEnv("CGI_COMMUNICATIONS_LEDGER_ENABLED", "true");
    db.getReportFollowupCandidates.mockResolvedValue({ ok: true, rows: [linha()] });
    db.getReportAccessTimestamps.mockResolvedValue({ ok: true, rows: new Map() });
    db.getNurtureLeads.mockResolvedValue({ ok: true, rows: new Map([["lead_1", leadRow()]]) });
    db.getNurtureOpportunities.mockResolvedValue({ ok: true, rows: new Map() });
    db.getRecordedCommunicationTypes.mockResolvedValue({ ok: true, rows: new Map() });
    db.getReportLanguages.mockResolvedValue({ ok: true, rows: new Map([["PID1", "pt"]]) });
    db.supabaseInsert.mockResolvedValue({ ok: true, status: 201, data: [{}] });
    db.updateCommunicationByDedupeKey.mockResolvedValue({ ok: true, status: 204 });
    contato.ensureContactToken.mockResolvedValue("tok_contato");
    mail.dispatchCgiParticipantEmail.mockResolvedValue({ status: "sent" });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("inspect da oferta não escreve, não emite token e não envia", async () => {
    const r = res();
    await handler(req({ mode: "inspect", type: "offer_d14" }), r as never);
    expect(r.payload?.would_send).toBe(1);
    expect(r.payload?.delivered_since).toBe(new Date(CORTE).toISOString());
    expect(r.payload?.items[0]).toMatchObject({ decision: "send", lowest_dimension: "growthMachine" });
    expect(db.supabaseInsert).not.toHaveBeenCalled();
    expect(contato.ensureContactToken).not.toHaveBeenCalled();
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
  });

  it("inspect padrão continua sendo o do D+2 (não chama a leitura de idioma)", async () => {
    db.getReportFollowupCandidates.mockResolvedValue({ ok: true, rows: [] });
    const r = res();
    await handler(req({ mode: "inspect" }), r as never);
    expect(r.payload?.type).toBeUndefined();
    expect(db.getReportLanguages).not.toHaveBeenCalled();
  });

  it("run com o D+2 desligado ainda roda a oferta: reserva, envia, fecha como sent", async () => {
    const r = res();
    await handler(req(), r as never);
    expect(r.payload?.status).toBe("disabled"); // o D+2
    expect(r.payload?.offer_d14).toMatchObject({ status: "ran", sent: 1, failed: 0 });
    const reserva = ledger()[0];
    expect(reserva).toMatchObject({ communication_type: "strategic_d21", status: "sending" });
    const envio = mail.dispatchCgiParticipantEmail.mock.calls[0][0];
    expect(envio.recipient).toBe("ana@acme.com");
    expect(envio.content.plainText).toContain("descadastrar#t=tok_contato");
    expect(db.updateCommunicationByDedupeKey).toHaveBeenCalledWith(
      expect.stringContaining("strategic_d21"),
      expect.objectContaining({ status: "sent" })
    );
  });

  it("flag da oferta desligada: nada da oferta acontece", async () => {
    vi.stubEnv("CGI_OFFER_D14_ENABLED", "");
    const r = res();
    await handler(req(), r as never);
    expect(r.payload?.offer_d14).toBeUndefined();
    expect(db.getReportLanguages).not.toHaveBeenCalled();
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
  });

  it("leitura de idioma falhou: varredura degradada, nada enviado", async () => {
    db.getReportLanguages.mockResolvedValue({ ok: false, rows: new Map() });
    const r = res();
    await handler(req(), r as never);
    expect(r.payload?.offer_d14).toMatchObject({ degraded: true, sent: 0, failed_reads: ["report_language"] });
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
  });

  it("sem token de descadastro, não envia e fecha a linha como failed", async () => {
    contato.ensureContactToken.mockResolvedValue(null);
    const r = res();
    await handler(req(), r as never);
    expect(r.payload?.offer_d14).toMatchObject({ sent: 0, failed: 1 });
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
    expect(db.updateCommunicationByDedupeKey).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ status: "failed", error_code: "unsubscribe_unavailable" })
    );
  });

  it("dry run não reserva a chave -- a pessoa continua elegível para o envio real", async () => {
    vi.stubEnv("CGI_EMAIL_DRY_RUN", "true");
    const r = res();
    await handler(req(), r as never);
    expect(r.payload?.offer_d14.results[0].outcome).toBe("dry_run");
    expect(db.supabaseInsert).not.toHaveBeenCalled();
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
  });

  it("ledger desligado: a oferta não sai -- sem reserva não há envio", async () => {
    vi.stubEnv("CGI_COMMUNICATIONS_LEDGER_ENABLED", "");
    const r = res();
    await handler(req(), r as never);
    expect(r.payload?.offer_d14.results[0]).toMatchObject({ outcome: "skipped" });
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
  });

  it("idioma inglês vira supressão registrada, uma vez", async () => {
    db.getReportLanguages.mockResolvedValue({ ok: true, rows: new Map([["PID1", "en"]]) });
    const r = res();
    await handler(req(), r as never);
    expect(r.payload?.offer_d14).toMatchObject({ sent: 0, suppressed: 1 });
    expect(ledger()[0]).toMatchObject({ status: "suppressed", reason: "unsupported_language" });
  });
});
