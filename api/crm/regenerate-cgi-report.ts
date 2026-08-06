import type { VercelRequest, VercelResponse } from "@vercel/node";
import { areCgiAnswersComplete, calculateCgiScore } from "../cgi-core.js";
import {
  enrichCompanyWebsite,
  generateAiDiagnostic,
  getConfiguredOpenAiModel,
  type CgiLead as PromptCgiLead,
} from "../cgi-assessment.js";
import {
  getAnswersByAssessmentId,
  getAssessmentById,
  getLeadById,
  getMaxCgiReportVersion,
  insertRegeneratedCgiReport,
  type CgiLeadRow,
  type InsertRegeneratedCgiReportResult,
} from "../_cgi-supabase.js";

// Admin-only. Never trusts assessment/lead/answers/score content from the
// request body -- the client sends only assessment_id, everything else is
// re-fetched from Supabase with the service role key. Never calls the Apps
// Script webhook, never sends any email, never touches version 1 (the
// original best-effort report). See supabase/migrations/20260806120000_cgi_reports_versioning.sql.

async function verifyCrmAdmin(req: VercelRequest): Promise<{ email: string } | null> {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return null;

  let userRes: Response;
  try {
    userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }
  if (!userRes.ok) return null;
  const user = (await userRes.json().catch(() => null)) as { email?: string } | null;
  const email = String(user?.email || "").toLowerCase().trim();
  if (!email) return null;

  let adminRes: Response;
  try {
    adminRes = await fetch(
      `${supabaseUrl}/rest/v1/crm_admins?email=eq.${encodeURIComponent(email)}&select=email&limit=1`,
      { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
    );
  } catch {
    return null;
  }
  if (!adminRes.ok) return null;
  const rows = (await adminRes.json().catch(() => null)) as { email: string }[] | null;
  if (!Array.isArray(rows) || rows.length === 0) return null;

  return { email };
}

function mapDbLeadToPromptLead(row: CgiLeadRow): PromptCgiLead {
  return {
    name: row.name,
    email: row.email,
    phone: row.phone || undefined,
    company: row.company,
    companyWebsite: row.company_website || undefined,
    role: row.role,
    sector: row.sector || undefined,
    commercialRelationshipModel: row.commercial_relationship_model || undefined,
    employeeCount: row.employee_count || undefined,
    annualRevenue: row.annual_revenue_range || undefined,
    currentChallenge: row.current_challenge || undefined,
    growthGoal: row.growth_goal || undefined,
    investmentIntent: row.investment_intent || undefined,
    comments: row.comments || undefined,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const admin = await verifyCrmAdmin(req);
  if (!admin) {
    res.status(403).json({ ok: false, error: "forbidden" });
    return;
  }

  const body = (req.body || {}) as { assessment_id?: unknown };
  const assessmentId = String(body.assessment_id || "").trim();
  if (!assessmentId) {
    res.status(400).json({ ok: false, error: "missing_assessment_id" });
    return;
  }

  const assessment = await getAssessmentById(assessmentId);
  if (!assessment) {
    res.status(404).json({ ok: false, error: "assessment_not_found" });
    return;
  }
  if (assessment.status !== "completed" || assessment.cgi_score === null) {
    res.status(422).json({ ok: false, error: "assessment_not_completed" });
    return;
  }
  if (!assessment.lead_id) {
    res.status(422).json({ ok: false, error: "assessment_missing_lead" });
    return;
  }

  const [leadRow, answers] = await Promise.all([
    getLeadById(assessment.lead_id),
    getAnswersByAssessmentId(assessmentId),
  ]);
  if (!leadRow) {
    res.status(422).json({ ok: false, error: "lead_not_found" });
    return;
  }
  if (!areCgiAnswersComplete(answers)) {
    res.status(422).json({ ok: false, error: "incomplete_answers" });
    return;
  }

  // Original score, recomputed from the immutable original answers -- never
  // from a different set of answers, and never reusing the previous report's
  // content. calculateCgiScore is a pure function of `answers`; if its output
  // ever drifts from what was actually persisted at completion time, that
  // means the scoring methodology changed since -- refuse rather than
  // silently applying a new methodology to an old assessment.
  const score = calculateCgiScore(answers);
  if (Math.abs(score.finalScore - Number(assessment.cgi_score)) > 0.5) {
    res.status(409).json({ ok: false, error: "score_mismatch" });
    return;
  }

  const language: "pt" | "en" | "es" = "pt";
  const lead = mapDbLeadToPromptLead(leadRow);
  const websiteEnrichment = await enrichCompanyWebsite(lead.companyWebsite);
  const requestContext = {
    ip: "",
    country: "",
    region: "",
    city: "",
    latitude: "",
    longitude: "",
    timezone: "",
  };

  const ai = await generateAiDiagnostic({
    lead,
    answers,
    score,
    websiteEnrichment,
    requestContext,
    language,
    requestStartedAt: Date.now(),
  });

  if (ai.status !== "generated" || !ai.text.trim()) {
    res.status(503).json({ ok: false, error: "ai_generation_failed", ai_status: ai.status });
    return;
  }

  const nextVersion = (await getMaxCgiReportVersion(assessment.public_assessment_id)) + 1;
  const model = getConfiguredOpenAiModel();

  const saved: InsertRegeneratedCgiReportResult = await insertRegeneratedCgiReport({
    publicAssessmentId: assessment.public_assessment_id,
    version: nextVersion,
    aiReport: ai.text,
    aiReportText: ai.plainText,
    model,
    lead,
    answers,
    score,
    websiteEnrichment,
    requestContext,
    language,
  });

  if (!saved.ok) {
    // "conflict" means the DB still has the legacy single-row-per-assessment
    // constraint (versioning migration Phase 3 not applied yet) and this
    // assessment already has a report -- nothing was overwritten, the
    // attempted INSERT was simply rejected by Postgres.
    if (saved.reason === "conflict") {
      res.status(409).json({ ok: false, error: "versioning_not_enabled" });
      return;
    }
    res.status(503).json({ ok: false, error: "report_persistence_failed" });
    return;
  }

  res.status(200).json({
    ok: true,
    report: {
      id: saved.report.id,
      version: saved.report.version,
      ai_report_text: saved.report.aiReportText,
      report_json: saved.report.reportJson,
      model: saved.report.model,
      language: saved.report.language,
      generation_completed_at: saved.report.generationCompletedAt,
    },
  });
}
