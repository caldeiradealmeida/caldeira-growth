import { crmSupabase } from "../lib/supabaseClient";
import type { CrmPerson } from "../types";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export async function searchPeople(query: string): Promise<CrmPerson[]> {
  const trimmed = query.trim();
  let builder = crmSupabase.from("crm_people").select("*").order("display_name", { ascending: true }).limit(20);
  if (trimmed) {
    builder = builder.or(`display_name.ilike.%${trimmed}%,primary_email_normalized.ilike.%${trimmed}%`);
  }
  return unwrap<CrmPerson[]>(await builder);
}

export async function createPerson(input: {
  displayName: string;
  primaryEmailNormalized?: string | null;
  phone?: string | null;
}): Promise<CrmPerson> {
  const res = await crmSupabase
    .from("crm_people")
    .insert({
      display_name: input.displayName.trim(),
      primary_email_normalized: input.primaryEmailNormalized?.trim().toLowerCase() || null,
      phone: input.phone?.trim() || null,
    })
    .select("*")
    .single();
  return unwrap<CrmPerson>(res);
}

export async function linkPersonToLead(leadId: string, personId: string): Promise<void> {
  const { error } = await crmSupabase.rpc("crm_link_person", { p_lead_id: leadId, p_person_id: personId });
  if (error) throw new Error(error.message);
}

export async function unlinkPersonFromLead(leadId: string): Promise<void> {
  const { error } = await crmSupabase.rpc("crm_unlink_person", { p_lead_id: leadId });
  if (error) throw new Error(error.message);
}
