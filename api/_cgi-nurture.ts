import {
  automationMaySend,
  classificationSuppressionReason,
} from "./_cgi-lead-classification.js";

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

export type NurtureType = Extract<
  CommunicationType,
  "report_followup_d2" | "howto_d7" | "strategic_d21"
>;

/** `strategic_d21` e o toque de OFERTA, que sai no D+14 (livro + sessao CGI).
 *
 * O nome do tipo ficou do desenho original da regua (D+21) e foi mantido de
 * proposito: `cgi_communications.communication_type` tem CHECK constraint, e
 * reaproveitar um valor ja permitido evita uma migration so para renomear.
 * O dia efetivo e a janela vivem em NURTURE_WINDOWS, nao no nome. */
export const OFFER_TYPE = "strategic_d21" as const;

export const NURTURE_TYPES: readonly NurtureType[] = ["report_followup_d2", "howto_d7", OFFER_TYPE];

/** Uma flag por toque. Duas flags e não uma porque os dois toques têm naturezas
 * diferentes -- um é continuação da entrega, o outro é conteúdo que nós
 * escolhemos mandar -- e porque o plano de lançamento liga um de cada vez. */
export const NURTURE_FLAG_BY_TYPE: Record<NurtureType, string> = {
  report_followup_d2: "CGI_REPORT_FOLLOWUP_D2_ENABLED",
  howto_d7: "CGI_NURTURE_D7_ENABLED",
  strategic_d21: "CGI_OFFER_D14_ENABLED",
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
  // Oferta: a partir do D+14. O fim largo (30) nao e para pegar historico --
  // isso e trabalho do corte de lancamento abaixo -- e para que quem cair na
  // janela de silencio de fim de ano ainda receba na volta, em vez de perder
  // a vez para sempre.
  strategic_d21: { fromDays: 14, toDays: 30 },
};

// ---------------------------------------------------------------------------
// OFERTA (D+14) -- corte de lancamento e silencio de fim de ano
// ---------------------------------------------------------------------------

/** So recebe a oferta automatica quem teve o relatorio entregue a partir desta
 * data. A base anterior recebe e-mail pessoal do Denis (decisao de 06/10/2026),
 * e as duas coisas juntas mandariam a mesma oferta duas vezes.
 *
 * Fail-closed: ausente ou invalida, ninguem recebe. */
export const OFFER_CUTOFF_ENV = "CGI_OFFER_D14_DELIVERED_SINCE";

export function readOfferCutoffMs(
  env: Record<string, string | undefined> = process.env
): number | null {
  const raw = String(env[OFFER_CUTOFF_ENV] || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

/** Janela de silencio: de 20/12 a 05/01, inclusive, no horario de Sao Paulo.
 * Oferta comercial no meio das festas e ruido -- e quem cair aqui ainda recebe
 * no dia 06/01 se continuar dentro dos 30 dias. */
export function isOfferQuietPeriod(now: number): boolean {
  // America/Sao_Paulo e UTC-3 o ano todo desde 2019 (sem horario de verao).
  const local = new Date(now - 3 * 3_600_000);
  const mes = local.getUTCMonth() + 1;
  const dia = local.getUTCDate();
  return (mes === 12 && dia >= 20) || (mes === 1 && dia <= 5);
}

/** A oferta e escrita em portugues e o livro e em portugues. Relatorios em
 * ingles ou espanhol ficam fora ate existir copy propria. */
export const OFFER_LANGUAGES: ReadonlySet<string> = new Set(["pt"]);

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
  | "unknown_dimension"
  // Oferta (D+14)
  | "before_offer_cutoff"
  | "quiet_period"
  | "unsupported_language"
  // Classificacao do lead. 'legitimate' e o unico valor que envia.
  | "lead_test"
  | "lead_spam"
  | "lead_invalid"
  | "lead_classification_unknown"
  // Nao foi possivel LER o que decide. Nunca significa "pode enviar".
  | "infrastructure_error";

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
  /** cgi_leads.classification. Deliberadamente `unknown`: o que chega aqui é o
   *  que o banco devolveu, e a decisão não presume que seja um dos quatro
   *  valores conhecidos. Ausente, nulo ou desconhecido bloqueia. */
  leadClassification?: unknown;
  /** cgi_reports.language ('pt' | 'en' | 'es'). So a oferta usa. */
  reportLanguage?: string | null;
};

export type NurtureDecision =
  | { decision: "send"; type: NurtureType; dedupeKey: string }
  | {
      decision: "suppress";
      type: NurtureType;
      reason: NurtureSuppressionReason;
      publicAssessmentId: string;
    };

const DIMENSOES_CONHECIDAS: ReadonlySet<string> = new Set([
  "strategy",
  "market",
  "growthMachine",
  "execution",
  "leadership",
]);

function suprimir(
  type: NurtureType,
  reason: NurtureSuppressionReason,
  publicAssessmentId: string
): NurtureDecision {
  return { decision: "suppress", type, reason, publicAssessmentId };
}

export function decideNurture(
  type: NurtureType,
  candidate: NurtureCandidate,
  options: { now?: number; env?: Record<string, string | undefined> } = {}
): NurtureDecision {
  const now = options.now ?? Date.now();

  // 1. Flag. Primeiro de tudo: desligado é desligado, sem avaliar mais nada.
  if (!isNurtureTypeEnabled(type, options.env ?? process.env)) {
    return suprimir(type, "flag_disabled", candidate.publicAssessmentId);
  }

  // 1b. Classificação do lead.
  //
  // Vem logo depois da flag e antes de tudo que descreve a pessoa, porque é a
  // pergunta mais barata e a mais decisiva: se esta linha não representa
  // alguém real querendo falar conosco, nada abaixo importa.
  //
  // Fail-closed por construção -- só 'legitimate' passa. Um lead sem
  // classificação (migration ainda não aplicada, leitura parcial, coluna
  // ausente) não recebe. Foi assim que um troll recebeu relatório e D+2 em
  // 31/08 e 03/09: o sistema não tinha como representar "esta pessoa não
  // deveria estar aqui".
  if (!automationMaySend(candidate.leadClassification)) {
    return suprimir(
      type,
      classificationSuppressionReason(candidate.leadClassification),
      candidate.publicAssessmentId
    );
  }

  // 2. Idempotência. O ledger é a memória; timestamp não é proteção.
  if (candidate.alreadyRecordedTypes.includes(type)) {
    return suprimir(type, "already_recorded", candidate.publicAssessmentId);
  }

  // 3. Sem entrega não há régua. Tudo aqui é continuação da entrega.
  const diasDesdeEntrega = daysBetween(candidate.reportEmailSentAtIso, now);
  if (diasDesdeEntrega === null) return suprimir(type, "report_not_delivered", candidate.publicAssessmentId);

  // 4. Conversa humana em curso vence qualquer automação.
  if (HUMAN_OWNED_STATUSES.has(String(candidate.crmStatus || ""))) {
    return suprimir(type, "human_contact", candidate.publicAssessmentId);
  }
  const diasDesdeContato = daysBetween(candidate.lastContactAtIso, now);
  if (diasDesdeContato !== null && diasDesdeContato < HUMAN_CONTACT_QUIET_DAYS) {
    return suprimir(type, "human_contact", candidate.publicAssessmentId);
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
  if (candidate.unsubscribedAtIso) return suprimir(type, "unsubscribed", candidate.publicAssessmentId);

  // 6. Janela.
  const janela = NURTURE_WINDOWS[type];
  if (diasDesdeEntrega < janela.fromDays || diasDesdeEntrega > janela.toDays) {
    return suprimir(type, "outside_window", candidate.publicAssessmentId);
  }

  // 7. Regras próprias de cada toque.
  if (type === "report_followup_d2") {
    // O único motivo de existir deste e-mail é "parece que não chegou". Se
    // chegou e foi aberto, ele não tem assunto.
    if (candidate.reportOpenedAtIso) return suprimir(type, "report_already_opened", candidate.publicAssessmentId);
  } else if (type === OFFER_TYPE) {
    // Oferta e o toque mais comercial da regua: tudo o que o D+7 exige, mais
    // corte de lancamento, silencio de fim de ano e idioma.
    const corte = readOfferCutoffMs(options.env ?? process.env);
    const entregaMs = new Date(String(candidate.reportEmailSentAtIso)).getTime();
    if (corte === null || !(entregaMs >= corte)) {
      return suprimir(type, "before_offer_cutoff", candidate.publicAssessmentId);
    }
    if (candidate.consentMarketing !== true) return suprimir(type, "no_marketing_consent", candidate.publicAssessmentId);
    if (!DIMENSOES_CONHECIDAS.has(String(candidate.lowestDimensionId || ""))) {
      return suprimir(type, "unknown_dimension", candidate.publicAssessmentId);
    }
    if (!OFFER_LANGUAGES.has(String(candidate.reportLanguage || ""))) {
      return suprimir(type, "unsupported_language", candidate.publicAssessmentId);
    }
    // Por ultimo, de proposito: so adia quem de fato receberia.
    if (isOfferQuietPeriod(now)) return suprimir(type, "quiet_period", candidate.publicAssessmentId);
  } else {
    // D+7 é conteúdo que nós escolhemos mandar: exige opt-in explícito.
    if (candidate.consentMarketing !== true) return suprimir(type, "no_marketing_consent", candidate.publicAssessmentId);
    if (!DIMENSOES_CONHECIDAS.has(String(candidate.lowestDimensionId || ""))) {
      // Sem saber qual dimensão está frágil, o e-mail viraria genérico -- que é
      // exatamente o que a régua não quer ser.
      return suprimir(type, "unknown_dimension", candidate.publicAssessmentId);
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

// ---------------------------------------------------------------------------
// SUPRESSÕES -- por que nada foi enviado
// ---------------------------------------------------------------------------
//
// Zero envios pode significar duas coisas opostas: a régua está sendo prudente,
// ou a régua está morta. Sem registrar supressão, as duas são indistinguíveis
// no banco.
//
// Mas registrar TODA supressão de TODA varredura encheria o ledger de ruído: a
// mesma pessoa fora da janela produziria uma linha por dia, para sempre. As
// duas regras abaixo resolvem isso sem nenhuma máquina de estado.

/** Motivos que NÃO viram linha:
 *
 * - `flag_disabled`: é um fato sobre o sistema, não sobre a pessoa. Com a flag
 *   desligada, toda a base seria suprimida por este motivo, todo dia.
 * - `outside_window`: é transitório por construção. Quem está cedo demais hoje
 *   entra amanhã; quem está tarde demais nunca mais entra. Nos dois casos a
 *   linha não informa nada que a data de entrega já não diga.
 * - `already_recorded`: é o dedupe funcionando. A linha que interessa já
 *   existe -- registrar de novo seria contar duas vezes. */
const SUPPRESSION_REASONS_NOT_RECORDED: ReadonlySet<NurtureSuppressionReason> = new Set([
  "flag_disabled",
  "outside_window",
  "already_recorded",
  // Fato sobre o sistema, nao sobre a pessoa -- mesma regra dos dois
  // primeiros. Numa queda do PostgREST, toda a janela seria suprimida por
  // este motivo e o ledger ganharia uma linha por candidato por dia, sem
  // dizer nada sobre ninguem. Fica observavel na resposta do sweep e no log.
  "infrastructure_error",
  // Mesma razao: nao saber a classificacao e um fato sobre o SISTEMA -- a
  // migration ainda nao rodou, a leitura veio parcial. Os outros tres motivos
  // de classificacao (lead_test, lead_spam, lead_invalid) descrevem a PESSOA e
  // viram linha, uma vez cada, pela chave namespaced.
  "lead_classification_unknown",
  // Oferta: os dois sao fatos sobre o CALENDARIO, nao sobre a pessoa. Quem esta
  // antes do corte nunca vai receber e a data de entrega ja diz isso; quem esta
  // no silencio de fim de ano recebe na volta.
  "before_offer_cutoff",
  "quiet_period",
]);

export function shouldRecordSuppression(reason: NurtureSuppressionReason): boolean {
  return !SUPPRESSION_REASONS_NOT_RECORDED.has(reason);
}

/** Chave de dedupe da supressão.
 *
 * Namespace próprio (`:suppressed:`), e isso não é cosmético: se a supressão
 * usasse a mesma chave do envio, a linha de supressão ocuparia o único slot
 * daquele tipo e o envio real seria recusado como duplicata mais tarde. Com o
 * namespace separado, uma pessoa pode ser suprimida hoje e receber amanhã.
 *
 * Um motivo, uma linha, para sempre: a segunda varredura com o mesmo motivo
 * colide na constraint única e não escreve nada. O teto por assessment é o
 * número de motivos registráveis -- hoje, cinco. */
export function buildSuppressionDedupeKey(input: {
  type: NurtureType;
  publicAssessmentId: string;
  reason: NurtureSuppressionReason;
}): string {
  return `${input.publicAssessmentId}:${input.type}:suppressed:${input.reason}`;
}

export type SuppressionRecord = {
  type: NurtureType;
  status: "suppressed";
  publicAssessmentId: string;
  dedupeKey: string;
  reason: NurtureSuppressionReason;
};

/** Traduz uma decisão em uma linha de ledger -- ou em nada. Não escreve: quem
 * escreve é o executor, que ainda não existe. */
export function buildSuppressionRecord(decision: NurtureDecision): SuppressionRecord | null {
  if (decision.decision !== "suppress") return null;
  if (!shouldRecordSuppression(decision.reason)) return null;
  const publicAssessmentId = decision.publicAssessmentId;
  if (!publicAssessmentId) return null;
  return {
    type: decision.type,
    status: "suppressed",
    publicAssessmentId,
    dedupeKey: buildSuppressionDedupeKey({
      type: decision.type,
      publicAssessmentId,
      reason: decision.reason,
    }),
    reason: decision.reason,
  };
}
