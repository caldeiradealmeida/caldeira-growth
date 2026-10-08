import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS, STATUS_ORDER } from "../constants";
import { RECENT_WINDOW_DAYS, type OpportunityFilters } from "../logic/filterSortOpportunities";
import type { OpportunitySort } from "../logic/sortOpportunities";

const SCORE_OPTIONS = [
  { value: "all", label: "Qualquer score" },
  { value: "85", label: "85+" },
  { value: "70", label: "70+" },
  { value: "50", label: "50+" },
];

const REPORT_STATUS_OPTIONS = [
  { value: "all", label: "Qualquer relatório" },
  { value: "report_ready", label: "Pronto" },
  { value: "report_generating", label: "Gerando" },
  { value: "report_failed", label: "Falhou" },
];

/** Atalhos para o mesmo estado que o clique no cabeçalho escreve. O seletor não
 *  é uma segunda fonte de verdade -- é uma porta de entrada para a primeira. */
const SORT_OPTIONS: { value: string; label: string; sort: OpportunitySort }[] = [
  { value: "prioridade", label: "Prioridade", sort: { column: "prioridade", direction: "asc" } },
  { value: "recent", label: "Mais recente", sort: { column: "ultima_interacao", direction: "desc" } },
  { value: "entrada", label: "Entrada", sort: { column: "entrada", direction: "desc" } },
  { value: "score", label: "Maior score", sort: { column: "cgi", direction: "desc" } },
  { value: "next_action", label: "Próxima ação", sort: { column: "proxima_acao", direction: "asc" } },
  { value: "company", label: "Empresa A–Z", sort: { column: "empresa", direction: "asc" } },
];

function sortOptionValue(sort: OpportunitySort): string {
  const igual = SORT_OPTIONS.find(
    (o) => o.sort.column === sort.column && o.sort.direction === sort.direction
  );
  // Ordenação escolhida clicando num cabeçalho que não tem atalho: o seletor
  // mostra "Personalizada" em vez de mentir sobre o estado.
  return igual?.value ?? "custom";
}

export function FiltersBar({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  sectors,
}: {
  filters: OpportunityFilters;
  onFiltersChange: (next: OpportunityFilters) => void;
  sort: OpportunitySort;
  onSortChange: (next: OpportunitySort) => void;
  sectors: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="crm-filters-bar">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, empresa ou e-mail"
          className="pl-8"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        />
      </div>

      <Select
        value={filters.status}
        onValueChange={(v) => onFiltersChange({ ...filters, status: v as OpportunityFilters["status"] })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.minScore === null ? "all" : String(filters.minScore)}
        onValueChange={(v) => onFiltersChange({ ...filters, minScore: v === "all" ? null : Number(v) })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Score" />
        </SelectTrigger>
        <SelectContent>
          {SCORE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.reportStatus}
        onValueChange={(v) => onFiltersChange({ ...filters, reportStatus: v as OpportunityFilters["reportStatus"] })}
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Relatório" />
        </SelectTrigger>
        <SelectContent>
          {REPORT_STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sector}
        onValueChange={(v) => onFiltersChange({ ...filters, sector: v })}
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Setor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os setores</SelectItem>
          {sectors.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          className="w-[150px]"
          value={filters.periodStart?.slice(0, 10) ?? ""}
          onChange={(e) => onFiltersChange({ ...filters, periodStart: e.target.value ? new Date(e.target.value).toISOString() : null })}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="date"
          className="w-[150px]"
          value={filters.periodEnd?.slice(0, 10) ?? ""}
          onChange={(e) => onFiltersChange({ ...filters, periodEnd: e.target.value ? new Date(e.target.value).toISOString() : null })}
        />
      </div>

      {/* Dois interruptores, não dois filtros de lista.
          "Recentes" precisa combinar com a fila "A contatar", e as fichas da
          fila são exclusivas entre si -- só uma pode estar ativa. Como
          alternância independente, as duas coisas se somam de graça.
          E "Recentes" é FILTRO; "Mais recente", ali do lado, continua sendo
          ORDENAÇÃO. São perguntas diferentes: uma corta a lista, a outra
          reordena o que sobrou. */}
      <button
        type="button"
        data-testid="filter-recent-toggle"
        aria-pressed={filters.recentDays !== null}
        onClick={() =>
          onFiltersChange({
            ...filters,
            recentDays: filters.recentDays === null ? RECENT_WINDOW_DAYS : null,
          })
        }
        className={`rounded-full border px-3 py-1.5 text-sm transition ${
          filters.recentDays !== null
            ? "border-foreground bg-foreground text-background"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        Recentes {RECENT_WINDOW_DAYS}d
      </button>

      <button
        type="button"
        data-testid="filter-discarded-toggle"
        aria-pressed={filters.showDiscarded}
        onClick={() => onFiltersChange({ ...filters, showDiscarded: !filters.showDiscarded })}
        className={`rounded-full border px-3 py-1.5 text-sm transition ${
          filters.showDiscarded
            ? "border-foreground bg-foreground text-background"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        Ver descartados
      </button>

      <div className="ml-auto">
        <Select
          value={sortOptionValue(sort)}
          onValueChange={(v) => {
            const opcao = SORT_OPTIONS.find((o) => o.value === v);
            if (opcao) onSortChange(opcao.sort);
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {sortOptionValue(sort) === "custom" && (
              <SelectItem value="custom" disabled>
                Personalizada
              </SelectItem>
            )}
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
