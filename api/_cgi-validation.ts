import { resolve4, resolve6, resolveMx } from "node:dns/promises";

export type CgiLanguage = "pt" | "en" | "es";

export type CgiLeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  companyWebsite?: string;
  company_website?: string | null;
  role?: string;
  sector?: string;
  commercialRelationshipModel?: string;
  commercial_relationship_model?: string;
  employeeCount?: string;
  employee_count?: string;
  annualRevenue?: string;
  annual_revenue_range?: string;
  currentChallenge?: string;
  current_challenge?: string;
  growthGoal?: string;
  growth_goal?: string;
  investmentIntent?: string;
  investment_intent?: string;
  comments?: string | null;
};

export type NormalizedCgiLead = {
  name: string;
  email: string;
  phone: string;
  company: string;
  company_website: string | null;
  role: string;
  sector: string;
  commercial_relationship_model: string;
  employee_count: string;
  annual_revenue_range: string;
  current_challenge: string;
  growth_goal: string;
  investment_intent: string;
  comments: string | null;
};

export type EmailValidation = {
  status: "ok" | "error";
  domain: string;
  hasMx: boolean;
  hasAddressFallback: boolean;
  error?: string;
};

export type CgiAttribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_page: string | null;
  gclid: string | null;
  fbclid: string | null;
  li_fat_id: string | null;
};

export type CgiEventName =
  | "cgi_landing_view"
  | "cgi_start_click"
  | "cgi_lead_form_view"
  | "cgi_lead_submitted"
  | "cgi_assessment_started"
  | "cgi_progress"
  | "cgi_assessment_completed"
  | "cgi_result_viewed"
  | "cgi_report_requested"
  | "cgi_cta_clicked"
  | "cgi_assessment_resumed"
  | "cgi_validation_error"
  | "cgi_system_error";

export const ALLOWED_CGI_EVENTS: CgiEventName[] = [
  "cgi_landing_view",
  "cgi_start_click",
  "cgi_lead_form_view",
  "cgi_lead_submitted",
  "cgi_assessment_started",
  "cgi_progress",
  "cgi_assessment_completed",
  "cgi_result_viewed",
  "cgi_report_requested",
  "cgi_cta_clicked",
  "cgi_assessment_resumed",
  "cgi_validation_error",
  "cgi_system_error",
];

const METADATA_ALLOWLIST: Record<CgiEventName, string[]> = {
  cgi_landing_view: ["language", "page_path"],
  cgi_start_click: ["cta_location"],
  cgi_lead_form_view: [],
  cgi_lead_submitted: ["company_size", "industry", "investment_intent"],
  cgi_assessment_started: [],
  cgi_progress: ["progress_percent"],
  cgi_assessment_completed: [
    "cgi_score",
    "cgi_level",
    "strategy_score",
    "market_customer_score",
    "growth_engine_score",
    "execution_management_score",
    "leadership_culture_score",
    "lowest_dimension",
    "highest_dimension",
    "completion_time_seconds",
  ],
  cgi_result_viewed: ["cgi_score", "cgi_level"],
  cgi_report_requested: ["destination_type"],
  cgi_cta_clicked: ["cta_name", "cta_location", "destination_type"],
  cgi_assessment_resumed: ["progress_percent"],
  cgi_validation_error: ["error_code"],
  cgi_system_error: ["error_code", "page_path"],
};

const PII_KEYS = new Set([
  "name",
  "email",
  "phone",
  "company",
  "company_website",
  "companyWebsite",
  "comments",
  "answers",
  "aiReport",
  "report",
]);

function cleanString(value: unknown, maxLength = 500): string {
  return String(value ?? "").trim().slice(0, maxLength);
}

function optionalString(value: unknown, maxLength = 500): string | null {
  const cleaned = cleanString(value, maxLength);
  return cleaned ? cleaned : null;
}

export function normalizeLanguage(value: unknown): CgiLanguage {
  return value === "en" || value === "es" ? value : "pt";
}

export function normalizePublicAssessmentId(value: unknown): string {
  return cleanString(value, 80);
}

export function normalizeAnonymousSessionId(value: unknown): string {
  return cleanString(value, 120);
}

export function normalizeAttribution(value: unknown): CgiAttribution {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    utm_source: optionalString(input.utm_source, 160),
    utm_medium: optionalString(input.utm_medium, 160),
    utm_campaign: optionalString(input.utm_campaign, 220),
    utm_content: optionalString(input.utm_content, 220),
    utm_term: optionalString(input.utm_term, 220),
    referrer: optionalString(input.referrer, 1000),
    landing_page: optionalString(input.landing_page, 1000),
    gclid: optionalString(input.gclid, 300),
    fbclid: optionalString(input.fbclid, 300),
    li_fat_id: optionalString(input.li_fat_id, 300),
  };
}

export function normalizeLead(input: CgiLeadInput | undefined): NormalizedCgiLead | null {
  if (!input) return null;
  return {
    name: cleanString(input.name),
    email: cleanString(input.email).toLowerCase(),
    phone: cleanString(input.phone, 80),
    company: cleanString(input.company),
    company_website: optionalString(input.company_website ?? input.companyWebsite, 1000),
    role: cleanString(input.role),
    sector: cleanString(input.sector),
    commercial_relationship_model: cleanString(
      input.commercial_relationship_model ?? input.commercialRelationshipModel
    ),
    employee_count: cleanString(input.employee_count ?? input.employeeCount, 80),
    annual_revenue_range: cleanString(input.annual_revenue_range ?? input.annualRevenue, 120),
    current_challenge: cleanString(input.current_challenge ?? input.currentChallenge, 180),
    growth_goal: cleanString(input.growth_goal ?? input.growthGoal, 120),
    investment_intent: cleanString(input.investment_intent ?? input.investmentIntent, 120),
    comments: optionalString(input.comments, 4000),
  };
}

export function validateNormalizedLead(lead: NormalizedCgiLead | null): string | null {
  if (!lead) return "lead_required";
  const required: Array<keyof NormalizedCgiLead> = [
    "name",
    "email",
    "phone",
    "company",
    "role",
    "sector",
    "commercial_relationship_model",
    "employee_count",
    "annual_revenue_range",
    "current_challenge",
    "growth_goal",
    "investment_intent",
  ];
  const missing = required.find((key) => !String(lead[key] ?? "").trim());
  if (missing) return `missing_${String(missing)}`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "invalid_email";
  return null;
}

function getEmailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] || "";
}

export async function validateEmailDomain(email: string): Promise<EmailValidation> {
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
      return { status: "ok", domain, hasMx: true, hasAddressFallback: false };
    }
  } catch {
    // Valid domains can rely on A/AAAA fallback.
  }

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
}

export function sanitizeEventMetadata(
  eventName: CgiEventName,
  metadata: unknown
): Record<string, string | number | boolean | null> {
  const source = metadata && typeof metadata === "object" ? metadata as Record<string, unknown> : {};
  const allowed = new Set(METADATA_ALLOWLIST[eventName] || []);
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => allowed.has(key) && !PII_KEYS.has(key))
      .map(([key, value]) => {
        if (typeof value === "number" || typeof value === "boolean" || value === null) {
          return [key, value];
        }
        return [key, cleanString(value, 300)];
      })
  ) as Record<string, string | number | boolean | null>;
}

export function isAllowedCgiEvent(value: unknown): value is CgiEventName {
  return ALLOWED_CGI_EVENTS.includes(value as CgiEventName);
}

export function hasForbiddenMetadataKeys(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object") return false;
  return Object.keys(metadata as Record<string, unknown>).some((key) => PII_KEYS.has(key));
}
