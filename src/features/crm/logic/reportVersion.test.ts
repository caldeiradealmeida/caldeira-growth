import { describe, expect, it } from "vitest";
import { pickLatestReport, canRegenerateReport } from "./reportVersion";
import type { CgiReport } from "../types";

function report(overrides: Partial<CgiReport>): CgiReport {
  return {
    id: "report_id",
    public_assessment_id: "pub_1",
    report_status: "report_ready",
    language: "pt",
    ai_report_text: "texto",
    report_json: {},
    lead_json: {},
    score_json: {},
    model: "gpt-5.1",
    version: 1,
    generation_completed_at: "2026-08-01T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("pickLatestReport", () => {
  it("returns null when there is no report for the assessment", () => {
    expect(pickLatestReport([], "pub_1")).toBeNull();
  });

  it("picks the highest version, not the array order", () => {
    const reports = [
      report({ id: "v2", version: 2, created_at: "2026-08-05T00:00:00.000Z" }),
      report({ id: "v1", version: 1, created_at: "2026-08-01T00:00:00.000Z" }),
    ];
    // v1 appears first in the array on purpose -- version must win, not order.
    expect(pickLatestReport(reports, "pub_1")?.id).toBe("v2");
  });

  it("ignores reports belonging to a different assessment", () => {
    const reports = [report({ id: "other", public_assessment_id: "pub_other", version: 5 })];
    expect(pickLatestReport(reports, "pub_1")).toBeNull();
  });

  it("falls back to created_at when versions tie", () => {
    const reports = [
      report({ id: "older", version: 1, created_at: "2026-08-01T00:00:00.000Z" }),
      report({ id: "newer", version: 1, created_at: "2026-08-03T00:00:00.000Z" }),
    ];
    expect(pickLatestReport(reports, "pub_1")?.id).toBe("newer");
  });
});

describe("canRegenerateReport", () => {
  it("is true for a completed assessment and an admin", () => {
    expect(canRegenerateReport({ assessmentStatus: "completed", isAdmin: true })).toBe(true);
  });

  it("is false for a non-completed assessment even for an admin", () => {
    expect(canRegenerateReport({ assessmentStatus: "in_progress", isAdmin: true })).toBe(false);
  });

  it("is false for a non-admin even on a completed assessment", () => {
    expect(canRegenerateReport({ assessmentStatus: "completed", isAdmin: false })).toBe(false);
  });
});
