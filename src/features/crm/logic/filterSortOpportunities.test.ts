import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, filterOpportunities, matchesFilters } from "./filterSortOpportunities";
import type { CgiLead, CrmOpportunity, OpportunityRow } from "../types";

function row(overrides: {
  id: string;
  name?: string;
  company?: string;
  email?: string;
  sector?: string;
  createdAt?: string;
  status?: CrmOpportunity["status"];
  score?: number | null;
  reportStatus?: "report_generating" | "report_ready" | "report_failed" | null;
  nextActionAt?: string | null;
  lastActivityAt?: string | null;
  classification?: string | null;
}): OpportunityRow {
  const lead: CgiLead = {
    id: overrides.id,
    email_normalized: (overrides.email ?? "x@example.com").toLowerCase(),
    name: overrides.name ?? "Lead",
    email: overrides.email ?? "x@example.com",
    phone: "",
    company: overrides.company ?? "Co",
    company_website: null,
    role: "CEO",
    sector: overrides.sector ?? "Tech",
    commercial_relationship_model: "B2B",
    employee_count: "1-10",
    annual_revenue_range: "Até R$ 1 milhão",
    current_challenge: "x",
    growth_goal: "x",
    investment_intent: "Sim",
    comments: null,
    created_at: overrides.createdAt ?? "2026-07-01T00:00:00Z",
    ...("classification" in overrides ? { classification: overrides.classification } : {}),
  };

  return {
    lead,
    opportunity: {
      lead_id: overrides.id,
      status: overrides.status ?? "novo",
      owner_email: null,
      notes: null,
      next_action_at: overrides.nextActionAt ?? null,
      last_contact_at: null,
      estimated_value: null,
      lost_reason: null,
      is_test_excluded: false,
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
    },
    personId: null,
    assessmentCount: 1,
    latestAssessment: null,
    bestScore: overrides.score ?? null,
    lastActivityAt: overrides.lastActivityAt ?? overrides.createdAt ?? null,
    latestReport: overrides.reportStatus
      ? { id: "report_pub", public_assessment_id: "pub", report_status: overrides.reportStatus, language: "pt", ai_report_text: null, report_json: null, version: 1, created_at: "2026-07-02T00:00:00Z" }
      : null,
    originAttribution: null,
    communications: [],
    reportOpenedAt: null,
  };
}

describe("matchesFilters", () => {
  it("searches across name, company and email case-insensitively", () => {
    const r = row({ id: "1", name: "Marchiori Bernardi", company: "Lagartto Studios", email: "marchiori@x.com" });
    expect(matchesFilters(r, { ...DEFAULT_FILTERS, search: "lagartto" })).toBe(true);
    expect(matchesFilters(r, { ...DEFAULT_FILTERS, search: "MARCHIORI" })).toBe(true);
    expect(matchesFilters(r, { ...DEFAULT_FILTERS, search: "nope" })).toBe(false);
  });

  it("filters by commercial status", () => {
    const r = row({ id: "1", status: "convertido" });
    expect(matchesFilters(r, { ...DEFAULT_FILTERS, status: "convertido" })).toBe(true);
    expect(matchesFilters(r, { ...DEFAULT_FILTERS, status: "novo" })).toBe(false);
  });

  it("treats a missing opportunity as status 'novo'", () => {
    const r = { ...row({ id: "1" }), opportunity: null };
    expect(matchesFilters(r, { ...DEFAULT_FILTERS, status: "novo" })).toBe(true);
  });

  it("filters by minimum score, excluding leads with no score at all", () => {
    const withScore = row({ id: "1", score: 80 });
    const noScore = row({ id: "2", score: null });
    expect(matchesFilters(withScore, { ...DEFAULT_FILTERS, minScore: 70 })).toBe(true);
    expect(matchesFilters(withScore, { ...DEFAULT_FILTERS, minScore: 90 })).toBe(false);
    expect(matchesFilters(noScore, { ...DEFAULT_FILTERS, minScore: 0 })).toBe(false);
  });

  it("filters by report status", () => {
    const ready = row({ id: "1", reportStatus: "report_ready" });
    const none = row({ id: "2", reportStatus: null });
    expect(matchesFilters(ready, { ...DEFAULT_FILTERS, reportStatus: "report_ready" })).toBe(true);
    expect(matchesFilters(none, { ...DEFAULT_FILTERS, reportStatus: "report_ready" })).toBe(false);
  });

  it("filters by sector", () => {
    const r = row({ id: "1", sector: "Seguros" });
    expect(matchesFilters(r, { ...DEFAULT_FILTERS, sector: "Seguros" })).toBe(true);
    expect(matchesFilters(r, { ...DEFAULT_FILTERS, sector: "Tech" })).toBe(false);
  });

  it("filters by period (inclusive on both ends)", () => {
    const r = row({ id: "1", createdAt: "2026-07-15T00:00:00Z" });
    expect(
      matchesFilters(r, { ...DEFAULT_FILTERS, periodStart: "2026-07-01T00:00:00Z", periodEnd: "2026-07-31T00:00:00Z" })
    ).toBe(true);
    expect(
      matchesFilters(r, { ...DEFAULT_FILTERS, periodStart: "2026-08-01T00:00:00Z", periodEnd: null })
    ).toBe(false);
  });
});

// A ordenação mudou de casa: ./sortOpportunities.test.ts.


// ---------------------------------------------------------------------------
// Etapa 2 do P0: a fila operacional mostra quem merece estar nela, e responde
// "quem entrou nos últimos dias" sem virar um dashboard.
// ---------------------------------------------------------------------------

const AGORA = Date.parse("2026-09-10T12:00:00Z");
const dias = (n: number) => new Date(AGORA - n * 24 * 60 * 60 * 1000).toISOString();

describe("classificação: o Pipe é uma fila, não um arquivo", () => {
  it("por padrão só mostra legitimate", () => {
    for (const valor of ["test", "spam", "invalid"]) {
      expect(matchesFilters(row({ id: "1", classification: valor }), DEFAULT_FILTERS, AGORA)).toBe(false);
    }
    expect(matchesFilters(row({ id: "1", classification: "legitimate" }), DEFAULT_FILTERS, AGORA)).toBe(true);
  });

  it("classificação ausente conta como legítima -- visibilidade falha ABERTA", () => {
    // O oposto do que a automação faz, de propósito: uma Preview cujo banco
    // ainda não recebeu a migration devolve leads sem a coluna, e esconder
    // todo mundo deixaria o Pipe vazio e sem explicação.
    expect(matchesFilters(row({ id: "1" }), DEFAULT_FILTERS, AGORA)).toBe(true);
    expect(matchesFilters(row({ id: "1", classification: null }), DEFAULT_FILTERS, AGORA)).toBe(true);
    expect(matchesFilters(row({ id: "1", classification: "  " }), DEFAULT_FILTERS, AGORA)).toBe(true);
  });

  it('"Ver descartados" mostra os descartados sem esconder os legítimos', () => {
    const filtros = { ...DEFAULT_FILTERS, showDiscarded: true };
    const linhas = [
      row({ id: "1", classification: "legitimate" }),
      row({ id: "2", classification: "spam" }),
      row({ id: "3", classification: "test" }),
    ];
    expect(filterOpportunities(linhas, filtros, AGORA)).toHaveLength(3);
    expect(filterOpportunities(linhas, DEFAULT_FILTERS, AGORA)).toHaveLength(1);
  });

  it("nada é apagado: a linha descartada continua existindo, só não é listada", () => {
    const linhas = [row({ id: "1", classification: "spam" })];
    expect(filterOpportunities(linhas, DEFAULT_FILTERS, AGORA)).toHaveLength(0);
    expect(linhas).toHaveLength(1);
  });
});

describe("Recentes 7d", () => {
  it("inclui quem entrou dentro da janela e exclui quem entrou antes", () => {
    const filtros = { ...DEFAULT_FILTERS, recentDays: 7 };
    expect(matchesFilters(row({ id: "1", createdAt: dias(1) }), filtros, AGORA)).toBe(true);
    expect(matchesFilters(row({ id: "2", createdAt: dias(6.9) }), filtros, AGORA)).toBe(true);
    expect(matchesFilters(row({ id: "3", createdAt: dias(8) }), filtros, AGORA)).toBe(false);
    expect(matchesFilters(row({ id: "4", createdAt: dias(30) }), filtros, AGORA)).toBe(false);
  });

  it("lê created_at do lead, nunca a última atividade", () => {
    // Um lead antigo que recebeu ação nossa ontem NÃO é uma entrada recente.
    // last_contact_at, updated_at e a data do relatório mudam quando NÓS
    // agimos; created_at é o único que responde "quando esta pessoa entrou".
    const antigo = row({ id: "1", createdAt: dias(40), lastActivityAt: dias(1) });
    expect(matchesFilters(antigo, { ...DEFAULT_FILTERS, recentDays: 7 }, AGORA)).toBe(false);
  });

  it("desligado por padrão", () => {
    expect(DEFAULT_FILTERS.recentDays).toBeNull();
    expect(matchesFilters(row({ id: "1", createdAt: dias(300) }), DEFAULT_FILTERS, AGORA)).toBe(true);
  });

  it("convive com o intervalo de datas existente, sem substituí-lo", () => {
    // Os dois aplicam juntos: quem passa é a interseção.
    const filtros = {
      ...DEFAULT_FILTERS,
      recentDays: 7,
      periodStart: new Date(AGORA - 3 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(matchesFilters(row({ id: "1", createdAt: dias(2) }), filtros, AGORA)).toBe(true);
    // Dentro da janela de 7 dias, mas fora do intervalo escolhido à mão.
    expect(matchesFilters(row({ id: "2", createdAt: dias(5) }), filtros, AGORA)).toBe(false);
  });

  it("é filtro: corta antes de qualquer ordenação existir", () => {
    // "fora" tem a atividade mais recente de todas e mesmo assim não passa. A
    // prova de que ordenar não ressuscita quem o filtro cortou está em
    // ./sortOpportunities.test.ts.
    const linhas = [
      row({ id: "antigo", createdAt: dias(2), lastActivityAt: dias(2) }),
      row({ id: "novo", createdAt: dias(1), lastActivityAt: dias(0.5) }),
      row({ id: "fora", createdAt: dias(90), lastActivityAt: dias(0.1) }),
    ];
    const r = filterOpportunities(linhas, { ...DEFAULT_FILTERS, recentDays: 7 }, AGORA);
    expect(r.map((x) => x.lead.id).sort()).toEqual(["antigo", "novo"]);
  });

  it("combina com classificação: descartado recente continua fora", () => {
    const filtros = { ...DEFAULT_FILTERS, recentDays: 7 };
    expect(matchesFilters(row({ id: "1", createdAt: dias(1), classification: "spam" }), filtros, AGORA)).toBe(false);
  });
});
