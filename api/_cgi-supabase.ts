import { randomBytes, randomUUID } from "node:crypto";
import type { CgiAttribution, CgiEventName, NormalizedCgiLead } from "./_cgi-validation.js";

type SupabaseResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

type AssessmentRow = {
  id: string;
  lead_id?: string | null;
  public_assessment_id: string;
  status?: string;
  last_activity_at?: string | null;
};

type LeadRow = {
  id: string;
};

type CgiReportRow = {
  public_assessment_id?: string | null;
  anonymous_session_id?: string | null;
  completion_event_id?: string | null;
  status?: string | null;
  report_status?: string | null;
  secondary_sync_status?: string | null;
  ai_status?: string | null;
  ai_generation_status?: string | null;
  ai_report?: string | null;
  ai_report_text?: string | null;
  report_json?: unknown;
  lead_json?: unknown;
  answers_json?: unknown;
  score_json?: unknown;
  website_enrichment_json?: unknown;
  request_context_json?: unknown;
  language?: string | null;
  error_code?: string | null;
  error_message?: string | null;
};

export type StoredCgiReport = {
  publicAssessmentId: string;
  completionEventId: string;
  reportStatus: "report_ready" | "report_ready_with_warnings";
  secondarySyncStatus: "secondary_sync_pending" | "secondary_sync_failed" | "secondary_sync_succeeded";
  aiStatus: "generated" | "not_configured" | "error";
  aiGenerationStatus: "generated" | "not_configured" | "error";
  aiReport: string;
  aiReportText: string;
  reportJson: unknown;
  lead: unknown;
  answers: unknown;
  score: unknown;
  websiteEnrichment: unknown;
  requestContext: unknown;
  language: "pt" | "en" | "es";
};

export type CgiReportState =
  | { status: "ready"; report: StoredCgiReport }
  | {
      status: "generating" | "failed";
      publicAssessmentId: string;
      completionEventId: string;
      errorCode?: string;
      errorMessage?: string;
    };

export type CgiReportLockResult =
  | { status: "acquired" }
  | { status: "existing_ready"; report: StoredCgiReport }
  | { status: "in_progress" }
  | { status: "failed"; errorCode?: string }
  | { status: "unavailable"; error?: string };

export type EventInsertInput = {
  eventId?: string;
  anonymousSessionId: string;
  publicAssessmentId?: string | null;
  eventName: CgiEventName;
  source: "client" | "server";
  pagePath?: string | null;
  metadata?: Record<string, unknown>;
};

const PUBLIC_ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const START_REUSABLE_STATUSES = new Set(["created", "lead_captured", "in_progress"]);
const START_REUSE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export function createPublicAssessmentId(length = 16): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((byte) => PUBLIC_ID_ALPHABET[byte % PUBLIC_ID_ALPHABET.length])
    .join("");
}

export function createEventId(): string {
  return randomUUID();
}

export function logSupabaseFailure(
  operation: string,
  detail: { status?: number; error?: unknown; publicAssessmentId?: string | null; eventName?: string } = {}
) {
  console.error("[CGI Supabase]", {
    operation,
    status: detail.status,
    error: detail.error instanceof Error ? detail.error.message : String(detail.error || ""),
    public_assessment_id: detail.publicAssessmentId || undefined,
    event_name: detail.eventName || undefined,
  });
}

async function supabaseRequest<T = unknown>(
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<SupabaseResult<T>> {
  const config = getSupabaseConfig();
  if (!config) {
    return { ok: false, status: 0, data: null, error: "not_configured" };
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", config.serviceRoleKey);
  headers.set("Authorization", `Bearer ${config.serviceRoleKey}`);
  headers.set("Content-Type", "application/json");
  if (init.prefer) headers.set("Prefer", init.prefer);

  try {
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...init,
      headers,
    });
    const text = await response.text();
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = null;
      }
    }
    return {
      ok: response.ok,
      status: response.status,
      data,
      ...(response.ok ? {} : { error: text || response.statusText }),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function eqFilter(value: string) {
  return `eq.${encodeURIComponent(value)}`;
}

function gteFilter(value: string) {
  return `gte.${encodeURIComponent(value)}`;
}

const CGI_REPORT_SELECT = [
  "public_assessment_id",
  "anonymous_session_id",
  "completion_event_id",
  "status",
  "report_status",
  "secondary_sync_status",
  "ai_status",
  "ai_generation_status",
  "ai_report",
  "ai_report_text",
  "report_json",
  "lead_json",
  "answers_json",
  "score_json",
  "website_enrichment_json",
  "request_context_json",
  "language",
  "error_code",
  "error_message",
].join(",");

function reportStatusFromRow(row: CgiReportRow): "report_generating" | "report_ready" | "report_ready_with_warnings" | "report_failed" {
  if (
    row.report_status === "report_generating" ||
    row.report_status === "report_ready" ||
    row.report_status === "report_ready_with_warnings" ||
    row.report_status === "report_failed"
  ) {
    return row.report_status;
  }
  if (row.status === "ready") return "report_ready";
  if (row.status === "failed") return "report_failed";
  return "report_generating";
}

function parseReportJson(value: string): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function mapStoredCgiReport(row: CgiReportRow | null | undefined): StoredCgiReport | null {
  const reportStatus = row ? reportStatusFromRow(row) : "report_generating";
  if (
    !row?.public_assessment_id ||
    (reportStatus !== "report_ready" && reportStatus !== "report_ready_with_warnings")
  ) {
    return null;
  }
  const secondarySyncStatus = String(row.secondary_sync_status || "secondary_sync_pending");
  const aiStatus = String(row.ai_status || "not_configured");
  const aiGenerationStatus = String(row.ai_generation_status || aiStatus);
  const aiReport = String(row.ai_report || "").trim();
  if (aiStatus !== "generated" || aiGenerationStatus !== "generated" || !aiReport) return null;
  return {
    publicAssessmentId: row.public_assessment_id,
    completionEventId: String(row.completion_event_id || ""),
    reportStatus,
    secondarySyncStatus:
      secondarySyncStatus === "secondary_sync_failed" ||
      secondarySyncStatus === "secondary_sync_succeeded"
        ? secondarySyncStatus
        : "secondary_sync_pending",
    aiStatus:
      aiStatus === "generated" || aiStatus === "error" ? aiStatus : "not_configured",
    aiGenerationStatus:
      aiGenerationStatus === "generated" || aiGenerationStatus === "error"
        ? aiGenerationStatus
        : "not_configured",
    aiReport,
    aiReportText: String(row.ai_report_text || ""),
    reportJson: row.report_json ?? null,
    lead: row.lead_json ?? null,
    answers: row.answers_json ?? null,
    score: row.score_json ?? null,
    websiteEnrichment: row.website_enrichment_json ?? null,
    requestContext: row.request_context_json ?? null,
    language: row.language === "en" || row.language === "es" ? row.language : "pt",
  };
}

function mapCgiReportState(row: CgiReportRow | null | undefined): CgiReportState | null {
  if (!row?.public_assessment_id) return null;
  const ready = mapStoredCgiReport(row);
  if (ready) return { status: "ready", report: ready };
  const reportStatus = reportStatusFromRow(row);
  if (reportStatus === "report_ready" || reportStatus === "report_ready_with_warnings") {
    return {
      status: "failed",
      publicAssessmentId: row.public_assessment_id,
      completionEventId: String(row.completion_event_id || ""),
      errorCode: row.error_code || "invalid_ready_report",
      errorMessage: row.error_message || "Ready report is missing generated AI content.",
    };
  }
  return {
    status: reportStatus === "report_failed" ? "failed" : "generating",
    publicAssessmentId: row.public_assessment_id,
    completionEventId: String(row.completion_event_id || ""),
    errorCode: row.error_code || undefined,
    errorMessage: row.error_message || undefined,
  };
}

async function getCgiReportStateByFilter(filter: string): Promise<CgiReportState | null> {
  const result = await supabaseRequest<CgiReportRow[]>(
    `cgi_reports?${filter}&select=${CGI_REPORT_SELECT}&limit=1`,
    { method: "GET" }
  );
  if (!result.ok) {
    if (result.status !== 0) {
      logSupabaseFailure("get_cgi_report_state", {
        status: result.status,
        error: result.error,
      });
    }
    return null;
  }
  return mapCgiReportState(Array.isArray(result.data) ? result.data[0] : null);
}

async function getReadyCgiReportByFilter(filter: string): Promise<StoredCgiReport | null> {
  const result = await supabaseRequest<CgiReportRow[]>(
    `cgi_reports?${filter}&report_status=in.(report_ready,report_ready_with_warnings)&select=${CGI_REPORT_SELECT}&limit=1`,
    { method: "GET" }
  );
  if (!result.ok) {
    if (result.status !== 0) {
      logSupabaseFailure("get_ready_cgi_report", {
        status: result.status,
        error: result.error,
      });
    }
    return null;
  }
  return mapStoredCgiReport(Array.isArray(result.data) ? result.data[0] : null);
}

export async function getCgiReportState(input: {
  publicAssessmentId?: string | null;
  completionEventId?: string | null;
}): Promise<CgiReportState | null> {
  const completionEventId = String(input.completionEventId || "").trim();
  if (completionEventId) {
    const byEvent = await getCgiReportStateByFilter(
      `completion_event_id=${eqFilter(completionEventId)}`
    );
    if (byEvent) return byEvent;
  }

  const publicAssessmentId = String(input.publicAssessmentId || "").trim();
  if (!publicAssessmentId) return null;
  return getCgiReportStateByFilter(`public_assessment_id=${eqFilter(publicAssessmentId)}`);
}

export async function getReadyCgiReport(input: {
  publicAssessmentId?: string | null;
  completionEventId?: string | null;
}): Promise<StoredCgiReport | null> {
  const completionEventId = String(input.completionEventId || "").trim();
  if (completionEventId) {
    const byEvent = await getReadyCgiReportByFilter(
      `completion_event_id=${eqFilter(completionEventId)}`
    );
    if (byEvent) return byEvent;
  }

  const publicAssessmentId = String(input.publicAssessmentId || "").trim();
  if (!publicAssessmentId) return null;
  return getReadyCgiReportByFilter(`public_assessment_id=${eqFilter(publicAssessmentId)}`);
}

export async function tryCreateCgiReportGenerationLock(input: {
  publicAssessmentId: string;
  anonymousSessionId?: string | null;
  completionEventId: string;
  language: "pt" | "en" | "es";
}): Promise<CgiReportLockResult> {
  if (!input.publicAssessmentId) return { status: "unavailable", error: "missing_public_assessment_id" };
  const now = new Date().toISOString();
  const result = await supabaseRequest<CgiReportRow[]>(
    `cgi_reports?on_conflict=public_assessment_id&select=${CGI_REPORT_SELECT}`,
    {
      method: "POST",
      body: JSON.stringify({
        public_assessment_id: input.publicAssessmentId,
        anonymous_session_id: input.anonymousSessionId || null,
        completion_event_id: input.completionEventId || null,
        status: "generating",
        report_status: "report_generating",
        secondary_sync_status: "secondary_sync_pending",
        language: input.language,
        generation_started_at: now,
        created_at: now,
        updated_at: now,
      }),
      prefer: "resolution=ignore-duplicates,return=representation",
    }
  );

  if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
    return { status: "acquired" };
  }

  const existing = await getCgiReportState({
    publicAssessmentId: input.publicAssessmentId,
    completionEventId: input.completionEventId,
  });
  if (existing?.status === "ready") return { status: "existing_ready", report: existing.report };
  if (existing?.status === "generating") return { status: "in_progress" };
  if (existing?.status === "failed") {
    return { status: "failed", errorCode: existing.errorCode };
  }

  if (!result.ok && result.status !== 409) {
    logSupabaseFailure("create_cgi_report_generation_lock", {
      status: result.status,
      error: result.error,
      publicAssessmentId: input.publicAssessmentId,
    });
    return { status: "unavailable", error: result.error };
  }

  return { status: "in_progress" };
}

export async function saveCompletedCgiReport(input: {
  publicAssessmentId: string;
  anonymousSessionId?: string | null;
  completionEventId: string;
  language: "pt" | "en" | "es";
  aiStatus: "generated" | "not_configured" | "error";
  aiReport: string;
  aiReportText: string;
  model?: string | null;
  lead?: unknown;
  answers?: unknown;
  score: unknown;
  websiteEnrichment: unknown;
  requestContext: unknown;
}): Promise<boolean> {
  if (!input.publicAssessmentId) return false;
  const result = await supabaseRequest(
    "cgi_reports?on_conflict=public_assessment_id",
    {
      method: "POST",
      body: JSON.stringify({
        public_assessment_id: input.publicAssessmentId,
        anonymous_session_id: input.anonymousSessionId || null,
        completion_event_id: input.completionEventId || null,
        status: "ready",
        report_status: "report_ready",
        secondary_sync_status: "secondary_sync_pending",
        ai_status: input.aiStatus,
        ai_generation_status: input.aiStatus,
        ai_report: input.aiReport,
        ai_report_text: input.aiReportText,
        report_json: parseReportJson(input.aiReport),
        lead_json: input.lead ?? null,
        answers_json: input.answers ?? null,
        model: input.model || null,
        score_json: input.score,
        website_enrichment_json: input.websiteEnrichment,
        request_context_json: input.requestContext,
        language: input.language,
        generation_completed_at: new Date().toISOString(),
        error_code: null,
        error_message: null,
        updated_at: new Date().toISOString(),
      }),
      prefer: "resolution=merge-duplicates,return=minimal",
    }
  );
  if (!result.ok) {
    logSupabaseFailure("save_completed_cgi_report", {
      status: result.status,
      error: result.error,
      publicAssessmentId: input.publicAssessmentId,
    });
  }
  return result.ok;
}

export async function markCgiReportFailed(input: {
  publicAssessmentId: string;
  errorCode: string;
  errorMessage?: string;
}): Promise<boolean> {
  if (!input.publicAssessmentId) return false;
  const result = await supabaseRequest(
    `cgi_reports?public_assessment_id=${eqFilter(input.publicAssessmentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "failed",
        report_status: "report_failed",
        error_code: input.errorCode,
        error_message: input.errorMessage || null,
        updated_at: new Date().toISOString(),
      }),
      prefer: "return=minimal",
    }
  );
  if (!result.ok) {
    logSupabaseFailure("mark_cgi_report_failed", {
      status: result.status,
      error: result.error,
      publicAssessmentId: input.publicAssessmentId,
    });
  }
  return result.ok;
}

export async function updateCgiReportSecondarySyncStatus(input: {
  publicAssessmentId: string;
  secondarySyncStatus: "secondary_sync_failed" | "secondary_sync_succeeded";
}): Promise<boolean> {
  if (!input.publicAssessmentId) return false;
  const result = await supabaseRequest(
    `cgi_reports?public_assessment_id=${eqFilter(input.publicAssessmentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        secondary_sync_status: input.secondarySyncStatus,
        secondary_sync_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      prefer: "return=minimal",
    }
  );
  if (!result.ok) {
    logSupabaseFailure("update_cgi_report_secondary_sync_status", {
      status: result.status,
      error: result.error,
      publicAssessmentId: input.publicAssessmentId,
    });
  }
  return result.ok;
}

export function isReusableStartAssessment(row: AssessmentRow | null, now = new Date()): boolean {
  if (!row?.public_assessment_id || !row.status || !START_REUSABLE_STATUSES.has(row.status)) {
    return false;
  }
  if (!row.last_activity_at) return true;
  const lastActivityAt = Date.parse(row.last_activity_at);
  return Number.isFinite(lastActivityAt) && now.getTime() - lastActivityAt <= START_REUSE_WINDOW_MS;
}

export async function getActiveAssessmentByAnonymousSession(
  anonymousSessionId: string,
  now = new Date()
): Promise<AssessmentRow | null> {
  const cutoff = new Date(now.getTime() - START_REUSE_WINDOW_MS).toISOString();
  const query = [
    `anonymous_session_id=${eqFilter(anonymousSessionId)}`,
    `status=in.(${Array.from(START_REUSABLE_STATUSES).join(",")})`,
    `last_activity_at=${gteFilter(cutoff)}`,
    "select=id,lead_id,public_assessment_id,status,last_activity_at",
    "order=last_activity_at.desc",
    "limit=1",
  ].join("&");
  const result = await supabaseRequest<AssessmentRow[]>(
    `cgi_assessments?${query}`,
    { method: "GET" }
  );

  if (!result.ok) {
    if (result.status !== 0) {
      logSupabaseFailure("get_active_assessment_by_anonymous_session", {
        status: result.status,
        error: result.error,
      });
    }
    return null;
  }

  const row = Array.isArray(result.data) ? result.data[0] ?? null : null;
  return isReusableStartAssessment(row, now) ? row : null;
}

export async function upsertAssessment(input: {
  publicAssessmentId: string;
  anonymousSessionId: string;
  status: "created" | "lead_captured" | "started" | "in_progress" | "completed" | "abandoned";
  currentQuestion?: number | null;
  progressPercent?: number;
  leadId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  completionTimeSeconds?: number | null;
  cgiScore?: number | null;
  strategyScore?: number | null;
  marketCustomerScore?: number | null;
  growthEngineScore?: number | null;
  executionManagementScore?: number | null;
  leadershipCultureScore?: number | null;
  cgiLevel?: string | null;
  lowestDimension?: string | null;
  highestDimension?: string | null;
  methodologyVersion?: string;
  scoringVersion?: string;
}): Promise<AssessmentRow | null> {
  const now = new Date().toISOString();
  const body: Record<string, unknown> = {
    public_assessment_id: input.publicAssessmentId,
    anonymous_session_id: input.anonymousSessionId,
    status: input.status,
    last_activity_at: now,
    progress_percent: input.progressPercent ?? 0,
  };
  if (input.currentQuestion !== undefined) body.current_question = input.currentQuestion;
  if (input.leadId !== undefined) body.lead_id = input.leadId;
  if (input.startedAt !== undefined) body.started_at = input.startedAt;
  if (input.completedAt !== undefined) body.completed_at = input.completedAt;
  if (input.completionTimeSeconds !== undefined) body.completion_time_seconds = input.completionTimeSeconds;
  if (input.cgiScore !== undefined) body.cgi_score = input.cgiScore;
  if (input.strategyScore !== undefined) body.strategy_score = input.strategyScore;
  if (input.marketCustomerScore !== undefined) body.market_customer_score = input.marketCustomerScore;
  if (input.growthEngineScore !== undefined) body.growth_engine_score = input.growthEngineScore;
  if (input.executionManagementScore !== undefined) body.execution_management_score = input.executionManagementScore;
  if (input.leadershipCultureScore !== undefined) body.leadership_culture_score = input.leadershipCultureScore;
  if (input.cgiLevel !== undefined) body.cgi_level = input.cgiLevel;
  if (input.lowestDimension !== undefined) body.lowest_dimension = input.lowestDimension;
  if (input.highestDimension !== undefined) body.highest_dimension = input.highestDimension;
  if (input.methodologyVersion) body.methodology_version = input.methodologyVersion;
  if (input.scoringVersion) body.scoring_version = input.scoringVersion;

  const result = await supabaseRequest<AssessmentRow[]>(
    "cgi_assessments?on_conflict=public_assessment_id&select=id,lead_id,public_assessment_id,status",
    {
      method: "POST",
      body: JSON.stringify(body),
      prefer: "resolution=merge-duplicates,return=representation",
    }
  );
  if (!result.ok) {
    logSupabaseFailure("upsert_assessment", {
      status: result.status,
      error: result.error,
      publicAssessmentId: input.publicAssessmentId,
    });
    return null;
  }
  return Array.isArray(result.data) ? result.data[0] ?? null : null;
}

export async function getAssessmentByPublicId(publicAssessmentId: string): Promise<AssessmentRow | null> {
  const result = await supabaseRequest<AssessmentRow[]>(
    `cgi_assessments?public_assessment_id=${eqFilter(publicAssessmentId)}&select=id,lead_id,public_assessment_id,status`,
    { method: "GET" }
  );
  if (!result.ok) return null;
  return Array.isArray(result.data) ? result.data[0] ?? null : null;
}

export async function upsertAttribution(
  assessmentId: string,
  attribution: CgiAttribution
) {
  const now = new Date().toISOString();
  const firstBody = {
    assessment_id: assessmentId,
    first_utm_source: attribution.utm_source,
    first_utm_medium: attribution.utm_medium,
    first_utm_campaign: attribution.utm_campaign,
    first_utm_content: attribution.utm_content,
    first_utm_term: attribution.utm_term,
    first_referrer: attribution.referrer,
    first_landing_page: attribution.landing_page,
    first_touch_at: now,
    last_utm_source: attribution.utm_source,
    last_utm_medium: attribution.utm_medium,
    last_utm_campaign: attribution.utm_campaign,
    last_utm_content: attribution.utm_content,
    last_utm_term: attribution.utm_term,
    last_referrer: attribution.referrer,
    last_landing_page: attribution.landing_page,
    last_touch_at: now,
    gclid: attribution.gclid,
    fbclid: attribution.fbclid,
    li_fat_id: attribution.li_fat_id,
  };

  await supabaseRequest("cgi_attribution?on_conflict=assessment_id", {
    method: "POST",
    body: JSON.stringify(firstBody),
    prefer: "resolution=ignore-duplicates,return=minimal",
  });

  const lastBody = {
    last_utm_source: attribution.utm_source,
    last_utm_medium: attribution.utm_medium,
    last_utm_campaign: attribution.utm_campaign,
    last_utm_content: attribution.utm_content,
    last_utm_term: attribution.utm_term,
    last_referrer: attribution.referrer,
    last_landing_page: attribution.landing_page,
    last_touch_at: now,
    gclid: attribution.gclid,
    fbclid: attribution.fbclid,
    li_fat_id: attribution.li_fat_id,
  };

  const result = await supabaseRequest(`cgi_attribution?assessment_id=${eqFilter(assessmentId)}`, {
    method: "PATCH",
    body: JSON.stringify(lastBody),
    prefer: "return=minimal",
  });
  if (!result.ok) {
    logSupabaseFailure("upsert_attribution", { status: result.status, error: result.error });
  }
}

export async function persistLeadForAssessment(input: {
  publicAssessmentId: string;
  anonymousSessionId: string;
  lead: NormalizedCgiLead;
  consentPrivacy: boolean;
  consentMarketing: boolean | null;
  privacyPolicyVersion: string;
}): Promise<{ leadId: string | null; assessmentId: string | null }> {
  const assessment =
    (await getAssessmentByPublicId(input.publicAssessmentId)) ||
    (await upsertAssessment({
      publicAssessmentId: input.publicAssessmentId,
      anonymousSessionId: input.anonymousSessionId,
      status: "lead_captured",
      progressPercent: 0,
    }));
  if (!assessment) return { leadId: null, assessmentId: null };

  const leadBody = {
    email_normalized: input.lead.email.toLowerCase(),
    name: input.lead.name,
    email: input.lead.email,
    phone: input.lead.phone,
    company: input.lead.company,
    company_website: input.lead.company_website,
    role: input.lead.role,
    sector: input.lead.sector,
    commercial_relationship_model: input.lead.commercial_relationship_model,
    employee_count: input.lead.employee_count,
    annual_revenue_range: input.lead.annual_revenue_range,
    current_challenge: input.lead.current_challenge,
    growth_goal: input.lead.growth_goal,
    investment_intent: input.lead.investment_intent,
    comments: input.lead.comments,
    consent_privacy: input.consentPrivacy,
    consent_marketing: input.consentMarketing,
    privacy_policy_version: input.privacyPolicyVersion,
    consent_timestamp: new Date().toISOString(),
  };

  let leadId = assessment.lead_id || null;
  if (leadId) {
    const updated = await supabaseRequest<LeadRow[]>(
      `cgi_leads?id=${eqFilter(leadId)}&select=id`,
      {
        method: "PATCH",
        body: JSON.stringify(leadBody),
        prefer: "return=representation",
      }
    );
    if (!updated.ok) {
      logSupabaseFailure("update_lead", {
        status: updated.status,
        error: updated.error,
        publicAssessmentId: input.publicAssessmentId,
      });
    }
  } else {
    const inserted = await supabaseRequest<LeadRow[]>("cgi_leads?select=id", {
      method: "POST",
      body: JSON.stringify(leadBody),
      prefer: "return=representation",
    });
    if (inserted.ok && Array.isArray(inserted.data) && inserted.data[0]?.id) {
      leadId = inserted.data[0].id;
    } else {
      logSupabaseFailure("insert_lead", {
        status: inserted.status,
        error: inserted.error,
        publicAssessmentId: input.publicAssessmentId,
      });
    }
  }

  if (leadId) {
    await upsertAssessment({
      publicAssessmentId: input.publicAssessmentId,
      anonymousSessionId: input.anonymousSessionId,
      status: "lead_captured",
      leadId,
      progressPercent: 0,
    });
  }

  return { leadId, assessmentId: assessment.id };
}

export async function upsertAnswers(assessmentId: string, answers: Record<string, number>) {
  const rows = Object.entries(answers).map(([questionId, answerValue]) => ({
    assessment_id: assessmentId,
    question_id: questionId,
    dimension_id:
      Number(questionId.slice(1)) <= 8
        ? "strategy"
        : Number(questionId.slice(1)) <= 16
          ? "market"
          : Number(questionId.slice(1)) <= 24
            ? "growthMachine"
            : Number(questionId.slice(1)) <= 32
              ? "execution"
              : "leadership",
    answer_value: answerValue,
    question_version: "1.0.0",
    answered_at: new Date().toISOString(),
  }));
  const result = await supabaseRequest("cgi_answers?on_conflict=assessment_id,question_id", {
    method: "POST",
    body: JSON.stringify(rows),
    prefer: "resolution=merge-duplicates,return=minimal",
  });
  if (!result.ok) {
    logSupabaseFailure("upsert_answers", { status: result.status, error: result.error });
  }
}

export async function insertFunnelEvent(input: EventInsertInput): Promise<string> {
  const eventId = input.eventId || createEventId();
  let assessmentId: string | null = null;
  let leadId: string | null = null;

  if (input.publicAssessmentId) {
    const assessment = await getAssessmentByPublicId(input.publicAssessmentId);
    assessmentId = assessment?.id || null;
    leadId = assessment?.lead_id || null;
  }

  const result = await supabaseRequest("cgi_funnel_events", {
    method: "POST",
    body: JSON.stringify({
      event_id: eventId,
      assessment_id: assessmentId,
      lead_id: leadId,
      anonymous_session_id: input.anonymousSessionId,
      event_name: input.eventName,
      source: input.source,
      page_path: input.pagePath || null,
      metadata: input.metadata || {},
    }),
    prefer: "return=minimal",
  });

  if (!result.ok && result.status !== 409) {
    logSupabaseFailure("insert_funnel_event", {
      status: result.status,
      error: result.error,
      publicAssessmentId: input.publicAssessmentId,
      eventName: input.eventName,
    });
  }
  return eventId;
}
