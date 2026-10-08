import { crmSupabase } from "../lib/supabaseClient";

export const LEAD_CLASSIFICATIONS = ["legitimate", "test", "spam", "invalid"] as const;
export type LeadClassification = (typeof LEAD_CLASSIFICATIONS)[number];

export const CLASSIFICATION_LABELS: Record<LeadClassification, string> = {
  legitimate: "Legítimo",
  test: "Teste",
  spam: "Spam",
  invalid: "Inválido",
};

export const CLASSIFICATION_HELP: Record<LeadClassification, string> = {
  legitimate: "Pessoa real com interesse real. Aparece na fila e recebe automação.",
  test: "Nosso próprio teste.",
  spam: "Abuso deliberado, humano ou máquina.",
  // A fronteira que mais importa: erro de preenchimento não é abuso.
  invalid: "Pessoa real, dado inutilizável — endereço no campo empresa, nome truncado.",
};

/**
 * Classifica um lead.
 *
 * RPC, não UPDATE. `authenticated` tem apenas SELECT em cgi_leads e deve
 * continuar tendo: dar UPDATE, mesmo por coluna, abriria a tabela inteira ao
 * browser do CRM. A função é SECURITY DEFINER, checa is_crm_admin() por dentro
 * e preenche classified_by com auth.email() no servidor -- o cliente não
 * consegue forjar quem classificou.
 *
 * Funciona para qualquer lead, tenha ele linha em crm_opportunities ou não. Era
 * exatamente esse o defeito de is_test_excluded.
 */
export async function classifyLead(input: {
  leadId: string;
  classification: LeadClassification;
  note?: string;
}): Promise<void> {
  const { error } = await crmSupabase.rpc("cgi_classify_lead", {
    p_lead_id: input.leadId,
    p_classification: input.classification,
    p_note: input.note?.trim() ? input.note.trim() : null,
  });
  if (error) throw new Error(error.message);
}
