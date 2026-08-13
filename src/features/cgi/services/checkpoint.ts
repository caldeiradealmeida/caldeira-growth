import { CGI_CHECKPOINT_ENDPOINT } from "../config";

/** Best-effort persistence of a partial-progress checkpoint. Never throws
 * and never blocks the caller -- localStorage already has the answers, so
 * a failed checkpoint just means the next one (or the final submission)
 * will resend the full set. Nothing user-facing depends on this resolving. */
export async function persistCgiCheckpoint({
  anonymousSessionId,
  publicAssessmentId,
  answers,
}: {
  anonymousSessionId: string;
  publicAssessmentId: string;
  answers: Record<string, number>;
}): Promise<void> {
  try {
    await fetch(CGI_CHECKPOINT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymous_session_id: anonymousSessionId,
        public_assessment_id: publicAssessmentId,
        answers,
      }),
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[CGI] Falha ao persistir checkpoint parcial.", error);
    }
  }
}
