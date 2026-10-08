import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CGI_QUESTIONS, normalizeCgiAnswers } from "../_cgi-core.js";
import {
  getAssessmentByPublicId,
  upsertAnswers,
  upsertAssessment,
} from "../_cgi-supabase.js";
import {
  normalizeAnonymousSessionId,
  normalizePublicAssessmentId,
} from "../_cgi-validation.js";

// Best-effort, fire-and-forget partial-progress checkpoint. Called by the
// frontend at the end of each of the 5 CGI dimensions (a separate,
// dimension-aligned trigger from the existing /api/cgi/progress endpoint's
// 25/50/75% milestones -- that endpoint is untouched by this file).
//
// Read-only with respect to report generation: never calls OpenAI, never
// touches cgi_reports, never changes report_status, never marks an
// assessment completed. Only upserts already-given answers into
// cgi_answers and reflects current progress on cgi_assessments, using the
// exact same upsertAnswers/upsertAssessment functions the real completion
// flow already uses -- no new persistence primitive, no new table.

const MAX_BODY_BYTES = 8192;

function readPayload(req: VercelRequest): Record<string, unknown> | null {
  let raw: unknown = req.body;
  if (typeof raw === "string") {
    if (raw.length > MAX_BODY_BYTES) return null;
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  const payload = readPayload(req);
  if (!payload) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  const anonymousSessionId = normalizeAnonymousSessionId(payload.anonymous_session_id);
  const publicAssessmentId = normalizePublicAssessmentId(payload.public_assessment_id);
  if (!anonymousSessionId || !publicAssessmentId) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  const rawAnswers =
    payload.answers && typeof payload.answers === "object" && !Array.isArray(payload.answers)
      ? (payload.answers as Record<string, unknown>)
      : {};
  const answers = normalizeCgiAnswers(rawAnswers);
  const answeredCount = Object.keys(answers).length;
  if (answeredCount === 0) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  const assessment = await getAssessmentByPublicId(publicAssessmentId);
  if (!assessment?.id) {
    res.status(404).json({ ok: false, error: "assessment_not_found" });
    return;
  }
  if (assessment.status === "completed" || assessment.status === "abandoned") {
    // Never let a stale/late checkpoint touch a finalized assessment's
    // already-scored answers or move its status backwards.
    res.status(409).json({ ok: false, error: "assessment_already_finalized" });
    return;
  }

  await upsertAnswers(assessment.id, answers);

  // Capped below 100 -- only the real completion flow (persistCompletedAssessmentBestEffort)
  // is allowed to report 100%/"completed", since only it has a computed score.
  const progressPercent = Math.min(99, Math.round((answeredCount / CGI_QUESTIONS.length) * 100));
  await upsertAssessment({
    publicAssessmentId,
    anonymousSessionId,
    status: "in_progress",
    currentQuestion: answeredCount,
    progressPercent,
  });

  res.status(200).json({ ok: true, answered_count: answeredCount });
}
