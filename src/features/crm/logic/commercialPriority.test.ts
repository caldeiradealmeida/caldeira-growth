import { describe, expect, it } from "vitest";
import {
  QUEUE_FILTER_LABELS,
  deriveReportEvidence,
  describeReportEvidence,
  compareForQueue,
  deriveCompanySize,
  deriveHumanContact,
  deriveMessageChips,
  derivePriority,
  isContacted,
  matchesQueueFilter,
  describeNextAction,
  type CompanySize,
  type ContactState,
} from "./commercialPriority";
import type { CgiCommunication, CrmOpportunity } from "../types";

const AGORA = Date.parse("2026-08-24T13:00:00Z");

function oportunidade(overrides: Partial<CrmOpportunity> = {}): CrmOpportunity {
  return {
    lead_id: "lead_1", status: "novo", owner_email: null, notes: null,
    next_action_at: null, last_contact_at: null, estimated_value: null,
    lost_reason: null, is_test_excluded: false,
    created_at: "2026-08-01T00:00:00Z", updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function comunicacao(overrides: Partial<CgiCommunication> = {}): CgiCommunication {
  return {
    id: "c1", lead_id: "lead_1", assessment_id: "a1", public_assessment_id: "PID",
    communication_type: "report_delivery", communication_class: "transactional",
    channel: "email", status: "sent", scheduled_at: null,
    sent_at: "2026-08-19T12:00:00Z", failed_at: null, cancelled_at: null,
    recipient_masked: "a***@x.com", subject: "s", error_code: null, reason: null,
    actor: "system:completion", created_at: "2026-08-19T12:00:00Z",
    ...overrides,
  };
}

const PORTE_MEDIO: CompanySize = deriveCompanySize("R$ 10-50 milhões");
const SEM_PORTE: CompanySize = deriveCompanySize("");

function base(over: Partial<Parameters<typeof derivePriority>[0]> = {}) {
  return {
    size: PORTE_MEDIO, contact: { kind: "never" } as ContactState, crmStatus: "novo",
    completed: true, started: true, reportDelivered: false, reportOpened: false,
    investmentIntent: null, nextActionAt: null, now: AGORA, ...over,
  };
}

describe("porte — usa as faixas canônicas do próprio formulário", () => {
  it("mapeia as cinco faixas reais em ordem crescente", () => {
    expect(deriveCompanySize("Até R$ 1 milhão").tier).toBe(1);
    expect(deriveCompanySize("R$ 1-10 milhões").tier).toBe(2);
    expect(deriveCompanySize("R$ 10-50 milhões").tier).toBe(3);
    expect(deriveCompanySize("R$ 50-200 milhões").tier).toBe(4);
    expect(deriveCompanySize("Acima de R$ 200 milhões").tier).toBe(5);
  });

  it("trata 'Prefiro não informar' e vazio como desconhecido, não como pequeno", () => {
    expect(deriveCompanySize("Prefiro não informar")).toMatchObject({ tier: 0, known: false });
    expect(deriveCompanySize("")).toMatchObject({ tier: 0, known: false });
    expect(deriveCompanySize(null)).toMatchObject({ tier: 0, known: false });
  });
});

describe("contato humano — comunicação automática nunca conta", () => {
  it("sem linha no CRM é nunca contatado", () => {
    expect(deriveHumanContact(null, AGORA)).toEqual({ kind: "never" });
  });

  it("last_contact_at é a fonte forte e produz a idade em dias", () => {
    const estado = deriveHumanContact(
      oportunidade({ status: "contato_realizado", last_contact_at: "2026-08-19T13:00:00Z" }),
      AGORA
    );
    expect(estado).toEqual({ kind: "contacted", atIso: "2026-08-19T13:00:00Z", daysAgo: 5 });
  });

  it("status movido por humano sem data vira 'contatado sem data' — não inventa data nem nega o contato", () => {
    expect(deriveHumanContact(oportunidade({ status: "contato_realizado" }), AGORA))
      .toEqual({ kind: "contacted_undated" });
    expect(deriveHumanContact(oportunidade({ status: "proposta_enviada" }), AGORA))
      .toEqual({ kind: "contacted_undated" });
  });

  it("novo, revisado e contato_pendente NÃO são contato", () => {
    for (const status of ["novo", "revisado", "contato_pendente"] as const) {
      expect(deriveHumanContact(oportunidade({ status }), AGORA)).toEqual({ kind: "never" });
    }
  });

  it("relatório entregue e abandono enviado não tornam ninguém contatado", () => {
    // O ledger não entra nesta derivação, por construção: a assinatura só
    // aceita a oportunidade do CRM.
    const estado = deriveHumanContact(oportunidade({ status: "novo" }), AGORA);
    expect(isContacted(estado)).toBe(false);
  });
});

describe("prioridade — cada nível cabe em uma frase", () => {
  it("P1: concluído, porte relevante, nenhum contato humano", () => {
    const p = derivePriority(base());
    expect(p.level).toBe("P1");
    expect(p.reason).toBe("Empresa 10–50M, CGI concluído, nenhum contato humano.");
  });

  it("P1: soma os sinais fortes na própria frase", () => {
    const p = derivePriority(base({ reportOpened: true, investmentIntent: "Sim" }));
    expect(p.level).toBe("P1");
    expect(p.reason).toBe(
      "Empresa 10–50M, CGI concluído, nenhum contato humano, abriu o relatório e declarou intenção de investir."
    );
  });

  it("P1: ação combinada vencida ganha de tudo", () => {
    const p = derivePriority(base({ crmStatus: "proposta_enviada", nextActionAt: "2026-08-21T13:00:00Z" }));
    expect(p.level).toBe("P1");
    expect(p.reason).toBe("Ação combinada venceu há 3 dias.");
  });

  it("P2: empresa pequena e sem sinal comercial, mesmo sem contato", () => {
    const p = derivePriority(base({ size: deriveCompanySize("Até R$ 1 milhão") }));
    expect(p.level).toBe("P2");
    expect(p.reason).toBe("Empresa ≤ 1M, CGI concluído, nenhum contato humano.");
  });

  it("P2: em processo comercial tem dono e próximo passo", () => {
    const p = derivePriority(base({ crmStatus: "reuniao_agendada" }));
    expect(p.level).toBe("P2");
    expect(p.reason).toContain("em processo comercial");
  });

  it("P2: concluído e já contatado, com próximo passo marcado, vira follow-up datado", () => {
    const p = derivePriority(base({
      crmStatus: "contato_realizado",
      contact: { kind: "contacted", atIso: "2026-08-14T13:00:00Z", daysAgo: 10 },
      nextActionAt: "2026-09-10T13:00:00Z",
    }));
    expect(p.level).toBe("P2");
    expect(p.reason).toBe("Empresa 10–50M, concluído e contatado há 10 dias.");
  });

  it("P2: contato sem data é dito como tal", () => {
    const p = derivePriority(base({
      crmStatus: "contato_realizado",
      contact: { kind: "contacted_undated" },
      nextActionAt: "2026-09-10T13:00:00Z",
    }));
    expect(p.reason).toBe("Empresa 10–50M, concluído e já contatado (sem data registrada).");
  });

  it("P3: empresa pequena que abandonou o CGI", () => {
    const p = derivePriority(base({
      size: deriveCompanySize("Até R$ 1 milhão"),
      completed: false,
      started: true,
    }));
    expect(p.level).toBe("P3");
    expect(p.rule).toBe("incomplete");
    expect(p.reason).toBe("Empresa ≤ 1M, CGI abandonado no meio.");
  });

  it("P4: encerrados saem da fila mas continuam existindo", () => {
    expect(derivePriority(base({ crmStatus: "convertido" }))).toEqual({
      level: "P4",
      rule: "converted",
      reason: "Convertido — fora da fila.",
    });
    expect(derivePriority(base({ crmStatus: "sem_interesse" })).level).toBe("P4");
    expect(derivePriority(base({ crmStatus: "descartado" })).level).toBe("P4");
  });

  it("P4: sem porte e sem engajamento", () => {
    const p = derivePriority(base({ size: SEM_PORTE, completed: false, started: false }));
    expect(p.level).toBe("P4");
    expect(p.reason).toBe("Sem porte informado e sem engajamento no diagnóstico.");
  });

  it("nunca devolve nível sem justificativa", () => {
    const casos = [
      base(), base({ completed: false }), base({ crmStatus: "convertido" }),
      base({ size: SEM_PORTE }), base({ crmStatus: "contato_pendente" }),
    ];
    for (const caso of casos) {
      const p = derivePriority(caso);
      expect(p.reason.length).toBeGreaterThan(10);
      expect(p.reason.endsWith(".")).toBe(true);
    }
  });
});

describe("mensagens — o ledger prova, o marcador legado apenas sugere", () => {
  it("usa os tipos reais do ledger, em rótulo curto", () => {
    const chips = deriveMessageChips({
      communications: [
        comunicacao({ id: "c1", communication_type: "report_delivery", sent_at: "2026-08-19T12:00:00Z" }),
        comunicacao({ id: "c2", communication_type: "abandon_progress_d1", sent_at: "2026-08-22T13:33:00Z" }),
      ],
    });
    expect(chips.map((c) => c.label)).toEqual(["Abandono", "Relatório"]);
    expect(chips.every((c) => c.proven)).toBe(true);
    expect(chips[0].detail).toContain("enviado 22/08/2026");
  });

  it("ignora o que não foi enviado", () => {
    const chips = deriveMessageChips({
      communications: [comunicacao({ status: "failed", sent_at: null })],
    });
    expect(chips).toHaveLength(0);
  });

  it("cai no marcador legado quando o ledger não cobre aquela família, e marca como não provado", () => {
    const chips = deriveMessageChips({
      communications: [],
      legacyReportEmailAt: "2026-08-19T00:10:00Z",
      legacyAbandonmentEmailAt: "2026-08-19T13:00:00Z",
    });
    expect(chips.map((c) => c.label).sort()).toEqual(["Abandono", "Relatório"]);
    expect(chips.every((c) => c.proven)).toBe(false);
    expect(chips.find((c) => c.label === "Abandono")?.detail).toContain("tipo exato não registrado");
  });

  it("não duplica quando o ledger já cobre a família", () => {
    const chips = deriveMessageChips({
      communications: [comunicacao({ communication_type: "report_delivery" })],
      legacyReportEmailAt: "2026-08-19T00:10:00Z",
    });
    expect(chips).toHaveLength(1);
    expect(chips[0].proven).toBe(true);
  });

  it("não inventa comunicação nenhuma quando não há prova", () => {
    expect(deriveMessageChips({ communications: [] })).toEqual([]);
  });
});

describe("fila — filtros e ordenação", () => {
  const view = (over: Record<string, unknown> = {}) => ({
    priority: { level: "P1" as const, rule: "completed_uncontacted" as const, reason: "x." },
    contact: { kind: "never" } as ContactState,
    crmStatus: "novo", completed: true, size: PORTE_MEDIO, ...over,
  });

  it("'A contatar' é concluído e sem contato humano", () => {
    expect(matchesQueueFilter("a_contatar", view())).toBe(true);
    expect(matchesQueueFilter("a_contatar", view({ contact: { kind: "contacted_undated" } }))).toBe(false);
    expect(matchesQueueFilter("a_contatar", view({ completed: false }))).toBe(false);
  });

  it("'Em proposta' cobre reunião, enviar e enviada", () => {
    for (const s of ["reuniao_agendada", "enviar_proposta", "proposta_enviada"]) {
      expect(matchesQueueFilter("em_proposta", view({ crmStatus: s }))).toBe(true);
    }
  });

  it("'Grandes empresas' é um recorte de porte, independente da prioridade", () => {
    const grande = deriveCompanySize("R$ 50-200 milhões");
    const maior = deriveCompanySize("Acima de R$ 200 milhões");
    const media = deriveCompanySize("R$ 10-50 milhões");

    // Atravessa todos os níveis: uma grande em P2 continua aparecendo.
    expect(matchesQueueFilter("grandes", view({ size: grande, priority: { level: "P2" as const, rule: "completed_contacted" as const, reason: "" } }))).toBe(true);
    expect(matchesQueueFilter("grandes", view({ size: maior, priority: { level: "P4" as const, rule: "closed" as const, reason: "" }, crmStatus: "descartado" }))).toBe(true);
    // Recorte comercial da Caldeira: "grande" começa em R$ 10 milhões.
    expect(matchesQueueFilter("grandes", view({ size: media }))).toBe(true);
    // E para aí. R$ 1-10 milhões e abaixo continuam fora.
    expect(matchesQueueFilter("grandes", view({ size: deriveCompanySize("R$ 1-10 milhões") }))).toBe(false);
    expect(matchesQueueFilter("grandes", view({ size: deriveCompanySize("Até R$ 1 milhão") }))).toBe(false);
    expect(matchesQueueFilter("grandes", view({ size: SEM_PORTE }))).toBe(false);
  });

  it("o filtro de porte não altera nenhuma regra de prioridade", () => {
    // A mesma empresa grande, sem contato, continua sendo classificada pelas
    // regras normais -- o filtro é só um recorte de visualização.
    const p = derivePriority(base({ size: deriveCompanySize("R$ 50-200 milhões"), crmStatus: "reuniao_agendada" }));
    expect(p.level).toBe("P2");
  });

  it("'Todos' nunca esconde ninguém", () => {
    expect(matchesQueueFilter("todos", view({ crmStatus: "descartado" }))).toBe(true);
    expect(Object.keys(QUEUE_FILTER_LABELS)).toContain("todos");
  });

  it("ordena por prioridade, depois porte, depois score", () => {
    const pri = (level: "P1" | "P2") => ({ level, rule: "completed_uncontacted" as const, reason: "" });
    const a = { priority: pri("P2"), size: deriveCompanySize("Acima de R$ 200 milhões"), bestScore: 90 };
    const b = { priority: pri("P1"), size: deriveCompanySize("Até R$ 1 milhão"), bestScore: 10 };
    expect(compareForQueue(a, b)).toBeGreaterThan(0);

    const c = { priority: pri("P1"), size: deriveCompanySize("R$ 50-200 milhões"), bestScore: 10 };
    const d = { priority: pri("P1"), size: deriveCompanySize("Até R$ 1 milhão"), bestScore: 99 };
    expect(compareForQueue(c, d)).toBeLessThan(0);

    // Ninguém do bloco de abandono tem score: aí o progresso desempata.
    const e = { priority: pri("P2"), size: SEM_PORTE, bestScore: null, progressPercent: 50 };
    const f = { priority: pri("P2"), size: SEM_PORTE, bestScore: null, progressPercent: 0 };
    expect(compareForQueue(e, f)).toBeLessThan(0);
  });
});


describe("relatório — evidência, nunca ausência", () => {
  const ANTES = "2026-07-26T00:00:00Z"; // antes da telemetria (19/08)
  const DEPOIS = "2026-08-20T00:00:00Z";

  it("prova positiva vence a data de corte: marcador antigo continua valendo", () => {
    // Andre Pimentel concluiu 14/08 mas foi alcançado pelo recovery de 19/08.
    const e = deriveReportEvidence({
      completedAtIso: "2026-08-14T00:00:00Z",
      reportReady: true,
      reportEmailSentAtIso: "2026-08-19T00:10:00Z",
      accessedAtIso: null,
    });
    expect(e).toEqual({ kind: "sent", atIso: "2026-08-19T00:10:00Z" });
  });

  it("concluído antes da telemetria e sem evidência vira LEGADO, não 'não enviado'", () => {
    // Belmir / Grupo MNGT: concluiu 26/07, antes de cgi_reports existir.
    const e = deriveReportEvidence({
      completedAtIso: ANTES, reportReady: false, reportEmailSentAtIso: null, accessedAtIso: null,
    });
    expect(e.kind).toBe("legacy_unknown");
    expect(describeReportEvidence(e, ANTES)).toContain("NÃO prova");
  });

  it("concluído DEPOIS da telemetria e sem evidência é, aí sim, não enviado", () => {
    const e = deriveReportEvidence({
      completedAtIso: DEPOIS, reportReady: false, reportEmailSentAtIso: null, accessedAtIso: null,
    });
    expect(e.kind).toBe("not_sent");
  });

  it("relatório pronto e sem envio, já na era rastreada, é dito como tal", () => {
    const e = deriveReportEvidence({
      completedAtIso: DEPOIS, reportReady: true, reportEmailSentAtIso: null, accessedAtIso: null,
    });
    expect(e.kind).toBe("ready_not_sent");
  });

  it("'aberto' exige relatório pronto — clique no link de abandono não é leitura de parecer", () => {
    // Giliard: abriu o token emitido pelo e-mail de abandono, sem relatório algum.
    const semRelatorio = deriveReportEvidence({
      completedAtIso: DEPOIS, reportReady: false, reportEmailSentAtIso: null,
      accessedAtIso: "2026-08-21T10:00:00Z",
    });
    expect(semRelatorio.kind).not.toBe("opened");

    const comRelatorio = deriveReportEvidence({
      completedAtIso: DEPOIS, reportReady: true, reportEmailSentAtIso: "2026-08-19T00:10:00Z",
      accessedAtIso: "2026-08-21T10:00:00Z",
    });
    expect(comRelatorio).toEqual({ kind: "opened", atIso: "2026-08-21T10:00:00Z" });
  });

  it("quem não concluiu não tem estado de relatório", () => {
    expect(deriveReportEvidence({
      completedAtIso: null, reportReady: false, reportEmailSentAtIso: null, accessedAtIso: null,
    }).kind).toBe("none");
  });
});

describe("regra estruturada — a copy é do humano, a lógica é da regra", () => {
  const GRANDE = deriveCompanySize("R$ 50-200 milhões");

  const view = (over: Record<string, unknown> = {}) => ({
    priority: { level: "P1" as const, rule: "overdue_commitment" as const, reason: "Ação combinada venceu há 3 dias." },
    contact: { kind: "contacted_undated" } as ContactState,
    crmStatus: "contato_realizado",
    completed: true,
    size: GRANDE,
    ...over,
  });

  it("'Vencidos' continua funcionando depois de reescreverem a justificativa", () => {
    // Este é o teste que o filtro antigo não passaria: ele casava por
    // reason.startsWith("Ação combinada venceu"), então qualquer melhoria de
    // redação o esvaziava em silêncio.
    const reescrito = view({
      priority: {
        level: "P1" as const,
        rule: "overdue_commitment" as const,
        reason: "Você combinou um retorno e a data passou. Isso ficou para trás.",
      },
    });
    expect(matchesQueueFilter("vencidos", reescrito)).toBe(true);
  });

  it("'Vencidos' não casa por texto parecido quando a regra é outra", () => {
    const impostor = view({
      priority: {
        level: "P2" as const,
        rule: "completed_contacted" as const,
        reason: "Ação combinada venceu há 3 dias.",
      },
    });
    expect(matchesQueueFilter("vencidos", impostor)).toBe(false);
  });

  it("toda prioridade sai com uma regra conhecida, e nunca só com texto", () => {
    const conhecidas = new Set([
      "converted", "closed", "overdue_commitment", "large_account_no_next_action",
      "in_commercial_process", "completed_uncontacted", "completed_contacted",
      "large_account_recovery", "incomplete", "no_signal",
    ]);
    const casos = [
      base(),
      base({ crmStatus: "convertido" }),
      base({ crmStatus: "sem_interesse" }),
      base({ nextActionAt: "2026-08-20T13:00:00Z" }),
      base({ crmStatus: "contato_realizado", contact: { kind: "contacted_undated" } }),
      base({ crmStatus: "proposta_enviada", nextActionAt: "2026-09-30T13:00:00Z" }),
      base({ completed: false }),
      base({ size: deriveCompanySize("Até R$ 1 milhão"), completed: false }),
      base({ size: SEM_PORTE, completed: false, started: false }),
    ];
    for (const caso of casos) {
      const p = derivePriority(caso);
      expect(conhecidas.has(p.rule)).toBe(true);
      expect(p.reason.endsWith(".")).toBe(true);
    }
  });

  it("'Vencidos' deixou de se chamar 'Aguardando'", () => {
    expect(QUEUE_FILTER_LABELS.vencidos).toBe("Vencidos");
    expect(Object.values(QUEUE_FILTER_LABELS)).not.toContain("Aguardando");
  });
});

describe("porte como regra comercial explícita, não como score", () => {
  const GRANDE = deriveCompanySize("R$ 50-200 milhões");

  it("conta grande já contatada e sem próximo passo sobe para P1 (Belmir, Marcio)", () => {
    const p = derivePriority(base({
      size: GRANDE,
      crmStatus: "contato_realizado",
      contact: { kind: "contacted_undated" },
      nextActionAt: null,
    }));
    expect(p.level).toBe("P1");
    expect(p.rule).toBe("large_account_no_next_action");
    expect(p.reason).toBe("Conta de R$ 50–200M já contatada, mas sem próximo passo definido.");
  });

  it("a mesma conta grande com próximo passo marcado NÃO é urgência: ela já tem plano", () => {
    const p = derivePriority(base({
      size: GRANDE,
      crmStatus: "contato_realizado",
      contact: { kind: "contacted_undated" },
      nextActionAt: "2026-09-10T13:00:00Z",
    }));
    expect(p.level).toBe("P2");
    expect(p.rule).toBe("completed_contacted");
  });

  it("conta grande que ninguém contatou não entra pela regra de 'sem próximo passo'", () => {
    const p = derivePriority(base({ size: GRANDE, contact: { kind: "never" } }));
    expect(p.rule).toBe("completed_uncontacted");
  });

  it("empresa grande não vira P1 automaticamente só por ser grande", () => {
    // Grande, abandonou o diagnóstico, ninguém falou com ela: sobe, mas para P2.
    const p = derivePriority(base({ size: GRANDE, completed: false, started: true }));
    expect(p.level).toBe("P2");
    expect(p.rule).toBe("large_account_recovery");
  });

  it("R$ 10-50M incompleta e nunca contatada sai do P3 genérico (Manoel Soffner)", () => {
    const manoel = base({
      size: deriveCompanySize("R$ 10-50 milhões"),
      completed: false,
      started: false,
      contact: { kind: "never" },
    });
    const p = derivePriority(manoel);
    expect(p.level).toBe("P2");
    expect(p.rule).toBe("large_account_recovery");
    expect(p.reason).toBe("Conta de R$ 10–50M, CGI não iniciado e nenhum contato humano.");

    // E o mesmo estado numa empresa de ≤ R$ 1 milhão continua P3.
    const pequena = derivePriority({ ...manoel, size: deriveCompanySize("Até R$ 1 milhão") });
    expect(pequena.level).toBe("P3");
    expect(pequena.rule).toBe("incomplete");
  });
});

describe("filtro 'Recuperar' — o bloco de abandono ganha porta de entrada", () => {
  const view = (over: Record<string, unknown> = {}) => ({
    priority: { level: "P3" as const, rule: "incomplete" as const, reason: "x." },
    contact: { kind: "never" } as ContactState,
    crmStatus: "novo",
    completed: false,
    size: PORTE_MEDIO,
    ...over,
  });

  it("pega quem começou e não terminou", () => {
    expect(matchesQueueFilter("recuperar", view())).toBe(true);
  });

  it("não pega quem concluiu o diagnóstico", () => {
    expect(matchesQueueFilter("recuperar", view({ completed: true }))).toBe(false);
  });

  it("não pega encerrados: não há o que recuperar", () => {
    for (const status of ["sem_interesse", "descartado", "convertido"]) {
      expect(matchesQueueFilter("recuperar", view({ crmStatus: status }))).toBe(false);
    }
  });

  it("continua pegando quem já foi contatado mas não terminou o CGI", () => {
    expect(matchesQueueFilter("recuperar", view({ contact: { kind: "contacted_undated" }, crmStatus: "contato_realizado" }))).toBe(true);
  });
});

describe("próxima ação — data no passado é dívida, não data", () => {
  it("sem data marcada não inventa nada", () => {
    expect(describeNextAction(null, AGORA).kind).toBe("none");
    expect(describeNextAction("nao-e-data", AGORA).kind).toBe("none");
  });

  it("data futura é só a data", () => {
    const v = describeNextAction("2026-09-10T13:00:00Z", AGORA);
    expect(v.kind).toBe("scheduled");
    expect(v.kind === "scheduled" && v.label).toBe("10/09/2026");
  });

  it("data vencida diz há quanto tempo, na própria célula", () => {
    const v = describeNextAction("2026-08-13T13:00:00Z", AGORA);
    expect(v.kind).toBe("overdue");
    expect(v.kind === "overdue" && v.days).toBe(11);
    expect(v.kind === "overdue" && v.label).toBe("13/08/2026 · vencida há 11d");
  });

  it("vencida hoje não vira 'vencida há 0d'", () => {
    const v = describeNextAction("2026-08-24T09:00:00Z", AGORA);
    expect(v.kind === "overdue" && v.label).toBe("24/08/2026 · vencida hoje");
  });
});
