import { describe, expect, it } from "vitest";
import {
  DEFAULT_SORT,
  FIRST_CLICK_DIRECTION,
  compareEntries,
  nextSortState,
  sortEntries,
  type SortableEntry,
  type SortColumn,
} from "./sortOpportunities";
import { deriveLastInteraction } from "./lastInteraction";
import type { OpportunityRow } from "../types";

const AGORA = Date.parse("2026-09-16T12:00:00Z");
const dias = (n: number) => new Date(AGORA - n * 86_400_000).toISOString();

function entry(over: {
  id: string;
  name?: string;
  company?: string;
  createdAt?: string;
  score?: number | null;
  status?: string;
  nextActionAt?: string | null;
  lastContactAt?: string | null;
  sentAt?: string | null;
  openedAt?: string | null;
  cgiActivityAt?: string | null;
  priorityRank?: number;
}): SortableEntry {
  const row = {
    lead: {
      id: over.id,
      name: over.name ?? "Lead",
      company: over.company ?? "Empresa",
      created_at: over.createdAt ?? dias(10),
    },
    opportunity: {
      status: over.status ?? "novo",
      next_action_at: over.nextActionAt ?? null,
      last_contact_at: over.lastContactAt ?? null,
    },
    bestScore: over.score ?? null,
    communications: over.sentAt ? [{ status: "sent", sent_at: over.sentAt }] : [],
    reportOpenedAt: over.openedAt ?? null,
    latestAssessment: over.cgiActivityAt ? { last_activity_at: over.cgiActivityAt } : null,
  } as unknown as OpportunityRow;

  return {
    row,
    lastInteraction: deriveLastInteraction(row, AGORA),
    priorityRank: over.priorityRank ?? 0,
  };
}

const ids = (e: SortableEntry[]) => e.map((x) => x.row.lead.id);

describe("uma autoridade só de ordenação", () => {
  it("o padrão continua sendo prioridade comercial", () => {
    expect(DEFAULT_SORT).toEqual({ column: "prioridade", direction: "asc" });
    const linhas = [entry({ id: "c", priorityRank: 2 }), entry({ id: "a", priorityRank: 0 }), entry({ id: "b", priorityRank: 1 })];
    expect(ids(sortEntries(linhas, DEFAULT_SORT))).toEqual(["a", "b", "c"]);
  });

  it("prioridade também inverte", () => {
    const linhas = [entry({ id: "a", priorityRank: 0 }), entry({ id: "b", priorityRank: 1 })];
    expect(ids(sortEntries(linhas, { column: "prioridade", direction: "desc" }))).toEqual(["b", "a"]);
  });
});

describe("A–Z e Z–A nas colunas de texto", () => {
  const linhas = [
    entry({ id: "1", name: "Zé", company: "Zafira" }),
    entry({ id: "2", name: "ana", company: "acme" }),
    entry({ id: "3", name: "Álvaro", company: "Ávila" }),
  ];

  it("lead A–Z, sem tropeçar em acento nem em maiúscula", () => {
    // sensitivity 'base' com locale pt-BR: "Álvaro" vem antes de "ana", e
    // "ana" minúsculo não vai para o fim da lista.
    expect(ids(sortEntries(linhas, { column: "lead", direction: "asc" }))).toEqual(["3", "2", "1"]);
  });

  it("lead Z–A é exatamente o inverso", () => {
    expect(ids(sortEntries(linhas, { column: "lead", direction: "desc" }))).toEqual(["1", "2", "3"]);
  });

  it("empresa A–Z e Z–A", () => {
    expect(ids(sortEntries(linhas, { column: "empresa", direction: "asc" }))).toEqual(["2", "3", "1"]);
    expect(ids(sortEntries(linhas, { column: "empresa", direction: "desc" }))).toEqual(["1", "3", "2"]);
  });

  it("status ordena, e quem não tem oportunidade conta como 'novo'", () => {
    const l = [entry({ id: "1", status: "reuniao_agendada" }), entry({ id: "2", status: "novo" })];
    expect(ids(sortEntries(l, { column: "status", direction: "asc" }))).toEqual(["2", "1"]);
  });
});

describe("colunas de data e número", () => {
  it("entrada ordena por created_at do lead", () => {
    const l = [entry({ id: "velho", createdAt: dias(30) }), entry({ id: "novo", createdAt: dias(1) })];
    expect(ids(sortEntries(l, { column: "entrada", direction: "desc" }))).toEqual(["novo", "velho"]);
    expect(ids(sortEntries(l, { column: "entrada", direction: "asc" }))).toEqual(["velho", "novo"]);
  });

  it("CGI ordena por score", () => {
    const l = [entry({ id: "baixo", score: 40 }), entry({ id: "alto", score: 90 })];
    expect(ids(sortEntries(l, { column: "cgi", direction: "desc" }))).toEqual(["alto", "baixo"]);
  });

  it("vazio vai para o FIM nos dois sentidos", () => {
    // Inverter a direção não pode encher o topo da tela de "—": quem não tem a
    // informação não é o menor, é o desconhecido.
    const l = [entry({ id: "sem", score: null }), entry({ id: "com", score: 50 })];
    expect(ids(sortEntries(l, { column: "cgi", direction: "desc" }))).toEqual(["com", "sem"]);
    expect(ids(sortEntries(l, { column: "cgi", direction: "asc" }))).toEqual(["com", "sem"]);
  });

  it("data inválida é tratada como ausente, não como 1970", () => {
    const l = [entry({ id: "ruim", createdAt: "não é data" }), entry({ id: "boa", createdAt: dias(5) })];
    expect(ids(sortEntries(l, { column: "entrada", direction: "asc" }))).toEqual(["boa", "ruim"]);
  });
});

describe("o clique no cabeçalho", () => {
  it("primeiro clique escolhe a direção que faz sentido para a coluna", () => {
    // Texto começa em A–Z; data e número começam no maior.
    expect(nextSortState(DEFAULT_SORT, "lead")).toEqual({ column: "lead", direction: "asc" });
    expect(nextSortState(DEFAULT_SORT, "entrada")).toEqual({ column: "entrada", direction: "desc" });
    expect(nextSortState(DEFAULT_SORT, "cgi")).toEqual({ column: "cgi", direction: "desc" });
    expect(nextSortState(DEFAULT_SORT, "proxima_acao")).toEqual({ column: "proxima_acao", direction: "asc" });
  });

  it("segundo clique na mesma coluna inverte", () => {
    const um = nextSortState(DEFAULT_SORT, "empresa");
    expect(nextSortState(um, "empresa")).toEqual({ column: "empresa", direction: "desc" });
    expect(nextSortState(nextSortState(um, "empresa"), "empresa")).toEqual({ column: "empresa", direction: "asc" });
  });

  it("toda coluna ordenável tem direção inicial declarada", () => {
    const colunas: SortColumn[] = [
      "prioridade", "lead", "empresa", "entrada", "cgi", "ultima_interacao", "proxima_acao", "status",
    ];
    for (const c of colunas) expect(FIRST_CLICK_DIRECTION[c]).toMatch(/^(asc|desc)$/);
  });
});

describe("última interação como eixo de ordenação", () => {
  it("ordena pelo movimento mais recente, venha ele de onde vier", () => {
    const l = [
      entry({ id: "humano", lastContactAt: dias(3) }),
      entry({ id: "automatico", sentAt: dias(1) }),
      entry({ id: "parado", cgiActivityAt: dias(40) }),
    ];
    expect(ids(sortEntries(l, { column: "ultima_interacao", direction: "desc" }))).toEqual([
      "automatico", "humano", "parado",
    ]);
  });

  it("quem nunca teve interação nenhuma fica por último", () => {
    const l = [entry({ id: "nada" }), entry({ id: "algo", sentAt: dias(9) })];
    expect(ids(sortEntries(l, { column: "ultima_interacao", direction: "desc" }))).toEqual(["algo", "nada"]);
    expect(ids(sortEntries(l, { column: "ultima_interacao", direction: "asc" }))).toEqual(["algo", "nada"]);
  });
});

describe("ordenar não ressuscita quem o filtro cortou", () => {
  it("a ordenação só reorganiza o que recebeu", () => {
    // O defeito original era o inverso disto: a tabela reordenava por conta
    // própria e apagava a decisão de quem veio antes.
    const recebidas = [entry({ id: "a", createdAt: dias(2) }), entry({ id: "b", createdAt: dias(1) })];
    const r = sortEntries(recebidas, { column: "entrada", direction: "desc" });
    expect(ids(r).sort()).toEqual(["a", "b"]);
    expect(r).toHaveLength(2);
  });

  it("compareEntries é estável para colunas iguais", () => {
    const a = entry({ id: "a", score: 50 });
    const b = entry({ id: "b", score: 50 });
    expect(compareEntries(a, b, { column: "cgi", direction: "asc" })).toBe(0);
  });
});
