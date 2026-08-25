import { describe, expect, it } from "vitest";
import {
  HUMAN_CONTACT_QUIET_DAYS,
  NURTURE_FLAG_BY_TYPE,
  decideNurture,
  isNurtureTypeEnabled,
  buildSuppressionRecord,
  shouldRecordSuppression,
  type NurtureCandidate,
} from "../../api/_cgi-nurture.js";

const AGORA = Date.parse("2026-08-25T13:00:00Z");
const LIGADO = { CGI_REPORT_FOLLOWUP_D2_ENABLED: "true", CGI_NURTURE_D7_ENABLED: "true" };

function candidato(over: Partial<NurtureCandidate> = {}): NurtureCandidate {
  return {
    publicAssessmentId: "PID1",
    leadId: "lead_1",
    // entregue há 3 dias -- dentro da janela do D+2
    reportEmailSentAtIso: "2026-08-22T13:00:00Z",
    reportOpenedAtIso: null,
    consentMarketing: true,
    unsubscribedAtIso: null,
    crmStatus: "novo",
    lastContactAtIso: null,
    lowestDimensionId: "growthMachine",
    alreadyRecordedTypes: [],
    ...over,
  };
}

function decidir(tipo: "report_followup_d2" | "howto_d7", over: Partial<NurtureCandidate> = {}, env = LIGADO) {
  return decideNurture(tipo, candidato(over), { now: AGORA, env });
}

describe("feature flag — desligada é desligada", () => {
  it("sem variável nenhuma, nada é enviado", () => {
    for (const tipo of ["report_followup_d2", "howto_d7"] as const) {
      expect(decidir(tipo, {}, {})).toMatchObject({ decision: "suppress", reason: "flag_disabled" });
    }
  });

  it("só a string exata 'true' liga", () => {
    for (const valor of ["", "1", "yes", "TRUE", "True", "true ", "false"]) {
      expect(isNurtureTypeEnabled("howto_d7", { CGI_NURTURE_D7_ENABLED: valor })).toBe(false);
    }
    expect(isNurtureTypeEnabled("howto_d7", { CGI_NURTURE_D7_ENABLED: "true" })).toBe(true);
  });

  it("as flags são independentes: ligar uma não liga a outra", () => {
    const so_d2 = { CGI_REPORT_FOLLOWUP_D2_ENABLED: "true" };
    expect(decidir("report_followup_d2", {}, so_d2)).toMatchObject({ decision: "send" });
    expect(decidir("howto_d7", { reportEmailSentAtIso: "2026-08-17T13:00:00Z" }, so_d2)).toMatchObject({
      decision: "suppress",
      reason: "flag_disabled",
    });
  });

  it("a flag é a primeira coisa avaliada, antes de qualquer outra regra", () => {
    // Candidato inelegível por vários motivos ao mesmo tempo: a razão relatada
    // ainda assim é a flag.
    const d = decidir("howto_d7", { unsubscribedAtIso: "2026-08-24T00:00:00Z", consentMarketing: false }, {});
    expect(d).toMatchObject({ reason: "flag_disabled" });
  });

  it("os nomes das flags são os combinados", () => {
    expect(NURTURE_FLAG_BY_TYPE.report_followup_d2).toBe("CGI_REPORT_FOLLOWUP_D2_ENABLED");
    expect(NURTURE_FLAG_BY_TYPE.howto_d7).toBe("CGI_NURTURE_D7_ENABLED");
  });
});

describe("D+2 — confirmação de entrega", () => {
  it("elegível: entregue há 3 dias, não aberto, ninguém falou com a pessoa", () => {
    const d = decidir("report_followup_d2");
    expect(d).toMatchObject({ decision: "send", type: "report_followup_d2" });
    expect(d.decision === "send" && d.dedupeKey).toBe("PID1:report_followup_d2");
  });

  it("relatório aberto suprime: o e-mail perde o assunto", () => {
    expect(decidir("report_followup_d2", { reportOpenedAtIso: "2026-08-23T10:00:00Z" })).toMatchObject({
      decision: "suppress",
      reason: "report_already_opened",
    });
  });

  it("sem entrega registrada não há régua", () => {
    expect(decidir("report_followup_d2", { reportEmailSentAtIso: null })).toMatchObject({
      reason: "report_not_delivered",
    });
  });

  it("cedo demais e tarde demais ficam de fora", () => {
    expect(decidir("report_followup_d2", { reportEmailSentAtIso: "2026-08-25T01:00:00Z" })).toMatchObject({
      reason: "outside_window",
    });
    expect(decidir("report_followup_d2", { reportEmailSentAtIso: "2026-08-01T13:00:00Z" })).toMatchObject({
      reason: "outside_window",
    });
  });

  it("a janela fechada é o que impede um disparo em massa ao ligar a flag", () => {
    // Base histórica inteira: entregas de semanas atrás. Nenhuma entra.
    for (const dias of [6, 10, 30, 90]) {
      const entregue = new Date(AGORA - dias * 86_400_000).toISOString();
      expect(decidir("report_followup_d2", { reportEmailSentAtIso: entregue })).toMatchObject({
        reason: "outside_window",
      });
    }
  });

  it("não exige consentimento de marketing: é continuação da entrega", () => {
    expect(decidir("report_followup_d2", { consentMarketing: false })).toMatchObject({ decision: "send" });
    expect(decidir("report_followup_d2", { consentMarketing: null })).toMatchObject({ decision: "send" });
  });

  it("mas respeita o descadastro mesmo sendo transacional — decisão deliberada", () => {
    expect(decidir("report_followup_d2", { unsubscribedAtIso: "2026-08-23T00:00:00Z" })).toMatchObject({
      reason: "unsubscribed",
    });
  });

  it("dedupe: já registrado no ledger não reenvia", () => {
    expect(decidir("report_followup_d2", { alreadyRecordedTypes: ["report_followup_d2"] })).toMatchObject({
      reason: "already_recorded",
    });
  });

  it("um tipo registrado não bloqueia o outro", () => {
    expect(decidir("report_followup_d2", { alreadyRecordedTypes: ["report_delivery", "howto_d7"] })).toMatchObject({
      decision: "send",
    });
  });
});

describe("D+7 — conteúdo, e portanto opt-in", () => {
  const noPrazo = { reportEmailSentAtIso: "2026-08-17T13:00:00Z" }; // 8 dias

  it("elegível: opt-in vivo, dimensão conhecida, ninguém em conversa", () => {
    const d = decidir("howto_d7", noPrazo);
    expect(d).toMatchObject({ decision: "send", type: "howto_d7" });
    expect(d.decision === "send" && d.dedupeKey).toBe("PID1:howto_d7");
  });

  it("sem opt-in não sai", () => {
    expect(decidir("howto_d7", { ...noPrazo, consentMarketing: false })).toMatchObject({
      reason: "no_marketing_consent",
    });
    expect(decidir("howto_d7", { ...noPrazo, consentMarketing: null })).toMatchObject({
      reason: "no_marketing_consent",
    });
  });

  it("descadastro suprime", () => {
    expect(decidir("howto_d7", { ...noPrazo, unsubscribedAtIso: "2026-08-20T00:00:00Z" })).toMatchObject({
      reason: "unsubscribed",
    });
  });

  it("descadastro vence opt-in ainda marcado como true", () => {
    expect(
      decidir("howto_d7", { ...noPrazo, consentMarketing: true, unsubscribedAtIso: "2026-08-20T00:00:00Z" })
    ).toMatchObject({ reason: "unsubscribed" });
  });

  it("sem dimensão conhecida não manda genérico", () => {
    for (const dim of [null, "", "dimensao_inventada"]) {
      expect(decidir("howto_d7", { ...noPrazo, lowestDimensionId: dim })).toMatchObject({
        reason: "unknown_dimension",
      });
    }
  });

  it("cada uma das cinco dimensões do CGI é aceita", () => {
    for (const dim of ["strategy", "market", "growthMachine", "execution", "leadership"]) {
      expect(decidir("howto_d7", { ...noPrazo, lowestDimensionId: dim })).toMatchObject({ decision: "send" });
    }
  });

  it("dedupe por assessment", () => {
    expect(decidir("howto_d7", { ...noPrazo, alreadyRecordedTypes: ["howto_d7"] })).toMatchObject({
      reason: "already_recorded",
    });
  });
});

describe("human override — a automação para quando a conversa começa", () => {
  const noPrazo = { reportEmailSentAtIso: "2026-08-17T13:00:00Z" };

  it("todo status movido por uma pessoa suprime os dois toques", () => {
    const statuses = [
      "contato_realizado", "reuniao_agendada", "enviar_proposta",
      "proposta_enviada", "convertido", "sem_interesse", "descartado",
    ];
    for (const status of statuses) {
      expect(decidir("report_followup_d2", { crmStatus: status })).toMatchObject({ reason: "human_contact" });
      expect(decidir("howto_d7", { ...noPrazo, crmStatus: status })).toMatchObject({ reason: "human_contact" });
    }
  });

  it("status que ninguém moveu não suprimem", () => {
    for (const status of ["novo", "revisado", "contato_pendente", ""]) {
      expect(decidir("report_followup_d2", { crmStatus: status })).toMatchObject({ decision: "send" });
    }
  });

  it("contato humano recente suprime mesmo com o card parado em 'novo'", () => {
    // O caso real: conversa no WhatsApp, card não movido.
    const ontem = new Date(AGORA - 1 * 86_400_000).toISOString();
    expect(decidir("report_followup_d2", { crmStatus: "novo", lastContactAtIso: ontem })).toMatchObject({
      reason: "human_contact",
    });
  });

  it("contato antigo volta a permitir", () => {
    const antigo = new Date(AGORA - (HUMAN_CONTACT_QUIET_DAYS + 1) * 86_400_000).toISOString();
    expect(decidir("report_followup_d2", { crmStatus: "novo", lastContactAtIso: antigo })).toMatchObject({
      decision: "send",
    });
  });

  it("a conversa humana vence a janela e vence o opt-in", () => {
    const d = decidir("howto_d7", { ...noPrazo, crmStatus: "reuniao_agendada", consentMarketing: true });
    expect(d).toMatchObject({ reason: "human_contact" });
  });
});

describe("nenhum caminho devolve 'send' por omissão", () => {
  it("candidato vazio é suprimido, nunca enviado", () => {
    const vazio: NurtureCandidate = {
      publicAssessmentId: "", leadId: null, reportEmailSentAtIso: null, reportOpenedAtIso: null,
      consentMarketing: null, unsubscribedAtIso: null, crmStatus: null, lastContactAtIso: null,
      lowestDimensionId: null, alreadyRecordedTypes: [],
    };
    for (const tipo of ["report_followup_d2", "howto_d7"] as const) {
      expect(decideNurture(tipo, vazio, { now: AGORA, env: LIGADO }).decision).toBe("suppress");
    }
  });

  it("data de entrega inválida não vira zero dias", () => {
    expect(decidir("report_followup_d2", { reportEmailSentAtIso: "nao-e-data" })).toMatchObject({
      reason: "report_not_delivered",
    });
  });
});

describe("supressões — medir sem poluir o ledger", () => {
  const suprimir = (tipo: "report_followup_d2" | "howto_d7", over = {}, env = LIGADO) =>
    decideNurture(tipo, candidato(over), { now: AGORA, env });

  it("motivo que informa sobre a pessoa vira linha", () => {
    const d = suprimir("howto_d7", { reportEmailSentAtIso: "2026-08-17T13:00:00Z", consentMarketing: false });
    const linha = buildSuppressionRecord(d);
    expect(linha).toMatchObject({
      type: "howto_d7", status: "suppressed", reason: "no_marketing_consent",
      dedupeKey: "PID1:howto_d7:suppressed:no_marketing_consent",
    });
  });

  it("flag desligada NÃO vira linha: é fato sobre o sistema, não sobre a pessoa", () => {
    expect(buildSuppressionRecord(suprimir("howto_d7", {}, {}))).toBeNull();
    expect(shouldRecordSuppression("flag_disabled")).toBe(false);
  });

  it("fora da janela NÃO vira linha: é transitório e viraria uma linha por dia", () => {
    const d = suprimir("report_followup_d2", { reportEmailSentAtIso: "2026-07-01T13:00:00Z" });
    expect(buildSuppressionRecord(d)).toBeNull();
    expect(shouldRecordSuppression("outside_window")).toBe(false);
  });

  it("já registrado NÃO vira linha: a linha que interessa já existe", () => {
    const d = suprimir("report_followup_d2", { alreadyRecordedTypes: ["report_followup_d2"] });
    expect(buildSuppressionRecord(d)).toBeNull();
  });

  it("uma decisão de envio nunca vira linha de supressão", () => {
    expect(buildSuppressionRecord(suprimir("report_followup_d2"))).toBeNull();
  });

  it("a chave usa namespace próprio, para não ocupar o slot do envio real", () => {
    // Se a supressão usasse a mesma chave, ela consumiria o único slot daquele
    // tipo e o envio real seria recusado como duplicata mais tarde.
    const envio = suprimir("report_followup_d2");
    const chaveDeEnvio = envio.decision === "send" ? envio.dedupeKey : "";
    const supressao = buildSuppressionRecord(
      suprimir("report_followup_d2", { reportOpenedAtIso: "2026-08-23T10:00:00Z" })
    );
    expect(chaveDeEnvio).toBe("PID1:report_followup_d2");
    expect(supressao?.dedupeKey).toBe("PID1:report_followup_d2:suppressed:report_already_opened");
    expect(supressao?.dedupeKey).not.toBe(chaveDeEnvio);
  });

  it("um motivo, uma chave: a mesma supressão duas vezes é a mesma linha", () => {
    const a = buildSuppressionRecord(suprimir("report_followup_d2", { crmStatus: "contato_realizado" }));
    const b = buildSuppressionRecord(suprimir("report_followup_d2", { crmStatus: "reuniao_agendada" }));
    expect(a?.dedupeKey).toBe(b?.dedupeKey);
    expect(a?.dedupeKey).toBe("PID1:report_followup_d2:suppressed:human_contact");
  });

  it("motivos distintos são linhas distintas — o teto é o número de motivos", () => {
    const chaves = new Set(
      [
        suprimir("report_followup_d2", { crmStatus: "contato_realizado" }),
        suprimir("report_followup_d2", { reportOpenedAtIso: "2026-08-23T10:00:00Z" }),
        suprimir("report_followup_d2", { unsubscribedAtIso: "2026-08-23T10:00:00Z" }),
      ].map((d) => buildSuppressionRecord(d)?.dedupeKey)
    );
    expect(chaves.size).toBe(3);
  });
});
