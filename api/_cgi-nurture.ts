import {
  buildCommunicationDedupeKey,
  type CommunicationType,
} from "./_cgi-communications.js";

// Régua V1 -- DECISÃO, não execução.
//
// Este módulo responde uma pergunta e só uma: "esta pessoa deve receber este
// toque agora?". Ele não lê banco, não manda e-mail, não conhece cron. É pura
// aritmética sobre um candidato já montado, e existe separado justamente para
// que a regra caiba num teste em vez de caber num sweep de 300 linhas.
//
// Enquanto não houver executor, nada disto envia coisa alguma. É deliberado:
// a Fase 1 do lançamento é consentimento, revogação e observabilidade -- zero
// e-mail novo.

export type NurtureType = Extract<CommunicationType, "report_followup_d2" | "howto_d7">;

export const NURTURE_TYPES: readonly NurtureType[] = ["report_followup_d2", "howto_d7"];

/** Uma flag por toque. Duas flags e não uma porque os dois toques têm naturezas
 * diferentes -- um é continuação da entrega, o outro é conteúdo que nós
 * escolhemos mandar -- e porque o plano de lançamento liga um de cada vez. */
export const NURTURE_FLAG_BY_TYPE: Record<NurtureType, string> = {
  report_followup_d2: "CGI_REPORT_FOLLOWUP_D2_ENABLED",
  howto_d7: "CGI_NURTURE_D7_ENABLED",
};

/** Fail-closed: qualquer coisa que não seja exatamente "true" mantém desligado.
 * Variável ausente, vazia, "1", "yes", "TRUE " com espaço -- tudo desligado.
 * Uma régua que liga por engano é pior que uma que não liga. */
export function isNurtureTypeEnabled(
  type: NurtureType,
  env: Record<string, string | undefined> = process.env
): boolean {
  return env[NURTURE_FLAG_BY_TYPE[type]] === "true";
}

// ---------------------------------------------------------------------------
// HUMAN OVERRIDE
// ---------------------------------------------------------------------------

/** A automação para quando a conversa humana começa. Estes status só são
 * atingidos por ação de uma pessoa, e todos significam "alguém está cuidando
 * disto" ou "acabou". */
const HUMAN_OWNED_STATUSES: ReadonlySet<string> = new Set([
  "contato_realizado",
  "reuniao_agendada",
  "enviar_proposta",
  "proposta_enviada",
  "convertido",
  "sem_interesse",
  "descartado",
]);

/** Além do status, a data. Alguém pode ter conversado no WhatsApp e ainda não
 * ter movido o card -- 14 dias é a janela em que um "insight automático"
 * chegando no meio da conversa seria constrangedor. */
export const HUMAN_CONTACT_QUIET_DAYS = 14;

// ---------------------------------------------------------------------------
// JANELAS
// ---------------------------------------------------------------------------

/** Cada toque tem começo E fim. O fim é a parte que importa no lançamento:
 * sem ele, ligar a flag pela primeira vez dispararia para toda a base
 * histórica de uma vez. Com ele, só entra quem está na janela agora. */
export const NURTURE_WINDOWS: Record<NurtureType, { fromDays: number; toDays: number }> = {
  report_followup_d2: { fromDays: 2, toDays: 5 },
  howto_d7: { fromDays: 7, toDays: 14 },
};

const DIA_MS = 86_400_000;

function daysBetween(fromIso: string | null | undefined, now: number): number | null {
  if (!fromIso) return null;
  const ms = new Date(fromIso).getTime();
  if (!Number.isFinite(ms)) return null;
  return (now - ms) / DIA_MS;
}

// ---------------------------------------------------------------------------
// DECISÃO
// ---------------------------------------------------------------------------

export type NurtureSuppressionReason =
  | "flag_disabled"
  | "already_recorded"
  | "report_not_delivered"
  | "report_already_opened"
  | "outside_window"
  | "no_marketing_consent"
  | "unsubscribed"
  | "human_contact"
  | "unknown_dimension";

export type NurtureCandidate = {
  publicAssessmentId: string;
  leadId: string | null;
  /** Marcador de entrega do relatório. É o relógio da régua inteira: a régua
   * conta a partir da ENTREGA, não da conclusão do CGI. */
  reportEmailSentAtIso: string | null;
  /** cgi_report_access.last_accessed_at, quando conhecido. */
  reportOpenedAtIso: string | null;
  consentMarketing: boolean | null;
  unsubscribedAtIso: string | null;
  crmStatus: string | null;
  lastContactAtIso: string | null;
  /** Dimensão mais frágil do CGI -- escolhe o template do D+7. */
  lowestDimensionId: string | null;
  /** Tipos já registrados no ledger para este assessment. */
  alreadyRecordedTypes: readonly string[];
};

export type NurtureDecision =
  | { decision: "send"; type: NurtureType; dedupeKey: string }
  | { decision: "suppress"; type: NurtureType; reason: NurtureSuppressionReason };

const DIMENSOES_CONHECIDAS: ReadonlySet<string> = new Set([
  "strategy",
  "market",
  "growthMachine",
  "execution",
  "leadership",
]);

function suprimir(type: NurtureType, reason: NurtureSuppressionReason): NurtureDecision {
  return { decision: "suppress", type, reason };
}

export function decideNurture(
  type: NurtureType,
  candidate: NurtureCandidate,
  options: { now?: number; env?: Record<string, string | undefined> } = {}
): NurtureDecision {
  const now = options.now ?? Date.now();

  // 1. Flag. Primeiro de tudo: desligado é desligado, sem avaliar mais nada.
  if (!isNurtureTypeEnabled(type, options.env ?? process.env)) {
    return suprimir(type, "flag_disabled");
  }

  // 2. Idempotência. O ledger é a memória; timestamp não é proteção.
  if (candidate.alreadyRecordedTypes.includes(type)) {
    return suprimir(type, "already_recorded");
  }

  // 3. Sem entrega não há régua. Tudo aqui é continuação da entrega.
  const diasDesdeEntrega = daysBetween(candidate.reportEmailSentAtIso, now);
  if (diasDesdeEntrega === null) return suprimir(type, "report_not_delivered");

  // 4. Conversa humana em curso vence qualquer automação.
  if (HUMAN_OWNED_STATUSES.has(String(candidate.crmStatus || ""))) {
    return suprimir(type, "human_contact");
  }
  const diasDesdeContato = daysBetween(candidate.lastContactAtIso, now);
  if (diasDesdeContato !== null && diasDesdeContato < HUMAN_CONTACT_QUIET_DAYS) {
    return suprimir(type, "human_contact");
  }

  // 5. Revogação. Vale para os dois toques, inclusive o transacional.
  //
  // Isto é MAIS estrito do que a classificação exige: report_followup_d2 é
  // transactional e, pela regra do motor, não depende de consentimento. Optamos
  // por respeitar o descadastro mesmo assim. Quem clicou em "cancelar
  // recebimento" não está fazendo distinção entre classes de mensagem, e um
  // segundo e-mail depois disso destrói mais confiança do que a confirmação de
  // entrega recupera. O que continua imune ao opt-out é o que a pessoa pede na
  // hora: o relatório que ela mesma solicitou.
  if (candidate.unsubscribedAtIso) return suprimir(type, "unsubscribed");

  // 6. Janela.
  const janela = NURTURE_WINDOWS[type];
  if (diasDesdeEntrega < janela.fromDays || diasDesdeEntrega > janela.toDays) {
    return suprimir(type, "outside_window");
  }

  // 7. Regras próprias de cada toque.
  if (type === "report_followup_d2") {
    // O único motivo de existir deste e-mail é "parece que não chegou". Se
    // chegou e foi aberto, ele não tem assunto.
    if (candidate.reportOpenedAtIso) return suprimir(type, "report_already_opened");
  } else {
    // D+7 é conteúdo que nós escolhemos mandar: exige opt-in explícito.
    if (candidate.consentMarketing !== true) return suprimir(type, "no_marketing_consent");
    if (!DIMENSOES_CONHECIDAS.has(String(candidate.lowestDimensionId || ""))) {
      // Sem saber qual dimensão está frágil, o e-mail viraria genérico -- que é
      // exatamente o que a régua não quer ser.
      return suprimir(type, "unknown_dimension");
    }
  }

  return {
    decision: "send",
    type,
    dedupeKey: buildCommunicationDedupeKey({
      type,
      publicAssessmentId: candidate.publicAssessmentId,
      leadId: candidate.leadId,
    }),
  };
}
