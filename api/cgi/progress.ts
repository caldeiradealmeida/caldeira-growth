import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createEventId,
  getAssessmentByPublicId,
  insertFunnelEvent,
  isFinalizedCgiAssessmentStatus,
  upsertAssessment,
} from "../_cgi-supabase.js";
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

  // Late/out-of-order milestone beacons must never reopen a finished
  // assessment. Without this guard a 25/50/75% beacon that lands after the
  // person already completed the CGI rewrites status back to "in_progress" --
  // which, besides corrupting the record, makes the assessment eligible for
  // the abandonment sweep and can send "seu diagnostico ficou em aberto" to
  // someone who finished. Mirrors the guard api/cgi/checkpoint.ts already has.
  // A missing row is left to the upsert below exactly as before, so a beacon
  // that races ahead of /api/cgi/start still behaves the way it does today.
  const existing = await getAssessmentByPublicId(publicAssessmentId);
  if (existing && isFinalizedCgiAssessmentStatus(existing.status)) {
    res.status(409).json({ ok: false, error: "assessment_already_finalized" });
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
