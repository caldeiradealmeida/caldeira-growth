import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// D+2 -- o sweep inteiro, do HTTP ao ledger.
//
// Os testes olham o que SAI: quais linhas de ledger foram gravadas, quais
// chamadas ao provider aconteceram, e o que o handler respondeu. É o nível em
// que "não enviou" e "não pôde enviar" são distinguíveis.

const DIA = 86_400_000;
const AGORA = Date.parse("2026-08-27T12:00:00Z");

const db = vi.hoisted(() => ({
  getReportFollowupCandidates: vi.fn(),
  getReportAccessTimestamps: vi.fn(),
  getNurtureLeads: vi.fn(),
  getNurtureOpportunities: vi.fn(),
  getRecordedCommunicationTypes: vi.fn(),
  updateCommunicationByDedupeKey: vi.fn(),
  supabaseInsert: vi.fn(),
  logSupabaseFailure: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => db);

const token = vi.hoisted(() => ({
  issueReportAccessToken: vi.fn(),
  buildReportAccessUrl: vi.fn((t: string) => `https://x/cgi/relatorio#t=${t}`),
}));
vi.mock("../../api/_cgi-report-token.js", () => token);

const mail = vi.hoisted(() => ({ dispatchCgiParticipantEmail: vi.fn() }));
vi.mock("../../api/_cgi-email-dispatch.js", () => mail);

import handler from "../../api/cgi/report-followup-sweep";

const SECRET = "segredo-do-cron";

function req(over: Record<string, unknown> = {}) {
  return {
    method: "GET",
    headers: { authorization: `Bearer ${SECRET}` },
    query: {},
    body: {},
    ...over,
  } as never;
}

function res() {
  const r = {
    statusCode: 0,
    payload: null as Record<string, unknown> | null,
    status(code: number) { r.statusCode = code; return r; },
    json(p: Record<string, unknown>) { r.payload = p; return r; },
  };
  return r;
}

function assessment(over: Record<string, unknown> = {}) {
  return {
    id: "assess_1",
    public_assessment_id: "PID1",
    lead_id: "lead_1",
    completed_at: new Date(AGORA - 4 * DIA).toISOString(),
    // entregue ha 3 dias -> dentro de [2,5]
    report_email_sent_at: new Date(AGORA - 3 * DIA).toISOString(),
    ...over,
  };
}

function lead(over: Record<string, unknown> = {}) {
  return {
    id: "lead_1", name: "Ana", email: "ana@acme.com", company: "ACME",
    consent_marketing: false, unsubscribed_at: null, contact_token_hash: null,
    ...over,
  };
}

/** Linhas de ledger efetivamente inseridas. */
const ledger = () =>
  db.supabaseInsert.mock.calls
    .filter(([t]) => t === "cgi_communications")
    .map(([, b]) => b as Record<string, unknown>);

function cenario(over: {
  assessments?: Array<Record<string, unknown>>;
  leads?: Array<Record<string, unknown>>;
  acessos?: Array<[string, string | null]>;
  oportunidades?: Array<[string, Record<string, unknown>]>;
  registrados?: Array<[string, string[]]>;
} = {}) {
  db.getReportFollowupCandidates.mockResolvedValue(over.assessments ?? [assessment()]);
  db.getReportAccessTimestamps.mockResolvedValue(new Map(over.acessos ?? []));
  db.getNurtureLeads.mockResolvedValue(new Map((over.leads ?? [lead()]).map((l) => [l.id as string, l])));
  db.getNurtureOpportunities.mockResolvedValue(new Map(over.oportunidades ?? []));
  db.getRecordedCommunicationTypes.mockResolvedValue(new Map(over.registrados ?? []));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(AGORA);
  process.env.CRON_SECRET = SECRET;
  process.env.CGI_COMMUNICATIONS_LEDGER_ENABLED = "true";
  process.env.CGI_REPORT_FOLLOWUP_D2_ENABLED = "true";
  process.env.CGI_EMAIL_DRY_RUN = "false";
  process.env.CONTACT_FORM_URL = "https://script.google.test/exec";
  process.env.CGI_EMAIL_RELAY_TOKEN = "relay";
  db.supabaseInsert.mockResolvedValue({ ok: true, status: 201 });
  db.updateCommunicationByDedupeKey.mockResolvedValue({ ok: true, status: 204 });
  token.issueReportAccessToken.mockResolvedValue({ token: "tok-novo", expiresAt: "2026-11-01T00:00:00Z" });
  mail.dispatchCgiParticipantEmail.mockResolvedValue({ status: "sent" });
  cenario();
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.CGI_REPORT_FOLLOWUP_D2_ENABLED;
});

describe("SECURITY", () => {
  it("sem CRON_SECRET no header: 401 e nada acontece", async () => {
    const r = res();
    await handler(req({ headers: {} }), r as never);
    expect(r.statusCode).toBe(401);
    expect(db.getReportFollowupCandidates).not.toHaveBeenCalled();
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
  });

  it("segredo errado: 401", async () => {
    const r = res();
    await handler(req({ headers: { authorization: "Bearer errado" } }), r as never);
    expect(r.statusCode).toBe(401);
  });

  it("CRON_SECRET ausente no ambiente NÃO libera geral — fail closed", async () => {
    delete process.env.CRON_SECRET;
    const r = res();
    await handler(req({ headers: { authorization: "Bearer " } }), r as never);
    expect(r.statusCode).toBe(401);
    process.env.CRON_SECRET = SECRET;
  });

  it("inspect também exige o segredo", async () => {
    const r = res();
    await handler(req({ headers: {}, query: { mode: "inspect" } }), r as never);
    expect(r.statusCode).toBe(401);
    expect(db.getReportFollowupCandidates).not.toHaveBeenCalled();
  });
});

describe("FLAG", () => {
  it("desligada: zero envios, zero escritas, zero provider", async () => {
    process.env.CGI_REPORT_FOLLOWUP_D2_ENABLED = "false";
    const r = res();
    await handler(req(), r as never);

    expect(r.payload).toMatchObject({ status: "disabled", sent: 0, failed: 0, suppressed: 0 });
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
    expect(db.supabaseInsert).not.toHaveBeenCalled();
    expect(token.issueReportAccessToken).not.toHaveBeenCalled();
  });

  it("ausente é o mesmo que desligada", async () => {
    delete process.env.CGI_REPORT_FOLLOWUP_D2_ENABLED;
    const r = res();
    await handler(req(), r as never);
    expect(r.payload).toMatchObject({ status: "disabled" });
    expect(db.supabaseInsert).not.toHaveBeenCalled();
  });

  it("ligada: segue a elegibilidade e envia o candidato válido", async () => {
    const r = res();
    await handler(req(), r as never);
    expect(r.payload).toMatchObject({ sent: 1, failed: 0 });
  });
});

describe("WINDOW", () => {
  const comEntrega = (dias: number) =>
    cenario({ assessments: [assessment({ report_email_sent_at: new Date(AGORA - dias * DIA).toISOString() })] });

  it("D+1 suprime", async () => {
    comEntrega(1);
    const r = res();
    await handler(req(), r as never);
    expect(r.payload).toMatchObject({ sent: 0 });
  });

  it("D+2 é elegível", async () => {
    comEntrega(2.1);
    const r = res();
    await handler(req(), r as never);
    expect(r.payload).toMatchObject({ sent: 1 });
  });

  it("D+5 ainda é elegível", async () => {
    comEntrega(4.9);
    const r = res();
    await handler(req(), r as never);
    expect(r.payload).toMatchObject({ sent: 1 });
  });

  it("D+6 suprime", async () => {
    comEntrega(6);
    const r = res();
    await handler(req(), r as never);
    expect(r.payload).toMatchObject({ sent: 0 });
  });

  it("a janela também é aplicada na consulta, não só na decisão", async () => {
    const r = res();
    await handler(req(), r as never);
    const [args] = db.getReportFollowupCandidates.mock.calls[0] as [
      { sentFromIso: string; sentToIso: string },
    ];
    expect(Date.parse(args.sentFromIso)).toBe(AGORA - 5 * DIA);
    expect(Date.parse(args.sentToIso)).toBe(AGORA - 2 * DIA);
  });
});

describe("SUPRESSÕES", () => {
  it("relatório já aberto suprime e registra o motivo", async () => {
    cenario({ acessos: [["PID1", new Date(AGORA - 1 * DIA).toISOString()]] });
    const r = res();
    await handler(req(), r as never);

    expect(r.payload).toMatchObject({ sent: 0, suppressed: 1 });
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
    expect(ledger()[0]).toMatchObject({
      communication_type: "report_followup_d2",
      status: "suppressed",
      reason: "report_already_opened",
      dedupe_key: "PID1:report_followup_d2:suppressed:report_already_opened",
    });
  });

  it("contato humano recente suprime", async () => {
    cenario({ oportunidades: [["lead_1", { lead_id: "lead_1", status: "novo", last_contact_at: new Date(AGORA - 2 * DIA).toISOString() }]] });
    const r = res();
    await handler(req(), r as never);
    expect(r.payload).toMatchObject({ sent: 0, suppressed: 1 });
    expect(ledger()[0]).toMatchObject({ reason: "human_contact" });
  });

  it("status comercial suprime", async () => {
    for (const status of ["contato_realizado", "reuniao_agendada", "proposta_enviada", "convertido", "descartado"]) {
      vi.clearAllMocks();
      db.supabaseInsert.mockResolvedValue({ ok: true, status: 201 });
      cenario({ oportunidades: [["lead_1", { lead_id: "lead_1", status, last_contact_at: null }]] });
      const r = res();
      await handler(req(), r as never);
      expect(r.payload).toMatchObject({ sent: 0 });
      expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
    }
  });

  it("descadastrado suprime, mesmo sendo transacional", async () => {
    cenario({ leads: [lead({ unsubscribed_at: new Date(AGORA - 10 * DIA).toISOString() })] });
    const r = res();
    await handler(req(), r as never);
    expect(r.payload).toMatchObject({ sent: 0, suppressed: 1 });
    expect(ledger()[0]).toMatchObject({ reason: "unsubscribed" });
  });

  it("NÃO exige consent_marketing: quem nunca consentiu recebe", async () => {
    cenario({ leads: [lead({ consent_marketing: null })] });
    const r = res();
    await handler(req(), r as never);
    expect(r.payload).toMatchObject({ sent: 1 });
  });
});

describe("DEDUPE", () => {
  it("já registrado no ledger não reenvia", async () => {
    cenario({ registrados: [["PID1", ["report_followup_d2"]]] });
    const r = res();
    await handler(req(), r as never);
    expect(r.payload).toMatchObject({ sent: 0 });
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
    // already_recorded não vira linha: a linha que interessa já existe.
    expect(ledger()).toHaveLength(0);
  });

  it("concorrência: a reserva 409 impede o segundo envio ANTES do provider", async () => {
    // É o ponto central do desenho: a linha 'sending' é gravada primeiro e a
    // constraint única é o cadeado. Sem isso as duas execuções enviariam.
    db.supabaseInsert.mockResolvedValue({ ok: false, status: 409 });
    const r = res();
    await handler(req(), r as never);

    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
    expect(token.issueReportAccessToken).not.toHaveBeenCalled();
    expect(r.payload).toMatchObject({ sent: 0, failed: 0 });
    expect((r.payload?.results as Array<Record<string, unknown>>)[0]).toMatchObject({
      outcome: "claimed_by_other",
    });
  });

  it("a reserva vem antes do provider, sempre", async () => {
    const ordem: string[] = [];
    db.supabaseInsert.mockImplementation(async () => { ordem.push("ledger"); return { ok: true, status: 201 }; });
    mail.dispatchCgiParticipantEmail.mockImplementation(async () => { ordem.push("provider"); return { status: "sent" }; });
    const r = res();
    await handler(req(), r as never);
    expect(ordem[0]).toBe("ledger");
    expect(ordem).toContain("provider");
    expect(r.payload).toMatchObject({ sent: 1 });
  });
});

describe("PROVIDER", () => {
  it("sucesso fecha a linha como sent, com sent_at e subject", async () => {
    const r = res();
    await handler(req(), r as never);

    expect(ledger()[0]).toMatchObject({ status: "sending", communication_type: "report_followup_d2" });
    const [chave, corpo] = db.updateCommunicationByDedupeKey.mock.calls[0] as [string, Record<string, unknown>];
    expect(chave).toBe("PID1:report_followup_d2");
    expect(corpo.status).toBe("sent");
    expect(corpo.sent_at).toBeTruthy();
    expect(String(corpo.subject)).toContain("conseguiu abrir");
    expect(r.payload).toMatchObject({ sent: 1, failed: 0 });
  });

  it("falha do provider vira failed, nunca sent", async () => {
    mail.dispatchCgiParticipantEmail.mockResolvedValue({ status: "error", error: "http_500" });
    const r = res();
    await handler(req(), r as never);

    const [, corpo] = db.updateCommunicationByDedupeKey.mock.calls[0] as [string, Record<string, unknown>];
    expect(corpo.status).toBe("failed");
    expect(corpo.error_code).toBe("http_500");
    expect(corpo).not.toHaveProperty("sent_at");
    expect(r.payload).toMatchObject({ sent: 0, failed: 1 });
  });

  it("uma falha não interrompe os outros", async () => {
    cenario({
      assessments: [assessment(), assessment({ id: "a2", public_assessment_id: "PID2", lead_id: "lead_2" })],
      leads: [lead(), lead({ id: "lead_2", email: "b@x.com" })],
    });
    mail.dispatchCgiParticipantEmail
      .mockRejectedValueOnce(new Error("estourou"))
      .mockResolvedValueOnce({ status: "sent" });

    const r = res();
    await handler(req(), r as never);

    expect(r.payload).toMatchObject({ sent: 1, failed: 1 });
    expect(mail.dispatchCgiParticipantEmail).toHaveBeenCalledTimes(2);
  });

  it("token indisponível não vira envio", async () => {
    token.issueReportAccessToken.mockResolvedValue(null);
    const r = res();
    await handler(req(), r as never);
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
    const [, corpo] = db.updateCommunicationByDedupeKey.mock.calls[0] as [string, Record<string, unknown>];
    expect(corpo).toMatchObject({ status: "failed", error_code: "token_unavailable" });
  });
});

describe("INSPECT", () => {
  it("zero escritas, zero provider, zero token", async () => {
    const r = res();
    await handler(req({ query: { mode: "inspect" } }), r as never);

    expect(r.statusCode).toBe(200);
    expect(db.supabaseInsert).not.toHaveBeenCalled();
    expect(db.updateCommunicationByDedupeKey).not.toHaveBeenCalled();
    expect(mail.dispatchCgiParticipantEmail).not.toHaveBeenCalled();
    expect(token.issueReportAccessToken).not.toHaveBeenCalled();
  });

  it("mostra decisão, motivo e destinatário mascarado — nunca o e-mail", async () => {
    cenario({ acessos: [["PID1", new Date(AGORA - 1 * DIA).toISOString()]] });
    const r = res();
    await handler(req({ query: { mode: "inspect" } }), r as never);

    const item = (r.payload?.items as Array<Record<string, unknown>>)[0];
    expect(item).toMatchObject({
      public_assessment_id: "PID1",
      decision: "suppress",
      reason: "report_already_opened",
      recipient_masked: "a***@acme.com",
    });
    expect(JSON.stringify(r.payload)).not.toContain("ana@acme.com");
  });

  it("funciona com a flag desligada — existe para olhar antes de ligar", async () => {
    process.env.CGI_REPORT_FOLLOWUP_D2_ENABLED = "false";
    const r = res();
    await handler(req({ query: { mode: "inspect" } }), r as never);

    expect(r.payload).toMatchObject({ mode: "inspect", flag_enabled: false, candidates: 1 });
    expect(db.supabaseInsert).not.toHaveBeenCalled();
  });

  it("mostra o assunto real, mas nunca um link", async () => {
    const r = res();
    await handler(req({ query: { mode: "inspect" } }), r as never);
    const item = (r.payload?.items as Array<Record<string, unknown>>)[0];
    expect(String(item.subject)).toContain("conseguiu abrir");
    expect(JSON.stringify(r.payload)).not.toMatch(/#t=/);
  });

  it("conta o que faria sem fazer", async () => {
    const r = res();
    await handler(req({ query: { mode: "inspect" } }), r as never);
    expect(r.payload).toMatchObject({ candidates: 1, would_send: 1, would_record_suppressions: 0 });
  });
});

describe("LEDGER", () => {
  it("a linha de envio carrega tipo, classe, dedupe e snapshot de consentimento", async () => {
    cenario({ leads: [lead({ consent_marketing: true })] });
    const r = res();
    await handler(req(), r as never);

    expect(ledger()[0]).toMatchObject({
      communication_type: "report_followup_d2",
      communication_class: "transactional",
      status: "sending",
      dedupe_key: "PID1:report_followup_d2",
      consent_marketing_snapshot: true,
      provider: "apps_script_mailapp",
      actor: "system:cron",
    });
    expect(r.payload).toMatchObject({ sent: 1 });
  });

  it("o destinatário vai mascarado para o ledger", async () => {
    await handler(req(), res() as never);
    expect(ledger()[0].recipient_masked).toBe("a***@acme.com");
    expect(JSON.stringify(ledger()[0])).not.toContain("ana@acme.com");
  });

  it("a supressão usa namespace próprio e não ocupa a chave do envio", async () => {
    cenario({ leads: [lead({ unsubscribed_at: new Date(AGORA - 1 * DIA).toISOString() })] });
    await handler(req(), res() as never);
    expect(ledger()[0].dedupe_key).toBe("PID1:report_followup_d2:suppressed:unsubscribed");
    expect(ledger()[0].dedupe_key).not.toBe("PID1:report_followup_d2");
  });
});
