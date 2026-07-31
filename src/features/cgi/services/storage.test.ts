import { beforeEach, describe, expect, it, vi } from "vitest";
import { readSavedCgiAssessment, saveCgiAssessment } from "./storage";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
}

const lead = { name: "Lead Teste", email: "lead@example.com" } as never;
const answers = { q1: 4 };

describe("saveCgiAssessment / readSavedCgiAssessment terminal state persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: createStorage() });
  });

  it("persists report_failed immediately so a later read reflects the terminal state", () => {
    saveCgiAssessment(lead, answers, { reportStatus: "report_generating" });
    expect(readSavedCgiAssessment()?.reportStatus).toBe("report_generating");

    // This is the write beginReportPolling's "failed" branch now performs
    // immediately, instead of leaving the stale "report_generating"
    // snapshot behind for a later reload to misread.
    saveCgiAssessment(lead, answers, { reportStatus: "report_failed" });

    expect(readSavedCgiAssessment()?.reportStatus).toBe("report_failed");
  });

  it("persists report_ready immediately so a later read reflects the terminal state", () => {
    saveCgiAssessment(lead, answers, { reportStatus: "report_generating" });

    saveCgiAssessment(lead, answers, {
      reportStatus: "report_ready",
      aiReport: "{}",
      aiStatus: "generated",
    });

    const saved = readSavedCgiAssessment();
    expect(saved?.reportStatus).toBe("report_ready");
    expect(saved?.aiStatus).toBe("generated");
  });
});
