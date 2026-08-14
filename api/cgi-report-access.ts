import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getAnswersByAssessmentId,
  getAssessmentByPublicId,
  getCgiReportState,
  getLeadById,
} from "./_cgi-supabase.js";
import { resolveReportAccessToken } from "./_cgi-report-token.js";

// Server-side, read-only resolution of a report-access bearer token. The
// token identifies an assessment, not just a finished report (Etapa 3) --
// this endpoint now branches on the assessment's own status to support both
// the original report-ready view and cross-device resume of an incomplete
// assessment. POST-only, token in the request body only (query-string
// tokens are never read), no CORS (same-origin use only), no caching.
//
// Response states are deliberately collapsed so nothing about *why* a token
// doesn't work is observable: "link_unavailable" covers not-found, expired,
// and revoked alike -- never public_assessment_id, never the token itself.
//
// Read-only by construction: the calls made are resolveReportAccessToken
// (reads cgi_report_access, best-effort touches last_accessed_at),
// getAssessmentByPublicId, getAnswersByAssessmentId, getLeadById (all plain
// reads), and getCgiReportState (reads cgi_reports, already returns the
// latest version -- same function/semantics the legacy status endpoint
// uses, so "latest valid version" behavior is inherited, not reimplemented).
// Never calls OpenAI, never calls saveCompletedCgiReport/
// insertRegeneratedCgiReport, never touches report_status, never creates a
// new report version, never creates or mutates an assessment/lead/answer.

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

  const publicAssessmentId = resolved.publicAssessmentId;

  let assessment;
  try {
    assessment = await getAssessmentByPublicId(publicAssessmentId);
  } catch {
    res.status(200).json({ ok: true, state: "error" });
    return;
  }

  // Same collapsed philosophy as an invalid token: a token whose assessment
  // is gone reveals nothing more specific than "this link doesn't work".
  if (!assessment) {
    res.status(200).json({ ok: true, state: "link_unavailable" });
    return;
  }

  if (assessment.status !== "completed") {
    // Incomplete assessment (created / lead_captured / started / in_progress
    // / abandoned) -- Etapa 3 cross-device resume. Never touches
    // report generation; only reads already-persisted answers/lead.
    let answers: Record<string, number> = {};
    let leadRow = null;
    try {
      [answers, leadRow] = await Promise.all([
        getAnswersByAssessmentId(assessment.id),
        assessment.lead_id ? getLeadById(assessment.lead_id) : Promise.resolve(null),
      ]);
    } catch {
      res.status(200).json({ ok: true, state: "error" });
      return;
    }

    res.status(200).json({
      ok: true,
      state: "resume",
      data: {
        // publicAssessmentId is required, not incidental: the frontend must
        // send it back on every subsequent checkpoint/completion call, or it
        // would call /api/cgi/start and create a second, unrelated
        // assessment instead of continuing this one.
        publicAssessmentId,
        status: assessment.status,
        answers,
        currentQuestion: assessment.current_question ?? 0,
        progressPercent: assessment.progress_percent ?? 0,
        lead: leadRow
          ? {
              name: leadRow.name,
              email: leadRow.email,
              phone: leadRow.phone || "",
              company: leadRow.company,
              companyWebsite: leadRow.company_website || "",
              role: leadRow.role,
              sector: leadRow.sector || "",
              commercialRelationshipModel: leadRow.commercial_relationship_model || "",
              employeeCount: leadRow.employee_count || "",
              annualRevenue: leadRow.annual_revenue_range || "",
              currentChallenge: leadRow.current_challenge || "",
              growthGoal: leadRow.growth_goal || "",
              investmentIntent: leadRow.investment_intent || "",
              comments: leadRow.comments || "",
            }
          : null,
      },
    });
    return;
  }

  let reportState;
  try {
    reportState = await getCgiReportState({ publicAssessmentId });
  } catch {
    res.status(200).json({ ok: true, state: "error" });
    return;
  }

  if (!reportState) {
    res.status(200).json({ ok: true, state: "report_unavailable" });
    return;
  }

  if (reportState.status !== "ready") {
    res.status(200).json({
      ok: true,
      state: reportState.status === "failed" ? "report_failed" : "report_generating",
    });
    return;
  }

  res.status(200).json({
    ok: true,
    state: "ready",
    data: {
      language: reportState.report.language,
      score: reportState.report.score,
      lead: reportState.report.lead,
      reportJson: reportState.report.reportJson,
    },
  });
}
