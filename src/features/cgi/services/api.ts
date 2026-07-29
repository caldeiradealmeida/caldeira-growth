import {
  CGI_LEAD_ENDPOINT,
  CGI_PRIVACY_POLICY_VERSION,
  CGI_START_ENDPOINT,
} from "../config";
import type { CgiAttribution, CgiConsentState, LeadForm, LeadPayload } from "../types";
import type { CgiDataLayerEvent } from "./analytics";

export async function startCgiAssessment({
  anonymousSessionId,
  language,
  attribution,
}: {
  anonymousSessionId: string;
  language: "pt" | "en" | "es";
  attribution: CgiAttribution | null;
}) {
  const response = await fetch(CGI_START_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anonymous_session_id: anonymousSessionId,
      page_path: window.location.pathname,
      language,
      attribution,
    }),
  });
  const data = await response.json();
  if (!response.ok || data.ok !== true || !data.public_assessment_id) {
    throw new Error(String(data.error || "cgi_start_failed"));
  }
  return data as {
    ok: true;
    public_assessment_id: string;
    status: "created";
  };
}

export function toApiLeadPayload(lead: LeadPayload) {
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    company_website: lead.companyWebsite || null,
    role: lead.role,
    sector: lead.sector,
    commercial_relationship_model: lead.commercialRelationshipModel,
    employee_count: lead.employeeCount,
    annual_revenue_range: lead.annualRevenue,
    current_challenge: lead.currentChallenge,
    growth_goal: lead.growthGoal,
    investment_intent: lead.investmentIntent,
    comments: lead.comments || null,
  };
}

export async function submitCgiLead({
  anonymousSessionId,
  publicAssessmentId,
  lead,
  consent,
  eventId,
  eventName = "cgi_lead_submitted",
  commercialInterest = false,
}: {
  anonymousSessionId: string;
  publicAssessmentId: string;
  lead: LeadPayload;
  consent: CgiConsentState;
  eventId: string;
  eventName?: Extract<
    CgiDataLayerEvent,
    "cgi_lead_submitted" | "cgi_company_context_submitted" | "cgi_phone_submitted"
  >;
  commercialInterest?: boolean;
}) {
  const response = await fetch(CGI_LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_id: eventId,
      anonymous_session_id: anonymousSessionId,
      public_assessment_id: publicAssessmentId,
      event_name: eventName,
      lead: toApiLeadPayload(lead),
      consent_privacy: consent.privacy,
      consent_marketing: consent.marketing,
      commercial_interest: commercialInterest,
      privacy_policy_version: CGI_PRIVACY_POLICY_VERSION,
    }),
  });
  const data = await response.json();
  if (!response.ok || data.ok !== true) {
    throw new Error(String(data.error || "cgi_lead_failed"));
  }
  return data as {
    ok: true;
    lead_id: string | null;
    status: "lead_captured";
    public_assessment_id: string;
    event_id: string;
    event_name: typeof eventName;
  };
}

export function mergeLeadForm(current: LeadForm, patch: Partial<LeadForm>): LeadForm {
  return { ...current, ...patch };
}
