import { CGI_QUESTIONS, type CgiDimensionId, type CgiQuestion } from "@/data/cgiConfig";

/** Which dimension index a cross-device resume should open on, derived from
 * the actual persisted answers -- not from current_question/progress_percent,
 * which are display counters and could in principle drift from the real
 * per-question data. A dimension is "complete" only if every one of its own
 * questions has a valid answer (1-5); the resume point is the first
 * incomplete dimension in canonical order. If all 5 are complete while the
 * assessment is still in_progress (a state that should not normally happen,
 * since completion is a separate explicit action), this defensively opens
 * the last dimension instead of doing anything that could look like
 * auto-completing the assessment. */
export function resolveResumeDimensionIndex(
  answers: Record<string, number>,
  dimensionOrder: readonly CgiDimensionId[],
  questions: readonly CgiQuestion[] = CGI_QUESTIONS
): number {
  const isAnswered = (question: CgiQuestion) => {
    const value = answers[question.id];
    return typeof value === "number" && value >= 1 && value <= 5;
  };

  for (let index = 0; index < dimensionOrder.length; index += 1) {
    const dimensionId = dimensionOrder[index];
    const dimensionQuestions = questions.filter((question) => question.dimensionId === dimensionId);
    const complete = dimensionQuestions.length > 0 && dimensionQuestions.every(isAnswered);
    if (!complete) return index;
  }

  return Math.max(dimensionOrder.length - 1, 0);
}
