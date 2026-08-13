import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getReadyCgiReport } from "./_cgi-supabase.js";
import { resolveReportAccessToken } from "./_cgi-report-token.js";

// Server-side, read-only resolution of a report-access bearer token into
// report content. POST-only, token in the request body only (query-string
// tokens are never read), no CORS (same-origin use only), no caching.
//
// Response states are deliberately collapsed so nothing about *why* a token
// doesn't work is observable: "link_unavailable" covers not-found, expired,
// and revoked alike -- never public_assessment_id, never the token itself.
//
// Read-only by construction: the only calls made are resolveReportAccessToken
// (reads cgi_report_access, best-effort touches last_accessed_at) and
// getReadyCgiReport (reads cgi_reports). Never calls OpenAI, never calls
// saveCompletedCgiReport/insertRegeneratedCgiReport, never touches
// report_status, never creates a new report version.

const MAX_BODY_BYTES = 2048;
const MAX_TOKEN_LENGTH = 512;

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
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, state: "error" });
    return;
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    res.status(400).json({ ok: false, state: "error" });
    return;
  }

  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    res.status(415).json({ ok: false, state: "error" });
    return;
  }

  const payload = readPayload(req);
  if (!payload) {
    res.status(400).json({ ok: false, state: "error" });
    return;
  }

  // Query-string tokens are never accepted, even if present alongside a
  // missing/invalid body token -- only payload.t (the JSON body) counts.
  const token = payload.t;
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    res.status(200).json({ ok: true, state: "link_unavailable" });
    return;
  }

  let resolved;
  try {
    resolved = await resolveReportAccessToken(token);
  } catch {
    res.status(200).json({ ok: true, state: "error" });
    return;
  }

  if (resolved.state === "link_unavailable") {
    res.status(200).json({ ok: true, state: "link_unavailable" });
    return;
  }

  let reportState;
  try {
    reportState = await getReadyCgiReport({ publicAssessmentId: resolved.publicAssessmentId });
  } catch {
    res.status(200).json({ ok: true, state: "error" });
    return;
  }

  if (!reportState) {
    res.status(200).json({ ok: true, state: "report_unavailable" });
    return;
  }

  res.status(200).json({
    ok: true,
    state: "ready",
    data: {
      language: reportState.language,
      score: reportState.score,
      lead: reportState.lead,
      reportJson: reportState.reportJson,
    },
  });
}
