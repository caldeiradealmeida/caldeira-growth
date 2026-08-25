// Opt-in e descadastro por posse de link.
//
// Os dois chamam RPCs do Supabase diretamente por fetch -- de propósito, sem
// @supabase/supabase-js. O cliente supabase-js vive isolado no chunk do CRM
// (scripts/check-crm-bundle-safety.mjs garante isso), e uma página de
// descadastro não pode ser motivo para arrastar essa biblioteca para o bundle
// do site público. Duas chamadas HTTP simples resolvem.
//
// Nenhuma das duas devolve informação: as funções do banco respondem igual
// para token válido e inválido. Isso é intencional -- um link de descadastro
// não pode virar um oráculo que confirma se um e-mail está na base.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export type ConsentSource = "cgi_report" | "report_email";

export type ConsentCallResult = "ok" | "invalid_link" | "unavailable";

/** Lê o token do fragmento (#t=...) e nunca da query string: fragmento não
 * viaja em Referer, não entra em log de servidor e não é indexado. Mesmo
 * padrão já usado pelo link do relatório. */
export function readContactTokenFromHash(hash: string): string | null {
  const raw = String(hash || "").replace(/^#/, "");
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const token = params.get("t");
  if (!token || token.length < 16) return null;
  return token;
}

async function callRpc(fn: string, body: Record<string, unknown>): Promise<ConsentCallResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return "unavailable";
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    return response.ok ? "ok" : "unavailable";
  } catch {
    return "unavailable";
  }
}

export async function grantMarketingConsentByToken(
  token: string,
  source: ConsentSource
): Promise<ConsentCallResult> {
  if (!token || token.length < 16) return "invalid_link";
  return callRpc("cgi_marketing_optin", { p_token: token, p_source: source });
}

export async function revokeMarketingConsentByToken(token: string): Promise<ConsentCallResult> {
  if (!token || token.length < 16) return "invalid_link";
  return callRpc("cgi_marketing_optout", { p_token: token });
}

/** Opt-in dado na tela de resultado.
 *
 * Diferente do opt-in por e-mail, aqui não há token: a prova é o par
 * (sessão anônima, assessment) que o CGI já usa para escrever tudo o mais
 * desta sessão, verificado no servidor. `consent_marketing: true` vai
 * explícito no corpo -- o servidor recusa qualquer outro valor, para que
 * nenhum POST acidental possa ser lido como consentimento. */
export async function grantMarketingConsentFromReport(input: {
  anonymousSessionId: string;
  publicAssessmentId: string;
}): Promise<ConsentCallResult> {
  if (!input.anonymousSessionId || !input.publicAssessmentId) return "invalid_link";
  try {
    const response = await fetch("/api/cgi/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "cgi_marketing_consent_granted",
        anonymous_session_id: input.anonymousSessionId,
        public_assessment_id: input.publicAssessmentId,
        consent_marketing: true,
      }),
    });
    return response.ok ? "ok" : "unavailable";
  } catch {
    return "unavailable";
  }
}
