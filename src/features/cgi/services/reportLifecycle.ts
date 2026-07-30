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
