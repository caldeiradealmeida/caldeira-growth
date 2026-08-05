import { crmSupabase } from "../lib/supabaseClient";
import type { OpportunityUpdatePayload } from "../logic/opportunityUpdate";
import type { CrmOpportunity } from "../types";

/** crm_opportunities rows are created on demand -- most leads have none until
 * an admin first touches them, so this is an upsert keyed on lead_id (the PK). */
export async function saveOpportunity(leadId: string, payload: OpportunityUpdatePayload): Promise<CrmOpportunity> {
  const { data, error } = await crmSupabase
    .from("crm_opportunities")
    .upsert({ lead_id: leadId, ...payload }, { onConflict: "lead_id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as CrmOpportunity;
}
