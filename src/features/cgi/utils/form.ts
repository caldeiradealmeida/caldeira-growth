import { CGI_QUESTIONS, type CgiDimensionId } from "@/data/cgiConfig";
import {
  areCgiAnswersComplete,
  normalizeCgiAnswers,
} from "@/lib/cgiScore";
import { devLeadFallback } from "../config";
import type { LeadForm, LeadPayload } from "../types";

export const CGI_COMMENTS_MAX_LENGTH = 1000;

export function questionsByDimension(
  questions: typeof CGI_QUESTIONS,
  dimensionId: CgiDimensionId
) {
  return questions.filter((question) => question.dimensionId === dimensionId);
}

export function getScoreTone(score: number): string {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-amber-700";
  return "text-destructive";
}

export function normalizeWebsiteInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function parseAnswersJsonInput(value: string): Record<string, number> | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const candidate =
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      ("respostas_json" in parsed || "answers" in parsed)
        ? (parsed as { respostas_json?: unknown; answers?: unknown }).respostas_json ??
          (parsed as { answers?: unknown }).answers
        : parsed;

    const answers =
      typeof candidate === "string"
        ? (JSON.parse(candidate) as Record<string, unknown>)
        : (candidate as Record<string, unknown>);

    const normalized = normalizeCgiAnswers(answers);
    return areCgiAnswersComplete(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export function sanitizePhoneInput(value: string) {
  let next = value.replace(/[^\d+\s()-]/g, "");
  next = next.replace(/\+/g, (match, offset) => (offset === 0 ? match : ""));
  if (next.startsWith("+")) {
    next = `+${next.slice(1).replace(/\+/g, "")}`;
  }
  return next;
}

export function normalizePhone(value: string) {
  const sanitized = sanitizePhoneInput(value);
  const hasLeadingPlus = sanitized.trim().startsWith("+");
  const digits = sanitized.replace(/\D/g, "");
  return hasLeadingPlus ? `+${digits}` : digits;
}

export function isValidPhone(value: string) {
  const normalized = normalizePhone(value);
  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export type PhoneStepAction =
  | { kind: "advance" }
  | { kind: "save_and_advance"; phone: string }
  | { kind: "block_invalid_phone" };

// The CGI phone step has a single action now ("Ver meu resultado"): the
// phone/WhatsApp field is optional, so an empty field must still advance -
// only a non-empty field gets format-validated, exactly like the old
// dedicated "quero conversar" CTA used to (same isValidPhone check, same
// error case), just without requiring a phone at all.
export function decidePhoneStepAction(phone: string): PhoneStepAction {
  const trimmed = phone.trim();
  if (!trimmed) return { kind: "advance" };
  if (!isValidPhone(trimmed)) return { kind: "block_invalid_phone" };
  return { kind: "save_and_advance", phone: trimmed };
}

export function isOtherOption(value: string | undefined) {
  return ["Outro", "Other", "Otro"].includes(String(value || ""));
}

function normalizeAbuseText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[4@]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/(.)\1{2,}/g, "$1$1");
}

function compactAbuseText(value: string) {
  return normalizeAbuseText(value).replace(/[^a-z0-9]+/g, "");
}

const ABUSE_PATTERNS = [
  /(?:^|[^a-z])(?:puta|puto|merda|porra|caralho|cacete|foda|fodase|idiota|imbecil|burro|otario|arrombado|vagabundo|desgracado)(?:[^a-z]|$)/i,
  /(?:^|[^a-z])(?:fuck|shit|bitch|asshole|idiot|moron)(?:[^a-z]|$)/i,
  /(?:^|[^a-z])(?:mierda|puta|puto|idiota|imbecil|pendejo)(?:[^a-z]|$)/i,
];

const COMPACT_ABUSE_PATTERNS = [
  /(?:puta|puto|merda|porra|caralho|cacete|fodase|idiota|imbecil|arrombado)/,
  /(?:fuck|shit|bitch|asshole)/,
  /(?:mierda|pendejo)/,
];

export function hasAbusiveProfessionalContent(value: string) {
  const normalized = normalizeAbuseText(String(value || ""));
  if (ABUSE_PATTERNS.some((pattern) => pattern.test(` ${normalized} `))) return true;

  const compact = compactAbuseText(value);
  if (compact.length < 4) return false;
  return COMPACT_ABUSE_PATTERNS.some((pattern) => pattern.test(compact));
}

export function isValidProfessionalField(value: string, options: { required?: boolean; maxLength?: number } = {}) {
  const text = String(value || "").trim();
  if (options.required && !text) return false;
  if (options.maxLength && text.length > options.maxLength) return false;
  if (!text) return true;
  return !hasAbusiveProfessionalContent(text);
}

export function resolveOtherValue(selected: string | undefined, otherValue: string | undefined) {
  return isOtherOption(selected)
    ? String(otherValue || "").trim()
    : String(selected || "").trim();
}

export function normalizeLeadForSubmit(lead: LeadForm): LeadForm {
  return {
    ...lead,
    phone: normalizePhone(lead.phone),
    companyWebsite: normalizeWebsiteInput(lead.companyWebsite),
    sector: resolveOtherValue(lead.sector, lead.sectorOther),
    sectorOther: "",
    commercialRelationshipModel: resolveOtherValue(
      lead.commercialRelationshipModel,
      lead.commercialRelationshipOther
    ),
    commercialRelationshipOther: "",
  };
}

export function toLeadPayload(lead: LeadForm): LeadPayload {
  const { sectorOther, commercialRelationshipOther, ...payload } = lead;
  void sectorOther;
  void commercialRelationshipOther;
  return payload;
}

export function withDevLeadFallback(lead: LeadForm): LeadForm {
  return {
    ...devLeadFallback,
    ...Object.fromEntries(
      Object.entries(lead).map(([key, value]) => [
        key,
        String(value || "").trim() || devLeadFallback[key as keyof LeadForm],
      ])
    ),
  } as LeadForm;
}
