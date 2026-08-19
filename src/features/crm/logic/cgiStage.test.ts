import { describe, expect, it } from "vitest";
import { deriveCgiStage, formatCgiProgress } from "./cgiStage";

describe("deriveCgiStage", () => {
  it("shows a lead that never answered anything as not started at 0%", () => {
    expect(deriveCgiStage({ status: "lead_captured", progress_percent: 0, current_question: null, completed_at: null }))
      .toEqual({ stage: "nao_iniciado", progressPercent: 0 });
  });

  it("shows partial progress as in progress with the real percentage", () => {
    expect(deriveCgiStage({ status: "in_progress", progress_percent: 20, current_question: 8, completed_at: null }))
      .toEqual({ stage: "em_andamento", progressPercent: 20 });
    expect(deriveCgiStage({ status: "in_progress", progress_percent: 50, current_question: 20, completed_at: null }))
      .toEqual({ stage: "em_andamento", progressPercent: 50 });
  });

  it("treats a finished assessment as finished even when the status column lags behind", () => {
    // The historical regression: a late phone step rewrote status back to
    // "lead_captured" and progress to 0 on an assessment that had already
    // completed and produced a report. completed_at is the source of truth.
    expect(deriveCgiStage({
      status: "lead_captured",
      progress_percent: 0,
      current_question: 40,
      completed_at: "2026-08-18T12:51:44.085Z",
    })).toEqual({ stage: "concluido", progressPercent: 100 });
  });

  it("shows an abandoned assessment with the progress it reached", () => {
    expect(deriveCgiStage({ status: "abandoned", progress_percent: 40, current_question: 16, completed_at: null }))
      .toEqual({ stage: "abandonado", progressPercent: 40 });
  });

  it("shows a completed assessment at 100%", () => {
    expect(deriveCgiStage({ status: "completed", progress_percent: 100, current_question: 40, completed_at: "2026-08-18T22:11:04.708Z" }))
      .toEqual({ stage: "concluido", progressPercent: 100 });
  });

  it("counts answered questions even when progress_percent was not written", () => {
    expect(deriveCgiStage({ status: "in_progress", progress_percent: 0, current_question: 4, completed_at: null }))
      .toEqual({ stage: "em_andamento", progressPercent: 0 });
  });

  it("clamps nonsense progress values instead of rendering them", () => {
    expect(deriveCgiStage({ status: "in_progress", progress_percent: 140, current_question: 40, completed_at: null }).progressPercent).toBe(100);
    expect(deriveCgiStage({ status: "in_progress", progress_percent: -5, current_question: 2, completed_at: null }).progressPercent).toBe(0);
    expect(deriveCgiStage({ status: "in_progress", progress_percent: Number.NaN, current_question: 2, completed_at: null }).progressPercent).toBe(0);
  });

  it("returns null when the lead has no assessment at all", () => {
    expect(deriveCgiStage(null)).toBeNull();
    expect(formatCgiProgress(null)).toBe("—");
  });

  it("formats the percentage for display", () => {
    expect(formatCgiProgress({ stage: "em_andamento", progressPercent: 20 })).toBe("20%");
    expect(formatCgiProgress({ stage: "concluido", progressPercent: 100 })).toBe("100%");
  });
});
