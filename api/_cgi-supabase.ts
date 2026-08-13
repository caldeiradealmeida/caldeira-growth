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
  id?: string;
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
  model?: string | null;
  version?: number;
  generation_completed_at?: string | null;
  created_at?: string | null;
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
  detail: {
    status?: number;
    error?: unknown;
    publicAssessmentId?: string | null;
    eventName?: string;
    leadId?: string | null;
  } = {}
) {
  console.error("[CGI Supabase]", {
    operation,
    status: detail.status,
    error: detail.error instanceof Error ? detail.error.message : String(detail.error || ""),
    public_assessment_id: detail.publicAssessmentId || undefined,
    event_name: detail.eventName || undefined,
    lead_id: detail.leadId || undefined,
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
    `cgi_reports?${filter}&select=${CGI_REPORT_SELECT}&order=version.desc&limit=1`,
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
    `cgi_reports?${filter}&report_status=in.(report_ready,report_ready_with_warnings)&select=${CGI_REPORT_SELECT}&order=version.desc&limit=1`,
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
    `cgi_reports?on_conflict=public_assessment_id,version&select=${CGI_REPORT_SELECT}`,
    {
      method: "POST",
      body: JSON.stringify({
        public_assessment_id: input.publicAssessmentId,
        version: 1,
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
    "cgi_reports?on_conflict=public_assessment_id,version",
    {
      method: "POST",
      body: JSON.stringify({
        public_assessment_id: input.publicAssessmentId,
        version: 1,
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
    `cgi_reports?public_assessment_id=${eqFilter(input.publicAssessmentId)}&version=eq.1`,
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
    `cgi_reports?public_assessment_id=${eqFilter(input.publicAssessmentId)}&version=eq.1`,
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

// --- Manual report regeneration (CGI Pipe, admin-only) ---
// version=1 rows belong exclusively to the automatic completion flow above
// (tryCreateCgiReportGenerationLock / saveCompletedCgiReport, both pinned to
// version 1). Regeneration only ever appends version = max(version) + 1 via
// a plain INSERT -- it never updates or deletes an existing row.

export async function getMaxCgiReportVersion(publicAssessmentId: string): Promise<number> {
  const result = await supabaseRequest<{ version: number }[]>(
    `cgi_reports?public_assessment_id=${eqFilter(publicAssessmentId)}&select=version&order=version.desc&limit=1`,
    { method: "GET" }
  );
  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) return 0;
  return Number(result.data[0]?.version) || 0;
}

export type RegeneratedCgiReport = {
  id: string;
  version: number;
  aiReportText: string;
  reportJson: unknown;
  model: string | null;
  language: "pt" | "en" | "es";
  generationCompletedAt: string;
};

export type InsertRegeneratedCgiReportResult =
  | { ok: true; report: RegeneratedCgiReport }
  | { ok: false; reason: "conflict" | "invalid_version" | "unknown" };

const REGENERATED_REPORT_SELECT = [
  "id",
  "version",
  "ai_report_text",
  "report_json",
  "model",
  "language",
  "generation_completed_at",
].join(",");

export async function insertRegeneratedCgiReport(input: {
  publicAssessmentId: string;
  version: number;
  aiReport: string;
  aiReportText: string;
  model: string | null;
  lead: unknown;
  answers: unknown;
  score: unknown;
  websiteEnrichment: unknown;
  requestContext: unknown;
  language: "pt" | "en" | "es";
}): Promise<InsertRegeneratedCgiReportResult> {
  if (!input.publicAssessmentId || input.version < 1) {
    return { ok: false, reason: "invalid_version" };
  }
  const now = new Date().toISOString();
  const result = await supabaseRequest<CgiReportRow[]>(
    `cgi_reports?select=${REGENERATED_REPORT_SELECT}`,
    {
      method: "POST",
      body: JSON.stringify({
        public_assessment_id: input.publicAssessmentId,
        version: input.version,
        status: "ready",
        report_status: "report_ready",
        secondary_sync_status: "secondary_sync_pending",
        ai_status: "generated",
        ai_generation_status: "generated",
        ai_report: input.aiReport,
        ai_report_text: input.aiReportText,
        report_json: parseReportJson(input.aiReport),
        lead_json: input.lead,
        answers_json: input.answers,
        score_json: input.score,
        website_enrichment_json: input.websiteEnrichment,
        request_context_json: input.requestContext,
        model: input.model,
        language: input.language,
        generation_completed_at: now,
        created_at: now,
        updated_at: now,
      }),
      prefer: "return=representation",
    }
  );
  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) {
    logSupabaseFailure("insert_regenerated_cgi_report", {
      status: result.status,
      error: result.error,
      publicAssessmentId: input.publicAssessmentId,
    });
    // 409 here means the legacy single-row-per-assessment unique constraint
    // (cgi_reports_public_assessment_id_key) is still in place and this
    // public_assessment_id already has a row -- i.e. the versioning
    // migration's Phase 3 (drop of that constraint) has not run yet. This
    // is a clean, expected rejection, not data corruption: the INSERT never
    // touched the existing row.
    return { ok: false, reason: result.status === 409 ? "conflict" : "unknown" };
  }
  const row = result.data[0];
  return {
    ok: true,
    report: {
      id: String(row.id),
      version: Number(row.version),
      aiReportText: String(row.ai_report_text || ""),
      reportJson: row.report_json ?? null,
      model: row.model ?? null,
      language: row.language === "en" || row.language === "es" ? row.language : "pt",
      generationCompletedAt: String(row.generation_completed_at || now),
    },
  };
}

// --- Report access tokens (public.cgi_report_access) ---
// Read/write layer only. Never generates or hashes tokens itself -- that
// crypto lives in api/_cgi-report-token.ts, which calls these.

type CgiReportAccessRow = {
  id: string;
  public_assessment_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
};

export async function upsertReportAccessToken(input: {
  publicAssessmentId: string;
  tokenHash: string;
  expiresAt: string;
}): Promise<boolean> {
  const result = await supabaseRequest(
    "cgi_report_access?on_conflict=public_assessment_id",
    {
      method: "POST",
      body: JSON.stringify({
        public_assessment_id: input.publicAssessmentId,
        token_hash: input.tokenHash,
        expires_at: input.expiresAt,
        revoked_at: null,
        updated_at: new Date().toISOString(),
      }),
      prefer: "resolution=merge-duplicates,return=minimal",
    }
  );
  if (!result.ok) {
    logSupabaseFailure("upsert_report_access_token", {
      status: result.status,
      error: result.error,
      publicAssessmentId: input.publicAssessmentId,
    });
  }
  return result.ok;
}

export async function revokeReportAccessToken(publicAssessmentId: string): Promise<boolean> {
  const result = await supabaseRequest(
    `cgi_report_access?public_assessment_id=${eqFilter(publicAssessmentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ revoked_at: new Date().toISOString() }),
      prefer: "return=minimal",
    }
  );
  if (!result.ok) {
    logSupabaseFailure("revoke_report_access_token", {
      status: result.status,
      error: result.error,
      publicAssessmentId,
    });
  }
  return result.ok;
}

export async function getReportAccessTokenByHash(tokenHash: string): Promise<CgiReportAccessRow | null> {
  const result = await supabaseRequest<CgiReportAccessRow[]>(
    `cgi_report_access?token_hash=${eqFilter(tokenHash)}&select=id,public_assessment_id,token_hash,expires_at,revoked_at&limit=1`,
    { method: "GET" }
  );
  if (!result.ok) return null;
  return Array.isArray(result.data) ? result.data[0] ?? null : null;
}

export async function touchReportAccessToken(id: string): Promise<void> {
  // Informational only -- last_accessed_at must never block or fail access.
  await supabaseRequest(`cgi_report_access?id=${eqFilter(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ last_accessed_at: new Date().toISOString() }),
    prefer: "return=minimal",
  }).catch(() => undefined);
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

export type CompletedAssessmentRow = {
  id: string;
  lead_id: string | null;
  public_assessment_id: string;
  status: string;
  cgi_score: number | null;
  strategy_score: number | null;
  market_customer_score: number | null;
  growth_engine_score: number | null;
  execution_management_score: number | null;
  leadership_culture_score: number | null;
  cgi_level: string | null;
  lowest_dimension: string | null;
  highest_dimension: string | null;
};

const COMPLETED_ASSESSMENT_SELECT = [
  "id",
  "lead_id",
  "public_assessment_id",
  "status",
  "cgi_score",
  "strategy_score",
  "market_customer_score",
  "growth_engine_score",
  "execution_management_score",
  "leadership_culture_score",
  "cgi_level",
  "lowest_dimension",
  "highest_dimension",
].join(",");

export async function getAssessmentById(assessmentId: string): Promise<CompletedAssessmentRow | null> {
  const result = await supabaseRequest<CompletedAssessmentRow[]>(
    `cgi_assessments?id=${eqFilter(assessmentId)}&select=${COMPLETED_ASSESSMENT_SELECT}&limit=1`,
    { method: "GET" }
  );
  if (!result.ok) return null;
  return Array.isArray(result.data) ? result.data[0] ?? null : null;
}

export type CgiLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  company_website: string | null;
  role: string;
  sector: string | null;
  commercial_relationship_model: string | null;
  employee_count: string | null;
  annual_revenue_range: string | null;
  current_challenge: string | null;
  growth_goal: string | null;
  investment_intent: string | null;
  comments: string | null;
};

export async function getLeadById(leadId: string): Promise<CgiLeadRow | null> {
  const result = await supabaseRequest<CgiLeadRow[]>(
    `cgi_leads?id=${eqFilter(leadId)}&select=id,name,email,phone,company,company_website,role,sector,commercial_relationship_model,employee_count,annual_revenue_range,current_challenge,growth_goal,investment_intent,comments&limit=1`,
    { method: "GET" }
  );
  if (!result.ok) return null;
  return Array.isArray(result.data) ? result.data[0] ?? null : null;
}

export async function getAnswersByAssessmentId(assessmentId: string): Promise<Record<string, number>> {
  const result = await supabaseRequest<{ question_id: string; answer_value: number }[]>(
    `cgi_answers?assessment_id=${eqFilter(assessmentId)}&select=question_id,answer_value`,
    { method: "GET" }
  );
  if (!result.ok || !Array.isArray(result.data)) return {};
  const answers: Record<string, number> = {};
  for (const row of result.data) {
    answers[row.question_id] = row.answer_value;
  }
  return answers;
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

// Fixes a gap where the comments textarea (rendered on the final
// assessment step) is validated right before completion but never
// re-saved: persistLeadForAssessment only fires on the earlier
// cgi_lead_submitted / cgi_company_context_submitted / cgi_phone_submitted
// events, so a comment typed on the last step never reached cgi_leads.
// Only writes when there is actual text, so an empty completion payload
// can never blank out a comment saved by an earlier step.
export async function updateLeadComments(leadId: string, comments: string | null | undefined): Promise<boolean> {
  const trimmed = String(comments || "").trim();
  if (!leadId || !trimmed) return false;
  const result = await supabaseRequest(
    `cgi_leads?id=${eqFilter(leadId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ comments: trimmed }),
      prefer: "return=minimal",
    }
  );
  if (!result.ok) {
    logSupabaseFailure("update_lead_comments", {
      status: result.status,
      error: result.error,
      leadId,
    });
  }
  return result.ok;
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
