import { randomUUID } from "node:crypto";

// Communication Engine -- Fase 1: o registro (ledger).
//
// POSICAO NA ARQUITETURA
// ----------------------
// Esta camada NAO decide se um e-mail pode sair e NAO envia nada. Quem decide
// continua sendo o executor de cada fluxo (_cgi-report-email.ts,
// _cgi-abandonment-email.ts) usando os marcadores que ja estao em producao
// (report_email_sent_at / abandonment_email_sent_at). O que este modulo faz e
// registrar, depois do fato, o que foi comunicado -- para que exista historico
// completo por lead, e para que um dia exista "proxima comunicacao".
//
// DUAL-WRITE NAO BLOQUEANTE
// -------------------------
// Toda funcao aqui e best-effort e NUNCA lanca: uma falha de rede, uma tabela
// ainda inexistente (migration nao aplicada) ou um erro de permissao devolvem
// um resultado tipado e escrevem log. Um e-mail transacional validamente
// enviado jamais pode ser afetado por um problema de contabilidade.
//
// IDEMPOTENCIA
// ------------
// A duplicata e impedida pelo banco, nao por logica de aplicacao: dedupe_key e
// UNIQUE. Tipos one-shot (um por assessment, para sempre) produzem uma chave
// deterministica; tipos repetiveis por natureza (toque humano, follow-up
// comercial) recebem um sufixo unico e portanto nunca colidem. Um insert que
// bate na unique volta como "duplicate" -- um retry/cron/backfill que tentar
// registrar duas vezes a mesma comunicacao e um no-op silencioso e correto.

import { logSupabaseFailure, supabaseInsert } from "./_cgi-supabase.js";

export const COMMUNICATION_TYPES = [
  "report_delivery",
  "report_followup_d2",
  "report_followup_d5",
  "abandon_lead_d1",
  "abandon_progress_d1",
  "insight_d2",
  "howto_d7",
  "strategic_d21",
  "checkin_d45",
  "revisit_d90",
  "commercial_followup",
  "manual_email",
] as const;

export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

export const COMMUNICATION_CLASSES = ["transactional", "nurturing", "commercial"] as const;
export type CommunicationClass = (typeof COMMUNICATION_CLASSES)[number];

export const COMMUNICATION_CHANNELS = ["email", "whatsapp", "manual"] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const COMMUNICATION_STATUSES = [
  "scheduled",
  "sending",
  "sent",
  "failed",
  "cancelled",
  "suppressed",
] as const;
export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number];

/** Classificacao congelada no registro. E o que decide se consentimento de
 * marketing e exigido -- ver requiresMarketingConsent abaixo.
 *
 *  transactional -- consequencia direta de um ato do proprio destinatario
 *                   (pediu o diagnostico, comecou e parou). Regra vigente e
 *                   preservada: NAO depende de consent_marketing.
 *  nurturing     -- conteudo que nos decidimos enviar. Exige opt-in explicito.
 *  commercial    -- toque humano do processo comercial, registrado a posteriori.
 */
export const COMMUNICATION_CLASS_BY_TYPE: Record<CommunicationType, CommunicationClass> = {
  report_delivery: "transactional",
  report_followup_d2: "transactional",
  report_followup_d5: "transactional",
  abandon_lead_d1: "transactional",
  abandon_progress_d1: "transactional",
  insight_d2: "nurturing",
  howto_d7: "nurturing",
  strategic_d21: "nurturing",
  checkin_d45: "nurturing",
  revisit_d90: "nurturing",
  commercial_followup: "commercial",
  manual_email: "commercial",
};

/** Tipos que, por natureza, podem acontecer mais de uma vez para a mesma
 * pessoa. Todo o resto e one-shot por assessment. */
const REPEATABLE_COMMUNICATION_TYPES: ReadonlySet<CommunicationType> = new Set([
  "commercial_followup",
  "manual_email",
]);

export function getCommunicationClass(type: CommunicationType): CommunicationClass {
  return COMMUNICATION_CLASS_BY_TYPE[type];
}

export function isRepeatableCommunicationType(type: CommunicationType): boolean {
  return REPEATABLE_COMMUNICATION_TYPES.has(type);
}

/** Unica regra de consentimento do motor: nurturing exige opt-in de marketing,
 * transacional e comercial nao. Deliberadamente uma funcao pura, para que a
 * regra seja testavel e nao fique espalhada por cada executor. */
export function requiresMarketingConsent(type: CommunicationType): boolean {
  return getCommunicationClass(type) === "nurturing";
}

/** Porteiro do nurturing futuro. Nao e chamado por nenhum envio transacional de
 * hoje -- existe para que, quando o primeiro nurture for implementado, ele nao
 * tenha como esquecer de perguntar. Fail-closed: consentimento desconhecido
 * (null/undefined) nao autoriza. */
export function isCommunicationAllowedByConsent(input: {
  type: CommunicationType;
  consentMarketing?: boolean | null;
}): boolean {
  if (!requiresMarketingConsent(input.type)) return true;
  return input.consentMarketing === true;
}

/** Chave de idempotencia.
 *
 * Escopo = public_assessment_id quando existe; senao "lead:<uuid>" (um toque
 * comercial pode nao ter assessment). Tipos one-shot geram sempre a mesma
 * chave, entao o segundo registro colide na UNIQUE e vira no-op. Tipos
 * repetiveis recebem um sufixo unico -- ou o que o chamador informar, para que
 * um retry de uma MESMA ocorrencia ainda possa deduplicar se ele tiver como
 * nomea-la. */
export function buildCommunicationDedupeKey(input: {
  type: CommunicationType;
  publicAssessmentId?: string | null;
  leadId?: string | null;
  occurrenceKey?: string | null;
}): string {
  const scope = input.publicAssessmentId?.trim()
    ? input.publicAssessmentId.trim()
    : input.leadId?.trim()
      ? `lead:${input.leadId.trim()}`
      : "orphan";
  if (isRepeatableCommunicationType(input.type)) {
    const occurrence = input.occurrenceKey?.trim() || randomUUID();
    return `${scope}:${input.type}:${occurrence}`;
  }
  return `${scope}:${input.type}`;
}

export type RecordCommunicationOutcome =
  | "recorded"
  | "duplicate"
  | "skipped_disabled"
  | "skipped_invalid"
  | "error";

export type RecordCommunicationResult = {
  outcome: RecordCommunicationOutcome;
  dedupeKey: string | null;
  detail?: string;
};

/** Fail-closed. Enquanto CGI_COMMUNICATIONS_LEDGER_ENABLED nao for "true",
 * nenhuma linha e escrita e nenhum caminho de envio muda de comportamento --
 * o deploy pode ir para producao antes da migration existir. */
export function isCommunicationsLedgerEnabled(): boolean {
  return process.env.CGI_COMMUNICATIONS_LEDGER_ENABLED === "true";
}

export type RecordCommunicationInput = {
  type: CommunicationType;
  status: Extract<CommunicationStatus, "sent" | "failed" | "scheduled" | "suppressed" | "cancelled">;
  channel?: CommunicationChannel;
  leadId?: string | null;
  assessmentId?: string | null;
  publicAssessmentId?: string | null;
  occurrenceKey?: string | null;
  recipient?: string | null;
  recipientMasked?: string | null;
  subject?: string | null;
  provider?: string | null;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  reason?: string | null;
  actor?: string | null;
  consentMarketing?: boolean | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  failedAt?: string | null;
  metadata?: Record<string, unknown>;
  now?: number;
};

function maskRecipient(email: string | null | undefined): string | null {
  const value = String(email || "").trim();
  if (!value) return null;
  const at = value.indexOf("@");
  if (at <= 0) return "***";
  return `${value.slice(0, 1)}***${value.slice(at)}`;
}

/** Registra UMA comunicacao ja resolvida (enviada, falha, agendada, cancelada).
 * Nunca lanca. O chamador pode ignorar o retorno com seguranca -- ele existe
 * para telemetria e para os testes. */
export async function recordCommunication(
  input: RecordCommunicationInput
): Promise<RecordCommunicationResult> {
  if (!isCommunicationsLedgerEnabled()) {
    return { outcome: "skipped_disabled", dedupeKey: null };
  }

  const communicationClass = COMMUNICATION_CLASS_BY_TYPE[input.type];
  if (!communicationClass) {
    return { outcome: "skipped_invalid", dedupeKey: null, detail: `unknown_type:${input.type}` };
  }

  const dedupeKey = buildCommunicationDedupeKey({
    type: input.type,
    publicAssessmentId: input.publicAssessmentId,
    leadId: input.leadId,
    occurrenceKey: input.occurrenceKey,
  });

  const nowIso = new Date(input.now ?? Date.now()).toISOString();
  const body: Record<string, unknown> = {
    lead_id: input.leadId || null,
    assessment_id: input.assessmentId || null,
    public_assessment_id: input.publicAssessmentId || null,
    communication_type: input.type,
    communication_class: communicationClass,
    channel: input.channel || "email",
    status: input.status,
    dedupe_key: dedupeKey,
    recipient_masked: input.recipientMasked ?? maskRecipient(input.recipient),
    subject: input.subject || null,
    provider: input.provider || null,
    provider_message_id: input.providerMessageId || null,
    error_code: input.errorCode || null,
    error_message: input.errorMessage || null,
    reason: input.reason || null,
    actor: input.actor || null,
    consent_marketing_snapshot:
      typeof input.consentMarketing === "boolean" ? input.consentMarketing : null,
    metadata: input.metadata || {},
  };

  // Carimbos coerentes com os CHECKs da tabela: cada estado exige o seu.
  if (input.status === "sent") body.sent_at = input.sentAt || nowIso;
  if (input.status === "failed") body.failed_at = input.failedAt || nowIso;
  if (input.status === "scheduled") body.scheduled_at = input.scheduledAt || nowIso;
  if (input.status === "cancelled") body.cancelled_at = nowIso;

  const result = await supabaseInsert("cgi_communications", body);

  if (result.ok) return { outcome: "recorded", dedupeKey };

  // 409 = a comunicacao ja estava registrada. Isso e o mecanismo funcionando,
  // nao um erro: nao polui o log.
  if (result.status === 409) return { outcome: "duplicate", dedupeKey };

  logSupabaseFailure("record_communication", {
    status: result.status,
    error: result.error,
    publicAssessmentId: input.publicAssessmentId || null,
    leadId: input.leadId || null,
  });
  return { outcome: "error", dedupeKey, detail: result.error || `http_${result.status}` };
}

/** Envelope para uso dentro de um executor de envio: registra e engole
 * qualquer excecao inesperada, garantindo que a contabilidade jamais mude o
 * resultado do envio. Sempre devolve um resultado. */
export async function recordCommunicationSafely(
  input: RecordCommunicationInput
): Promise<RecordCommunicationResult> {
  try {
    return await recordCommunication(input);
  } catch (error) {
    console.error("[CGI Communications]", {
      operation: "record_communication",
      communication_type: input.type,
      public_assessment_id: input.publicAssessmentId || undefined,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      outcome: "error",
      dedupeKey: null,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
