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
import type { OpportunityFilters, OpportunitySort } from "../logic/filterSortOpportunities";

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

const SORT_OPTIONS: { value: OpportunitySort; label: string }[] = [
  { value: "recent", label: "Mais recente" },
  { value: "score", label: "Maior score" },
  { value: "next_action", label: "Próxima ação" },
  { value: "company", label: "Empresa" },
];

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

      <div className="ml-auto">
        <Select value={sort} onValueChange={(v) => onSortChange(v as OpportunitySort)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
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
