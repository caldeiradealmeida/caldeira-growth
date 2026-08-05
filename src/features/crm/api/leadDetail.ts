import { crmSupabase } from "../lib/supabaseClient";
import type {
  CgiAnswer,
  CgiAssessment,
  CgiAttribution,
  CgiLead,
  CgiReport,
  CrmOpportunity,
  CrmPerson,
  CrmPersonLink,
} from "../types";
import type { SamePersonCandidate } from "../logic/samePerson";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export type LeadDetail = {
  lead: CgiLead;
  opportunity: CrmOpportunity | null;
  assessments: CgiAssessment[];
  answers: CgiAnswer[];
  attribution: CgiAttribution[];
  reports: CgiReport[];
  personLink: (CrmPersonLink & { person: CrmPerson }) | null;
  sameEmailCandidates: SamePersonCandidate[];
};

export async function fetchLeadDetail(leadId: string): Promise<LeadDetail> {
  const leadRes = await crmSupabase.from("cgi_leads").select("*").eq("id", leadId).single();
  const lead = unwrap<CgiLead>(leadRes);

  const [opportunityRes, assessmentsRes, personLinkRes, sameEmailRes] = await Promise.all([
    crmSupabase.from("crm_opportunities").select("*").eq("lead_id", leadId).maybeSingle(),
    crmSupabase
      .from("cgi_assessments")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false }),
    crmSupabase
      .from("crm_people_links")
      .select("*, person:crm_people(*)")
      .eq("lead_id", leadId)
      .maybeSingle(),
    crmSupabase
      .from("cgi_leads")
      .select("id,name,company,created_at")
      .eq("email_normalized", lead.email_normalized)
      .neq("id", leadId),
  ]);

  const opportunity = unwrap<CrmOpportunity | null>(opportunityRes);
  const assessments = unwrap<CgiAssessment[]>(assessmentsRes);
  const personLink = unwrap<(CrmPersonLink & { person: CrmPerson }) | null>(personLinkRes);
  const sameEmailCandidates = unwrap<SamePersonCandidate[]>(sameEmailRes);

  const assessmentIds = assessments.map((a) => a.id);
  const publicAssessmentIds = assessments.map((a) => a.public_assessment_id);

  const [answersRes, attributionRes, reportsRes] = await Promise.all([
    assessmentIds.length
      ? crmSupabase.from("cgi_answers").select("*").in("assessment_id", assessmentIds)
      : Promise.resolve({ data: [], error: null }),
    assessmentIds.length
      ? crmSupabase.from("cgi_attribution").select("*").in("assessment_id", assessmentIds)
      : Promise.resolve({ data: [], error: null }),
    publicAssessmentIds.length
      ? crmSupabase.from("cgi_reports").select("*").in("public_assessment_id", publicAssessmentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const answers = unwrap<CgiAnswer[]>(answersRes);
  const attribution = unwrap<CgiAttribution[]>(attributionRes);
  const reports = unwrap<CgiReport[]>(reportsRes)
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { lead, opportunity, assessments, answers, attribution, reports, personLink, sameEmailCandidates };
}
