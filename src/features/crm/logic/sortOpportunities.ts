import type { OpportunityRow } from "../types";
import type { LastInteraction } from "./lastInteraction";

/**
 * Ordenação da fila -- UMA autoridade só.
 *
 * Antes havia duas, e era esse o defeito: a lista era ordenada em CrmList e
 * depois reordenada por prioridade comercial dentro da tabela. A segunda
 * ordenação apagava a primeira, então o seletor "Ordenar por" não tinha efeito
 * nenhum -- não só "Mais recente", as quatro opções.
 *
 * Agora existe um único estado de ordenação, e tanto o seletor quanto o clique
 * no cabeçalho escrevem nele.
 */
export type SortColumn =
  | "prioridade"
  | "lead"
  | "empresa"
  | "entrada"
  | "cgi"
  | "ultima_interacao"
  | "proxima_acao"
  | "status";

export type SortDirection = "asc" | "desc";

export type OpportunitySort = { column: SortColumn; direction: SortDirection };

/** O padrão continua sendo prioridade comercial: a pergunta de segunda-feira de
 *  manhã é "quem eu preciso contatar hoje", não "quem chegou por último". */
export const DEFAULT_SORT: OpportunitySort = { column: "prioridade", direction: "asc" };

/** Direção do PRIMEIRO clique em cada coluna.
 *
 * Texto começa em A–Z porque é como se lê uma lista de nomes; data e número
 * começam no maior porque a pergunta é sempre "o mais recente" ou "o maior".
 * O segundo clique inverte. */
export const FIRST_CLICK_DIRECTION: Record<SortColumn, SortDirection> = {
  prioridade: "asc",
  lead: "asc",
  empresa: "asc",
  entrada: "desc",
  cgi: "desc",
  ultima_interacao: "desc",
  proxima_acao: "asc",
  status: "asc",
};

export const SORT_COLUMN_LABELS: Record<SortColumn, string> = {
  prioridade: "Prioridade",
  lead: "Lead",
  empresa: "Empresa",
  entrada: "Entrada",
  cgi: "CGI",
  ultima_interacao: "Última interação",
  proxima_acao: "Próxima ação",
  status: "Status",
};

export function nextSortState(atual: OpportunitySort, coluna: SortColumn): OpportunitySort {
  if (atual.column !== coluna) {
    return { column: coluna, direction: FIRST_CLICK_DIRECTION[coluna] };
  }
  return { column: coluna, direction: atual.direction === "asc" ? "desc" : "asc" };
}

/** O mínimo que o comparador precisa saber de cada linha. */
export type SortableEntry = {
  row: OpportunityRow;
  lastInteraction: LastInteraction;
  /** Comparação por prioridade comercial, já resolvida por quem deriva a view. */
  priorityRank: number;
};

function texto(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function tempo(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Vazio vai sempre para o fim, nos dois sentidos.
 *
 * Inverter a direção não pode encher o topo da tela de "—": quem não tem a
 * informação não é o "menor", é o desconhecido, e o lugar do desconhecido é
 * depois de todo mundo que se sabe. */
function compararOpcional(
  a: number | string | null,
  b: number | string | null,
  direction: SortDirection,
  comparar: (x: never, y: never) => number
): number {
  const aVazio = a === null || a === "";
  const bVazio = b === null || b === "";
  if (aVazio && bVazio) return 0;
  if (aVazio) return 1;
  if (bVazio) return -1;
  const base = comparar(a as never, b as never);
  return direction === "asc" ? base : -base;
}

const compararTexto = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });
const compararNumero = (a: number, b: number) => a - b;

export function compareEntries(
  a: SortableEntry,
  b: SortableEntry,
  sort: OpportunitySort
): number {
  switch (sort.column) {
    case "prioridade": {
      const base = a.priorityRank - b.priorityRank;
      return sort.direction === "asc" ? base : -base;
    }
    case "lead":
      return compararOpcional(texto(a.row.lead.name), texto(b.row.lead.name), sort.direction, compararTexto);
    case "empresa":
      return compararOpcional(texto(a.row.lead.company), texto(b.row.lead.company), sort.direction, compararTexto);
    case "status":
      return compararOpcional(
        texto(a.row.opportunity?.status ?? "novo"),
        texto(b.row.opportunity?.status ?? "novo"),
        sort.direction,
        compararTexto
      );
    case "entrada":
      return compararOpcional(tempo(a.row.lead.created_at), tempo(b.row.lead.created_at), sort.direction, compararNumero);
    case "ultima_interacao":
      return compararOpcional(
        tempo(a.lastInteraction.atIso),
        tempo(b.lastInteraction.atIso),
        sort.direction,
        compararNumero
      );
    case "proxima_acao":
      return compararOpcional(
        tempo(a.row.opportunity?.next_action_at),
        tempo(b.row.opportunity?.next_action_at),
        sort.direction,
        compararNumero
      );
    case "cgi":
      return compararOpcional(a.row.bestScore, b.row.bestScore, sort.direction, compararNumero);
    default:
      return 0;
  }
}

export function sortEntries<T extends SortableEntry>(entries: T[], sort: OpportunitySort): T[] {
  return [...entries].sort((a, b) => compareEntries(a, b, sort));
}
