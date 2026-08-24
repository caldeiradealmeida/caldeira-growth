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

export type Priority = {
  level: PriorityLevel;
  /** Uma frase. É o contrato: nenhum nível existe sem explicação. */
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

  // 1. Encerrados saem da fila -- mas continuam na lista.
  if (input.crmStatus === "convertido") return { level: "P4", reason: "Convertido — fora da fila." };
  if (CLOSED_STATUSES.has(input.crmStatus)) {
    return { level: "P4", reason: `${input.crmStatus === "sem_interesse" ? "Sem interesse" : "Descartado"} — fora da fila.` };
  }

  // 2. Compromisso vencido é a coisa mais acionável que existe.
  const atrasado = overdueDays(input.nextActionAt, now);
  if (atrasado !== null) {
    return { level: "P1", reason: `Ação combinada venceu há ${atrasado} ${atrasado === 1 ? "dia" : "dias"}.` };
  }

  // 3. Processo comercial em andamento: já tem dono e próximo passo.
  if (IN_COMMERCIAL_PROCESS.has(input.crmStatus)) {
    return { level: "P2", reason: `${porte}, em processo comercial (${input.crmStatus.replace(/_/g, " ")}).` };
  }

  // 4. O coração da fila: concluiu o diagnóstico e ninguém falou com a pessoa.
  if (input.completed && !isContacted(input.contact)) {
    const reforcos: string[] = [];
    if (input.reportOpened) reforcos.push("abriu o relatório");
    else if (input.reportDelivered) reforcos.push("relatório entregue");
    if (hasStrongIntent(input.investmentIntent)) reforcos.push("declarou intenção de investir");
    const sufixo = reforcos.length ? `, ${reforcos.join(" e ")}` : "";

    // Porte relevante, ou sinal comercial forte, sobe para P1.
    if (input.size.tier >= 2 || reforcos.length > 0) {
      return { level: "P1", reason: `${porte}, CGI concluído, nenhum contato humano${sufixo}.` };
    }
    return { level: "P2", reason: `${porte}, CGI concluído, nenhum contato humano.` };
  }

  // 5. Concluiu e já foi contatado: follow-up.
  if (input.completed && isContacted(input.contact)) {
    if (input.contact.kind === "contacted") {
      return { level: "P2", reason: `${porte}, concluído e contatado há ${input.contact.daysAgo} ${input.contact.daysAgo === 1 ? "dia" : "dias"}.` };
    }
    return { level: "P2", reason: `${porte}, concluído e já contatado (sem data registrada).` };
  }

  // 6. Não concluiu. Porte relevante ainda merece um olhar.
  if (input.size.tier >= 3) {
    return { level: "P3", reason: `${porte}, CGI ${input.started ? "abandonado no meio" : "não iniciado"}.` };
  }
  if (input.started || input.size.known) {
    return { level: "P3", reason: `${porte}, CGI ${input.started ? "abandonado no meio" : "não iniciado"}.` };
  }

  // 7. Resto.
  return { level: "P4", reason: "Sem porte informado e sem engajamento no diagnóstico." };
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
// FILTROS DA FILA
// ---------------------------------------------------------------------------

export type QueueFilter = "todos" | "a_contatar" | "follow_up" | "em_proposta" | "aguardando";

export const QUEUE_FILTER_LABELS: Record<QueueFilter, string> = {
  todos: "Todos",
  a_contatar: "A contatar",
  follow_up: "Follow-up",
  em_proposta: "Em proposta",
  aguardando: "Aguardando",
};

export function matchesQueueFilter(
  filter: QueueFilter,
  view: { priority: Priority; contact: ContactState; crmStatus: string; completed: boolean }
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
    case "aguardando":
      return view.crmStatus === "contato_pendente" || view.priority.reason.startsWith("Ação combinada venceu");
    default:
      return true;
  }
}

const PRIORITY_RANK: Record<PriorityLevel, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

/** Ordenação padrão da fila: prioridade, depois porte, depois score. */
export function compareForQueue(
  a: { priority: Priority; size: CompanySize; bestScore: number | null },
  b: { priority: Priority; size: CompanySize; bestScore: number | null }
): number {
  const byPriority = PRIORITY_RANK[a.priority.level] - PRIORITY_RANK[b.priority.level];
  if (byPriority !== 0) return byPriority;
  const bySize = b.size.tier - a.size.tier;
  if (bySize !== 0) return bySize;
  return (b.bestScore ?? -1) - (a.bestScore ?? -1);
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
  const reportDelivered = chips.some((c) => c.label === "Relatório");
  const reportOpened = Boolean(row.reportOpenedAt);
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
  return { size, contact, crmStatus, completed, started, chips, reportDelivered, reportOpened, priority };
}
