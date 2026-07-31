// Small, pure decision helpers extracted from the CGI page's report-polling
// lifecycle so they can be unit tested without mounting the full page.

/**
 * Decides whether a mount/reload should resume polling for a previously
 * started report generation. This is the only path allowed to show the
 * "Seu índice já foi calculado" resume toast - a brand new submission never
 * goes through this function, so it never shows that message.
 */
export function shouldAutoResumeReportPolling({
  assessmentId,
  isCurrentReportReady,
  savedReportStatus,
  hasSavedAnswers,
}: {
  assessmentId: string;
  isCurrentReportReady: boolean;
  savedReportStatus: string | undefined;
  hasSavedAnswers: boolean;
}): boolean {
  if (!assessmentId) return false;
  if (isCurrentReportReady) return false;
  if (savedReportStatus !== "report_generating") return false;
  if (!hasSavedAnswers) return false;
  return true;
}

/**
 * The auto-resume check above must only ever run once per page mount. A
 * brand-new submission moves reportStatus/publicAssessmentId through the
 * exact same values a resumed reload does, so if the resume effect were
 * allowed to re-evaluate on every such change, it would race ahead of that
 * submission's own request - stealing its step/isSubmitting transitions
 * before the backend even knows the assessment exists. Call this once at
 * the top of the effect, guarded by a ref that starts at `false` and is
 * flipped to `true` right after the first evaluation (whether or not it
 * actually resumed).
 */
export function shouldEvaluateAutoResume({
  alreadyAttempted,
}: {
  alreadyAttempted: boolean;
}): boolean {
  return !alreadyAttempted;
}

/**
 * A beginReportPolling invocation can be superseded by a newer one (for the
 * same or a different assessment id) before its own poll settles. Only the
 * attempt whose AbortController is still the one the page is currently
 * tracking is allowed to finalize - i.e. clear isSubmitting and release the
 * poll refs. A stale/superseded attempt resolving later (ready, failed,
 * timeout, or otherwise) must never clear state that a newer, still-running
 * attempt already owns.
 */
export function shouldFinalizePollAttempt({
  activeAbortController,
  thisAttemptController,
}: {
  activeAbortController: AbortController | null;
  thisAttemptController: AbortController;
}): boolean {
  return activeAbortController === thisAttemptController;
}
