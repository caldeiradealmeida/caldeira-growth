import {
  countCompletedAssessmentsForLead,
  getAbandonmentState,
  getCrmOpportunityByLeadId,
  getLeadById,
  getReadyCgiReport,
  markAbandonmentEmailSent,
  type AbandonmentStateRow,
  type CgiLeadRow,
} from "./_cgi-supabase.js";
import {
  buildCgiLeadCaptureAbandonmentEmail,
  buildCgiProgressAbandonmentEmail,
} from "./_cgi-email-content.js";
import { dispatchCgiParticipantEmail } from "./_cgi-email-dispatch.js";
import { buildReportAccessUrl, issueReportAccessToken } from "./_cgi-report-token.js";
import { recordCommunicationSafely } from "./_cgi-communications.js";

// Abandonment V2 -- one executor, two kinds, and a decision step that is
// deliberately separated from the send step.
//
// `evaluateAbandonmentCandidate` performs every read and every guard and returns
// a typed decision. It issues no token, calls no relay and writes nothing. The
// inspect mode of the sweep endpoint calls ONLY this function, which is what
// makes "read-only" a structural property rather than a promise: there is no
// code path from evaluate to a side effect.
//
// `deliverAbandonmentEmailForAssessment` calls evaluate first and only then
// touches anything.
//
// IDEMPOTENCY, DELIBERATE LIMITATION OF THIS PHASE
// ------------------------------------------------
// abandonment_email_sent_at remains the single canonical marker, so an
// assessment receives AT MOST ONE abandonment email ever -- whichever kind fired
// first. Someone who gets abandon_lead_d1 and later starts answering will not
// receive abandon_progress_d1. That is intentional here: this patch is not a
// multi-step ladder and does not introduce cgi_communications or a second
// marker. The future communication engine can lift the limitation.

export type AbandonmentKind = "abandon_lead_d1" | "abandon_progress_d1";

export type AbandonmentOutcome =
  | "would_send"
  | "sent"
  | "skipped_not_found"
  | "skipped_completed"
  | "skipped_already_sent"
  | "skipped_report_ready"
  | "skipped_completed_elsewhere"
  | "skipped_completion_state_unknown"
  | "skipped_report_email_sent"
  | "skipped_no_lead"
  | "skipped_recipient"
  | "skipped_too_recent"
  | "skipped_outside_window"
  | "skipped_commercial_contact"
  | "skipped_commercial_state_unknown"
  | "skipped_feature_disabled"
  | "error_token"
  | "error_dispatch";

export type AbandonmentDecision = {
  publicAssessmentId: string;
  outcome: AbandonmentOutcome;
  abandonmentKind: AbandonmentKind | null;
  inactiveHours: number | null;
  maskedRecipient: string | null;
  subject: string | null;
  detail?: string;
};

/** Subjects, kept next to the decision so inspect can report what would be sent
 * without rendering a body (which would require a token that must not exist for
 * a read-only call). A test pins these against the actual builders. */
export const ABANDONMENT_SUBJECTS: Record<AbandonmentKind, string> = {
  abandon_lead_d1: "Seu acesso ao CGI continua disponível",
  abandon_progress_d1: "Seu diagnóstico CGI ficou em aberto",
};

export const DEFAULT_ABANDONMENT_DELAY_HOURS = 24;
export const DEFAULT_ABANDONMENT_MAX_AGE_HOURS = 168; // 7 dias

export function getAbandonmentDelayHours(): number {
  const raw = Number(process.env.CGI_ABANDONMENT_DELAY_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_ABANDONMENT_DELAY_HOURS;
}

export function getAbandonmentMaxAgeHours(): number {
  const raw = Number(process.env.CGI_ABANDONMENT_MAX_AGE_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_ABANDONMENT_MAX_AGE_HOURS;
}

/** Fail-closed feature switch for everything introduced by V2. While this is
 * off, the sweep endpoint keeps its previous behaviour byte for byte and no new
 * kind of email can be produced by any path. */
export function isAbandonmentV2Enabled(): boolean {
  return process.env.CGI_ABANDONMENT_V2_ENABLED === "true";
}

/** Recomputed at send time, never trusted from the selection query. */
export function classifyAbandonmentKind(state: {
  current_question?: number | null;
  progress_percent?: number | null;
}): AbandonmentKind {
  const answered = typeof state.current_question === "number" ? state.current_question : 0;
  const progress = typeof state.progress_percent === "number" ? state.progress_percent : 0;
  return answered > 0 || progress > 0 ? "abandon_progress_d1" : "abandon_lead_d1";
}

export function maskEmail(email: string): string {
  const value = String(email || "").trim();
  const at = value.indexOf("@");
  if (at <= 0) return "***";
  return `${value.slice(0, 1)}***${value.slice(at)}`;
}

/** Raw elapsed hours. Kept unrounded on purpose: rounding here would let an
 * assessment idle for 23h59 pass a 24h gate. The rounded value is for display
 * only. */
function rawHoursSince(fromIso: string | null, now: number): number | null {
  if (!fromIso) return null;
  const ms = Date.parse(fromIso);
  if (!Number.isFinite(ms)) return null;
  return (now - ms) / 3_600_000;
}

function forDisplay(hours: number | null): number | null {
  return hours === null ? null : Math.round(hours * 10) / 10;
}

/** Pure decision: reads, guards, classifies. No token, no relay, no write. */
export async function evaluateAbandonmentCandidate(input: {
  publicAssessmentId: string;
  enforceMaxAge: boolean;
  now?: number;
  delayHours?: number;
  maxAgeHours?: number;
  state?: AbandonmentStateRow | null;
}): Promise<{ decision: AbandonmentDecision; state: AbandonmentStateRow | null; lead: CgiLeadRow | null }> {
  const publicAssessmentId = input.publicAssessmentId;
  const now = input.now ?? Date.now();
  const delayHours = input.delayHours ?? getAbandonmentDelayHours();
  const maxAgeHours = input.maxAgeHours ?? getAbandonmentMaxAgeHours();

  const make = (
    outcome: AbandonmentOutcome,
    extra: Partial<AbandonmentDecision> = {}
  ): AbandonmentDecision => ({
    publicAssessmentId,
    outcome,
    abandonmentKind: extra.abandonmentKind ?? null,
    inactiveHours: extra.inactiveHours ?? null,
    maskedRecipient: extra.maskedRecipient ?? null,
    subject: extra.subject ?? null,
    ...(extra.detail ? { detail: extra.detail } : {}),
  });

  // 1. Fresh state. Never trust a row carried in from the sweep query.
  const state = input.state ?? (await getAbandonmentState(publicAssessmentId));
  if (!state) return { decision: make("skipped_not_found"), state: null, lead: null };

  const rawInactiveHours = rawHoursSince(state.last_activity_at, now);
  const inactiveHours = forDisplay(rawInactiveHours);

  // 2. Lifecycle guards. completed_at first: a finished assessment is never an
  //    abandonment, whatever its status column says.
  if (state.completed_at) return { decision: make("skipped_completed", { inactiveHours }), state, lead: null };
  if (state.abandonment_email_sent_at) return { decision: make("skipped_already_sent", { inactiveHours }), state, lead: null };
  if (state.report_email_sent_at) return { decision: make("skipped_report_email_sent", { inactiveHours }), state, lead: null };

  // 3. Time window. The lower bound always applies; the upper bound only for the
  //    automatic sweep -- an authorized nominal backfill is about old rows.
  if (rawInactiveHours === null) return { decision: make("skipped_too_recent"), state, lead: null };
  if (rawInactiveHours < delayHours) return { decision: make("skipped_too_recent", { inactiveHours }), state, lead: null };
  if (input.enforceMaxAge && rawInactiveHours > maxAgeHours) {
    return { decision: make("skipped_outside_window", { inactiveHours }), state, lead: null };
  }

  const abandonmentKind = classifyAbandonmentKind(state);
  const subject = ABANDONMENT_SUBJECTS[abandonmentKind];

  // 4. A ready report means the person finished somewhere -- never chase them.
  const report = await getReadyCgiReport({ publicAssessmentId });
  if (report) return { decision: make("skipped_report_ready", { inactiveHours, abandonmentKind }), state, lead: null };

  // 5. Recipient.
  if (!state.lead_id) return { decision: make("skipped_no_lead", { inactiveHours, abandonmentKind }), state, lead: null };

  // 5b. A pessoa terminou -- em OUTRA linha.
  //
  // A guarda 2 (completed_at) e a guarda 4 (relatorio pronto) fazem a pergunta
  // certa no objeto errado: as duas olham ESTE assessment. Quando a geracao do
  // relatorio falha, o botao "tentar novamente" cria um public_assessment_id
  // novo, e tanto a conclusao quanto o relatorio pronto passam a viver na linha
  // nova. A linha antiga continua in_progress, sem completed_at, sem relatorio
  // -- e, para as guardas acima, indistinguivel de alguem que largou no meio.
  //
  // Foi assim que uma pessoa que concluiu o CGI as 02:02 do dia 21/08 recebeu,
  // no dia 22, um e-mail dizendo que o diagnostico dela tinha ficado em aberto.
  // A persistencia antecipada da conclusao (commit anterior) impede que isso
  // volte a acontecer pela causa original; esta guarda impede que aconteca por
  // QUALQUER caminho que produza uma segunda linha, incluindo as linhas que ja
  // existem no banco de antes da correcao.
  //
  // So suprime, nunca habilita: nao ha valor de retorno desta leitura capaz de
  // fazer um e-mail sair que nao sairia sem ela. Leitura falha => nao envia.
  const conclusoesDaPessoa = await countCompletedAssessmentsForLead({
    leadId: state.lead_id,
    excludePublicAssessmentId: publicAssessmentId,
  });
  if (!conclusoesDaPessoa.ok) {
    return {
      decision: make("skipped_completion_state_unknown", { inactiveHours, abandonmentKind }),
      state,
      lead: null,
    };
  }
  if (conclusoesDaPessoa.rows > 0) {
    return {
      decision: make("skipped_completed_elsewhere", { inactiveHours, abandonmentKind }),
      state,
      lead: null,
    };
  }

  const lead = await getLeadById(state.lead_id);
  if (!lead) return { decision: make("skipped_no_lead", { inactiveHours, abandonmentKind }), state, lead: null };
  const recipient = String(lead.email || "").trim();
  if (!recipient) return { decision: make("skipped_recipient", { inactiveHours, abandonmentKind }), state, lead };
  const maskedRecipient = maskEmail(recipient);

  // 6. Commercial guard. A missing crm_opportunities row is not a problem: rows
  //    are created lazily on the first human touch, so "no row" is exactly what
  //    the Pipe shows as Novo. A failed read is NOT treated as Novo.
  //    consent_marketing is deliberately not consulted -- this is an operational
  //    reminder about a diagnostic the person started themselves.
  const lookup = await getCrmOpportunityByLeadId(state.lead_id);
  if (!lookup.ok) {
    return {
      decision: make("skipped_commercial_state_unknown", { inactiveHours, abandonmentKind, maskedRecipient, subject }),
      state,
      lead,
    };
  }
  const opportunity = lookup.opportunity;
  if (opportunity) {
    const status = String(opportunity.status || "").trim();
    if (status && status !== "novo") {
      return {
        decision: make("skipped_commercial_contact", { inactiveHours, abandonmentKind, maskedRecipient, subject, detail: `crm_status:${status}` }),
        state,
        lead,
      };
    }
    if (opportunity.last_contact_at) {
      return { decision: make("skipped_commercial_contact", { inactiveHours, abandonmentKind, maskedRecipient, subject, detail: "last_contact_at" }), state, lead };
    }
    if (opportunity.next_action_at) {
      return { decision: make("skipped_commercial_contact", { inactiveHours, abandonmentKind, maskedRecipient, subject, detail: "next_action_at" }), state, lead };
    }
  }

  return {
    decision: make("would_send", { inactiveHours, abandonmentKind, maskedRecipient, subject }),
    state,
    lead,
  };
}

/** Decision + send. Token is issued only after every guard passed, immediately
 * before the relay call; the marker is written only after the relay confirms. */
export async function deliverAbandonmentEmailForAssessment(input: {
  publicAssessmentId: string;
  enforceMaxAge: boolean;
  appsScriptUrl: string;
  relayToken: string;
  dryRun: boolean;
  now?: number;
  delayHours?: number;
  maxAgeHours?: number;
}): Promise<AbandonmentDecision> {
  const evaluated = await evaluateAbandonmentCandidate({
    publicAssessmentId: input.publicAssessmentId,
    enforceMaxAge: input.enforceMaxAge,
    now: input.now,
    delayHours: input.delayHours,
    maxAgeHours: input.maxAgeHours,
  });
  const base = evaluated.decision;
  if (base.outcome !== "would_send") return base;

  const lead = evaluated.lead as CgiLeadRow;
  const kind = base.abandonmentKind as AbandonmentKind;

  const token = await issueReportAccessToken(input.publicAssessmentId);
  if (!token) return { ...base, outcome: "error_token" };

  const reportAccessUrl = buildReportAccessUrl(token.token);
  const content =
    kind === "abandon_lead_d1"
      ? buildCgiLeadCaptureAbandonmentEmail({
          name: String(lead.name || ""),
          company: String(lead.company || ""),
          reportAccessUrl,
        })
      : buildCgiProgressAbandonmentEmail({ name: String(lead.name || ""), reportAccessUrl });

  const dispatchResult = await dispatchCgiParticipantEmail({
    appsScriptUrl: input.appsScriptUrl,
    relayToken: input.relayToken,
    recipient: String(lead.email || "").trim(),
    content,
    // The relay does no templating: subject/plainText/htmlBody arrive fully
    // rendered. Both kinds therefore travel on the existing "abandonment"
    // channel, and no new Apps Script configuration is required.
    emailKind: "abandonment",
    dryRun: input.dryRun,
  });

  // Ledger (Communication Engine, fase 1). Aditivo, posterior ao envio e
  // incapaz de alterar o resultado: abandonment_email_sent_at segue sendo o
  // marcador operacional. Aqui o tipo registrado é a KIND real
  // (abandon_lead_d1 / abandon_progress_d1), que é a informação que o marcador
  // único de hoje não consegue guardar -- é exatamente essa perda que o motor
  // de comunicação existe para resolver.
  const ledger = (status: "sent" | "failed", errorCode?: string): Promise<unknown> =>
    recordCommunicationSafely({
      type: kind,
      status,
      leadId: evaluated.state?.lead_id || null,
      assessmentId: evaluated.state?.id || null,
      publicAssessmentId: input.publicAssessmentId,
      recipientMasked: base.maskedRecipient,
      subject: base.subject,
      provider: "apps_script_mailapp",
      actor: input.enforceMaxAge ? "system:cron" : "system:backfill",
      // F-A -- estado REAL do consentimento no momento do evento. O e-mail de
      // abandono e operacional e deliberadamente NAO consulta consent_marketing
      // para decidir se envia; registrar o estado aqui e auditoria, nao regra.
      consentMarketing:
        typeof lead.consent_marketing === "boolean" ? lead.consent_marketing : null,
      metadata: {
        inactive_hours: base.inactiveHours,
        enforce_max_age: input.enforceMaxAge,
      },
      now: input.now,
      ...(errorCode ? { errorCode } : {}),
    });

  if (dispatchResult.status === "sent") {
    const marked = await markAbandonmentEmailSent(input.publicAssessmentId);
    await ledger("sent");
    return marked ? { ...base, outcome: "sent" } : { ...base, outcome: "sent", detail: "writeback_failed" };
  }
  if (dispatchResult.status === "dry_run") return { ...base, outcome: "would_send", detail: "dry_run" };
  const dispatchError =
    dispatchResult.status === "error" ? dispatchResult.error : dispatchResult.reason;
  await ledger("failed", dispatchError);
  return {
    ...base,
    outcome: "error_dispatch",
    detail: dispatchError,
  };
}
