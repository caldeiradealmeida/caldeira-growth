import { crmSupabase } from "../lib/supabaseClient";
import { buildOpportunities } from "../logic/buildOpportunities";
import type { CgiAssessment, CgiAttribution, CgiLead, CgiReportSummary, CrmOpportunity, CrmPersonLink } from "../types";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/** Assembles the opportunity list from several RLS-scoped reads. No
 * server-side view/RPC exists for this on purpose (schema frozen for v0.1) --
 * the join happens here, client-side, over a small dataset. */
export async function fetchOpportunityRows() {
  const leadsRes = await crmSupabase.from("cgi_leads").select("*").order("created_at", { ascending: false });
  const leads = unwrap<CgiLead[]>(leadsRes);
  const leadIds = leads.map((l) => l.id);

  if (leadIds.length === 0) {
    return buildOpportunities({ leads: [], opportunities: [], assessments: [], attribution: [], reports: [], personLinks: [] });
  }

  const [opportunitiesRes, assessmentsRes, personLinksRes] = await Promise.all([
    crmSupabase.from("crm_opportunities").select("*").in("lead_id", leadIds),
    crmSupabase.from("cgi_assessments").select("*").in("lead_id", leadIds),
    crmSupabase.from("crm_people_links").select("*").in("lead_id", leadIds),
  ]);

  const opportunities = unwrap<CrmOpportunity[]>(opportunitiesRes);
  const assessments = unwrap<CgiAssessment[]>(assessmentsRes);
  const personLinks = unwrap<CrmPersonLink[]>(personLinksRes);

  const assessmentIds = assessments.map((a) => a.id);
  const publicAssessmentIds = assessments.map((a) => a.public_assessment_id);

  const [attributionRes, reportsRes] = await Promise.all([
    assessmentIds.length
      ? crmSupabase.from("cgi_attribution").select("*").in("assessment_id", assessmentIds)
      : Promise.resolve({ data: [], error: null }),
    publicAssessmentIds.length
      ? crmSupabase
          .from("cgi_reports")
          .select("id,public_assessment_id,report_status,language,ai_report_text,report_json,version,created_at")
          .in("public_assessment_id", publicAssessmentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const attribution = unwrap<CgiAttribution[]>(attributionRes);
  const reports = unwrap<CgiReportSummary[]>(reportsRes);

  return buildOpportunities({ leads, opportunities, assessments, attribution, reports, personLinks });
}
