import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpportunities } from "../hooks/useOpportunities";
import { FiltersBar } from "../components/FiltersBar";
import { OpportunityTable } from "../components/OpportunityTable";
import { DEFAULT_FILTERS, filterOpportunities } from "../logic/filterSortOpportunities";
import { DEFAULT_SORT, type OpportunitySort } from "../logic/sortOpportunities";

export function CrmList() {
  const { data: rows, isLoading, isError, error } = useOpportunities();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState<OpportunitySort>(DEFAULT_SORT);

  const sectors = useMemo(() => {
    if (!rows) return [];
    return Array.from(new Set(rows.map((r) => r.lead.sector).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [rows]);

  // Só filtra aqui. Ordenar é trabalho da tabela, onde as views já existem --
  // e ordenar nos dois lugares foi o que fazia o seletor não ter efeito.
  const visibleRows = useMemo(() => {
    if (!rows) return [];
    return filterOpportunities(rows, filters);
  }, [rows, filters]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Oportunidades</h1>
        <p className="text-sm text-muted-foreground">
          Uma linha por lead que se identificou no CGI. Assessments e relatórios de cada um ficam no
          detalhe.
        </p>
      </div>

      <FiltersBar filters={filters} onFiltersChange={setFilters} sort={sort} onSortChange={setSort} sectors={sectors} />

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Não foi possível carregar as oportunidades: {error instanceof Error ? error.message : "erro desconhecido"}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <p className="text-sm text-muted-foreground">
            {visibleRows.length} {visibleRows.length === 1 ? "oportunidade" : "oportunidades"}
          </p>
          <OpportunityTable rows={visibleRows} sort={sort} onSortChange={setSort} />
        </>
      )}
    </div>
  );
}
