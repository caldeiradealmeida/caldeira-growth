import type { CgiLead } from "../types";

export type SamePersonCandidate = Pick<CgiLead, "id" | "name" | "company" | "created_at">;

/** Never merges anything -- just finds other cgi_leads rows sharing the same
 * normalized email, for the UI to show as a dismissable hint. Linking always
 * requires an explicit admin action (crm_link_person RPC). */
export function findSameEmailCandidates(
  allLeads: CgiLead[],
  currentLead: Pick<CgiLead, "id" | "email_normalized">
): SamePersonCandidate[] {
  return allLeads
    .filter((l) => l.id !== currentLead.id && l.email_normalized === currentLead.email_normalized)
    .map(({ id, name, company, created_at }) => ({ id, name, company, created_at }));
}
