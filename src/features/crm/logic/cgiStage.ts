/** Derivation of the CGI stage shown in the Pipe.
 *
 * Deliberately keyed on completed_at BEFORE status: a handful of historical
 * assessments finished the diagnostic while an out-of-order write left their
 * status column behind (the late cgi_phone_submitted regression). Those rows
 * carry completed_at, a score and a ready report, so the Pipe must show them as
 * finished regardless of what `status` says. Reading status first would render
 * a finished lead as "Não iniciado".
 *
 * Management-facing labels, not lifecycle names: the person reading the Pipe
 * wants to know whether the diagnostic happened, not which enum value the row
 * holds.
 */

export type CgiStage = "nao_iniciado" | "em_andamento" | "concluido" | "abandonado";

export type CgiStageView = {
  stage: CgiStage;
  progressPercent: number;
};

export type CgiStageInput = {
  status?: string | null;
  progress_percent?: number | null;
  current_question?: number | null;
  completed_at?: string | null;
};

function normalizeProgress(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function deriveCgiStage(assessment: CgiStageInput | null | undefined): CgiStageView | null {
  if (!assessment) return null;

  if (assessment.completed_at) return { stage: "concluido", progressPercent: 100 };

  const progressPercent = normalizeProgress(assessment.progress_percent);

  if (assessment.status === "abandoned") return { stage: "abandonado", progressPercent };

  const answered = typeof assessment.current_question === "number" ? assessment.current_question : 0;
  if (progressPercent > 0 || answered > 0) return { stage: "em_andamento", progressPercent };

  return { stage: "nao_iniciado", progressPercent: 0 };
}

export function formatCgiProgress(view: CgiStageView | null): string {
  if (!view) return "—";
  return `${view.progressPercent}%`;
}
