import type { CrmOpportunityStatus, OpportunityRow } from "../types";

export type OpportunityFilters = {
  search: string;
  status: CrmOpportunityStatus | "all";
  minScore: number | null;
  reportStatus: "report_generating" | "report_ready" | "report_failed" | "all";
  sector: string | "all";
  periodStart: string | null; // ISO date, inclusive, compared to lead.created_at
  periodEnd: string | null; // ISO date, inclusive
};

export const DEFAULT_FILTERS: OpportunityFilters = {
  search: "",
  status: "all",
  minScore: null,
  reportStatus: "all",
  sector: "all",
  periodStart: null,
  periodEnd: null,
};

export type OpportunitySort = "recent" | "score" | "next_action" | "company";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function matchesFilters(row: OpportunityRow, filters: OpportunityFilters): boolean {
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
  sort: OpportunitySort
): OpportunityRow[] {
  return sortOpportunities(rows.filter((r) => matchesFilters(r, filters)), sort);
}
