import { describe, expect, it } from "vitest";
import { buildOpportunityUpdatePayload, OpportunityUpdateError } from "./opportunityUpdate";

describe("buildOpportunityUpdatePayload", () => {
  it("only includes fields that were actually provided", () => {
    const payload = buildOpportunityUpdatePayload({ status: "revisado" });
    expect(payload).toEqual({ status: "revisado" });
  });

  it("trims notes and converts empty string to null", () => {
    expect(buildOpportunityUpdatePayload({ notes: "  algumas notas  " })).toEqual({ notes: "algumas notas" });
    expect(buildOpportunityUpdatePayload({ notes: "   " })).toEqual({ notes: null });
  });

  it("passes through a valid next_action_at", () => {
    const payload = buildOpportunityUpdatePayload({ nextActionAt: "2026-08-10T12:00:00Z" });
    expect(payload.next_action_at).toBe("2026-08-10T12:00:00Z");
  });

  it("rejects an invalid next_action_at", () => {
    expect(() => buildOpportunityUpdatePayload({ nextActionAt: "not-a-date" })).toThrow(OpportunityUpdateError);
  });

  it("allows clearing next_action_at with null", () => {
    expect(buildOpportunityUpdatePayload({ nextActionAt: null })).toEqual({ next_action_at: null });
  });

  it("rejects a negative estimated_value", () => {
    expect(() => buildOpportunityUpdatePayload({ estimatedValue: -1 })).toThrow(OpportunityUpdateError);
  });

  it("accepts zero and positive estimated_value", () => {
    expect(buildOpportunityUpdatePayload({ estimatedValue: 0 })).toEqual({ estimated_value: 0 });
    expect(buildOpportunityUpdatePayload({ estimatedValue: 5000 })).toEqual({ estimated_value: 5000 });
  });

  it("trims lost_reason and converts empty string to null", () => {
    expect(buildOpportunityUpdatePayload({ lostReason: "  preço  " })).toEqual({ lost_reason: "preço" });
    expect(buildOpportunityUpdatePayload({ lostReason: "" })).toEqual({ lost_reason: null });
  });
});
