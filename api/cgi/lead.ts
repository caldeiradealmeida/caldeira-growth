import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createEventId,
  insertFunnelEvent,
  persistLeadForAssessment,
} from "../_cgi-supabase.js";
import {
  hasForbiddenMetadataKeys,
  isAllowedCgiEvent,
  normalizeAnonymousSessionId,
  type CgiLeadInput,
  normalizeLead,
  normalizePublicAssessmentId,
  validateProfessionalContent,
  validateEmailDomain,
  validateNormalizedLead,
  validateNormalizedLeadContext,
  validateNormalizedLeadIdentity,
} from "../_cgi-validation.js";

const PRIVACY_POLICY_VERSION = "2026-07-17";
const LEAD_EVENT_ALLOWLIST = new Set([
  "cgi_lead_submitted",
  "cgi_company_context_submitted",
  "cgi_phone_submitted",
]);

function readPayload(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}") as Record<string, unknown>;
  return (req.body ?? {}) as Record<string, unknown>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = readPayload(req);
  } catch {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  const anonymousSessionId = normalizeAnonymousSessionId(payload.anonymous_session_id);
  const publicAssessmentId = normalizePublicAssessmentId(payload.public_assessment_id);
  const lead = normalizeLead(payload.lead as CgiLeadInput | undefined);
  const eventName = isAllowedCgiEvent(payload.event_name) &&
    LEAD_EVENT_ALLOWLIST.has(payload.event_name)
    ? payload.event_name
    : "cgi_lead_submitted";
  const validationError =
    eventName === "cgi_lead_submitted"
      ? validateNormalizedLeadIdentity(lead)
      : eventName === "cgi_company_context_submitted"
        ? validateNormalizedLeadContext(lead)
        : eventName === "cgi_phone_submitted"
          ? validateNormalizedLeadIdentity(lead)
          : validateNormalizedLead(lead);
  const consentPrivacy = payload.consent_privacy === true;
  const consentMarketing =
    typeof payload.consent_marketing === "boolean" ? payload.consent_marketing : null;
  const eventId = String(payload.event_id || createEventId());

  if (!anonymousSessionId || !publicAssessmentId) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }
  if (!consentPrivacy) {
    res.status(400).json({ ok: false, error: "consent_required" });
    return;
  }
  if (validationError) {
    res.status(400).json({ ok: false, error: validationError });
    return;
  }
  if (!lead) {
    res.status(400).json({ ok: false, error: "lead_required" });
    return;
  }
  const professionalContentError = validateProfessionalContent({
    strict: [
      { field: "name", value: lead.name },
      { field: "company", value: lead.company },
      { field: "role", value: lead.role },
    ],
    contextual: [
      { field: "sector", value: lead.sector },
      { field: "commercial_relationship_model", value: lead.commercial_relationship_model },
      { field: "current_challenge", value: lead.current_challenge },
      { field: "growth_goal", value: lead.growth_goal },
      { field: "comments", value: lead.comments || "", maxLength: 1000 },
    ],
  });
  if (professionalContentError) {
    res.status(422).json({ ok: false, error: "invalid_professional_content" });
    return;
  }
  if (hasForbiddenMetadataKeys(payload.metadata)) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  const emailValidation = await validateEmailDomain(lead.email);
  if (emailValidation.status !== "ok") {
    res.status(400).json({
      ok: false,
      error: "invalid_email_domain",
      emailValidation,
    });
    return;
  }

  const persisted = await persistLeadForAssessment({
    publicAssessmentId,
    anonymousSessionId,
    lead,
    consentPrivacy,
    consentMarketing,
    privacyPolicyVersion: String(payload.privacy_policy_version || PRIVACY_POLICY_VERSION),
  });

  await insertFunnelEvent({
    eventId,
    anonymousSessionId,
    publicAssessmentId,
    eventName,
    source: "server",
    pagePath: "/cgi",
    metadata:
      eventName === "cgi_phone_submitted"
        ? { commercial_interest: payload.commercial_interest === true }
        : {
            company_size: lead.employee_count,
            industry: lead.sector,
            investment_intent: lead.investment_intent,
          },
  });

  res.status(200).json({
    ok: true,
    lead_id: persisted.leadId,
    status: "lead_captured",
    public_assessment_id: publicAssessmentId,
    event_id: eventId,
    event_name: eventName,
    emailValidation,
  });
}
