import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, filterAndSortOpportunities, matchesFilters } from "./filterSortOpportunities";
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

describe("filterAndSortOpportunities sorting", () => {
  const rows = [
    row({ id: "1", company: "Zulu Co", score: 50, lastActivityAt: "2026-07-01T00:00:00Z", nextActionAt: "2026-08-10T00:00:00Z" }),
    row({ id: "2", company: "Alpha Co", score: 90, lastActivityAt: "2026-07-20T00:00:00Z", nextActionAt: null }),
    row({ id: "3", company: "Mid Co", score: 70, lastActivityAt: "2026-07-10T00:00:00Z", nextActionAt: "2026-08-01T00:00:00Z" }),
  ];

  it("sorts by most recent activity", () => {
    const sorted = filterAndSortOpportunities(rows, DEFAULT_FILTERS, "recent");
    expect(sorted.map((r) => r.lead.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts by score descending", () => {
    const sorted = filterAndSortOpportunities(rows, DEFAULT_FILTERS, "score");
    expect(sorted.map((r) => r.lead.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts by soonest next action, pushing rows with none to the end", () => {
    const sorted = filterAndSortOpportunities(rows, DEFAULT_FILTERS, "next_action");
    expect(sorted.map((r) => r.lead.id)).toEqual(["3", "1", "2"]);
  });

  it("sorts by company name", () => {
    const sorted = filterAndSortOpportunities(rows, DEFAULT_FILTERS, "company");
    expect(sorted.map((r) => r.lead.id)).toEqual(["2", "3", "1"]);
  });
});
