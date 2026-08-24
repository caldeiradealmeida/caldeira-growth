import type { CgiCommunication, CommunicationType, CrmOpportunity, OpportunityRow } from "../types";

// Fila comercial do CGI Pipe.
//
// Três derivações, todas determinísticas e explicáveis em uma frase:
// porte da empresa, estado de contato humano, e prioridade.
//
// Nenhuma delas usa modelo, peso oculto ou score contínuo. A prioridade é uma
// lista ordenada de regras: a primeira que casa vence e devolve, junto do
// nível, a frase que justifica aquele nível. Se um dia um lead aparecer como P1
// e isso parecer errado, a frase diz exatamente qual regra o colocou lá.

// ---------------------------------------------------------------------------
// PORTE
// ---------------------------------------------------------------------------

/** Faixas canônicas do próprio formulário do CGI (src/data/cgiConfig.ts).
 * Não inventamos taxonomia nova: estas são as opções que a pessoa escolheu. */
const REVENUE_TIERS: ReadonlyArray<{ band: string; tier: number; short: string }> = [
  { band: "Até R$ 1 milhão", tier: 1, short: "≤ 1M" },
  { band: "R$ 1-10 milhões", tier: 2, short: "1–10M" },
  { band: "R$ 10-50 milhões", tier: 3, short: "10–50M" },
  { band: "R$ 50-200 milhões", tier: 4, short: "50–200M" },
  { band: "Acima de R$ 200 milhões", tier: 5, short: "> 200M" },
];

export type CompanySize = {
  /** 0 = não informado. 1..5 = faixas crescentes. */
  tier: number;
  /** Rótulo curto para o badge. */
  short: string;
  /** Faixa exata que a pessoa escolheu, para tooltip. */
  band: string;
  known: boolean;
};

const SIZE_UNKNOWN: CompanySize = { tier: 0, short: "—", band: "Não informado", known: false };

/** "Prefiro não informar" e vazio caem no mesmo lugar: desconhecido. Vazio
 * normalmente significa que a pessoa abandonou antes da etapa de contexto. */
export function deriveCompanySize(annualRevenueRange: string | null | undefined): CompanySize {
  const band = String(annualRevenueRange || "").trim();
  if (!band || band === "Prefiro não informar") return SIZE_UNKNOWN;
  const match = REVENUE_TIERS.find((entry) => entry.band === band);
  if (!match) return { ...SIZE_UNKNOWN, band };
  return { tier: match.tier, short: match.short, band: match.band, known: true };
}

// ---------------------------------------------------------------------------
// CONTATO HUMANO
// ---------------------------------------------------------------------------

/** Comunicação automática NUNCA conta como contato. Relatório entregue,
 * abandono e nurturing são coisas que o sistema fez, não conversas que
 * aconteceram. O único sinal admissível vem do CRM. */
const CONTACTED_STATUSES: ReadonlySet<string> = new Set([
  "contato_realizado",
  "reuniao_agendada",
  "enviar_proposta",
  "proposta_enviada",
  "convertido",
  // Alguém só descobre que não há interesse conversando.
  "sem_interesse",
]);

/** Explicitamente NÃO contam como contato: `novo`, `revisado` (Denis olhou, não
 * falou), `contato_pendente` (usado como lembrete de que falta contatar) e
 * `descartado` (pode ser juízo de valor sem conversa). */
export type ContactState =
  | { kind: "never" }
  | { kind: "contacted"; atIso: string; daysAgo: number }
  | { kind: "contacted_undated" };

export function deriveHumanContact(
  opportunity: CrmOpportunity | null | undefined,
  now: number = Date.now()
): ContactState {
  if (!opportunity) return { kind: "never" };
  if (opportunity.last_contact_at) {
    const ms = new Date(opportunity.last_contact_at).getTime();
    if (Number.isFinite(ms)) {
      return { kind: "contacted", atIso: opportunity.last_contact_at, daysAgo: Math.max(0, Math.floor((now - ms) / 86_400_000)) };
    }
  }
  // O status mudou para algo que só um humano move, mas ninguém preencheu a
  // data. É contato -- só não sabemos quando. Melhor dizer isso do que fingir
  // uma data ou fingir que não houve contato.
  if (CONTACTED_STATUSES.has(String(opportunity.status || ""))) return { kind: "contacted_undated" };
  return { kind: "never" };
}

export function isContacted(state: ContactState): boolean {
  return state.kind !== "never";
}

// ---------------------------------------------------------------------------
// PRIORIDADE
// ---------------------------------------------------------------------------

export type PriorityLevel = "P1" | "P2" | "P3" | "P4";

/** Identificador estável da regra que decidiu o nível.
 *
 * É ISTO que a lógica enxerga -- filtros, ordenação e testes. A frase de
 * justificativa existe só para o humano ler no tooltip, e pode ser reescrita a
 * qualquer momento sem quebrar nada. Filtro que casa por texto é filtro que
 * some em silêncio no dia em que alguém melhora a redação. */
export type PriorityRule =
  | "converted"
  | "closed"
  | "overdue_commitment"
  | "large_account_no_next_action"
  | "in_commercial_process"
  | "completed_uncontacted"
  | "completed_contacted"
  | "large_account_recovery"
  | "incomplete"
  | "no_signal";

export type Priority = {
  level: PriorityLevel;
  /** A regra que decidiu. Único campo que a lógica pode ler. */
  rule: PriorityRule;
  /** Uma frase, para o humano. É o contrato: nenhum nível existe sem
   * explicação. Nenhuma lógica funcional pode depender deste texto. */
  reason: string;
};

/** Estados terminais: saem da fila de trabalho, mas continuam visíveis.
 * Prioridade ordena e sinaliza; nunca esconde. */
const CLOSED_STATUSES: ReadonlySet<string> = new Set(["convertido", "sem_interesse", "descartado"]);

const IN_COMMERCIAL_PROCESS: ReadonlySet<string> = new Set([
  "reuniao_agendada",
  "enviar_proposta",
  "proposta_enviada",
]);

export type PriorityInput = {
  size: CompanySize;
  contact: ContactState;
  crmStatus: string;
  /** CGI concluído (completed_at presente em algum assessment do lead). */
  completed: boolean;
  /** Chegou a responder alguma coisa. */
  started: boolean;
  reportDelivered: boolean;
  reportOpened: boolean;
  investmentIntent: string | null | undefined;
  nextActionAt: string | null | undefined;
  now?: number;
};

/** Sinais comerciais declarados pela própria pessoa. "Ainda avaliando" não
 * conta: é o meio-termo educado. */
function hasStrongIntent(investmentIntent: string | null | undefined): boolean {
  return String(investmentIntent || "").trim() === "Sim";
}

function overdueDays(nextActionAt: string | null | undefined, now: number): number | null {
  if (!nextActionAt) return null;
  const ms = new Date(nextActionAt).getTime();
  if (!Number.isFinite(ms) || ms > now) return null;
  return Math.max(0, Math.floor((now - ms) / 86_400_000));
}

export function derivePriority(input: PriorityInput): Priority {
  const now = input.now ?? Date.now();
  const porte = input.size.known ? `Empresa ${input.size.short}` : "Porte não informado";
  const contaGrande = isLargeCompany(input.size);

  // 1. Encerrados saem da fila -- mas continuam na lista.
  if (input.crmStatus === "convertido") {
    return { level: "P4", rule: "converted", reason: "Convertido — fora da fila." };
  }
  if (CLOSED_STATUSES.has(input.crmStatus)) {
    return {
      level: "P4",
      rule: "closed",
      reason: `${input.crmStatus === "sem_interesse" ? "Sem interesse" : "Descartado"} — fora da fila.`,
    };
  }

  // 2. Compromisso vencido é a coisa mais acionável que existe.
  const atrasado = overdueDays(input.nextActionAt, now);
  if (atrasado !== null) {
    return {
      level: "P1",
      rule: "overdue_commitment",
      reason: `Ação combinada venceu há ${atrasado} ${atrasado === 1 ? "dia" : "dias"}.`,
    };
  }

  // 3. Conta grande já tocada e sem próximo passo marcado.
  //
  // Isto NÃO é "empresa grande = urgente". É uma conta grande onde alguém já
  // gastou uma conversa e ninguém marcou o que vem depois -- exatamente onde
  // se perde negócio grande em silêncio. Conta grande que ninguém contatou
  // ainda não entra aqui; conta grande com próximo passo marcado também não,
  // porque essa já tem plano.
  if (contaGrande && isContacted(input.contact) && !input.nextActionAt) {
    return {
      level: "P1",
      rule: "large_account_no_next_action",
      reason: `Conta de R$ ${input.size.short} já contatada, mas sem próximo passo definido.`,
    };
  }

  // 4. Processo comercial em andamento: já tem dono e próximo passo.
  if (IN_COMMERCIAL_PROCESS.has(input.crmStatus)) {
    return {
      level: "P2",
      rule: "in_commercial_process",
      reason: `${porte}, em processo comercial (${input.crmStatus.replace(/_/g, " ")}).`,
    };
  }

  // 5. O coração da fila: concluiu o diagnóstico e ninguém falou com a pessoa.
  if (input.completed && !isContacted(input.contact)) {
    const reforcos: string[] = [];
    if (input.reportOpened) reforcos.push("abriu o relatório");
    else if (input.reportDelivered) reforcos.push("relatório entregue");
    if (hasStrongIntent(input.investmentIntent)) reforcos.push("declarou intenção de investir");
    const sufixo = reforcos.length ? `, ${reforcos.join(" e ")}` : "";

    // Porte relevante, ou sinal comercial forte, sobe para P1.
    if (input.size.tier >= 2 || reforcos.length > 0) {
      return {
        level: "P1",
        rule: "completed_uncontacted",
        reason: `${porte}, CGI concluído, nenhum contato humano${sufixo}.`,
      };
    }
    return {
      level: "P2",
      rule: "completed_uncontacted",
      reason: `${porte}, CGI concluído, nenhum contato humano.`,
    };
  }

  // 6. Concluiu e já foi contatado: follow-up.
  if (input.completed && isContacted(input.contact)) {
    if (input.contact.kind === "contacted") {
      return {
        level: "P2",
        rule: "completed_contacted",
        reason: `${porte}, concluído e contatado há ${input.contact.daysAgo} ${input.contact.daysAgo === 1 ? "dia" : "dias"}.`,
      };
    }
    return {
      level: "P2",
      rule: "completed_contacted",
      reason: `${porte}, concluído e já contatado (sem data registrada).`,
    };
  }

  // 7. Não concluiu, nunca foi contatada, e é conta grande.
  //
  // Porte não vira urgência: vira P2, não P1. A diferença que importa é que
  // uma conta de R$ 10M+ que abandonou o diagnóstico merece uma tentativa
  // humana de recuperação, e uma de ≤ R$ 1M no mesmo estado não merece --
  // e até aqui as duas caíam no mesmo P3 indistinguível.
  if (contaGrande && !isContacted(input.contact)) {
    return {
      level: "P2",
      rule: "large_account_recovery",
      reason: `Conta de R$ ${input.size.short}, CGI ${input.started ? "abandonado no meio" : "não iniciado"} e nenhum contato humano.`,
    };
  }

  // 8. Resto do abandono.
  if (input.started || input.size.known) {
    return {
      level: "P3",
      rule: "incomplete",
      reason: `${porte}, CGI ${input.started ? "abandonado no meio" : "não iniciado"}.`,
    };
  }

  // 9. Sem nenhum sinal.
  return { level: "P4", rule: "no_signal", reason: "Sem porte informado e sem engajamento no diagnóstico." };
}

// ---------------------------------------------------------------------------
// PRÓXIMA AÇÃO
// ---------------------------------------------------------------------------

/** Uma data no passado na coluna "Próxima ação" não é uma data: é uma dívida.
 * Renderizar as duas do mesmo jeito faz o operador ler a linha e não ver nada. */
export type NextActionView =
  | { kind: "none" }
  | { kind: "scheduled"; label: string }
  | { kind: "overdue"; label: string; days: number };

export function describeNextAction(
  nextActionAt: string | null | undefined,
  now: number = Date.now()
): NextActionView {
  if (!nextActionAt) return { kind: "none" };
  const ms = new Date(nextActionAt).getTime();
  if (!Number.isFinite(ms)) return { kind: "none" };
  const data = new Date(ms).toLocaleDateString("pt-BR");
  const atrasado = overdueDays(nextActionAt, now);
  if (atrasado === null) return { kind: "scheduled", label: data };
  const sufixo = atrasado === 0 ? "vencida hoje" : `vencida há ${atrasado}d`;
  return { kind: "overdue", label: `${data} · ${sufixo}`, days: atrasado };
}

// ---------------------------------------------------------------------------
// MENSAGENS -- o que o ledger prova, e o que só os marcadores legados sugerem
// ---------------------------------------------------------------------------

export type MessageChip = {
  key: string;
  label: string;
  /** Data de envio, quando conhecida. */
  atIso: string | null;
  /** Verdadeiro quando a linha veio do ledger; falso quando foi inferida de um
   * marcador antigo, anterior ao Communication Engine. */
  proven: boolean;
  detail: string;
};

const SHORT_TYPE_LABELS: Record<CommunicationType, string> = {
  report_delivery: "Relatório",
  report_followup_d2: "Follow-up",
  report_followup_d5: "Follow-up",
  abandon_lead_d1: "Abandono",
  abandon_progress_d1: "Abandono",
  insight_d2: "Insight",
  howto_d7: "Insight",
  strategic_d21: "Insight",
  checkin_d45: "Check-in",
  revisit_d90: "Revisitar",
  commercial_followup: "Comercial",
  manual_email: "Manual",
};

function formatDate(value: string | null): string {
  if (!value) return "sem data";
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("pt-BR") : "sem data";
}

/** Chips compactos do que a pessoa recebeu. O ledger é a fonte; os marcadores
 * antigos entram só quando a semântica é inequívoca, e sempre marcados como
 * histórico legado -- nunca inventamos uma comunicação que não podemos provar. */
export function deriveMessageChips(row: {
  communications: CgiCommunication[];
  legacyReportEmailAt?: string | null;
  legacyAbandonmentEmailAt?: string | null;
}): MessageChip[] {
  const chips: MessageChip[] = [];
  const tiposNoLedger = new Set<string>();

  for (const c of row.communications || []) {
    if (c.status !== "sent") continue;
    tiposNoLedger.add(c.communication_type);
    const label = SHORT_TYPE_LABELS[c.communication_type] ?? c.communication_type;
    chips.push({
      key: c.id,
      label,
      atIso: c.sent_at,
      proven: true,
      detail: `${label} · enviado ${formatDate(c.sent_at)} · automático`,
    });
  }

  // Marcadores legados: só entram se o ledger ainda não cobre aquela família.
  const temRelatorio = tiposNoLedger.has("report_delivery");
  if (!temRelatorio && row.legacyReportEmailAt) {
    chips.push({
      key: "legacy-report",
      label: "Relatório",
      atIso: row.legacyReportEmailAt,
      proven: false,
      detail: `Relatório · enviado ${formatDate(row.legacyReportEmailAt)} · histórico legado, anterior ao ledger`,
    });
  }
  const temAbandono = tiposNoLedger.has("abandon_lead_d1") || tiposNoLedger.has("abandon_progress_d1");
  if (!temAbandono && row.legacyAbandonmentEmailAt) {
    chips.push({
      key: "legacy-abandon",
      // O marcador único não guarda QUAL kind foi enviada; a família é certa,
      // o tipo exato não. Por isso o rótulo é o genérico.
      label: "Abandono",
      atIso: row.legacyAbandonmentEmailAt,
      proven: false,
      detail: `Abandono · enviado ${formatDate(row.legacyAbandonmentEmailAt)} · histórico legado, tipo exato não registrado`,
    });
  }

  return chips.sort((a, b) => new Date(b.atIso || 0).getTime() - new Date(a.atIso || 0).getTime());
}

// ---------------------------------------------------------------------------
// RELATÓRIO -- evidência, não ausência
// ---------------------------------------------------------------------------

/** Quando os marcadores de e-mail passaram a ser confiáveis em produção.
 *
 * Antes disso o CGI entregava relatório por um caminho que não deixava
 * registro: `cgi_reports` só existe desde 28/07 e `report_email_sent_at` desde
 * 14/08, com o envio real ligado em 19/08. Para quem concluiu antes, a
 * ausência de marcador é consequência de a telemetria não existir -- não prova
 * que a pessoa não recebeu nada. Tratar as duas coisas como iguais é o tipo de
 * erro que faz alguém "reenviar" um relatório que o cliente já leu há um mês. */
export const CGI_TELEMETRY_START = Date.parse("2026-08-19T00:00:00Z");

export type ReportEvidence =
  | { kind: "opened"; atIso: string }
  | { kind: "sent"; atIso: string }
  | { kind: "ready_not_sent" }
  | { kind: "legacy_unknown" }
  | { kind: "not_sent" }
  | { kind: "none" };

export const REPORT_EVIDENCE_LABELS: Record<ReportEvidence["kind"], string> = {
  opened: "Aberto",
  sent: "Enviado",
  ready_not_sent: "Pronto, não enviado",
  legacy_unknown: "CGI legado",
  not_sent: "Não enviado",
  none: "—",
};

export function deriveReportEvidence(input: {
  completedAtIso: string | null | undefined;
  reportReady: boolean;
  reportEmailSentAtIso: string | null | undefined;
  /** cgi_report_access.last_accessed_at */
  accessedAtIso: string | null | undefined;
}): ReportEvidence {
  if (!input.completedAtIso) return { kind: "none" };

  // Prova positiva sempre vence a data de corte. Quem foi alcançado pelo
  // recovery de 19/08 tem marcador verdadeiro mesmo tendo concluído antes.
  //
  // "Aberto" exige relatório pronto: o e-mail de abandono também emite token de
  // acesso, então um last_accessed_at sem relatório significa "clicou no link
  // de retomada", não "leu o parecer".
  if (input.accessedAtIso && input.reportReady) return { kind: "opened", atIso: input.accessedAtIso };
  if (input.reportEmailSentAtIso) return { kind: "sent", atIso: input.reportEmailSentAtIso };

  const concluidoEm = Date.parse(input.completedAtIso);
  const antesDaTelemetria = Number.isFinite(concluidoEm) && concluidoEm < CGI_TELEMETRY_START;
  if (antesDaTelemetria) return { kind: "legacy_unknown" };

  return input.reportReady ? { kind: "ready_not_sent" } : { kind: "not_sent" };
}

export function describeReportEvidence(evidence: ReportEvidence, completedAtIso?: string | null): string {
  switch (evidence.kind) {
    case "opened":
      return `Relatório aberto pelo lead em ${new Date(evidence.atIso).toLocaleDateString("pt-BR")}.`;
    case "sent":
      return `Relatório enviado em ${new Date(evidence.atIso).toLocaleDateString("pt-BR")}. Sem registro de abertura.`;
    case "ready_not_sent":
      return "Relatório gerado, mas nenhum e-mail de entrega registrado.";
    case "legacy_unknown":
      return `CGI concluído em ${completedAtIso ? new Date(completedAtIso).toLocaleDateString("pt-BR") : "data anterior"}, antes da telemetria atual. A ausência de registro NÃO prova que o lead não recebeu o relatório.`;
    case "not_sent":
      return "Nenhum relatório entregue.";
    default:
      return "Diagnóstico não concluído.";
  }
}

// ---------------------------------------------------------------------------
// FILTROS DA FILA
// ---------------------------------------------------------------------------

export type QueueFilter =
  | "todos"
  | "a_contatar"
  | "follow_up"
  | "em_proposta"
  | "vencidos"
  | "recuperar"
  | "grandes";

export const QUEUE_FILTER_LABELS: Record<QueueFilter, string> = {
  todos: "Todos",
  a_contatar: "A contatar",
  follow_up: "Follow-up",
  em_proposta: "Em proposta",
  // "Aguardando" dizia a coisa errada: sugeria que estávamos esperando o lead,
  // quando o que o filtro seleciona é compromisso NOSSO que já venceu.
  vencidos: "Vencidos",
  recuperar: "Recuperar",
  grandes: "Grandes empresas",
};

/** "Grande" é uma faixa de faturamento, não um nível de prioridade. O filtro é
 * um recorte independente: atravessa P1..P4 sem alterar nenhuma regra de
 * priorização. Uma empresa de R$ 50-200 milhões que já está em processo
 * comercial continua P2 -- e continua aparecendo aqui. */
// Recorte comercial da Caldeira Growth, não classificação econômica oficial:
// para este funil, "grande" começa em R$ 10 milhões de faturamento.
export const LARGE_COMPANY_MIN_TIER = 3; // R$ 10-50M, R$ 50-200M e acima

export function isLargeCompany(size: CompanySize): boolean {
  return size.tier >= LARGE_COMPANY_MIN_TIER;
}

export function matchesQueueFilter(
  filter: QueueFilter,
  view: { priority: Priority; contact: ContactState; crmStatus: string; completed: boolean; size: CompanySize }
): boolean {
  switch (filter) {
    case "todos":
      return true;
    case "a_contatar":
      return view.completed && !isContacted(view.contact) && !CLOSED_STATUSES.has(view.crmStatus);
    case "follow_up":
      return isContacted(view.contact) && !IN_COMMERCIAL_PROCESS.has(view.crmStatus) && !CLOSED_STATUSES.has(view.crmStatus);
    case "em_proposta":
      return IN_COMMERCIAL_PROCESS.has(view.crmStatus);
    case "vencidos":
      // Casa pela REGRA, nunca pelo texto. Reescrever a justificativa não pode
      // esvaziar um filtro em silêncio.
      return view.priority.rule === "overdue_commitment";
    case "recuperar":
      // Quem começou o diagnóstico e não terminou, e ainda faz sentido
      // trabalhar. Encerrados (convertido, sem interesse, descartado) ficam de
      // fora -- não há o que recuperar.
      return !view.completed && !CLOSED_STATUSES.has(view.crmStatus);
    case "grandes":
      return isLargeCompany(view.size);
    default:
      return true;
  }
}

const PRIORITY_RANK: Record<PriorityLevel, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

type QueueSortable = {
  priority: Priority;
  size: CompanySize;
  bestScore: number | null;
  /** Só existe para quem não concluiu. Ver comentário abaixo. */
  progressPercent?: number | null;
};

/** Ordenação padrão da fila: prioridade, depois porte, depois score --
 * e, para quem não concluiu e portanto não tem score, o progresso. */
export function compareForQueue(a: QueueSortable, b: QueueSortable): number {
  const byPriority = PRIORITY_RANK[a.priority.level] - PRIORITY_RANK[b.priority.level];
  if (byPriority !== 0) return byPriority;
  const bySize = b.size.tier - a.size.tier;
  if (bySize !== 0) return bySize;
  const byScore = (b.bestScore ?? -1) - (a.bestScore ?? -1);
  if (byScore !== 0) return byScore;
  // Dentro do bloco de abandono ninguém tem score: todos empatam em -1. Quem
  // chegou mais longe no diagnóstico é quem mais vale a pena recuperar.
  return (b.progressPercent ?? -1) - (a.progressPercent ?? -1);
}

/** Monta tudo o que a linha da fila precisa, a partir de uma OpportunityRow. */
export function deriveQueueView(row: OpportunityRow, now: number = Date.now()) {
  const size = deriveCompanySize(row.lead.annual_revenue_range);
  const contact = deriveHumanContact(row.opportunity, now);
  const crmStatus = row.opportunity?.status ?? "novo";
  const completed = Boolean(row.latestAssessment?.completed_at);
  const started = Boolean(
    row.latestAssessment &&
      ((row.latestAssessment.progress_percent ?? 0) > 0 || (row.latestAssessment.current_question ?? 0) > 0)
  );
  const chips = deriveMessageChips({
    communications: row.communications,
    legacyReportEmailAt: row.latestAssessment?.report_email_sent_at ?? null,
    legacyAbandonmentEmailAt: row.latestAssessment?.abandonment_email_sent_at ?? null,
  });
  const reportEvidence = deriveReportEvidence({
    completedAtIso: row.latestAssessment?.completed_at,
    reportReady: row.latestReport?.report_status === "report_ready",
    reportEmailSentAtIso: row.latestAssessment?.report_email_sent_at,
    accessedAtIso: row.reportOpenedAt,
  });
  const reportDelivered = reportEvidence.kind === "sent" || reportEvidence.kind === "opened";
  const reportOpened = reportEvidence.kind === "opened";
  const priority = derivePriority({
    size,
    contact,
    crmStatus,
    completed,
    started,
    reportDelivered,
    reportOpened,
    investmentIntent: row.lead.investment_intent,
    nextActionAt: row.opportunity?.next_action_at,
    now,
  });
  const nextAction = describeNextAction(row.opportunity?.next_action_at, now);
  return {
    size,
    contact,
    crmStatus,
    completed,
    started,
    chips,
    reportDelivered,
    reportOpened,
    reportEvidence,
    priority,
    nextAction,
    progressPercent: row.latestAssessment?.progress_percent ?? null,
  };
}
