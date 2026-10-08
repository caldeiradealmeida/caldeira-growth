import { describe, expect, it } from "vitest";
import {
  AUTOMATION_ALLOWED_CLASSIFICATION,
  LEAD_CLASSIFICATIONS,
  automationMaySend,
  classificationSuppressionReason,
  isLeadClassification,
} from "../../api/_cgi-lead-classification";
import { decideNurture, shouldRecordSuppression, type NurtureCandidate } from "../../api/_cgi-nurture";

const AGORA = Date.parse("2026-08-25T12:00:00Z");
const LIGADO = { CGI_REPORT_FOLLOWUP_D2_ENABLED: "true", CGI_HOWTO_D7_ENABLED: "true" };

function candidato(over: Partial<NurtureCandidate> = {}): NurtureCandidate {
  return {
    publicAssessmentId: "assessment_1",
    leadId: "lead_1",
    reportEmailSentAtIso: "2026-08-22T13:00:00Z",
    reportOpenedAtIso: null,
    consentMarketing: true,
    unsubscribedAtIso: null,
    crmStatus: "novo",
    lastContactAtIso: null,
    lowestDimensionId: "growthMachine",
    alreadyRecordedTypes: [],
    leadClassification: "legitimate",
    ...over,
  };
}

const decidir = (over: Partial<NurtureCandidate> = {}) =>
  decideNurture("report_followup_d2", candidato(over), { now: AGORA, env: LIGADO });

describe("automationMaySend -- fail-closed por construção", () => {
  it("só 'legitimate' passa", () => {
    expect(automationMaySend("legitimate")).toBe(true);
    expect(AUTOMATION_ALLOWED_CLASSIFICATION).toBe("legitimate");
  });

  it("os outros três valores conhecidos bloqueiam", () => {
    for (const valor of ["test", "spam", "invalid"]) {
      expect(automationMaySend(valor)).toBe(false);
    }
  });

  it("ausência de informação NUNCA vira permissão", () => {
    // A lista é o ponto do teste: cada um destes é uma forma diferente de
    // "não sei", e nenhuma pode autorizar um e-mail. `undefined` cobre a
    // coluna que ainda não existe porque a migration não rodou.
    for (const valor of [null, undefined, "", "LEGITIMATE", "legitimo", 0, 1, true, {}, []]) {
      expect(automationMaySend(valor)).toBe(false);
    }
  });

  it("o motivo distingue a pessoa do sistema", () => {
    expect(classificationSuppressionReason("test")).toBe("lead_test");
    expect(classificationSuppressionReason("spam")).toBe("lead_spam");
    expect(classificationSuppressionReason("invalid")).toBe("lead_invalid");
    // Tudo que não sabemos ler é fato do sistema, não da pessoa.
    expect(classificationSuppressionReason(null)).toBe("lead_classification_unknown");
    expect(classificationSuppressionReason("qualquer_coisa")).toBe("lead_classification_unknown");
  });

  it("isLeadClassification reconhece exatamente os quatro", () => {
    expect(LEAD_CLASSIFICATIONS).toEqual(["legitimate", "test", "spam", "invalid"]);
    for (const v of LEAD_CLASSIFICATIONS) expect(isLeadClassification(v)).toBe(true);
    expect(isLeadClassification("outro")).toBe(false);
  });
});

describe("D+2 respeita a classificação", () => {
  it("spam nunca envia", () => {
    expect(decidir({ leadClassification: "spam" })).toMatchObject({
      decision: "suppress",
      reason: "lead_spam",
    });
  });

  it("test nunca envia", () => {
    expect(decidir({ leadClassification: "test" })).toMatchObject({
      decision: "suppress",
      reason: "lead_test",
    });
  });

  it("invalid não envia -- e isso é decisão, não descuido", () => {
    // Um lead inválido tem, por definição, dado que ninguém conferiu. Não há
    // regra explícita em contrário, e eu não criei uma.
    expect(decidir({ leadClassification: "invalid" })).toMatchObject({
      decision: "suppress",
      reason: "lead_invalid",
    });
  });

  it("classificação ilegível não envia", () => {
    expect(decidir({ leadClassification: null })).toMatchObject({
      decision: "suppress",
      reason: "lead_classification_unknown",
    });
    expect(decidir({ leadClassification: undefined })).toMatchObject({
      decision: "suppress",
      reason: "lead_classification_unknown",
    });
  });

  it("legitimate continua enviando quando elegível -- a guarda não suprime demais", () => {
    expect(decidir()).toMatchObject({ decision: "send", type: "report_followup_d2" });
  });

  it("a guarda vem antes da idempotência, mas depois da flag", () => {
    // Depois da flag: desligado é desligado, sem avaliar quem é a pessoa.
    expect(decideNurture("report_followup_d2", candidato({ leadClassification: "spam" }), {
      now: AGORA,
      env: {},
    })).toMatchObject({ reason: "flag_disabled" });
    // Antes da idempotência: não faz sentido dizer "já registrei" sobre quem
    // nunca deveria ter entrado na fila.
    expect(decidir({ leadClassification: "spam", alreadyRecordedTypes: ["report_followup_d2"] })).toMatchObject({
      reason: "lead_spam",
    });
  });
});

describe("o que vira linha no ledger", () => {
  it("motivos sobre a PESSOA viram linha", () => {
    for (const r of ["lead_test", "lead_spam", "lead_invalid"] as const) {
      expect(shouldRecordSuppression(r)).toBe(true);
    }
  });

  it("não saber a classificação é fato do SISTEMA -- não vira linha", () => {
    // Mesma regra de infrastructure_error: numa janela em que a migration
    // ainda não rodou, isto escreveria uma linha por candidato por dia sem
    // dizer nada sobre ninguém.
    expect(shouldRecordSuppression("lead_classification_unknown")).toBe(false);
    expect(shouldRecordSuppression("infrastructure_error")).toBe(false);
  });
});
