import { describe, expect, it } from "vitest";
import { findSameEmailCandidates } from "./samePerson";
import type { CgiLead } from "../types";

function lead(overrides: Partial<CgiLead> & { id: string }): CgiLead {
  return {
    email_normalized: "x@example.com",
    name: "Lead",
    email: "x@example.com",
    phone: "",
    company: "Co",
    company_website: null,
    role: "CEO",
    sector: "Tech",
    commercial_relationship_model: "B2B",
    employee_count: "1-10",
    annual_revenue_range: "Até R$ 1 milhão",
    current_challenge: "x",
    growth_goal: "x",
    investment_intent: "Sim",
    comments: null,
    created_at: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("findSameEmailCandidates", () => {
  it("finds other leads with the same normalized email", () => {
    const marchioriOld = lead({ id: "old", email_normalized: "marchiori@x.com", name: "Marchiori Bernardi", company: "Lagartto Studios" });
    const marchioriNew = lead({ id: "new", email_normalized: "marchiori@x.com", name: "Marchiori 2", company: "Other Co" });
    const unrelated = lead({ id: "other", email_normalized: "someone@else.com" });

    const result = findSameEmailCandidates([marchioriOld, marchioriNew, unrelated], marchioriOld);

    expect(result.map((c) => c.id)).toEqual(["new"]);
  });

  it("never includes the lead itself", () => {
    const l = lead({ id: "l1" });
    expect(findSameEmailCandidates([l], l)).toHaveLength(0);
  });

  it("returns an empty list when no other lead shares the email", () => {
    const l = lead({ id: "l1", email_normalized: "unique@example.com" });
    const other = lead({ id: "l2", email_normalized: "different@example.com" });
    expect(findSameEmailCandidates([l, other], l)).toHaveLength(0);
  });
});
