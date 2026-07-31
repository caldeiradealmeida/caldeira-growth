import { describe, expect, it } from "vitest";
import {
  shouldAutoResumeReportPolling,
  shouldEvaluateAutoResume,
  shouldFinalizePollAttempt,
} from "./reportLifecycle";

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

describe("shouldEvaluateAutoResume", () => {
  it("evaluates on a genuine mount/reload, when no attempt has run yet", () => {
    expect(shouldEvaluateAutoResume({ alreadyAttempted: false })).toBe(true);
  });

  it("does not re-evaluate for a fresh submission on the same page lifetime", () => {
    // A brand-new submission drives reportStatus/publicAssessmentId through
    // the exact same values a resumed reload does. Once the mount-time
    // evaluation has already happened (alreadyAttempted = true), any later
    // change that would otherwise re-trigger the resume effect - including a
    // fresh submission's own setReportStatus("report_generating") - must be
    // ignored, or it would race ahead of that submission's own request.
    expect(shouldEvaluateAutoResume({ alreadyAttempted: true })).toBe(false);
  });
});

describe("shouldFinalizePollAttempt", () => {
  it("lets the current attempt end progress on a ready result", () => {
    const controller = new AbortController();
    expect(
      shouldFinalizePollAttempt({
        activeAbortController: controller,
        thisAttemptController: controller,
      })
    ).toBe(true);
  });

  it("lets the current attempt end progress on a failed result", () => {
    const controller = new AbortController();
    expect(
      shouldFinalizePollAttempt({
        activeAbortController: controller,
        thisAttemptController: controller,
      })
    ).toBe(true);
  });

  it("keeps the bar under the newest attempt's control once an older attempt is superseded", () => {
    const oldController = new AbortController();
    const newController = new AbortController();
    // The old attempt resolving after being superseded must never finalize
    // (never clear isSubmitting) - that would hide the bar while the newer
    // attempt is still actively generating the report.
    expect(
      shouldFinalizePollAttempt({
        activeAbortController: newController,
        thisAttemptController: oldController,
      })
    ).toBe(false);
    // The newest attempt remains authoritative and will still finalize once
    // it resolves.
    expect(
      shouldFinalizePollAttempt({
        activeAbortController: newController,
        thisAttemptController: newController,
      })
    ).toBe(true);
  });

  it("does not finalize once the tracked controller has already been cleared", () => {
    const controller = new AbortController();
    expect(
      shouldFinalizePollAttempt({
        activeAbortController: null,
        thisAttemptController: controller,
      })
    ).toBe(false);
  });
});
