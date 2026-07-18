import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createEventId, insertFunnelEvent, upsertAssessment } from "../_cgi-supabase.js";
import {
  normalizeAnonymousSessionId,
  normalizePublicAssessmentId,
} from "../_cgi-validation.js";

function readPayload(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}") as Record<string, unknown>;
  return (req.body ?? {}) as Record<string, unknown>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH" && req.method !== "POST") {
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
  const publicAssessmentId = normalizePublicAssessmentId(payload.public_assessment_id);
  const progressPercent = Number(payload.progress_percent);
  const currentQuestion = Number(payload.current_question);
  const eventId = String(payload.event_id || createEventId());

  if (
    !anonymousSessionId ||
    !publicAssessmentId ||
    ![25, 50, 75].includes(progressPercent) ||
    !Number.isFinite(currentQuestion)
  ) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  await upsertAssessment({
    publicAssessmentId,
    anonymousSessionId,
    status: "in_progress",
    progressPercent,
    currentQuestion,
  });

  await insertFunnelEvent({
    eventId,
    anonymousSessionId,
    publicAssessmentId,
    eventName: "cgi_progress",
    source: "client",
    pagePath: "/cgi",
    metadata: { progress_percent: progressPercent },
  });

  res.status(200).json({ ok: true, event_id: eventId });
}
