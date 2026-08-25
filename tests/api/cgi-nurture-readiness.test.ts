import { describe, expect, it } from "vitest";
import { decideNurture, type NurtureCandidate } from "../../api/_cgi-nurture.js";

// Readiness da regua contra a distribuicao REAL de Production.
//
// As datas de entrega abaixo sao as 5 unicas entregas de relatorio registradas
// em producao (leitura em 25/08/2026), todas de 19/08. Os identificadores foram
// trocados por rotulos; o que importa aqui sao as datas e o consentimento.
//
// O estado comercial e o MAIS PERMISSIVO possivel -- ninguem contatado, ledger
// vazio -- para que o resultado seja um piso, nao uma coincidencia: se nem
// assim nada dispara, nada dispara.
const AGORA = Date.parse("2026-08-25T15:00:00Z");
const LIGADO = { CGI_REPORT_FOLLOWUP_D2_ENABLED: "true", CGI_NURTURE_D7_ENABLED: "true" };

const REAIS: Array<{ pid: string; entregue: string; consent: boolean }> = [
  { pid: "ENTREGA_A", entregue: "2026-08-19T13:15:49.882Z", consent: true },
  { pid: "ENTREGA_B", entregue: "2026-08-19T00:11:48.358Z", consent: true },
  { pid: "ENTREGA_C", entregue: "2026-08-19T00:11:05.618Z", consent: false },
  { pid: "ENTREGA_D", entregue: "2026-08-19T00:10:17.122Z", consent: true },
  { pid: "ENTREGA_E", entregue: "2026-08-19T00:08:57.455Z", consent: true },
];

const cand = (r: (typeof REAIS)[number]): NurtureCandidate => ({
  publicAssessmentId: r.pid, leadId: "lead", reportEmailSentAtIso: r.entregue,
  reportOpenedAtIso: null, consentMarketing: r.consent, unsubscribedAtIso: null,
  crmStatus: "novo", lastContactAtIso: null, lowestDimensionId: "growthMachine",
  alreadyRecordedTypes: [],
});

describe("base histórica real: ligar a flag hoje não dispara nada", () => {
  it("D+2: zero envios sobre as 5 entregas reais", () => {
    const decisoes = REAIS.map((r) => decideNurture("report_followup_d2", cand(r), { now: AGORA, env: LIGADO }));
    console.log("D+2 →", decisoes.map((d) => (d.decision === "send" ? "ENVIA" : d.reason)).join(" | "));
    expect(decisoes.filter((d) => d.decision === "send")).toHaveLength(0);
    expect(decisoes.every((d) => d.decision === "suppress" && d.reason === "outside_window")).toBe(true);
  });

  it("D+7: zero envios hoje — a base ainda não entrou na janela", () => {
    const decisoes = REAIS.map((r) => decideNurture("howto_d7", cand(r), { now: AGORA, env: LIGADO }));
    console.log("D+7 hoje →", decisoes.map((d) => (d.decision === "send" ? "ENVIA" : d.reason)).join(" | "));
    expect(decisoes.filter((d) => d.decision === "send")).toHaveLength(0);
  });

  it("D+7: amanhã entram exatamente os 4 com opt-in, e nenhum sem", () => {
    const amanha = AGORA + 86_400_000;
    const decisoes = REAIS.map((r) => decideNurture("howto_d7", cand(r), { now: amanha, env: LIGADO }));
    console.log("D+7 amanhã →", decisoes.map((d) => (d.decision === "send" ? "ENVIA" : d.reason)).join(" | "));
    expect(decisoes.filter((d) => d.decision === "send")).toHaveLength(4);
    expect(decisoes.filter((d) => d.decision === "suppress" && d.reason === "no_marketing_consent")).toHaveLength(1);
  });

  it("D+7: depois de 02/09 a janela fecha e a base sai de novo", () => {
    const depois = Date.parse("2026-09-03T15:00:00Z");
    const decisoes = REAIS.map((r) => decideNurture("howto_d7", cand(r), { now: depois, env: LIGADO }));
    expect(decisoes.filter((d) => d.decision === "send")).toHaveLength(0);
  });

  it("com as flags desligadas — o estado de hoje — nada sai em nenhuma data", () => {
    for (const quando of [AGORA, AGORA + 86_400_000, Date.parse("2026-09-03T15:00:00Z")]) {
      for (const tipo of ["report_followup_d2", "howto_d7"] as const) {
        const envios = REAIS.map((r) => decideNurture(tipo, cand(r), { now: quando, env: {} }))
          .filter((d) => d.decision === "send");
        expect(envios).toHaveLength(0);
      }
    }
  });
});
