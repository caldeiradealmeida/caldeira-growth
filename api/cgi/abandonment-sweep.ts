import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getAbandonmentCandidates,
  getAssessmentByPublicId,
  getLeadById,
  markAbandonmentEmailSent,
} from "../_cgi-supabase.js";
import { issueReportAccessToken, buildReportAccessUrl } from "../_cgi-report-token.js";
import { buildCgiAbandonmentEmail } from "../_cgi-email-content.js";
import { dispatchCgiParticipantEmail } from "../_cgi-email-dispatch.js";

// Vercel Cron target (see vercel.json). Not part of any user-facing flow --
// finds in_progress assessments idle past CGI_ABANDONMENT_DELAY_HOURS,
// each with real persisted answers and a real lead, and sends at most one
// recovery email per assessment, ever (abandonment_email_sent_at). The
// recovery link is the exact same report-access token mechanism as
// Etapas 1/3: opening it while still in_progress resumes the CGI; opening
// it after the person completed on their own resolves to the ready report
// instead -- nothing here needs to know which case it is.
//
// Every candidate's status is re-read immediately before sending (not
// reused from the sweep query, which is intentionally allowed to be
// stale) -- this is what stops a person who completes seconds after being
// selected as a candidate from ever receiving an abandonment email.

const CGI_ABANDONMENT_BATCH_LIMIT = 25;

function getCgiAbandonmentDelayHours(): number {
  return Number(process.env.CGI_ABANDONMENT_DELAY_HOURS) || 24;
}

function isCgiAbandonmentEmailEnabled(): boolean {
  return process.env.CGI_ABANDONMENT_EMAIL_ENABLED === "true";
}

function isCgiEmailDryRun(): boolean {
  return process.env.CGI_EMAIL_DRY_RUN === "true";
}

function getCgiEmailRelayToken(): string {
  return process.env.CGI_EMAIL_RELAY_TOKEN?.trim() || "";
}

function getAppsScriptUrl(): string {
  return process.env.CONTACT_FORM_URL?.trim() || process.env.VITE_CONTACT_FORM_URL?.trim() || "";
}

function isAuthorized(req: VercelRequest): boolean {
  const expected = process.env.CGI_CRON_SECRET?.trim();
  if (!expected) return false; // fail closed: unset secret means nobody is authorized, not everybody.
  const header = String(req.headers.authorization || "");
  return header === `Bearer ${expected}`;
}

type SweepOutcome =
  | "sent"
  | "dry_run"
  | "skipped_not_eligible_anymore"
  | "skipped_no_lead"
  | "skipped_recipient"
  | "error_token"
  | "error_dispatch";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store, private");

  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  const dryRun = isCgiEmailDryRun();
  const enabled = isCgiAbandonmentEmailEnabled();
  const appsScriptUrl = getAppsScriptUrl();
  const relayToken = getCgiEmailRelayToken();
  const cutoffIso = new Date(Date.now() - getCgiAbandonmentDelayHours() * 60 * 60 * 1000).toISOString();

  let candidates: Awaited<ReturnType<typeof getAbandonmentCandidates>> = [];
  try {
    candidates = await getAbandonmentCandidates({ cutoffIso, limit: CGI_ABANDONMENT_BATCH_LIMIT });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "candidate_query_failed",
      detail: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const results: Array<{ publicAssessmentId: string; outcome: SweepOutcome; detail?: string }> = [];

  for (const candidate of candidates) {
    try {
      // Stale-read guard: re-fetch this one assessment fresh, right before
      // acting on it, instead of trusting the batch query above.
      const fresh = await getAssessmentByPublicId(candidate.public_assessment_id);
      const stillEligible =
        fresh?.status === "in_progress" &&
        (fresh.current_question ?? 0) > 0 &&
        !fresh.abandonment_email_sent_at &&
        !fresh.report_email_sent_at;
      if (!stillEligible) {
        results.push({ publicAssessmentId: candidate.public_assessment_id, outcome: "skipped_not_eligible_anymore" });
        continue;
      }

      const lead = await getLeadById(candidate.lead_id);
      if (!lead) {
        results.push({ publicAssessmentId: candidate.public_assessment_id, outcome: "skipped_no_lead" });
        continue;
      }
      const recipient = String(lead.email || "").trim();
      if (!recipient) {
        results.push({ publicAssessmentId: candidate.public_assessment_id, outcome: "skipped_recipient" });
        continue;
      }

      if (!enabled && !dryRun) {
        // Flag off, not testing -- do nothing further for this candidate.
        // (Kept after eligibility/lead checks so dry-run output still
        // reflects real candidates even while the feature is off.)
        results.push({ publicAssessmentId: candidate.public_assessment_id, outcome: "skipped_not_eligible_anymore", detail: "feature_disabled" });
        continue;
      }

      // Same consent guarantee as the report-ready email: cgi_leads only
      // ever exists for a lead that passed the mandatory consent_privacy
      // check in /api/cgi/lead. This is an operational reminder about a
      // diagnostic the person themselves started, not a marketing send, so
      // consent_marketing is deliberately not required.
      const token = await issueReportAccessToken(candidate.public_assessment_id);
      if (!token) {
        results.push({ publicAssessmentId: candidate.public_assessment_id, outcome: "error_token" });
        continue;
      }

      const content = buildCgiAbandonmentEmail({
        name: String(lead.name || ""),
        reportAccessUrl: buildReportAccessUrl(token.token),
      });

      const dispatchResult = await dispatchCgiParticipantEmail({
        appsScriptUrl,
        relayToken,
        recipient,
        content,
        emailKind: "abandonment",
        dryRun,
      });

      if (dispatchResult.status === "sent") {
        await markAbandonmentEmailSent(candidate.public_assessment_id);
        results.push({ publicAssessmentId: candidate.public_assessment_id, outcome: "sent" });
      } else if (dispatchResult.status === "dry_run") {
        results.push({ publicAssessmentId: candidate.public_assessment_id, outcome: "dry_run" });
      } else {
        results.push({
          publicAssessmentId: candidate.public_assessment_id,
          outcome: "error_dispatch",
          detail: dispatchResult.status === "error" ? dispatchResult.error : dispatchResult.reason,
        });
      }
    } catch (error) {
      // One candidate's failure must never abort the rest of the batch.
      console.error("[CGI Abandonment Sweep]", {
        public_assessment_id: candidate.public_assessment_id,
        error: error instanceof Error ? error.message : String(error),
      });
      results.push({
        publicAssessmentId: candidate.public_assessment_id,
        outcome: "error_dispatch",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  res.status(200).json({
    ok: true,
    dryRun,
    enabled,
    cutoffIso,
    candidateCount: candidates.length,
    results,
  });
}
