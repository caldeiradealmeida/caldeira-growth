import type { CgiReport } from "../types";

/** Reports are append-only per public_assessment_id (see the versioning
 * migration) -- this picks the highest version, falling back to created_at
 * only to break a tie when version is missing/equal. */
export function pickLatestReport(reports: CgiReport[], publicAssessmentId: string): CgiReport | null {
  const candidates = reports.filter((r) => r.public_assessment_id === publicAssessmentId);
  if (candidates.length === 0) return null;
  return candidates.slice().sort((a, b) => {
    const versionDiff = (b.version ?? 0) - (a.version ?? 0);
    if (versionDiff !== 0) return versionDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0];
}

export function canRegenerateReport(input: { assessmentStatus: string; isAdmin: boolean }): boolean {
  return input.isAdmin && input.assessmentStatus === "completed";
}
