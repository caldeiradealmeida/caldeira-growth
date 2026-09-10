import type { CrmOpportunityStatus, OpportunityRow } from "../types";

export type OpportunityFilters = {
  search: string;
  status: CrmOpportunityStatus | "all";
  minScore: number | null;
  reportStatus: "report_generating" | "report_ready" | "report_failed" | "all";
  sector: string | "all";
  periodStart: string | null; // ISO date, inclusive, compared to lead.created_at
  periodEnd: string | null; // ISO date, inclusive
  /** Janela de entrada recente, em dias. Independente de periodStart/periodEnd:
   *  aqueles respondem "neste intervalo", este responde "quem entrou agora". */
  recentDays: number | null;
  /** Mostrar quem foi classificado como test, spam ou invalid. Por padrão a
   *  fila operacional só mostra `legitimate`. */
  showDiscarded: boolean;
};

/** A janela do botão "Recentes". Sete dias porque é a semana comercial: a
 *  pergunta que ele responde é "quem entrou desde a última vez que olhei". */
export const RECENT_WINDOW_DAYS = 7;

export const DEFAULT_FILTERS: OpportunityFilters = {
  search: "",
  status: "all",
  minScore: null,
  reportStatus: "all",
  sector: "all",
  periodStart: null,
  periodEnd: null,
  recentDays: null,
  showDiscarded: false,
};

/** Classificação efetiva de um lead para efeito de EXIBIÇÃO.
 *
 * Ausente conta como legítima -- e isto é o oposto do que a automação faz, de
 * propósito. Uma Preview cujo banco ainda não recebeu a migration devolve
 * leads sem a coluna; escondê-los todos deixaria o Pipe vazio e sem explicação.
 * Visibilidade falha aberta, envio falha fechado: cada lado erra na direção
 * segura para o que faz. */
export function displayClassification(lead: { classification?: string | null }): string {
  const valor = String(lead.classification ?? "").trim();
  return valor === "" ? "legitimate" : valor;
}

export function isDiscarded(lead: { classification?: string | null }): boolean {
  return displayClassification(lead) !== "legitimate";
}

export type OpportunitySort = "recent" | "score" | "next_action" | "company";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function matchesFilters(
  row: OpportunityRow,
  filters: OpportunityFilters,
  now: number = Date.now()
): boolean {
  // Classificação primeiro: é a pergunta mais barata e a que elimina mais.
  if (!filters.showDiscarded && isDiscarded(row.lead)) return false;

  const search = normalize(filters.search);
  if (search) {
    const haystack = normalize(`${row.lead.name} ${row.lead.company} ${row.lead.email}`);
    if (!haystack.includes(search)) return false;
  }

  if (filters.status !== "all") {
    const status = row.opportunity?.status ?? "novo";
    if (status !== filters.status) return false;
  }

  if (filters.minScore !== null) {
    if (row.bestScore === null || row.bestScore < filters.minScore) return false;
  }

  if (filters.reportStatus !== "all") {
    if (row.latestReport?.report_status !== filters.reportStatus) return false;
  }

  if (filters.sector !== "all") {
    if (row.lead.sector !== filters.sector) return false;
  }

  // Entrada recente. Lê lead.created_at -- nunca last_contact_at, updated_at ou
  // a data do relatório. A pergunta é "quando esta pessoa entrou no pipeline",
  // e só created_at responde isso; as outras mudam quando NÓS agimos.
  if (filters.recentDays !== null) {
    const limite = now - filters.recentDays * 24 * 60 * 60 * 1000;
    if (new Date(row.lead.created_at).getTime() < limite) return false;
  }

  if (filters.periodStart) {
    if (new Date(row.lead.created_at).getTime() < new Date(filters.periodStart).getTime()) return false;
  }
  if (filters.periodEnd) {
    if (new Date(row.lead.created_at).getTime() > new Date(filters.periodEnd).getTime()) return false;
  }

  return true;
}

function toTime(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : 0;
}

export function sortOpportunities(rows: OpportunityRow[], sort: OpportunitySort): OpportunityRow[] {
  const copy = [...rows];
  switch (sort) {
    case "score":
      return copy.sort((a, b) => (b.bestScore ?? -1) - (a.bestScore ?? -1));
    case "next_action":
      // Rows with a next action come first, soonest first; rows without one go last.
      return copy.sort((a, b) => {
        const at = a.opportunity?.next_action_at;
        const bt = b.opportunity?.next_action_at;
        if (!at && !bt) return 0;
        if (!at) return 1;
        if (!bt) return -1;
        return toTime(at) - toTime(bt);
      });
    case "company":
      return copy.sort((a, b) => a.lead.company.localeCompare(b.lead.company, "pt-BR"));
    case "recent":
    default:
      return copy.sort((a, b) => toTime(b.lastActivityAt) - toTime(a.lastActivityAt));
  }
}

export function filterAndSortOpportunities(
  rows: OpportunityRow[],
  filters: OpportunityFilters,
  sort: OpportunitySort,
  now: number = Date.now()
): OpportunityRow[] {
  return sortOpportunities(rows.filter((r) => matchesFilters(r, filters, now)), sort);
}
