import type { CgiDimensionId } from "@/data/cgiConfig";
import type { CgiResumeHandoff, LeadForm, Step } from "../types";
import { normalizeCgiAnswers } from "../scoring";
import { resolveResumeDimensionIndex } from "./resumeDimension";

export type ResumeHydrationResult = {
  publicAssessmentId: string;
  answers: Record<string, number>;
  answeredCount: number;
  lead: LeadForm | null;
  step: Step;
  dimensionIndex: number | null;
};

/** Pure decision logic for cross-device resume hydration (Etapa 3): given
 * the server-resolved handoff, what should the CGI form's state become?
 * Kept separate from the CGI.tsx effect that applies it (setState,
 * localStorage, analytics) so the actual landing logic is unit-testable
 * without rendering the full form. Mirrors the existing localStorage-restore
 * branching in CGI.tsx (lead + no answers -> context; answers -> assessment)
 * so a token-based resume and a same-device reload land the same way. */
export function computeResumeHydration(
  handoff: CgiResumeHandoff,
  initialLead: LeadForm,
  dimensionOrder: readonly CgiDimensionId[]
): ResumeHydrationResult {
  const answers = normalizeCgiAnswers(handoff.answers);
  const answeredCount = Object.keys(answers).length;
  const lead = handoff.lead ? { ...initialLead, ...handoff.lead } : null;

  if (!lead) {
    return { publicAssessmentId: handoff.publicAssessmentId, answers, answeredCount, lead: null, step: "lead", dimensionIndex: null };
  }

  if (answeredCount === 0) {
    return { publicAssessmentId: handoff.publicAssessmentId, answers, answeredCount, lead, step: "context", dimensionIndex: null };
  }

  return {
    publicAssessmentId: handoff.publicAssessmentId,
    answers,
    answeredCount,
    lead,
    step: "assessment",
    dimensionIndex: resolveResumeDimensionIndex(answers, dimensionOrder),
  };
}
