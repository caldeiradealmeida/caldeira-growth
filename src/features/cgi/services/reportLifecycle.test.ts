import { describe, expect, it } from "vitest";
import { shouldAutoResumeReportPolling } from "./reportLifecycle";

describe("shouldAutoResumeReportPolling", () => {
  it("does not resume for a brand new submission with no prior saved state", () => {
    // A fresh submission has no saved snapshot yet (savedReportStatus is
    // undefined), so this must never trigger the resume path - and
    // therefore never show the "Seu índice já foi calculado" toast, which
    // only fires from the resume path.
    expect(
      shouldAutoResumeReportPolling({
        assessmentId: "assessment_1",
        isCurrentReportReady: false,
        savedReportStatus: undefined,
        hasSavedAnswers: false,
      })
    ).toBe(false);
  });

  it("resumes when a previous attempt is still marked report_generating", () => {
    expect(
      shouldAutoResumeReportPolling({
        assessmentId: "assessment_1",
        isCurrentReportReady: false,
        savedReportStatus: "report_generating",
        hasSavedAnswers: true,
      })
    ).toBe(true);
  });

  it("does not resume once the terminal state has already been persisted as report_ready", () => {
    expect(
      shouldAutoResumeReportPolling({
        assessmentId: "assessment_1",
        isCurrentReportReady: false,
        savedReportStatus: "report_ready",
        hasSavedAnswers: true,
      })
    ).toBe(false);
  });

  it("does not resume once the terminal state has already been persisted as report_failed", () => {
    // This is exactly the case that used to keep re-triggering polling (and
    // the toast) on every reload: a failure that was never written back to
    // localStorage stayed at "report_generating" forever. Once report_failed
    // is persisted immediately, this guard stops it for good.
    expect(
      shouldAutoResumeReportPolling({
        assessmentId: "assessment_1",
        isCurrentReportReady: false,
        savedReportStatus: "report_failed",
        hasSavedAnswers: true,
      })
    ).toBe(false);
  });

  it("does not resume when the current in-memory report is already ready", () => {
    expect(
      shouldAutoResumeReportPolling({
        assessmentId: "assessment_1",
        isCurrentReportReady: true,
        savedReportStatus: "report_generating",
        hasSavedAnswers: true,
      })
    ).toBe(false);
  });

  it("does not resume without an assessment id or saved answers", () => {
    expect(
      shouldAutoResumeReportPolling({
        assessmentId: "",
        isCurrentReportReady: false,
        savedReportStatus: "report_generating",
        hasSavedAnswers: true,
      })
    ).toBe(false);
    expect(
      shouldAutoResumeReportPolling({
        assessmentId: "assessment_1",
        isCurrentReportReady: false,
        savedReportStatus: "report_generating",
        hasSavedAnswers: false,
      })
    ).toBe(false);
  });
});
