import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createPublicAssessmentId,
  getActiveAssessmentByAnonymousSession,
  logSupabaseFailure,
  upsertAssessment,
  upsertAttribution,
} from "../_cgi-supabase.js";
import {
  normalizeAnonymousSessionId,
  normalizeAttribution,
  normalizeLanguage,
} from "../_cgi-validation.js";

function readPayload(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}") as Record<string, unknown>;
  return (req.body ?? {}) as Record<string, unknown>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = readPayload(req);
  } catch {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  const anonymousSessionId = normalizeAnonymousSessionId(payload.anonymous_session_id);
  const pagePath = String(payload.page_path || "/cgi").slice(0, 300);
  const language = normalizeLanguage(payload.language);
  if (!anonymousSessionId) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  try {
    const existingAssessment = await getActiveAssessmentByAnonymousSession(anonymousSessionId);
    if (existingAssessment?.public_assessment_id) {
      res.status(200).json({
        ok: true,
        public_assessment_id: existingAssessment.public_assessment_id,
        status: existingAssessment.status || "created",
        language,
        reused: true,
      });
      return;
    }
  } catch (error) {
    logSupabaseFailure("get_active_assessment_by_anonymous_session", { error });
  }

  const publicAssessmentId = createPublicAssessmentId();
  const attribution = normalizeAttribution(payload.attribution);
  const assessment = await upsertAssessment({
    publicAssessmentId,
    anonymousSessionId,
    status: "created",
    progressPercent: 0,
    startedAt: new Date().toISOString(),
  });

  if (assessment?.id) {
    await upsertAttribution(assessment.id, {
      ...attribution,
      landing_page: attribution.landing_page || pagePath,
    });
  }

  res.status(200).json({
    ok: true,
    public_assessment_id: publicAssessmentId,
    status: "created",
    language,
  });
}
