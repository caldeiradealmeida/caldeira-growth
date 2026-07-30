import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolve4, resolve6, resolveMx } from "node:dns/promises";
import {
  CGI_DIMENSIONS,
  CGI_QUESTIONS,
  areCgiAnswersComplete,
  calculateCgiScore,
  normalizeCgiAnswers,
  type CgiScoreResult,
} from "./cgi-core.js";
import { buildCgiReportPromptContext } from "./cgi-report-guide.js";
import {
  createEventId,
  getCgiReportState,
  getReadyCgiReport,
  insertFunnelEvent,
  markCgiReportFailed,
  saveCompletedCgiReport,
  tryCreateCgiReportGenerationLock,
  updateCgiReportSecondarySyncStatus,
  upsertAnswers,
  upsertAssessment,
  type StoredCgiReport,
} from "./_cgi-supabase.js";
import {
  CGI_COMMENTS_MAX_LENGTH,
  normalizeAnonymousSessionId,
  normalizePublicAssessmentId,
  validateProfessionalContent,
} from "./_cgi-validation.js";

type CgiLead = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  companyWebsite?: string;
  role?: string;
  region?: string;
  businessUnit?: string;
  companyId?: string;
  respondentId?: string;
  sector?: string;
  commercialRelationshipModel?: string;
  employeeCount?: string;
  annualRevenue?: string;
  currentChallenge?: string;
  growthGoal?: string;
  investmentIntent?: string;
  comments?: string;
};

type CgiPayload = {
  action?: string;
  language?: "pt" | "en" | "es";
  lead?: CgiLead;
  answers?: Record<string, unknown>;
  score?: unknown;
  aiReport?: string;
  aiStatus?: string;
  startedAt?: string;
  website?: string;
  anonymous_session_id?: string;
  public_assessment_id?: string;
  completion_event_id?: string;
  attribution?: Record<string, unknown>;
};

type AiResult = {
  status: "generated" | "not_configured" | "error";
  text: string;
  plainText: string;
  reportStatus?: "report_ready" | "report_ready_with_warnings";
  warnings?: GeneratedReportValidationError[];
  metrics?: GeneratedReportMetrics;
};

type OpenAiResponseMeta = {
  id: string;
  model: string;
  status: string;
  finishReason: string;
  incompleteDetails: unknown;
  outputTokens: number | null;
  outputCharCount: number;
  maxOutputTokens: number;
  isTruncated: boolean;
};

type WebsiteEnrichment = {
  status: "not_provided" | "ok" | "error";
  requestedUrl: string;
  finalUrl: string;
  title: string;
  description: string;
  headings: string[];
  observedText: string;
  error?: string;
};

type RequestContext = {
  ip: string;
  country: string;
  region: string;
  city: string;
  latitude: string;
  longitude: string;
  timezone: string;
};

type EmailValidation = {
  status: "ok" | "error";
  domain: string;
  hasMx: boolean;
  hasAddressFallback: boolean;
  error?: string;
};

type DimensionTranslations = Record<"pt" | "en" | "es", Record<string, string>>;

const REPORT_METHODOLOGY_VERSION = "1.1.0";
const SCORING_VERSION = "1.0.0";
const CGI_OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const CGI_OPENAI_MODEL_ENV = "OPENAI_MODEL";
const CGI_OPENAI_TIMEOUT_MS = 85000;
const CGI_REPORT_MAX_OUTPUT_TOKENS = 10000;
const CGI_REPORT_PREFERRED_MIN_CHARS = 8500;
const CGI_REPORT_PREFERRED_MAX_CHARS = 10500;
const CGI_REPORT_WARNING_CHARS = 10800;
const CGI_REPORT_MAX_CHARS = 11200;
const CGI_REPORT_MAX_CONTENT_PAGES = 7;
const CGI_REPORT_ESTIMATED_CHARS_PER_CONTENT_PAGE = 1600;
const CGI_REPORT_TRANSIENT_MAX_FULL_ATTEMPTS = 3;
const CGI_REPORT_CRITICAL_MAX_FULL_ATTEMPTS = 2;
const CGI_OPENAI_TOTAL_TIMEOUT_BUDGET_MS = CGI_OPENAI_TIMEOUT_MS * CGI_REPORT_TRANSIENT_MAX_FULL_ATTEMPTS;
const CGI_NON_OPENAI_RUNTIME_BUDGET_MS = 20000;
const VERCEL_FUNCTION_TIMEOUT_MS = 300000;

type ValidationIssueCategory =
  | "transient"
  | "critical_structural"
  | "correctable_structural"
  | "editorial"
  | "quality";

type GeneratedReportMetrics = {
  chars: number;
  words: number;
  estimatedContentPages: number;
  pageLimit: number;
  preferredMaxChars: number;
  maxChars: number;
};

type GeneratedReportValidationError = {
  field: string;
  index?: number;
  message: string;
  code: string;
  category: ValidationIssueCategory;
  blocksGeneration: boolean;
  retryType: "full" | "none";
  path: string;
  expected?: string;
  received_type: string;
  received_summary?: string;
  section: string;
};

export function getCgiReportTimeoutBudget() {
  return {
    openAiAttemptTimeoutMs: CGI_OPENAI_TIMEOUT_MS,
    maxTransientFullAttempts: CGI_REPORT_TRANSIENT_MAX_FULL_ATTEMPTS,
    maxCriticalFullAttempts: CGI_REPORT_CRITICAL_MAX_FULL_ATTEMPTS,
    openAiWorstCaseMs: CGI_OPENAI_TOTAL_TIMEOUT_BUDGET_MS,
    nonOpenAiRuntimeBudgetMs: CGI_NON_OPENAI_RUNTIME_BUDGET_MS,
    theoreticalWorstCaseMs: CGI_OPENAI_TOTAL_TIMEOUT_BUDGET_MS + CGI_NON_OPENAI_RUNTIME_BUDGET_MS,
    vercelFunctionTimeoutMs: VERCEL_FUNCTION_TIMEOUT_MS,
  };
}

const CGI_PRESENTATION =
  "O CGI é um diagnóstico executivo desenvolvido pela Caldeira Growth para avaliar a capacidade de uma organização transformar ambição de crescimento em direção estratégica, leitura de mercado, máquina comercial, disciplina de execução e liderança. O instrumento não avalia perfil comportamental; ele identifica padrões, tensões e prioridades que podem influenciar a qualidade e a sustentabilidade do crescimento.";

const CGI_METHODOLOGY_NOTE =
  "Este parecer foi produzido a partir das respostas fornecidas ao CGI — Crescimento, Gestão e Implementação —, combinadas, quando indicado, com informações públicas sobre a empresa e seu contexto de atuação. As conclusões representam uma leitura executiva orientada por padrões de resposta e não substituem um diagnóstico organizacional completo. Hipóteses estratégicas, causas e prioridades devem ser validadas em discussão com a liderança e, quando aplicável, com dados operacionais adicionais.";

function snippet(value: string, maxLength = 700): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function getAppsScriptUrl(): string {
  return (
    process.env.CONTACT_FORM_URL?.trim() ||
    process.env.VITE_CONTACT_FORM_URL?.trim() ||
    ""
  );
}

function getConfiguredOpenAiModel(): string {
  return process.env[CGI_OPENAI_MODEL_ENV]?.trim() || "";
}

function getOpenAiConfig(): { apiKey: string; model: string } | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = getConfiguredOpenAiModel();
  if (!apiKey || !model) return null;
  return { apiKey, model };
}

async function fetchOpenAiResponse(
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs = CGI_OPENAI_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(CGI_OPENAI_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } finally {
    clearTimeout(timeout);
  }
}

function logCgiOperation(input: {
  correlationId: string;
  publicAssessmentId?: string | null;
  operation: string;
  success: boolean;
  errorCode?: string;
  durationMs: number;
  retryCount?: number;
  reportId?: string | null;
}) {
  console.info("[CGI Flow]", {
    correlation_id: input.correlationId,
    public_assessment_id: input.publicAssessmentId || undefined,
    report_id: input.reportId || undefined,
    operation: input.operation,
    success: input.success,
    error_code: input.errorCode || undefined,
    duration_ms: input.durationMs,
    retry_count: input.retryCount ?? 0,
  });
}

function respondWithStoredReport(
  res: VercelResponse,
  report: StoredCgiReport
): void {
  const secondarySyncFailed = report.secondarySyncStatus === "secondary_sync_failed";
  res.status(200).json({
    ok: true,
    public_assessment_id: report.publicAssessmentId,
    completion_event_id: report.completionEventId,
    report_status: report.reportStatus,
    secondary_sync_status: report.secondarySyncStatus,
    save: secondarySyncFailed
      ? { ok: false, error: "secondary_sync_failed" }
      : { ok: true },
    score: report.score,
    ai: {
      status: report.aiStatus,
      generation_status: report.aiGenerationStatus,
      text: report.aiReport,
      plainText: report.aiReportText,
    },
    ai_generation_status: report.aiGenerationStatus,
    lead: report.lead,
    answers: report.answers,
    websiteEnrichment: report.websiteEnrichment,
    requestContext: report.requestContext,
    reused: true,
  });
}

function firstHeaderValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

function getClientIp(req: VercelRequest): string {
  const vercelForwarded = firstHeaderValue(req.headers["x-vercel-forwarded-for"]);
  if (vercelForwarded) return vercelForwarded.split(",")[0].trim();

  const forwarded = firstHeaderValue(req.headers["x-forwarded-for"]);
  if (forwarded) return forwarded.split(",")[0].trim();

  return firstHeaderValue(req.headers["x-real-ip"]);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getRequestContext(req: VercelRequest): RequestContext {
  return {
    ip: getClientIp(req),
    country: firstHeaderValue(req.headers["x-vercel-ip-country"]),
    region: firstHeaderValue(req.headers["x-vercel-ip-country-region"]),
    city: safeDecode(firstHeaderValue(req.headers["x-vercel-ip-city"])),
    latitude: firstHeaderValue(req.headers["x-vercel-ip-latitude"]),
    longitude: firstHeaderValue(req.headers["x-vercel-ip-longitude"]),
    timezone: firstHeaderValue(req.headers["x-vercel-ip-timezone"]),
  };
}

function readPayload(req: VercelRequest): CgiPayload {
  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}") as CgiPayload;
  }
  return (req.body ?? {}) as CgiPayload;
}

function getEmailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] || "";
}

function getWebsiteDomain(rawUrl: string | undefined): string {
  const value = String(rawUrl || "").trim();
  if (!value) return "";
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

async function validateEmailDomain(email: string): Promise<EmailValidation> {
  const domain = getEmailDomain(email);
  if (!domain || !domain.includes(".")) {
    return {
      status: "error",
      domain,
      hasMx: false,
      hasAddressFallback: false,
      error: "invalid_domain",
    };
  }

  try {
    const mxRecords = await resolveMx(domain);
    if (mxRecords.length > 0) {
      return {
        status: "ok",
        domain,
        hasMx: true,
        hasAddressFallback: false,
      };
    }
  } catch {
    // Some valid domains do not expose MX but can still receive through A/AAAA fallback.
  }

  try {
    const [ipv4, ipv6] = await Promise.allSettled([resolve4(domain), resolve6(domain)]);
    const hasAddressFallback =
      (ipv4.status === "fulfilled" && ipv4.value.length > 0) ||
      (ipv6.status === "fulfilled" && ipv6.value.length > 0);

    return {
      status: hasAddressFallback ? "ok" : "error",
      domain,
      hasMx: false,
      hasAddressFallback,
      ...(hasAddressFallback ? {} : { error: "domain_not_resolvable" }),
    };
  } catch (error) {
    return {
      status: "error",
      domain,
      hasMx: false,
      hasAddressFallback: false,
      error: error instanceof Error ? error.message : "domain_validation_failed",
    };
  }
}

async function validateLead(lead: CgiLead | undefined): Promise<{
  error: string | null;
  emailValidation?: EmailValidation;
}> {
  if (!lead) return { error: "lead_required" };
  const required: Array<keyof CgiLead> = [
    "name",
    "email",
    "company",
    "role",
    "sector",
    "commercialRelationshipModel",
    "employeeCount",
    "annualRevenue",
    "currentChallenge",
    "growthGoal",
    "investmentIntent",
  ];
  const missing = required.find((key) => !String(lead[key] ?? "").trim());
  if (missing) return { error: `missing_${String(missing)}` };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(lead.email))) {
    return { error: "invalid_email" };
  }
  const emailValidation = await validateEmailDomain(String(lead.email));
  if (emailValidation.status !== "ok") {
    return { error: "invalid_email_domain", emailValidation };
  }
  return { error: null, emailValidation };
}

function validateSpam(payload: CgiPayload): string | null {
  if (String(payload.website ?? "").trim()) return "spam_honeypot";

  const startedAt = Number(payload.startedAt);
  if (!Number.isFinite(startedAt)) return "missing_started_at";

  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs < 5000) return "spam_too_fast";
  if (elapsedMs > 1000 * 60 * 60 * 4) return "expired";
  return null;
}

function normalizePublicWebsiteUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("invalid_protocol");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
    hostname === "::1" ||
    hostname.includes("[")
  ) {
    throw new Error("private_or_local_host");
  }

  url.hash = "";
  return url.toString();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(value: string, maxLength = 1200): string {
  return decodeHtmlEntities(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function getFirstMatch(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match ? cleanText(match[1] || "") : "";
}

function getMetaContent(html: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:name|property)=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escapedName}["'][^>]*>`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const value = getFirstMatch(html, pattern);
    if (value) return value;
  }
  return "";
}

function extractWebsiteContent(html: string): Pick<
  WebsiteEnrichment,
  "title" | "description" | "headings" | "observedText"
> {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const title = getFirstMatch(withoutNoise, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    getMetaContent(withoutNoise, "description") ||
    getMetaContent(withoutNoise, "og:description");
  const headings = Array.from(
    withoutNoise.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)
  )
    .map((match) => cleanText(match[1] || "", 180))
    .filter(Boolean)
    .slice(0, 8);
  const observedText = cleanText(withoutNoise.replace(/<[^>]+>/g, " "), 5000);

  return { title, description, headings, observedText };
}

async function enrichCompanyWebsite(rawUrl: string | undefined): Promise<WebsiteEnrichment> {
  const requestedUrl = String(rawUrl || "").trim();
  if (!requestedUrl) {
    return {
      status: "not_provided",
      requestedUrl: "",
      finalUrl: "",
      title: "",
      description: "",
      headings: [],
      observedText: "",
    };
  }

  let url = "";
  try {
    url = normalizePublicWebsiteUrl(requestedUrl);
  } catch (error) {
    return {
      status: "error",
      requestedUrl,
      finalUrl: "",
      title: "",
      description: "",
      headings: [],
      observedText: "",
      error: error instanceof Error ? error.message : "invalid_url",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "CaldeiraGrowth-CGI/1.0 (+https://www.caldeiragrowth.com/cgi)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) throw new Error(`http_${response.status}`);
    if (!contentType.includes("text/html")) throw new Error("not_html");

    const html = await response.text();
    return {
      status: "ok",
      requestedUrl,
      finalUrl: response.url,
      ...extractWebsiteContent(html.slice(0, 500000)),
    };
  } catch (error) {
    return {
      status: "error",
      requestedUrl,
      finalUrl: url,
      title: "",
      description: "",
      headings: [],
      observedText: "",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractOutputText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const direct = (response as { output_text?: unknown }).output_text;
  if (typeof direct === "string") return direct.trim();

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => {
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const text = (item as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .join("\n")
    .trim();
}

function findNestedString(value: unknown, key: string): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if (typeof record[key] === "string") return record[key];
  for (const nested of Object.values(record)) {
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const found = findNestedString(item, key);
        if (found) return found;
      }
      continue;
    }
    const found = findNestedString(nested, key);
    if (found) return found;
  }
  return "";
}

function getUsageOutputTokens(response: unknown): number | null {
  if (!response || typeof response !== "object") return null;
  const usage = (response as { usage?: unknown }).usage;
  if (!usage || typeof usage !== "object") return null;
  const record = usage as Record<string, unknown>;
  const outputTokens = record.output_tokens ?? record.completion_tokens;
  return typeof outputTokens === "number" ? outputTokens : null;
}

function isOpenAiOutputTruncated(meta: Pick<
  OpenAiResponseMeta,
  "status" | "finishReason" | "incompleteDetails"
>): boolean {
  const reasonText = JSON.stringify(meta.incompleteDetails || "").toLowerCase();
  const finishReason = meta.finishReason.toLowerCase();
  const status = meta.status.toLowerCase();
  return (
    status === "incomplete" ||
    finishReason === "length" ||
    finishReason.includes("max_output") ||
    reasonText.includes("max_output") ||
    reasonText.includes("length")
  );
}

function extractOpenAiResponseMeta(
  response: unknown,
  outputText: string,
  maxOutputTokens: number
): OpenAiResponseMeta {
  const record =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : {};
  const meta = {
    id: typeof record.id === "string" ? record.id : "",
    model: typeof record.model === "string" ? record.model : "",
    status: typeof record.status === "string" ? record.status : "",
    finishReason: findNestedString(response, "finish_reason"),
    incompleteDetails: record.incomplete_details ?? null,
    outputTokens: getUsageOutputTokens(response),
    outputCharCount: outputText.length,
    maxOutputTokens,
    isTruncated: false,
  };
  return {
    ...meta,
    isTruncated: isOpenAiOutputTruncated(meta),
  };
}

function sanitizeOpenAiResponseMeta(meta?: OpenAiResponseMeta) {
  if (!meta) return undefined;
  return {
    id: meta.id || undefined,
    model: meta.model || undefined,
    status: meta.status || undefined,
    finish_reason: meta.finishReason || undefined,
    incomplete_details: meta.incompleteDetails || undefined,
    output_tokens: meta.outputTokens,
    output_char_count: meta.outputCharCount,
    max_output_tokens: meta.maxOutputTokens,
    is_truncated: meta.isTruncated,
  };
}

function formatAiReportForEmail(value: string, language: "pt" | "en" | "es" = "pt"): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const lines: string[] = [];
    const labels = {
      pt: {
        executiveSummary: "Sumário Executivo",
        methodology: "Nota metodológica",
        evidence: "Resumo de evidências",
        diagnosis: "Contexto e diagnóstico",
        dimensionReading: "Leitura por dimensão",
        bottlenecks: "Gargalos críticos",
        bets: "Apostas estratégicas recomendadas",
        renunciations: "Renúncias estratégicas",
        governance: "Sistema mínimo de governança",
        hypotheses: "Hipóteses a validar",
        recommendations: "Recomendações finais",
      },
      en: {
        executiveSummary: "Executive Summary",
        methodology: "Methodological note",
        evidence: "Evidence summary",
        diagnosis: "Context and diagnosis",
        dimensionReading: "Reading by dimension",
        bottlenecks: "Critical bottlenecks",
        bets: "Recommended strategic bets",
        renunciations: "Strategic renunciations",
        governance: "Minimum governance system",
        hypotheses: "Hypotheses to validate",
        recommendations: "Final recommendations",
      },
      es: {
        executiveSummary: "Resumen ejecutivo",
        methodology: "Nota metodológica",
        evidence: "Resumen de evidencias",
        diagnosis: "Contexto y diagnóstico",
        dimensionReading: "Lectura por dimensión",
        bottlenecks: "Cuellos de botella críticos",
        bets: "Apuestas estratégicas recomendadas",
        renunciations: "Renuncias estratégicas",
        governance: "Sistema mínimo de gobernanza",
        hypotheses: "Hipótesis a validar",
        recommendations: "Recomendaciones finales",
      },
    }[language];

    const addText = (title: string, field: string) => {
      const text = parsed[field];
      if (typeof text === "string" && text.trim()) {
        lines.push(title, text.trim(), "");
      }
    };
    const addList = (title: string, field: string) => {
      const list = parsed[field];
      if (typeof list === "string" && list.trim()) {
        lines.push(title, list.trim(), "");
        return;
      }
      if (Array.isArray(list) && list.length > 0) {
        lines.push(title);
        list.forEach((item) => {
          if (typeof item === "string") {
            lines.push("- " + item);
          } else if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            const label =
              String(record.title || record.dimension || record.name || "").trim();
            const body = String(
              record.analysis || record.rationale || record.recommendation || record.action || ""
            ).trim();
            lines.push("- " + [label, body].filter(Boolean).join(": "));
          }
        });
        lines.push("");
      }
    };

    addText(labels.methodology, "methodology_note");
    addList(labels.evidence, "evidence_summary");
    addText(labels.executiveSummary, "executive_summary");
    addText(labels.diagnosis, "strategic_diagnosis");
    addList(labels.dimensionReading, "dimension_reading");
    addList(labels.bottlenecks, "critical_bottlenecks");
    addList(labels.bets, "strategic_bets");
    addList(labels.renunciations, "renunciations");
    addList(labels.governance, "governance_system");
    addList(labels.hypotheses, "hypotheses_to_validate");
    addList(labels.recommendations, "final_recommendations");

    return lines.join("\n").trim();
  } catch {
    return value;
  }
}

function hasPortugueseLeak(value: string): boolean {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const markers = [
    "crescimento",
    "estrategia",
    "mercado e cliente",
    "maquina de crescimento",
    "execucao",
    "lideranca",
    "gargalo",
    "recomendacao",
    "empresa parece",
    "proxima fase",
    "decisao",
    "governanca",
    "renuncia",
    "prioridade",
  ];
  return markers.filter((marker) => normalized.includes(marker)).length >= 3;
}

function answerLabel(value: number, language: "pt" | "en" | "es"): string {
  const labels = {
    pt: {
      1: "discordo totalmente",
      2: "discordo parcialmente",
      3: "neutro",
      4: "concordo parcialmente",
      5: "concordo totalmente",
    },
    en: {
      1: "strongly disagree",
      2: "partially disagree",
      3: "neutral",
      4: "partially agree",
      5: "strongly agree",
    },
    es: {
      1: "totalmente en desacuerdo",
      2: "parcialmente en desacuerdo",
      3: "neutral",
      4: "parcialmente de acuerdo",
      5: "totalmente de acuerdo",
    },
  }[language] as Record<number, string>;
  return labels[value] || String(value);
}

function getQuestionReference(
  question: (typeof CGI_QUESTIONS)[number],
  language: "pt" | "en" | "es"
) {
  if (language === "pt") return question.text;
  return `assessment item ${question.id}`;
}

export function buildCgiReportEvidence({
  answers,
  score,
  language,
  dimensionTranslations,
  respondentComment,
}: {
  answers: Record<string, number>;
  score: CgiScoreResult;
  language: "pt" | "en" | "es";
  dimensionTranslations: DimensionTranslations;
  respondentComment?: string;
}) {
  const dimensions = CGI_DIMENSIONS.map((dimension) => {
    const dimensionScore = score.dimensionScores.find(
      (item) => item.dimensionId === dimension.id
    );
    const items = CGI_QUESTIONS.filter((question) => question.dimensionId === dimension.id)
      .map((question) => ({
        id: question.id,
        answer: answers[question.id],
        answer_label: answerLabel(answers[question.id], language),
        evidence_reference: getQuestionReference(question, language),
      }))
      .filter((item) => Number.isFinite(item.answer));

    const strongestItems = [...items]
      .sort((a, b) => b.answer - a.answer || a.id.localeCompare(b.id))
      .slice(0, 3);
    const weakestItems = [...items]
      .sort((a, b) => a.answer - b.answer || a.id.localeCompare(b.id))
      .slice(0, 2);
    const maxAnswer = Math.max(...items.map((item) => item.answer));
    const minAnswer = Math.min(...items.map((item) => item.answer));

    return {
      dimension_id: dimension.id,
      dimension:
        dimensionTranslations[language][dimension.id] || dimension.title,
      score: dimensionScore?.score ?? null,
      average: dimensionScore?.average ?? null,
      strongest_items: strongestItems,
      weakest_items: weakestItems,
      answer_spread: maxAnswer - minAnswer,
      has_internal_contrast: maxAnswer - minAnswer >= 2,
    };
  });

  return {
    methodology_version: REPORT_METHODOLOGY_VERSION,
    scoring_version: SCORING_VERSION,
    overall: {
      final_score: score.finalScore,
      maturity_level: score.level.title,
      maturity_level_id: score.level.id,
      strongest_dimensions: [...score.dimensionScores]
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map((item) => ({
          dimension_id: item.dimensionId,
          dimension:
            dimensionTranslations[language][item.dimensionId] || item.title,
          score: item.score,
        })),
      weakest_dimensions: [...score.dimensionScores]
        .sort((a, b) => a.score - b.score)
        .slice(0, 2)
        .map((item) => ({
          dimension_id: item.dimensionId,
          dimension:
            dimensionTranslations[language][item.dimensionId] || item.title,
          score: item.score,
        })),
    },
    by_dimension: dimensions,
    respondent_statement: String(respondentComment || "").trim()
      ? {
          source: "respondent_free_text",
          text: snippet(String(respondentComment || ""), 1000),
          interpretation_note:
            "Declaração aberta do respondente; deve ser tratada como perspectiva individual e hipótese qualitativa, não como fato organizacional comprovado.",
        }
      : null,
  };
}

export function buildCgiReportSystemPrompt(languageInstruction: string): string {
  return `${languageInstruction}

Você é um consultor sênior da Caldeira Growth. Gere um relatório executivo no formato de parecer estratégico, usando o guia de estilo e conteúdo fornecido.

Princípio central da versão 1.1: o relatório deve parecer a aplicação disciplinada da metodologia Caldeira Growth às respostas específicas do respondente. Toda conclusão relevante deve estar sustentada por evidência do CGI, comentário textual do participante, contexto público validado ou aparecer explicitamente como hipótese a validar.

Apresentação metodológica obrigatória: ${CGI_PRESENTATION}

Nota metodológica obrigatória: ${CGI_METHODOLOGY_NOTE}

Use três camadas com origem clara:
1. Evidência do CGI: respostas, pontuações, forças, fragilidades e contrastes do assessment.
2. Contexto complementar: apenas informações públicas presentes em public_website_context com status ok.
3. Hipótese executiva: inferências estratégicas que precisam ser validadas em conversa posterior.

Regras de credibilidade:
- Não invente dados, fatos sobre a empresa, clientes, canais, produtos, resultados, nomes, estrutura, números ou metas não informadas.
- Não presuma causa a partir de uma nota.
- Não presuma que baixa pontuação significa ausência total.
- Não presuma que alta pontuação significa maturidade comprovada.
- Não cite informações públicas sem que estejam em public_website_context.
- Não invente frases do respondente nem use aspas se estiver apenas resumindo comentários.
- Quando a evidência for insuficiente, diga isso de forma explícita.
- Evite afirmações categóricas como "o principal gargalo é", "a empresa precisa", "a causa é", "a empresa não possui" ou "a liderança falha em", exceto quando houver evidência direta e inequívoca nas respostas.
- Como o CGI parte de um questionário individual, enquadre conclusões como perspectiva do respondente. Use formulações como "As respostas deste executivo indicam", "A partir da perspectiva do respondente", "O diagnóstico sugere", "Há sinais de que" e "Esta hipótese deve ser validada com outras lideranças e dados internos".
- Prefira formulações como "as respostas sugerem", "o padrão indica", "há sinais de que", "uma hipótese relevante é", "este resultado pode indicar", "o tema merece validação adicional" e "a leitura do CGI sugere".
- Evite transformar uma percepção individual em verdade objetiva sobre a organização. Em executive_summary, strategic_diagnosis, critical_bottlenecks, dimension_reading e final_recommendations, diferencie evidência observada, hipótese provável e validação necessária.

Regras de personalização:
- Use response_evidence.by_dimension para citar naturalmente as respostas que sustentam cada conclusão, sem expor códigos internos quando houver texto da pergunta disponível.
- Em cada dimensão, destaque dois ou três itens fortes, um ou dois itens frágeis e alguma tensão quando answer_spread indicar contraste relevante.
- Use lead.comments de forma explícita quando existir; se resumir o comentário, não coloque aspas.
- Considere meta de crescimento, estágio/tamanho, modelo comercial, cargo do respondente, setor e site público quando disponíveis.
- Varie a construção argumentativa entre dimensões e entre relatórios. Não reutilize automaticamente as mesmas expressões em todas as seções.

Formato e tamanho:
- Retorne apenas JSON válido, sem markdown decorativo.
- Mantenha o conteúdo total preferencialmente entre ${CGI_REPORT_PREFERRED_MIN_CHARS.toLocaleString("pt-BR")} e ${CGI_REPORT_PREFERRED_MAX_CHARS.toLocaleString("pt-BR")} caracteres, e nunca acima de ${CGI_REPORT_MAX_CHARS.toLocaleString("pt-BR")} caracteres, incluindo espaços.
- O conteúdo analítico deve caber em no máximo ${CGI_REPORT_MAX_CONTENT_PAGES} páginas úteis do PDF, excluindo capa, índice e assinatura. Priorize densidade analítica e não expanda texto apenas para atingir tamanho.
- Use exatamente estas chaves: report_title, report_subtitle, email_subject, methodology_note, evidence_summary, executive_summary, strategic_diagnosis, dimension_reading, critical_bottlenecks, strategic_bets, renunciations, governance_system, hypotheses_to_validate, final_recommendations.
- methodology_note deve preservar o significado da nota metodológica obrigatória, no idioma solicitado.
- evidence_summary deve ser um array com 2 a 4 itens curtos, mostrando as principais evidências usadas.
- executive_summary deve mencionar pontuação geral, faixa de maturidade, duas forças reais e uma tensão central; deve ter de 600 a 900 caracteres.
- strategic_diagnosis deve ter 3 a 4 parágrafos discursivos, 1.600 a 2.400 caracteres no total, conectar dimensões, distinguir evidências de hipóteses e não repetir o executive_summary.
- dimension_reading deve ter exatamente 5 objetos com dimension, score, analysis e implication. Cada dimensão deve ter 280 a 480 caracteres no total; cada analysis deve indicar as fontes principais da pontuação; cada implication deve explicar risco ou oportunidade sem excesso prescritivo.
- critical_bottlenecks deve ter 2 a 3 strings. Cada string deve usar preferencialmente este contrato e estes rótulos, nesta ordem: "Título: ... Sinal observado: ... Causa provável: ... Impacto estratégico: ...". Cada item deve ter 280 a 480 caracteres.
- strategic_bets deve ter 2 a 3 strings. Cada string deve usar preferencialmente este contrato e estes rótulos, nesta ordem: "Título: ... Ação prioritária: ... Resultado esperado: ... Horizonte: ...". Cada item deve ter 260 a 440 caracteres.
- renunciations deve ter 2 a 3 strings. Cada string deve usar preferencialmente este contrato e estes rótulos, nesta ordem: "Escolha: ... O que deixar de fazer: ... Recurso ou capacidade protegida: ... Racional estratégico: ...". Cada item deve ter 200 a 360 caracteres.
- governance_system deve ter 2 a 3 strings. Cada string deve usar preferencialmente este contrato e estes rótulos, nesta ordem: "Ritual: ... Frequência: ... Participantes: ... Indicadores: ... Decisão esperada: ...". Cada item deve ter 220 a 380 caracteres.
- hypotheses_to_validate deve ter 2 a 4 hipóteses executivas curtas, claramente marcadas como hipóteses.
- final_recommendations deve ter 2 a 3 strings. Cada string deve usar preferencialmente este contrato e estes rótulos, nesta ordem: "Recomendação: ... Prioridade: ... Próximo passo: ... Condição de validação: ...". Cada item deve ter 220 a 380 caracteres.

Proporcionalidade por nível de score:
- Scores baixos: recomende poucas iniciativas simultâneas, com foco em capacidade de execução e validação básica.
- Scores médios: priorize sequenciamento, escolha e redução de dispersão.
- Scores altos: evite elogios genéricos; trate tensões de escala, governança, renúncia e qualidade de crescimento.
- Empresas frágeis devem receber próximos passos proporcionais à capacidade de execução; empresas maduras devem receber tensões mais sofisticadas de escala e escolha.

Fronteira da versão gratuita:
- O relatório deve gerar clareza estratégica, apontar prioridades, mostrar tensões, formular hipóteses e sugerir próximos passos.
- Não entregue plano operacional completo, cronograma detalhado, matriz de responsáveis, playbook de implantação, desenho acabado de processos nem solução exaustiva para cada gargalo.
- O relatório deve gerar clareza estratégica e apontar prioridades, mas não substituir uma etapa de diagnóstico aprofundado, alinhamento executivo ou desenho de implementação.

O relatório deve ser discursivo, analítico e útil, mas enxuto para uma versão gratuita. Não escreva um comentário curto sobre o índice, mas também não produza um relatório longo de consultoria completa.`;
}

const EXACT_THREE_REPORT_LIST_FIELDS = [
  "critical_bottlenecks",
  "strategic_bets",
  "renunciations",
  "governance_system",
  "final_recommendations",
] as const;

const REQUIRED_REPORT_KEYS = [
  "report_title",
  "report_subtitle",
  "email_subject",
  "methodology_note",
  "evidence_summary",
  "executive_summary",
  "strategic_diagnosis",
  "dimension_reading",
  ...EXACT_THREE_REPORT_LIST_FIELDS,
  "hypotheses_to_validate",
];

type ReportListField = (typeof EXACT_THREE_REPORT_LIST_FIELDS)[number];

type ReportItemContractField = {
  label: string;
  keys: string[];
};

const REPORT_ITEM_CONTRACTS: Record<ReportListField, ReportItemContractField[]> = {
  critical_bottlenecks: [
    { label: "Título", keys: ["title", "titulo", "name", "tema"] },
    { label: "Sinal observado", keys: ["observed_signal", "signal", "sinal_observado", "sinal", "evidence", "evidencia"] },
    { label: "Causa provável", keys: ["probable_cause", "possible_cause", "cause", "causa_provavel", "causa"] },
    { label: "Impacto estratégico", keys: ["strategic_impact", "impact", "impacto_estrategico", "impacto"] },
  ],
  strategic_bets: [
    { label: "Título", keys: ["title", "titulo", "name", "tema"] },
    { label: "Ação prioritária", keys: ["priority_action", "action", "acao_prioritaria", "acao", "decision", "decisao"] },
    { label: "Resultado esperado", keys: ["expected_result", "resultado_esperado", "outcome"] },
    { label: "Horizonte", keys: ["horizon", "horizonte", "deadline", "prazo"] },
  ],
  renunciations: [
    { label: "Escolha", keys: ["choice", "escolha", "title", "titulo"] },
    { label: "O que deixar de fazer", keys: ["what_to_stop", "stop_doing", "o_que_deixar_de_fazer", "renunciation", "renuncia"] },
    { label: "Recurso ou capacidade protegida", keys: ["protected_resource", "resource_protected", "protected_capability", "recurso_protegido", "capacidade_protegida"] },
    { label: "Racional estratégico", keys: ["strategic_rationale", "rationale", "racional_estrategico", "racional"] },
  ],
  governance_system: [
    { label: "Ritual", keys: ["ritual", "title", "titulo", "name"] },
    { label: "Frequência", keys: ["frequency", "frequencia", "cadence", "cadencia"] },
    { label: "Participantes", keys: ["participants", "participantes"] },
    { label: "Indicadores", keys: ["indicators", "indicadores", "metrics", "metricas"] },
    { label: "Decisão esperada", keys: ["expected_decision", "decision", "decisao_esperada", "decisao"] },
  ],
  final_recommendations: [
    { label: "Recomendação", keys: ["recommendation", "recomendacao", "title", "titulo"] },
    { label: "Prioridade", keys: ["priority", "prioridade"] },
    { label: "Próximo passo", keys: ["next_step", "proximo_passo", "action", "acao"] },
    { label: "Condição de validação", keys: ["validation_condition", "condicao_de_validacao", "condition", "hypothesis_to_validate", "hipotese_a_validar"] },
  ],
};

const REPORT_ITEM_LABELS: Record<string, string> = {
  signal: "Sinal",
  sinal: "Sinal",
  evidence: "Evidencia",
  evidencia: "Evidencia",
  cause: "Possivel causa",
  possible_cause: "Possivel causa",
  causa: "Possivel causa",
  impact: "Impacto",
  impacto: "Impacto",
  action: "Acao",
  acao: "Acao",
  decision: "Decisao",
  decisao: "Decisao",
  expected_result: "Resultado esperado",
  resultado_esperado: "Resultado esperado",
  deadline: "Prazo",
  prazo: "Prazo",
  cadence: "Cadencia",
  cadencia: "Cadencia",
  participants: "Participantes",
  participantes: "Participantes",
  indicators: "Indicadores",
  indicadores: "Indicadores",
  resource_protected: "Recurso protegido",
  recurso_protegido: "Recurso protegido",
  rationale: "Racional",
  recommendation: "Recomendacao",
  title: "Tema",
  name: "Tema",
  description: "Descricao",
};

function withProtectedUrls(value: string, transform: (input: string) => string): string {
  const urls: string[] = [];
  const protectedText = value.replace(/\b(?:https?:\/\/|www\.)[^\s)]+/gi, (match) => {
    const token = `__CGI_URL_${urls.length}__`;
    urls.push(match);
    return token;
  });
  const transformed = transform(protectedText);
  return urls.reduce(
    (text, url, index) => text.replace(`__CGI_URL_${index}__`, url),
    transformed
  );
}

export function sanitizeReportText(value: string): string {
  return withProtectedUrls(value, (input) =>
    input
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/[ \t]+([,.;:!?])/g, "$1")
      .replace(/,\s*\./g, ".")
      .replace(/;\s*;/g, ";")
      .replace(/,{2,}/g, ",")
      .replace(/;{2,}/g, ";")
      .replace(/(?<!\d)\.{2,}(?!\d)/g, ".")
      .replace(/[ \t]+$/gm, "")
      .trim()
  );
}

function normalizeReportValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return sanitizeReportText(value.replace(/\s+/g, " "));
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeReportValue(item))
      .filter(Boolean)
      .join("; ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => normalizeReportValue(item))
      .filter(Boolean)
      .join("; ");
  }
  return "";
}

function valueFromContract(record: Record<string, unknown>, field: ReportItemContractField): string {
  for (const key of field.keys) {
    const direct = normalizeReportValue(record[key]);
    if (direct) return direct;
  }
  return "";
}

function stripExistingContractLabels(value: string, contract: ReportItemContractField[]): string {
  let next = value;
  for (const field of contract) {
    const escaped = field.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`\\b${escaped}\\s*:`, "gi"), `${field.label}:`);
  }
  return sanitizeReportText(next);
}

export function normalizeReportListItem(
  item: unknown,
  field?: ReportListField
): string {
  if (typeof item === "string") {
    return field
      ? stripExistingContractLabels(item, REPORT_ITEM_CONTRACTS[field])
      : sanitizeReportText(item);
  }
  if (item === null || item === undefined) return "";
  if (Array.isArray(item)) {
    const text = item
      .map((value) => normalizeReportValue(value))
      .filter(Boolean)
      .join("; ")
      .trim();
    return sanitizeReportText(text);
  }
  if (typeof item !== "object") return normalizeReportValue(item);

  const record = item as Record<string, unknown>;
  if (field) {
    const contract = REPORT_ITEM_CONTRACTS[field];
    const entries = contract
      .map((contractField) => {
        const text = valueFromContract(record, contractField);
        return text ? `${contractField.label}: ${text}` : "";
      })
      .filter(Boolean);

    if (entries.length > 0) return sanitizeReportText(entries.join(". "));
  }

  const entries = Object.entries(record)
    .map(([key, value]) => {
      const text = normalizeReportValue(value);
      if (!text) return "";
      const label = REPORT_ITEM_LABELS[key] || "";
      return label ? `${label}: ${text}` : text;
    })
    .filter(Boolean);

  return sanitizeReportText(entries.join(". "));
}

function normalizeStringArray(
  value: unknown,
  maxItems?: number,
  field?: ReportListField
): string[] {
  const source = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.values(value as Record<string, unknown>)
      : [];
  const items = source
    .map((item) => normalizeReportListItem(item, field))
    .filter(Boolean);
  return typeof maxItems === "number" ? items.slice(0, maxItems) : items;
}

function stripJsonCodeFence(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function hasInvalidReportListText(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized ||
    normalized === "[object object]" ||
    normalized === "undefined" ||
    normalized === "null"
  );
}

function strategicDiagnosisParagraphs(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function isSubstantialParagraph(value: string): boolean {
  const words = value.split(/\s+/).filter(Boolean);
  return value.length >= 80 && words.length >= 12;
}

function reportSerializedLength(value: Record<string, unknown>): number {
  return JSON.stringify(value).length;
}

function getReportContentStrings(value: Record<string, unknown>): string[] {
  return REQUIRED_REPORT_KEYS.flatMap((key) => walkStrings(value[key]));
}

export function estimateGeneratedReportMetrics(value: Record<string, unknown>): GeneratedReportMetrics {
  const text = getReportContentStrings(value).join(" ").replace(/\s+/g, " ").trim();
  const chars = text.length;
  return {
    chars,
    words: text ? text.split(/\s+/).filter(Boolean).length : 0,
    estimatedContentPages: Number(
      (chars / CGI_REPORT_ESTIMATED_CHARS_PER_CONTENT_PAGE).toFixed(2)
    ),
    pageLimit: CGI_REPORT_MAX_CONTENT_PAGES,
    preferredMaxChars: CGI_REPORT_PREFERRED_MAX_CHARS,
    maxChars: CGI_REPORT_MAX_CHARS,
  };
}

function walkStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((item) => walkStrings(item));
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((item) => walkStrings(item));
  }
  return [];
}

function hasUnsafeDuplicatePunctuation(value: string): boolean {
  const sanitized = sanitizeReportText(value);
  return sanitized !== value.trim();
}

function hasReportPunctuationArtifacts(value: Record<string, unknown>): boolean {
  return walkStrings(value).some(hasUnsafeDuplicatePunctuation);
}

function getSectionText(value: unknown): string {
  return walkStrings(value).join(" ");
}

function validationPath(field: string, index?: number): string {
  return typeof index === "number" ? `${field}.${index}` : field;
}

function receivedType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function receivedSummary(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "null";
  if (typeof value === "string") {
    return `string(length=${value.length}, empty=${String(value.trim().length === 0)})`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `${typeof value}(${String(value)})`;
  }
  if (Array.isArray(value)) {
    const itemTypes = Array.from(new Set(value.slice(0, 5).map(receivedType))).join(",");
    return `array(length=${value.length}${itemTypes ? `, item_types=${itemTypes}` : ""})`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).slice(0, 10);
    return `object(keys=${keys.join(",")})`;
  }
  return receivedType(value);
}

function expectedForValidationMessage(message: string, field: string): string | undefined {
  if (message === "missing_key") return "required key";
  if (message.startsWith("missing_")) return "non-empty value";
  if (message === "must contain exactly 5 items") return "array with exactly 5 items";
  if (message === "must contain 3 to 5 items") return "array with 3 to 5 items";
  if (message === "must contain 2 to 4 items") return "array with 2 to 4 items";
  if (message === "must contain 2 to 3 items") return "array with 2 to 3 items";
  if (message === "must contain exactly 3 items") return "array with exactly 3 items";
  if (message === "item must be an object") return "object";
  if (message === "item must be a string") return "string";
  if (message === "invalid list item text") return "non-empty executive text";
  if (message === "item does not follow the required labeled structure") {
    return "string with required labels in order";
  }
  if (message.includes("substantial paragraphs")) return "3 to 5 substantial paragraphs separated by blank lines";
  if (message.includes("serialized characters")) return `serialized report <= ${CGI_REPORT_MAX_CHARS} characters`;
  if (message.includes("respondent perspective")) return "respondent-perspective framing";
  if (message.includes("punctuation")) return "sanitized punctuation";
  if (field === "$" && message.startsWith("parse_error")) return "valid JSON object";
  return undefined;
}

function codeForValidationMessage(message: string): string {
  if (message === "missing_key" || message.startsWith("missing_")) return "missing_required";
  if (message.startsWith("parse_error")) return "invalid_json";
  if (message.includes("must contain")) return "invalid_array_length";
  if (message.includes("must be")) return "invalid_type";
  if (message.includes("does not follow")) return "invalid_structure";
  if (message.includes("invalid list item")) return "invalid_value";
  if (message.includes("serialized characters")) return "too_large";
  if (message.includes("punctuation")) return "unsafe_text";
  if (message.includes("respondent perspective")) return "missing_perspective";
  return "validation_failed";
}

function classifyValidationIssue(
  message: string,
  field: string
): Pick<GeneratedReportValidationError, "category" | "blocksGeneration" | "retryType"> {
  if (message.startsWith("parse_error")) {
    return { category: "critical_structural", blocksGeneration: true, retryType: "full" };
  }
  if (message === "missing_key") {
    const critical = field === "executive_summary" || field === "strategic_diagnosis" || field === "dimension_reading";
    return {
      category: critical ? "critical_structural" : "correctable_structural",
      blocksGeneration: critical,
      retryType: critical ? "full" : "none",
    };
  }
  if (field === "dimension_reading") {
    return { category: "critical_structural", blocksGeneration: true, retryType: "full" };
  }
  if (message.includes("must not exceed") || message.includes("estimated content pages")) {
    return { category: "critical_structural", blocksGeneration: true, retryType: "full" };
  }
  if (message.includes("must contain 2 to 4") || message.includes("must contain 2 to 3")) {
    return { category: "correctable_structural", blocksGeneration: false, retryType: "none" };
  }
  if (message.includes("item must be a string") || message.includes("invalid list item text")) {
    return { category: "correctable_structural", blocksGeneration: false, retryType: "none" };
  }
  if (
    message.includes("does not follow the required labeled structure") ||
    message.includes("respondent perspective") ||
    message.includes("punctuation") ||
    message.includes("substantial paragraphs") ||
    message.includes("preferred")
  ) {
    return { category: "editorial", blocksGeneration: false, retryType: "none" };
  }
  return { category: "quality", blocksGeneration: false, retryType: "none" };
}

function enrichValidationError(input: {
  field: string;
  index?: number;
  value?: unknown;
  message: string;
}): GeneratedReportValidationError {
  const missingField = input.message.startsWith("missing_")
    ? input.message.replace(/^missing_/, "")
    : "";
  const path =
    input.field === "dimension_reading" && typeof input.index === "number" && missingField
      ? `${input.field}.${input.index}.${missingField}`
      : validationPath(input.field, input.index);
  const classification = classifyValidationIssue(input.message, input.field);
  return {
    field: input.field,
    index: input.index,
    message: input.message,
    code: codeForValidationMessage(input.message),
    ...classification,
    path,
    expected: expectedForValidationMessage(input.message, input.field),
    received_type: receivedType(input.value),
    received_summary: receivedSummary(input.value),
    section: input.field === "$" ? "root" : input.field,
  };
}

function logCgiAiValidationFailure(input: {
  attempt: number;
  maxAttempts: number;
  retryType: "full" | "none";
  model: string;
  durationMs: number;
  errors: GeneratedReportValidationError[];
  warnings?: GeneratedReportValidationError[];
  metrics?: GeneratedReportMetrics;
  responseMeta?: OpenAiResponseMeta;
}) {
  console.error(
    "[CGI OpenAI] cgi_ai_validation_failed",
    JSON.stringify({
      event: "cgi_ai_validation_failed",
      attempt: input.attempt,
      max_attempts: input.maxAttempts,
      retry_type: input.retryType,
      model: input.model,
      duration_ms: input.durationMs,
      response: sanitizeOpenAiResponseMeta(input.responseMeta),
      metrics: input.metrics,
      errors: input.errors.map(({ path, code, message, expected, received_type, received_summary, section, category, retryType }) => ({
        attempt: input.attempt,
        model: input.model,
        duration_ms: input.durationMs,
        reason_category: category,
        retry_type: retryType,
        path,
        code,
        message,
        expected,
        received_type,
        received_summary,
        section,
      })),
      warnings: (input.warnings || []).map(({ path, code, message, section, category }) => ({
        path,
        code,
        message,
        section,
        reason_category: category,
      })),
    })
  );
}

function sanitizeValidationErrorsForOperationalUse(errors: GeneratedReportValidationError[]) {
  return errors.map(({ path, code, message, expected, received_type, received_summary, section, category, retryType }) => ({
    path,
    code,
    message,
    reason_category: category,
    retry_type: retryType,
    expected,
    received_type,
    received_summary,
    section,
  }));
}

function itemHasContractLabels(value: string, field: ReportListField): boolean {
  let cursor = -1;
  return REPORT_ITEM_CONTRACTS[field].every((contractField) => {
    const index = value.indexOf(`${contractField.label}:`);
    if (index <= cursor) return false;
    cursor = index;
    return true;
  });
}

function hasRespondentPerspectiveLanguage(parsed: Record<string, unknown>): boolean {
  const dimensionReading = Array.isArray(parsed.dimension_reading)
    ? parsed.dimension_reading
        .map((item) => {
          if (!item || typeof item !== "object") return "";
          const record = item as Record<string, unknown>;
          return [record.analysis, record.implication].map((value) => String(value || "")).join(" ");
        })
        .join(" ")
    : "";
  const source = [
    parsed.executive_summary,
    parsed.strategic_diagnosis,
    parsed.critical_bottlenecks,
    dimensionReading,
    parsed.final_recommendations,
  ]
    .map((value) => getSectionText(value))
    .join(" ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  const markers = [
    "respostas deste executivo",
    "perspectiva do respondente",
    "diagnostico sugere",
    "ha sinais de que",
    "hipotese deve ser validada",
    "as respostas indicam",
    "as respostas sugerem",
    "a leitura do cgi sugere",
    "from the respondent's perspective",
    "the diagnosis suggests",
    "there are signs that",
    "this hypothesis should be validated",
    "desde la perspectiva del respondente",
    "el diagnostico sugiere",
    "hay senales de que",
    "esta hipotesis debe validarse",
  ];
  return markers.some((marker) => source.includes(marker));
}

function hasStructurallyUsefulReport(parsed: Record<string, unknown> | null): boolean {
  if (!parsed) return false;
  const executiveSummary = getSectionText(parsed.executive_summary).trim();
  const strategicDiagnosis = getSectionText(parsed.strategic_diagnosis).trim();
  const dimensions = parsed.dimension_reading;
  return (
    executiveSummary.length >= 80 &&
    strategicDiagnosis.length >= 160 &&
    Array.isArray(dimensions) &&
    dimensions.length === 5
  );
}

function summarizeRetryErrors(errors: unknown[]): string {
  return errors
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const record = entry as { errors?: unknown };
      if (!Array.isArray(record.errors)) return [];
      return record.errors.slice(0, 6).map((error) => {
        if (!error || typeof error !== "object") return "";
        const errorRecord = error as Partial<GeneratedReportValidationError>;
        return `${errorRecord.path || errorRecord.field || "$"}: ${
          errorRecord.code || "validation_failed"
        } (${errorRecord.message || "invalid"})`;
      });
    })
    .filter(Boolean)
    .slice(0, 8)
    .join("\n- ");
}

export function buildReportRetryInstruction(errors: unknown[], attempt: number): string {
  if (attempt <= 1) return "";
  const serializedErrors = JSON.stringify(errors).toLowerCase();
  const needsCondensation =
    serializedErrors.includes("serialized characters") ||
    serializedErrors.includes("output_truncated");
  const specificErrors = summarizeRetryErrors(errors);
  const condensationInstruction = needsCondensation
    ? `\n- O relatório anterior ficou longo demais ou truncou. Condense o texto para ${CGI_REPORT_PREFERRED_MIN_CHARS}-${CGI_REPORT_PREFERRED_MAX_CHARS} caracteres e no máximo ${CGI_REPORT_MAX_CHARS}, preservando todas as chaves obrigatórias, 3-5 parágrafos em strategic_diagnosis e os números exigidos de itens. Não corte JSON nem remova seções.`
    : "";
  const specificInstruction = specificErrors
    ? `\n\nErros específicos da validação anterior:\n- ${specificErrors}`
    : "";

  return `\n\nA tentativa anterior falhou na validação de contrato. Corrija obrigatoriamente:
- Use de 2 a 3 strings legíveis nos campos critical_bottlenecks, strategic_bets, renunciations, governance_system e final_recommendations; 3 é preferível, mas 2 é aceitável quando o relatório ficar mais consistente.
- Cada item desses arrays deve seguir preferencialmente os rótulos e a ordem definidos no prompt.
- Não retorne objetos nesses arrays e nunca produza "[object Object]".
- Remova artefatos de pontuação como "..", ",.", ";;" e espaços antes de pontuação.
- Enquadre conclusões pela perspectiva do respondente e valide hipóteses com outras lideranças e dados internos.
- strategic_diagnosis deve ter 3 a 5 parágrafos substanciais separados por linha em branco.${condensationInstruction}${specificInstruction}`;
}

export function validateGeneratedReportJson(value: string | Record<string, unknown>): {
  ok: boolean;
  errors: GeneratedReportValidationError[];
  structural_errors: GeneratedReportValidationError[];
  correctable_errors: GeneratedReportValidationError[];
  editorial_warnings: GeneratedReportValidationError[];
  quality_warnings: GeneratedReportValidationError[];
  warnings: GeneratedReportValidationError[];
  reportStatus: "report_ready" | "report_ready_with_warnings" | "report_failed";
  metrics: GeneratedReportMetrics | null;
  parsed: Record<string, unknown> | null;
} {
  let parsed: Record<string, unknown>;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value) as Record<string, unknown>;
    } catch (error) {
      const parseIssue = enrichValidationError({
        field: "$",
        message: `parse_error: ${error instanceof Error ? error.message : String(error)}`,
        value,
      });
      return {
        ok: false,
        parsed: null,
        metrics: null,
        reportStatus: "report_failed",
        structural_errors: [parseIssue],
        correctable_errors: [],
        editorial_warnings: [],
        quality_warnings: [],
        warnings: [],
        errors: [parseIssue],
      };
    }
  } else {
    parsed = value;
  }

  const structuralErrors: GeneratedReportValidationError[] = [];
  const correctableErrors: GeneratedReportValidationError[] = [];
  const editorialWarnings: GeneratedReportValidationError[] = [];
  const qualityWarnings: GeneratedReportValidationError[] = [];
  const addIssue = (input: {
    field: string;
    index?: number;
    value?: unknown;
    message: string;
  }) => {
    const issue = enrichValidationError(input);
    if (issue.blocksGeneration) {
      structuralErrors.push(issue);
    } else if (issue.category === "correctable_structural") {
      correctableErrors.push(issue);
    } else if (issue.category === "editorial") {
      editorialWarnings.push(issue);
    } else {
      qualityWarnings.push(issue);
    }
  };
  for (const key of REQUIRED_REPORT_KEYS) {
    if (!(key in parsed)) {
      addIssue({ field: key, value: undefined, message: "missing_key" });
    }
  }

  const metrics = estimateGeneratedReportMetrics(parsed);
  if (reportSerializedLength(parsed) > CGI_REPORT_MAX_CHARS || metrics.chars > CGI_REPORT_MAX_CHARS) {
    addIssue({
      field: "$",
      value: { serialized: reportSerializedLength(parsed), content_chars: metrics.chars },
      message: `must not exceed ${CGI_REPORT_MAX_CHARS} serialized characters`,
    });
  } else if (metrics.chars > CGI_REPORT_WARNING_CHARS) {
    addIssue({
      field: "$",
      value: metrics.chars,
      message: `preferred content length is at most ${CGI_REPORT_WARNING_CHARS} characters`,
    });
  }
  if (metrics.estimatedContentPages > CGI_REPORT_MAX_CONTENT_PAGES) {
    addIssue({
      field: "$",
      value: metrics.estimatedContentPages,
      message: `estimated content pages must not exceed ${CGI_REPORT_MAX_CONTENT_PAGES}`,
    });
  }

  if (hasReportPunctuationArtifacts(parsed)) {
    addIssue({
      field: "$",
      message: "contains duplicated punctuation or unsafe spacing artifacts",
    });
  }

  if (!hasRespondentPerspectiveLanguage(parsed)) {
    addIssue({
      field: "$",
      message: "must frame conclusions from the respondent perspective",
    });
  }

  const dimensionReading = parsed.dimension_reading;
  if (!Array.isArray(dimensionReading) || dimensionReading.length !== 5) {
    addIssue({
      field: "dimension_reading",
      value: dimensionReading,
      message: "must contain exactly 5 items",
    });
  } else {
    dimensionReading.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        addIssue({ field: "dimension_reading", index, value: item, message: "item must be an object" });
        return;
      }
      const record = item as Record<string, unknown>;
      for (const key of ["dimension", "score", "analysis", "implication"]) {
        if (record[key] === undefined || record[key] === null || String(record[key]).trim() === "") {
          addIssue({
            field: "dimension_reading",
            index,
            value: record[key],
            message: `missing_${key}`,
          });
        }
      }
    });
  }

  const evidenceSummary = parsed.evidence_summary;
  if (!Array.isArray(evidenceSummary) || evidenceSummary.length < 2 || evidenceSummary.length > 4) {
    addIssue({
      field: "evidence_summary",
      value: evidenceSummary,
      message: "must contain 2 to 4 items",
    });
  }

  const hypotheses = parsed.hypotheses_to_validate;
  if (!Array.isArray(hypotheses) || hypotheses.length < 2 || hypotheses.length > 4) {
    addIssue({
      field: "hypotheses_to_validate",
      value: hypotheses,
      message: "must contain 2 to 4 items",
    });
  }

  for (const field of EXACT_THREE_REPORT_LIST_FIELDS) {
    const list = parsed[field];
    if (!Array.isArray(list) || list.length < 2 || list.length > 4) {
      addIssue({
        field,
        value: list,
        message: "must contain 2 to 3 items",
      });
      continue;
    }
    if (list.length !== 3) {
      addIssue({
        field,
        value: list,
        message: "preferred cardinality is exactly 3 items",
      });
    }
    list.forEach((item, index) => {
      if (typeof item !== "string") {
        addIssue({ field, index, value: item, message: "item must be a string" });
        return;
      }
      if (hasInvalidReportListText(item)) {
        addIssue({ field, index, value: item, message: "invalid list item text" });
      }
      if (!itemHasContractLabels(item, field)) {
        addIssue({
          field,
          index,
          value: item,
          message: "item does not follow the required labeled structure",
        });
      }
    });
  }

  const paragraphs = strategicDiagnosisParagraphs(parsed.strategic_diagnosis);
  if (
    paragraphs.length < 3 ||
    paragraphs.length > 5 ||
    paragraphs.some((paragraph) => !isSubstantialParagraph(paragraph))
  ) {
    addIssue({
      field: "strategic_diagnosis",
      value: parsed.strategic_diagnosis,
      message: "must contain 3 to 5 substantial paragraphs separated by blank lines",
    });
  }

  const warnings = [...editorialWarnings, ...qualityWarnings];
  const errors = [...structuralErrors, ...correctableErrors];
  return {
    ok: errors.length === 0,
    errors,
    structural_errors: structuralErrors,
    correctable_errors: correctableErrors,
    editorial_warnings: editorialWarnings,
    quality_warnings: qualityWarnings,
    warnings,
    reportStatus: warnings.length ? "report_ready_with_warnings" : "report_ready",
    metrics,
    parsed,
  };
}

export function normalizeGeneratedReportJson(value: string): string {
  if (!value) return "";
  const candidate = stripJsonCodeFence(value);
  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    const strategicDiagnosis = typeof parsed.strategic_diagnosis === "string"
      ? parsed.strategic_diagnosis
          .split(/\n\s*\n/)
          .map((paragraph) => sanitizeReportText(paragraph))
          .filter(Boolean)
          .join("\n\n")
      : parsed.strategic_diagnosis;
    const dimensionReading = Array.isArray(parsed.dimension_reading)
      ? parsed.dimension_reading.map((item) => {
          if (!item || typeof item !== "object") return item;
          const record = item as Record<string, unknown>;
          return {
            ...record,
            dimension: normalizeReportValue(record.dimension),
            analysis: normalizeReportValue(record.analysis),
            implication: normalizeReportValue(record.implication),
          };
        })
      : parsed.dimension_reading;
    const normalized = {
      ...parsed,
      report_title: normalizeReportValue(parsed.report_title),
      report_subtitle: normalizeReportValue(parsed.report_subtitle),
      email_subject: normalizeReportValue(parsed.email_subject),
      methodology_note: normalizeReportValue(parsed.methodology_note),
      executive_summary: normalizeReportValue(parsed.executive_summary),
      strategic_diagnosis: strategicDiagnosis,
      dimension_reading: dimensionReading,
      evidence_summary: normalizeStringArray(parsed.evidence_summary, 4),
      critical_bottlenecks: normalizeStringArray(parsed.critical_bottlenecks, undefined, "critical_bottlenecks"),
      strategic_bets: normalizeStringArray(parsed.strategic_bets, undefined, "strategic_bets"),
      renunciations: normalizeStringArray(parsed.renunciations, undefined, "renunciations"),
      governance_system: normalizeStringArray(parsed.governance_system, undefined, "governance_system"),
      hypotheses_to_validate: normalizeStringArray(parsed.hypotheses_to_validate, 4),
      final_recommendations: normalizeStringArray(parsed.final_recommendations, undefined, "final_recommendations"),
    };
    return JSON.stringify(normalized);
  } catch {
    return candidate;
  }
}

async function rewriteAiReportLanguage({
  apiKey,
  model,
  text,
  language,
}: {
  apiKey: string;
  model: string;
  text: string;
  language: "en" | "es";
}): Promise<string> {
  const instruction =
    language === "es"
      ? "Reescriba TODO el contenido textual de este JSON en español latinoamericano neutro, adecuado para Panamá y América Latina. Mantenga exactamente las mismas claves, estructura, números, marcas, URLs y nombres propios. No deje ninguna frase en portugués. Devuelva solo JSON válido."
      : "Rewrite ALL textual content in this JSON in natural executive English. Keep exactly the same keys, structure, numbers, brands, URLs and proper names. Do not leave any Portuguese or Spanish sentences. Return only valid JSON.";

  const response = await fetchOpenAiResponse(apiKey, {
      model,
      store: false,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: instruction }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text }],
        },
      ],
      text: { format: { type: "json_object" } },
      max_output_tokens: CGI_REPORT_MAX_OUTPUT_TOKENS,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[CGI OpenAI] rewrite_failed", response.status, errorText);
    return text;
  }

  const data = await response.json();
  const outputText = extractOutputText(data);
  const meta = extractOpenAiResponseMeta(
    data,
    outputText,
    CGI_REPORT_MAX_OUTPUT_TOKENS
  );
  if (meta.isTruncated) {
    console.error("[CGI OpenAI] rewrite_output_truncated", meta);
    return text;
  }
  return outputText || text;
}

function isTransientOpenAiFailure(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function logCgiAiAttempt(input: {
  event: string;
  attempt: number;
  maxAttempts: number;
  retryType: "full" | "none";
  reasonCategory: ValidationIssueCategory | "http" | "exception" | "truncation";
  model: string;
  durationMs: number;
  status?: number;
  errorCode?: string;
  message?: string;
  responseMeta?: OpenAiResponseMeta;
  metrics?: GeneratedReportMetrics | null;
}) {
  console.info(
    "[CGI OpenAI]",
    input.event,
    JSON.stringify({
      event: input.event,
      attempt: input.attempt,
      max_attempts: input.maxAttempts,
      retry_type: input.retryType,
      reason_category: input.reasonCategory,
      model: input.model,
      duration_ms: input.durationMs,
      status: input.status,
      error_code: input.errorCode,
      message: input.message,
      response: sanitizeOpenAiResponseMeta(input.responseMeta),
      metrics: input.metrics || undefined,
    })
  );
}

async function generateAiDiagnostic({
  lead,
  answers,
  score,
  websiteEnrichment,
  requestContext,
  language,
}: {
  lead: CgiLead;
  answers: Record<string, number>;
  score: CgiScoreResult;
  websiteEnrichment: WebsiteEnrichment;
  requestContext: RequestContext;
  language: "pt" | "en" | "es";
}): Promise<AiResult> {
  const openAiConfig = getOpenAiConfig();
  if (!openAiConfig) return { status: "not_configured", text: "", plainText: "" };

  const { apiKey, model } = openAiConfig;
  const dimensionTranslations: DimensionTranslations = {
    pt: {
      strategy: "Estratégia",
      market: "Mercado e Cliente",
      growthMachine: "Máquina de Crescimento",
      execution: "Execução e Gestão",
      leadership: "Liderança e Cultura de Crescimento",
    },
    en: {
      strategy: "Strategy",
      market: "Market and Customer",
      growthMachine: "Growth Machine",
      execution: "Execution and Management",
      leadership: "Leadership and Growth Culture",
    },
    es: {
      strategy: "Estrategia",
      market: "Mercado y Cliente",
      growthMachine: "Máquina de Crecimiento",
      execution: "Ejecución y Gestión",
      leadership: "Liderazgo y Cultura de Crecimiento",
    },
  };
  const compactAnswers = CGI_QUESTIONS.map((question) => ({
    id: question.id,
    dimension:
      dimensionTranslations[language][question.dimensionId] || question.dimensionId,
    question:
      language === "pt"
        ? question.text
        : `Assessment question ${question.id} for ${
            dimensionTranslations[language][question.dimensionId] || question.dimensionId
          }`,
    answer: answers[question.id],
  }));
  const localizedDimensions = CGI_DIMENSIONS.map((dimension) => ({
    ...dimension,
    title: dimensionTranslations[language][dimension.id] || dimension.title,
    shortTitle: dimensionTranslations[language][dimension.id] || dimension.title,
  }));
  const localizedScore = {
    ...score,
    dimensionScores: score.dimensionScores.map((item) => ({
      ...item,
      title: dimensionTranslations[language][item.dimensionId] || item.title,
    })),
    attentionPoints: score.attentionPoints.map((item) => ({
      ...item,
      title: dimensionTranslations[language][item.dimensionId] || item.title,
    })),
  };
  const languageInstruction =
    language === "en"
      ? "CRITICAL LANGUAGE RULE: write every title, paragraph, bullet and recommendation in natural executive English. Do not write Portuguese or Spanish words, except proper names, brands, URLs and literal user-provided values."
      : language === "es"
        ? "REGLA CRÍTICA DE IDIOMA: escriba todos los títulos, párrafos, bullets y recomendaciones en español latinoamericano neutro, adecuado para Panamá y América Latina. No escriba palabras en portugués o inglés, excepto nombres propios, marcas, URLs y valores literales informados por el usuario. Use los nombres de dimensión en español."
      : "REGRA CRÍTICA DE IDIOMA: escreva todos os títulos, parágrafos, bullets e recomendações em português executivo do Brasil. Não misture inglês ou espanhol, exceto nomes próprios, marcas, URLs e valores literais informados pelo usuário.";
  const responseEvidence = buildCgiReportEvidence({
    answers,
    score,
    language,
    dimensionTranslations,
    respondentComment: lead.comments || "",
  });
  const promptPayload = {
    report_guide: buildCgiReportPromptContext(),
    lead,
    respondent_context: {
      company: lead.company || "",
      company_domain: getWebsiteDomain(lead.companyWebsite),
      respondent_name: lead.name || "",
      role: lead.role || "",
      region: lead.region || "",
      business_unit: lead.businessUnit || "",
      company_id: lead.companyId || "",
      respondent_id: lead.respondentId || "",
      sector: lead.sector || "",
      commercial_relationship_model:
        lead.commercialRelationshipModel || "",
      employee_count: lead.employeeCount || "",
      annual_revenue_range: lead.annualRevenue || "",
      current_challenge: lead.currentChallenge || "",
      growth_goal: lead.growthGoal || "",
      investment_intent: lead.investmentIntent || "",
      comments_available: Boolean(String(lead.comments || "").trim()),
    },
    request_context: requestContext,
    public_website_context: websiteEnrichment,
    language,
    cgi: localizedScore,
    dimensions: localizedDimensions,
    answers: compactAnswers,
    response_evidence: responseEvidence,
  };

  try {
    const validationErrors: unknown[] = [];
    for (let attempt = 1; attempt <= CGI_REPORT_TRANSIENT_MAX_FULL_ATTEMPTS; attempt += 1) {
      const attemptStartedAt = Date.now();
      const retryInstruction = buildReportRetryInstruction(validationErrors, attempt);
      let response: Response;
      try {
        response = await fetchOpenAiResponse(apiKey, {
          model,
          store: false,
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: `${buildCgiReportSystemPrompt(languageInstruction)}${retryInstruction}`,
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: JSON.stringify(promptPayload),
                },
              ],
            },
          ],
          text: {
            format: {
              type: "json_object",
            },
          },
          max_output_tokens: CGI_REPORT_MAX_OUTPUT_TOKENS,
        });
      } catch (error) {
        const durationMs = Date.now() - attemptStartedAt;
        validationErrors.push({
          attempt,
          type: "transient_exception",
          error: error instanceof Error ? error.name : "unknown_error",
        });
        logCgiAiAttempt({
          event: "cgi_ai_full_attempt_exception",
          attempt,
          maxAttempts: CGI_REPORT_TRANSIENT_MAX_FULL_ATTEMPTS,
          retryType: "full",
          reasonCategory: "exception",
          model,
          durationMs,
          errorCode: error instanceof Error ? error.name : "unknown_error",
          message: error instanceof Error ? error.message : String(error),
        });
        if (attempt < CGI_REPORT_TRANSIENT_MAX_FULL_ATTEMPTS) continue;
        return { status: "error", text: "", plainText: "" };
      }

      if (!response.ok) {
        const errorText = await response.text();
        const sanitizedError = snippet(errorText, 500);
        validationErrors.push({
          attempt,
          type: "http_error",
          status: response.status,
          transient: isTransientOpenAiFailure(response.status),
          error: sanitizedError,
        });
        logCgiAiAttempt({
          event: "cgi_ai_full_attempt_http_failed",
          attempt,
          maxAttempts: isTransientOpenAiFailure(response.status)
            ? CGI_REPORT_TRANSIENT_MAX_FULL_ATTEMPTS
            : attempt,
          retryType: "full",
          reasonCategory: "http",
          model,
          durationMs: Date.now() - attemptStartedAt,
          status: response.status,
          errorCode: "openai_http_failed",
          message: sanitizedError,
        });
        if (isTransientOpenAiFailure(response.status) && attempt < CGI_REPORT_TRANSIENT_MAX_FULL_ATTEMPTS) {
          continue;
        }
        return { status: "error", text: "", plainText: "" };
      }

      const data = await response.json();
      const rawText = extractOutputText(data);
      const responseMeta = extractOpenAiResponseMeta(
        data,
        rawText,
        CGI_REPORT_MAX_OUTPUT_TOKENS
      );
      if (responseMeta.isTruncated) {
        validationErrors.push({
          attempt,
          type: "output_truncated",
          meta: responseMeta,
        });
        logCgiAiAttempt({
          event: "cgi_ai_output_truncated",
          attempt,
          maxAttempts: CGI_REPORT_TRANSIENT_MAX_FULL_ATTEMPTS,
          retryType: "full",
          reasonCategory: "truncation",
          model,
          durationMs: Date.now() - attemptStartedAt,
          responseMeta,
        });
        continue;
      }

      let text = normalizeGeneratedReportJson(rawText);
      if (language !== "pt") {
        if (hasPortugueseLeak(text)) {
          console.warn("[CGI OpenAI] portuguese_leak_detected", { language });
        }
        text = await rewriteAiReportLanguage({
          apiKey,
          model,
          text,
          language,
        });
        text = normalizeGeneratedReportJson(text);
      }

      const validation = validateGeneratedReportJson(text);
      if (validation.ok || !validation.structural_errors.length) {
        const acceptedWarnings = [
          ...validation.warnings,
          ...(validation.ok ? [] : validation.correctable_errors),
        ];
        if (!validation.ok && !hasStructurallyUsefulReport(validation.parsed)) {
          validationErrors.push({
            attempt,
            errors: sanitizeValidationErrorsForOperationalUse(validation.errors),
            warnings: sanitizeValidationErrorsForOperationalUse(validation.warnings),
            metrics: validation.metrics,
          });
          logCgiAiValidationFailure({
            attempt,
            maxAttempts: 1,
            retryType: "none",
            model,
            durationMs: Date.now() - attemptStartedAt,
            errors: validation.errors,
            warnings: validation.warnings,
            metrics: validation.metrics || undefined,
            responseMeta,
          });
          break;
        }
        if (acceptedWarnings.length) {
          console.warn(
            "[CGI OpenAI] cgi_ai_report_ready_with_warnings",
            JSON.stringify({
              event: "cgi_ai_report_ready_with_warnings",
              attempt,
              max_attempts: 0,
              retry_type: "none",
              model,
              duration_ms: Date.now() - attemptStartedAt,
              response: sanitizeOpenAiResponseMeta(responseMeta),
              metrics: validation.metrics,
              warnings: sanitizeValidationErrorsForOperationalUse(acceptedWarnings),
            })
          );
        }
        return {
          status: "generated",
          text,
          plainText: formatAiReportForEmail(text, language),
          reportStatus: acceptedWarnings.length ? "report_ready_with_warnings" : "report_ready",
          warnings: acceptedWarnings,
          metrics: validation.metrics || undefined,
        };
      }

      validationErrors.push({
        attempt,
        errors: sanitizeValidationErrorsForOperationalUse(validation.errors),
        warnings: sanitizeValidationErrorsForOperationalUse(validation.warnings),
        metrics: validation.metrics,
      });
      logCgiAiValidationFailure({
        attempt,
        maxAttempts: validation.structural_errors.length
          ? CGI_REPORT_CRITICAL_MAX_FULL_ATTEMPTS
          : 1,
        retryType: validation.structural_errors.length ? "full" : "none",
        model,
        durationMs: Date.now() - attemptStartedAt,
        errors: validation.errors,
        warnings: validation.warnings,
        metrics: validation.metrics || undefined,
        responseMeta,
      });
      if (validation.structural_errors.length && attempt >= CGI_REPORT_CRITICAL_MAX_FULL_ATTEMPTS) {
        break;
      }
    }

    console.error(
      "[CGI OpenAI] invalid_report_json",
      JSON.stringify({
        event: "cgi_ai_generation_failed",
        reason: "invalid_report_json",
        model,
        attempts: validationErrors.length,
        max_transient_full_attempts: CGI_REPORT_TRANSIENT_MAX_FULL_ATTEMPTS,
        max_critical_full_attempts: CGI_REPORT_CRITICAL_MAX_FULL_ATTEMPTS,
        openai_attempt_timeout_ms: CGI_OPENAI_TIMEOUT_MS,
        openai_total_timeout_budget_ms: CGI_OPENAI_TOTAL_TIMEOUT_BUDGET_MS,
        validation_failures: validationErrors,
      })
    );
    return { status: "error", text: "", plainText: "" };
  } catch (error) {
    console.error("[CGI OpenAI] error", error);
    return { status: "error", text: "", plainText: "" };
  }
}

function getDimensionScore(score: CgiScoreResult, dimensionId: string): number | null {
  return score.dimensionScores.find((item) => item.dimensionId === dimensionId)?.score ?? null;
}

async function persistCompletedAssessmentBestEffort({
  payload,
  answers,
  score,
}: {
  payload: CgiPayload;
  answers: Record<string, number>;
  score: CgiScoreResult;
}): Promise<{ publicAssessmentId: string; completionEventId: string } | null> {
  const publicAssessmentId = normalizePublicAssessmentId(payload.public_assessment_id);
  const anonymousSessionId = normalizeAnonymousSessionId(payload.anonymous_session_id);
  if (!publicAssessmentId || !anonymousSessionId) return null;

  const startedAtMs = Number(payload.startedAt);
  const completionTimeSeconds = Number.isFinite(startedAtMs)
    ? Math.max(0, Math.round((Date.now() - startedAtMs) / 1000))
    : null;
  const lowest = [...score.dimensionScores].sort((a, b) => a.score - b.score)[0];
  const highest = [...score.dimensionScores].sort((a, b) => b.score - a.score)[0];

  const assessment = await upsertAssessment({
    publicAssessmentId,
    anonymousSessionId,
    status: "completed",
    currentQuestion: CGI_QUESTIONS.length,
    progressPercent: 100,
    completedAt: new Date().toISOString(),
    completionTimeSeconds,
    cgiScore: score.finalScore,
    strategyScore: getDimensionScore(score, "strategy"),
    marketCustomerScore: getDimensionScore(score, "market"),
    growthEngineScore: getDimensionScore(score, "growthMachine"),
    executionManagementScore: getDimensionScore(score, "execution"),
    leadershipCultureScore: getDimensionScore(score, "leadership"),
    cgiLevel: score.level.id,
    lowestDimension: lowest?.dimensionId ?? null,
    highestDimension: highest?.dimensionId ?? null,
    methodologyVersion: REPORT_METHODOLOGY_VERSION,
    scoringVersion: SCORING_VERSION,
  });

  if (assessment?.id) {
    await upsertAnswers(assessment.id, answers);
  }

  const completionEventId = String(payload.completion_event_id || createEventId());
  await insertFunnelEvent({
    eventId: completionEventId,
    anonymousSessionId,
    publicAssessmentId,
    eventName: "cgi_assessment_completed",
    source: "server",
    pagePath: "/cgi",
    metadata: {
      cgi_score: score.finalScore,
      cgi_level: score.level.id,
      strategy_score: getDimensionScore(score, "strategy"),
      market_customer_score: getDimensionScore(score, "market"),
      growth_engine_score: getDimensionScore(score, "growthMachine"),
      execution_management_score: getDimensionScore(score, "execution"),
      leadership_culture_score: getDimensionScore(score, "leadership"),
      lowest_dimension: lowest?.dimensionId ?? null,
      highest_dimension: highest?.dimensionId ?? null,
      completion_time_seconds: completionTimeSeconds,
    },
  });

  return { publicAssessmentId, completionEventId };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method === "GET") {
    const publicAssessmentId = normalizePublicAssessmentId(req.query.public_assessment_id);
    if (publicAssessmentId) {
      const reportState = await getCgiReportState({ publicAssessmentId });
      if (reportState?.status === "ready") {
        respondWithStoredReport(res, reportState.report);
        return;
      }
      if (reportState?.status === "generating") {
        res.status(202).json({
          ok: true,
          public_assessment_id: reportState.publicAssessmentId,
          completion_event_id: reportState.completionEventId,
          report_status: "report_generating",
          secondary_sync_status: "secondary_sync_pending",
        });
        return;
      }
      if (reportState?.status === "failed") {
        res.status(503).json({
          ok: false,
          public_assessment_id: reportState.publicAssessmentId,
          completion_event_id: reportState.completionEventId,
          error: "report_failed",
          report_status: "report_failed",
          message: "Não foi possível concluir a geração do relatório neste momento.",
        });
        return;
      }
      res.status(404).json({ ok: false, error: "report_not_found" });
      return;
    }

    res.status(200).json({
      ok: true,
      configured: getAppsScriptUrl().length > 0,
      openaiConfigured: Boolean(getOpenAiConfig()),
      openaiModelConfigured: Boolean(getConfiguredOpenAiModel()),
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  let payload: CgiPayload;
  try {
    payload = readPayload(req);
  } catch {
    res.status(400).json({ ok: false, error: "invalid_json" });
    return;
  }
  const handlerStartedAt = Date.now();
  const correlationId = String(
    payload.completion_event_id ||
      payload.public_assessment_id ||
      createEventId()
  );

  const spamError = validateSpam(payload);
  if (spamError) {
    res.status(400).json({ ok: false, error: spamError });
    return;
  }

  const leadValidation = await validateLead(payload.lead);
  if (leadValidation.error) {
    res.status(400).json({
      ok: false,
      error: leadValidation.error,
      emailValidation: leadValidation.emailValidation,
    });
    return;
  }

  const professionalContentError = validateProfessionalContent({
    strict: [
      { field: "name", value: payload.lead?.name || "" },
      { field: "company", value: payload.lead?.company || "" },
      { field: "role", value: payload.lead?.role || "" },
    ],
    contextual: [
      { field: "sector", value: payload.lead?.sector || "" },
      {
        field: "commercial_relationship_model",
        value: payload.lead?.commercialRelationshipModel || "",
      },
      { field: "current_challenge", value: payload.lead?.currentChallenge || "" },
      { field: "growth_goal", value: payload.lead?.growthGoal || "" },
      {
        field: "comments",
        value: payload.lead?.comments || "",
        maxLength: CGI_COMMENTS_MAX_LENGTH,
      },
    ],
  });
  if (professionalContentError) {
    res.status(422).json({ ok: false, error: "invalid_professional_content" });
    return;
  }

  const answers = normalizeCgiAnswers(payload.answers ?? {});
  if (!areCgiAnswersComplete(answers)) {
    res.status(400).json({ ok: false, error: "incomplete_answers" });
    return;
  }

  const language: "pt" | "en" | "es" =
    payload.language === "en" || payload.language === "es" ? payload.language : "pt";
  const score = calculateCgiScore(answers);
  const normalizedPublicAssessmentId = normalizePublicAssessmentId(payload.public_assessment_id);
  const normalizedCompletionEventId = String(payload.completion_event_id || "");

  const existingReport = await getReadyCgiReport({
    publicAssessmentId: normalizedPublicAssessmentId,
    completionEventId: normalizedCompletionEventId,
  });
  if (existingReport) {
    logCgiOperation({
      correlationId,
      publicAssessmentId: existingReport.publicAssessmentId,
      operation: "report_idempotency_lookup",
      success: true,
      durationMs: Date.now() - handlerStartedAt,
    });
    respondWithStoredReport(res, existingReport);
    return;
  }

  const reportLock = await tryCreateCgiReportGenerationLock({
    publicAssessmentId: normalizedPublicAssessmentId,
    anonymousSessionId: normalizeAnonymousSessionId(payload.anonymous_session_id),
    completionEventId: normalizedCompletionEventId,
    language,
  });
  if (reportLock.status === "existing_ready") {
    logCgiOperation({
      correlationId,
      publicAssessmentId: reportLock.report.publicAssessmentId,
      operation: "report_idempotency_lock",
      success: true,
      durationMs: Date.now() - handlerStartedAt,
    });
    respondWithStoredReport(res, reportLock.report);
    return;
  }
  if (reportLock.status === "in_progress") {
    logCgiOperation({
      correlationId,
      publicAssessmentId: normalizedPublicAssessmentId,
      operation: "report_idempotency_lock",
      success: true,
      errorCode: "report_generation_in_progress",
      durationMs: Date.now() - handlerStartedAt,
    });
    res.status(202).json({
      ok: true,
      public_assessment_id: normalizedPublicAssessmentId,
      completion_event_id: normalizedCompletionEventId,
      report_status: "report_generating",
      secondary_sync_status: "secondary_sync_pending",
    });
    return;
  }
  if (reportLock.status === "failed") {
    logCgiOperation({
      correlationId,
      publicAssessmentId: normalizedPublicAssessmentId,
      operation: "report_idempotency_lock",
      success: false,
      errorCode: reportLock.errorCode || "report_failed",
      durationMs: Date.now() - handlerStartedAt,
    });
    res.status(503).json({
      ok: false,
      error: "report_failed",
      report_status: "report_failed",
      message: "Não foi possível concluir a geração do relatório neste momento.",
    });
    return;
  }
  if (reportLock.status === "unavailable") {
    logCgiOperation({
      correlationId,
      publicAssessmentId: normalizedPublicAssessmentId,
      operation: "report_idempotency_lock",
      success: false,
      errorCode: "report_persistence_unavailable",
      durationMs: Date.now() - handlerStartedAt,
    });
    res.status(503).json({
      ok: false,
      error: "report_persistence_unavailable",
      report_status: "report_failed",
      message:
        "Não foi possível iniciar a geração do relatório neste momento. Tente novamente em alguns instantes.",
    });
    return;
  }

  const requestContext = getRequestContext(req);
  const websiteEnrichment = await enrichCompanyWebsite(payload.lead?.companyWebsite);
  const aiModel = getConfiguredOpenAiModel();
  const aiStartedAt = Date.now();
  const ai = await generateAiDiagnostic({
    lead: payload.lead as CgiLead,
    answers,
    score,
    websiteEnrichment,
    requestContext,
    language,
  });
  if (ai.status === "error" || (ai.status === "generated" && !ai.text.trim())) {
    logCgiOperation({
      correlationId,
      publicAssessmentId: normalizedPublicAssessmentId,
      operation: "report_generation",
      success: false,
      errorCode: "ai_generation_failed",
      durationMs: Date.now() - aiStartedAt,
    });
    await markCgiReportFailed({
      publicAssessmentId: normalizedPublicAssessmentId,
      errorCode: "ai_generation_failed",
      errorMessage: "AI report validation failed after retry limit.",
    });
    res.status(503).json({
      ok: false,
      error: "report_generation_failed",
      report_status: "report_failed",
      message: "Não foi possível concluir o parecer neste momento. Tente novamente.",
      ai_generation_status: ai.status,
    });
    return;
  }
  const reportStatus = ai.reportStatus || "report_ready";
  logCgiOperation({
    correlationId,
    publicAssessmentId: normalizedPublicAssessmentId,
    operation: "report_generation",
    success: true,
    durationMs: Date.now() - aiStartedAt,
  });
  const reportSaved = await saveCompletedCgiReport({
    publicAssessmentId: normalizedPublicAssessmentId,
    anonymousSessionId: normalizeAnonymousSessionId(payload.anonymous_session_id),
    completionEventId: normalizedCompletionEventId,
    language,
    aiStatus: ai.status,
    aiReport: ai.text,
    aiReportText: ai.plainText,
    model: ai.status === "generated" ? aiModel : null,
    lead: payload.lead,
    answers,
    score,
    websiteEnrichment,
    requestContext,
  });
  logCgiOperation({
    correlationId,
    publicAssessmentId: normalizedPublicAssessmentId,
    operation: "report_persistence",
    success: reportSaved,
    errorCode: reportSaved ? undefined : "report_persistence_unavailable",
    durationMs: Date.now() - aiStartedAt,
  });
  if (!reportSaved) {
    await markCgiReportFailed({
      publicAssessmentId: normalizedPublicAssessmentId,
      errorCode: "report_persistence_unavailable",
      errorMessage: "The report was generated but could not be persisted.",
    });
    res.status(503).json({
      ok: false,
      error: "report_persistence_unavailable",
      report_status: "report_failed",
      message: "Não foi possível salvar o relatório neste momento.",
      ai_generation_status: ai.status,
    });
    return;
  }
  let supabaseCompletion: Awaited<ReturnType<typeof persistCompletedAssessmentBestEffort>> = null;
  try {
    const persistenceStartedAt = Date.now();
    supabaseCompletion = await persistCompletedAssessmentBestEffort({
      payload,
      answers,
      score,
    });
    logCgiOperation({
      correlationId,
      publicAssessmentId: normalizedPublicAssessmentId,
      operation: "assessment_persistence",
      success: Boolean(supabaseCompletion),
      errorCode: supabaseCompletion ? undefined : "assessment_persistence_unavailable",
      durationMs: Date.now() - persistenceStartedAt,
    });
  } catch (error) {
    console.error("[CGI Supabase]", {
      operation: "persist_completed_assessment",
      status: 0,
      public_assessment_id: normalizePublicAssessmentId(payload.public_assessment_id),
      error: error instanceof Error ? error.message : String(error || ""),
    });
    logCgiOperation({
      correlationId,
      publicAssessmentId: normalizedPublicAssessmentId,
      operation: "assessment_persistence",
      success: false,
      errorCode: "assessment_persistence_exception",
      durationMs: Date.now() - handlerStartedAt,
    });
  }

  const responsePublicAssessmentId =
    supabaseCompletion?.publicAssessmentId ||
    normalizePublicAssessmentId(payload.public_assessment_id);
  const responseCompletionEventId =
    supabaseCompletion?.completionEventId ||
    String(payload.completion_event_id || "");

  const url = getAppsScriptUrl();
  if (!url) {
    await updateCgiReportSecondarySyncStatus({
      publicAssessmentId: responsePublicAssessmentId,
      secondarySyncStatus: "secondary_sync_failed",
    });
    res.status(200).json({
      ok: true,
      public_assessment_id: responsePublicAssessmentId,
      completion_event_id: responseCompletionEventId,
      report_status: reportStatus,
      secondary_sync_status: "secondary_sync_failed",
      save: { ok: false, error: "not_configured" },
      score,
      ai,
      ai_generation_status: ai.status,
      websiteEnrichment,
      requestContext,
    });
    logCgiOperation({
      correlationId,
      publicAssessmentId: responsePublicAssessmentId,
      operation: "status_response",
      success: true,
      errorCode: "secondary_sync_not_configured",
      durationMs: Date.now() - handlerStartedAt,
    });
    return;
  }

  const upstreamPayload = {
    action: "cgi_assessment",
    language,
    lead: payload.lead,
    answers,
    score,
    emailValidation: leadValidation.emailValidation,
    websiteEnrichment,
    requestContext,
    aiReport: ai.text,
    aiReportText: ai.plainText,
    aiStatus: ai.status,
    userAgent: req.headers["user-agent"] ?? "",
    referrer: req.headers.referer ?? req.headers.referrer ?? "",
    publicAssessmentId: responsePublicAssessmentId,
    anonymousSessionId: normalizeAnonymousSessionId(payload.anonymous_session_id),
    completionEventId: responseCompletionEventId,
    reportStatus,
    secondarySyncStatus: "secondary_sync_pending",
    attribution: payload.attribution || {},
  };

  let upstream: Response;
  let text = "";
  let data: unknown = {};
  try {
    const sheetsStartedAt = Date.now();
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(upstreamPayload),
    });
    text = await upstream.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: snippet(text), contentType: upstream.headers.get("content-type") };
    }
    logCgiOperation({
      correlationId,
      publicAssessmentId: responsePublicAssessmentId,
      operation: "sheets_sync",
      success: upstream.ok && (data as { ok?: boolean }).ok === true,
      errorCode:
        upstream.ok && (data as { ok?: boolean }).ok === true
          ? undefined
          : "sheets_sync_failed",
      durationMs: Date.now() - sheetsStartedAt,
    });
  } catch (error) {
    await updateCgiReportSecondarySyncStatus({
      publicAssessmentId: responsePublicAssessmentId,
      secondarySyncStatus: "secondary_sync_failed",
    });
    res.status(200).json({
      ok: true,
      public_assessment_id: responsePublicAssessmentId,
      completion_event_id: responseCompletionEventId,
      report_status: reportStatus,
      secondary_sync_status: "secondary_sync_failed",
      save: {
        ok: false,
        error: "upstream_request_failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      score,
      ai,
      ai_generation_status: ai.status,
      websiteEnrichment,
      requestContext,
    });
    logCgiOperation({
      correlationId,
      publicAssessmentId: responsePublicAssessmentId,
      operation: "status_response",
      success: true,
      errorCode: "secondary_sync_request_failed",
      durationMs: Date.now() - handlerStartedAt,
    });
    return;
  }

  if (!upstream.ok || (data as { ok?: boolean }).ok !== true) {
    const upstreamError = String((data as { error?: unknown }).error || "");
    const error =
      upstreamError === "validation"
        ? "apps_script_outdated_or_wrong_deployment"
        : "upstream_failed";

    await updateCgiReportSecondarySyncStatus({
      publicAssessmentId: responsePublicAssessmentId,
      secondarySyncStatus: "secondary_sync_failed",
    });
    res.status(200).json({
      ok: true,
      public_assessment_id: responsePublicAssessmentId,
      completion_event_id: responseCompletionEventId,
      report_status: reportStatus,
      secondary_sync_status: "secondary_sync_failed",
      save: {
        ok: false,
        error,
        upstreamStatus: upstream.status,
        upstreamUrl: upstream.url,
        upstream: data,
      },
      score,
      ai,
      ai_generation_status: ai.status,
      websiteEnrichment,
      requestContext,
    });
    logCgiOperation({
      correlationId,
      publicAssessmentId: responsePublicAssessmentId,
      operation: "status_response",
      success: true,
      errorCode: "secondary_sync_failed",
      durationMs: Date.now() - handlerStartedAt,
    });
    return;
  }

  await updateCgiReportSecondarySyncStatus({
    publicAssessmentId: responsePublicAssessmentId,
    secondarySyncStatus: "secondary_sync_succeeded",
  });
  res.status(200).json({
    ok: true,
    public_assessment_id: responsePublicAssessmentId,
    completion_event_id: responseCompletionEventId,
    report_status: reportStatus,
    secondary_sync_status: "secondary_sync_succeeded",
    save: { ok: true },
    score,
    ai,
    ai_generation_status: ai.status,
    websiteEnrichment,
    requestContext,
  });
  logCgiOperation({
    correlationId,
    publicAssessmentId: responsePublicAssessmentId,
    operation: "status_response",
    success: true,
    durationMs: Date.now() - handlerStartedAt,
  });
}
