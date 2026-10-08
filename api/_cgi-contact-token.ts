import { createHmac } from "node:crypto";
import { sha256Hex } from "./_cgi-report-token.js";
import { setContactTokenHash } from "./_cgi-supabase.js";

// Token de contato -- o mesmo link serve para ativar e para cancelar o
// recebimento de insights.
//
// Reaproveita o modelo do token de relatorio em tudo o que importa: token
// opaco na URL, apenas o SHA-256 persistido (cgi_leads.contact_token_hash), e
// a mesma comparacao por hash do lado do banco. Nao ha sistema paralelo.
//
// A UNICA diferenca e a origem do token: aqui ele e DERIVADO por HMAC do
// lead_id, em vez de sorteado. A razao e um requisito que o modelo sorteado
// nao consegue cumprir: o link de descadastro precisa continuar funcionando
// para sempre. Como so o hash e guardado, um token sorteado nao pode ser
// reconstruido depois -- cada novo e-mail teria que sortear outro e invalidar
// os links de todos os e-mails anteriores. Derivar resolve isso sem guardar
// nada em claro: o mesmo lead produz sempre o mesmo token, e o banco continua
// vendo apenas o hash.
//
// Sem CGI_CONTACT_TOKEN_SECRET configurado, tudo aqui devolve null e quem
// chama simplesmente omite o link. Fail-closed: nunca um link quebrado, nunca
// um token fraco.

const SECRET_ENV = "CGI_CONTACT_TOKEN_SECRET";

function readSecret(env: Record<string, string | undefined> = process.env): string | null {
  const secret = String(env[SECRET_ENV] || "").trim();
  // Um segredo curto derrubaria a garantia inteira; melhor nao ter link.
  return secret.length >= 32 ? secret : null;
}

export function isContactTokenConfigured(
  env: Record<string, string | undefined> = process.env
): boolean {
  return readSecret(env) !== null;
}

/** Deriva o token de contato de um lead. Deterministico: o mesmo lead devolve
 * sempre o mesmo token, entao um link enviado ha tres meses continua valendo. */
export function deriveContactToken(
  leadId: string,
  env: Record<string, string | undefined> = process.env
): string | null {
  const secret = readSecret(env);
  if (!secret || !leadId) return null;
  return createHmac("sha256", secret).update(`cgi_contact:${leadId}`, "utf8").digest("base64url");
}

export function contactTokenHash(token: string): string {
  return sha256Hex(token);
}

/** Garante que o hash do token esteja gravado e devolve o token em claro para
 * quem vai montar o link.
 *
 * Idempotente por construcao: como o token e derivado, regravar o hash escreve
 * exatamente o mesmo valor. Por isso a regravacao nunca invalida um link ativo
 * -- que e o requisito. */
export async function ensureContactToken(
  leadId: string,
  existingHash: string | null | undefined,
  env: Record<string, string | undefined> = process.env
): Promise<string | null> {
  const token = deriveContactToken(leadId, env);
  if (!token) return null;
  const hash = contactTokenHash(token);
  if (existingHash === hash) return token;
  const ok = await setContactTokenHash(leadId, hash);
  return ok ? token : null;
}
