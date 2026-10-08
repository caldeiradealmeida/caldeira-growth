import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getReportEmailCandidates } from "../_cgi-supabase.js";
import {
  deliverReportEmailForAssessment,
  getReportEmailFreshnessHours,
  type ReportEmailReason,
  type ReportEmailResult,
} from "../_cgi-report-email.js";

// P0 -- out-of-band report-email delivery, protected by CRON_SECRET exactly
// like api/cgi/abandonment-sweep.ts. Two modes, and the difference between
// them is only *how candidates are chosen*; the send itself goes through the
// same executor with the same recheck and the same idempotency marker.
//
//   ?mode=recovery (default)
//     Assessments completed within CGI_REPORT_EMAIL_FRESHNESS_HOURS (72h) that
//     still have report_email_sent_at IS NULL. This is the safety net for the
//     inline path -- a report generated while the flag was off, or one whose
//     dispatch failed. The freshness window is the guard that makes an
//     accidental invocation harmless: it structurally cannot reach an old
//     report, so no bug or misfire here can produce a mass backfill.
//
//   ?mode=backfill&ids=a,b,c
//     Deliberate, human-authorized recovery of specific old assessments. There
//     is NO query behind this mode -- if `ids` is absent the handler does
//     nothing at all. A scan of the base is not merely discouraged here, it is
//     impossible: the candidate list can only ever be what the caller typed.
//     Every id still passes the full commercial guard inside the executor.

const REPORT_EMAIL_SWEEP_BATCH_LIMIT = 25;

function isCgiReportEmailEnabled(): boolean {
  return process.env.CGI_REPORT_EMAIL_ENABLED === "true";
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

// Same fail-closed CRON_SECRET check as the abandonment sweep: an unset secret
// authorizes nobody, never everybody.
function isAuthorized(req: VercelRequest): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const header = String(req.headers.authorization || "");
  return header === `Bearer ${expected}`;
}

function readParam(req: VercelRequest, key: string): string {
  const fromQuery = req.query?.[key];
  if (typeof fromQuery === "string") return fromQuery.trim();
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === "string") return fromQuery[0].trim();
  const body = req.body;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string") return value.trim();
  }
  return "";
}

function parseIds(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const id = part.trim();
    // Same shape as createPublicAssessmentId: opaque, non-sequential, no
    // internal UUIDs accepted here.
    if (id && /^[A-Za-z0-9_-]{8,64}$/.test(id)) seen.add(id);
    if (seen.size >= REPORT_EMAIL_SWEEP_BATCH_LIMIT) break;
  }
  return [...seen];
}

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

  const mode: ReportEmailReason = readParam(req, "mode") === "backfill" ? "backfill" : "recovery";
  const dryRun = isCgiEmailDryRun();
  const enabled = isCgiReportEmailEnabled();
  const freshnessHours = getReportEmailFreshnessHours();
  const appsScriptUrl = getAppsScriptUrl();
  const relayToken = getCgiEmailRelayToken();

  let publicAssessmentIds: string[] = [];
  if (mode === "backfill") {
    publicAssessmentIds = parseIds(readParam(req, "ids"));
    if (publicAssessmentIds.length === 0) {
      res.status(400).json({ ok: false, error: "ids_required", mode });
      return;
    }
  } else {
    const completedSinceIso = new Date(Date.now() - freshnessHours * 60 * 60 * 1000).toISOString();
    try {
      const candidates = await getReportEmailCandidates({
        completedSinceIso,
        limit: REPORT_EMAIL_SWEEP_BATCH_LIMIT,
      });
      publicAssessmentIds = candidates.map((row) => row.public_assessment_id).filter(Boolean);
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: "candidate_query_failed",
        detail: error instanceof Error ? error.message : String(error),
      });
      return;
    }
  }

  const results: ReportEmailResult[] = [];
  for (const publicAssessmentId of publicAssessmentIds) {
    if (!enabled && !dryRun) {
      results.push({ publicAssessmentId, outcome: "skipped_feature_disabled" });
      continue;
    }
    try {
      results.push(
        await deliverReportEmailForAssessment({
          publicAssessmentId,
          reason: mode,
          appsScriptUrl,
          relayToken,
          dryRun,
          freshnessHours,
        })
      );
    } catch (error) {
      // One assessment's failure must never abort the rest of the batch.
      console.error("[CGI Report Email Sweep]", {
        public_assessment_id: publicAssessmentId,
        error: error instanceof Error ? error.message : String(error),
      });
      results.push({
        publicAssessmentId,
        outcome: "error_dispatch",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  res.status(200).json({
    ok: true,
    mode,
    dryRun,
    enabled,
    freshnessHours,
    candidateCount: publicAssessmentIds.length,
    results,
  });
}
