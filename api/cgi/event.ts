import type { VercelRequest, VercelResponse } from "@vercel/node";
import { insertFunnelEvent } from "../_cgi-supabase.js";
import {
  hasForbiddenMetadataKeys,
  isAllowedCgiEvent,
  normalizeAnonymousSessionId,
  normalizePublicAssessmentId,
  sanitizeEventMetadata,
} from "../_cgi-validation.js";

const INTERNAL_EVENT_ALLOWLIST = new Set([
  "cgi_landing_view",
  "cgi_start_click",
  "cgi_lead_form_view",
  "cgi_assessment_started",
  "cgi_result_viewed",
  "cgi_report_requested",
  "cgi_cta_clicked",
  "cgi_assessment_resumed",
  "cgi_validation_error",
  "cgi_system_error",
]);

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

  const eventName = payload.event_name;
  if (!isAllowedCgiEvent(eventName) || !INTERNAL_EVENT_ALLOWLIST.has(eventName)) {
    res.status(400).json({ ok: false, error: "event_not_allowed" });
    return;
  }
  if (hasForbiddenMetadataKeys(payload.metadata)) {
    res.status(400).json({ ok: false, error: "invalid_metadata" });
    return;
  }

  const anonymousSessionId = normalizeAnonymousSessionId(payload.anonymous_session_id);
  const publicAssessmentId = normalizePublicAssessmentId(payload.public_assessment_id);
  const eventId = String(payload.event_id || "");
  if (!anonymousSessionId || !eventId) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  await insertFunnelEvent({
    eventId,
    anonymousSessionId,
    publicAssessmentId: publicAssessmentId || null,
    eventName,
    source: "client",
    pagePath: String(payload.page_path || "/cgi").slice(0, 300),
    metadata: sanitizeEventMetadata(eventName, payload.metadata),
  });

  res.status(200).json({ ok: true, event_id: eventId });
}
