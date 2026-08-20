import { crmSupabase } from "../lib/supabaseClient";
import { buildOpportunities } from "../logic/buildOpportunities";
import type { CgiAssessment, CgiAttribution, CgiCommunication, CgiLead, CgiReportSummary, CrmOpportunity, CrmPersonLink } from "../types";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/** Leitura FAIL-SOFT do ledger de comunicações.
 *
 * cgi_communications é a única tabela desta lista que pode legitimamente não
 * existir ainda: a migration é aplicada em produção separadamente do deploy do
 * código. Se essa leitura usasse unwrap(), um Pipe implantado antes da
 * migration lançaria e a tela inteira quebraria por causa de uma coluna
 * acessória. Qualquer falha aqui -- tabela ausente, RLS, rede -- vira lista
 * vazia e um aviso no console, e o Pipe continua mostrando tudo o mais. */
async function fetchCommunicationsSoft(leadIds: string[]): Promise<CgiCommunication[]> {
  if (leadIds.length === 0) return [];
  try {
    const res = await crmSupabase
      .from("cgi_communications")
      .select(
        "id,lead_id,assessment_id,public_assessment_id,communication_type,communication_class,channel,status,scheduled_at,sent_at,failed_at,cancelled_at,recipient_masked,subject,error_code,reason,actor,created_at"
      )
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });
    if (res.error) {
      console.warn("[CRM] ledger de comunicações indisponível:", res.error.message);
      return [];
    }
    return (res.data as CgiCommunication[]) ?? [];
  } catch (error) {
    console.warn(
      "[CRM] ledger de comunicações indisponível:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/** Assembles the opportunity list from several RLS-scoped reads. No
 * server-side view/RPC exists for this on purpose (schema frozen for v0.1) --
 * the join happens here, client-side, over a small dataset. */
export async function fetchOpportunityRows() {
  const leadsRes = await crmSupabase.from("cgi_leads").select("*").order("created_at", { ascending: false });
  const leads = unwrap<CgiLead[]>(leadsRes);
  const leadIds = leads.map((l) => l.id);

  if (leadIds.length === 0) {
    return buildOpportunities({ leads: [], opportunities: [], assessments: [], attribution: [], reports: [], personLinks: [], communications: [] });
  }

  const [opportunitiesRes, assessmentsRes, personLinksRes, communications] = await Promise.all([
    crmSupabase.from("crm_opportunities").select("*").in("lead_id", leadIds),
    crmSupabase.from("cgi_assessments").select("*").in("lead_id", leadIds),
    crmSupabase.from("crm_people_links").select("*").in("lead_id", leadIds),
    fetchCommunicationsSoft(leadIds),
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

  return buildOpportunities({ leads, opportunities, assessments, attribution, reports, personLinks, communications });
}
