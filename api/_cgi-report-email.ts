import {
  getAssessmentEmailState,
  getCrmOpportunityByLeadId,
  getLeadById,
  getReadyCgiReport,
  getReportEmailState,
  markReportEmailSent,
} from "./_cgi-supabase.js";
import { buildCgiReportReadyEmail, extractExecutiveSummary } from "./_cgi-email-content.js";
import { dispatchCgiParticipantEmail } from "./_cgi-email-dispatch.js";
import { buildReportAccessUrl, issueReportAccessToken } from "./_cgi-report-token.js";
import { recordCommunicationSafely } from "./_cgi-communications.js";
import { ensureContactToken } from "./_cgi-contact-token.js";
import { buildCgiInsightsOptInUrl } from "./_cgi-email-content.js";

// P0 -- out-of-band delivery of the report-ready email.
//
// The inline path in api/cgi-assessment.ts can only fire while the completion
// request is still running. Anything already persisted before that -- a report
// generated while the feature flag was off, or one whose dispatch failed -- is
// unreachable from there forever. This module is the single executor for those
// two cases, and it deliberately reuses the exact same primitives as the inline
// path and the abandonment sweep: same token issuance, same rendered content,
// same relay, same marker column.
//
// Two call reasons, one code path:
//   "recovery" -- assessment completed inside the freshness window. Safe to run
//                 on a schedule or by hand; the window is what stops a future
//                 bug from spontaneously mailing a months-old report.
//   "backfill" -- an explicitly authorized, named assessment. Ignores the
//                 freshness window (that is the whole point) but in exchange
//                 requires the commercial state to still be untouched, re-read
//                 immediately before sending so a contact made two minutes ago
//                 still cancels the send.
//
// Every decision that stops a send returns a typed outcome instead of throwing,
// and report_email_sent_at is written only after the relay confirms delivery --
// so a failure always leaves the assessment safely retryable.

export type ReportEmailReason = "completion" | "recovery" | "backfill";

/** Values the caller already holds in memory. Only the completion path passes
 * this: it has just generated the report and validated the lead inside the
 * same request, so re-reading either from Postgres would add latency to a
 * handler that already spent ~40s on the model, and would change behaviour
 * that is in production today. The out-of-band paths pass nothing and every
 * field is read fresh. */
export type ReportEmailContext = {
  aiReportJson?: string;
  lead?: { name?: string; email?: string; company?: string } | null;
  /** Só o caminho de conclusão passa: ele já validou o lead nesta mesma
   * requisição. Serve exclusivamente para o registro no ledger poder amarrar a
   * linha ao lead sem uma segunda leitura. Nenhuma decisão de envio o usa. */
  leadId?: string | null;
};

type EmailGateState = {
  id?: string | null;
  report_email_sent_at?: string | null;
  lead_id?: string | null;
  completed_at?: string | null;
};

export type ReportEmailOutcome =
  | "sent"
  | "dry_run"
  | "skipped_feature_disabled"
  | "skipped_already_sent"
  | "skipped_not_found"
  | "skipped_not_completed"
  | "skipped_stale"
  | "skipped_report_not_ready"
  | "skipped_missing_executive_summary"
  | "skipped_no_lead"
  | "skipped_recipient"
  | "skipped_commercial_contact"
  | "skipped_commercial_state_unknown"
  | "error_token"
  | "error_dispatch";

export type ReportEmailResult = {
  publicAssessmentId: string;
  outcome: ReportEmailOutcome;
  detail?: string;
};

// Backfill is authorized only for leads nobody has ever worked. "novo" and a
// missing crm_opportunities row are the same thing (rows are created lazily on
// first human touch), and both mean the same thing operationally: Denis has not
// spoken to this person, so a transactional report email cannot land as a
// surprise on top of a conversation that already happened.
const BACKFILL_ALLOWED_CRM_STATUS = "novo";

export const DEFAULT_REPORT_EMAIL_FRESHNESS_HOURS = 72;

export function getReportEmailFreshnessHours(): number {
  const raw = Number(process.env.CGI_REPORT_EMAIL_FRESHNESS_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_REPORT_EMAIL_FRESHNESS_HOURS;
}

export async function deliverReportEmailForAssessment(input: {
  publicAssessmentId: string;
  reason: ReportEmailReason;
  appsScriptUrl: string;
  relayToken: string;
  dryRun: boolean;
  freshnessHours?: number;
  now?: number;
  context?: ReportEmailContext;
}): Promise<ReportEmailResult> {
  const publicAssessmentId = input.publicAssessmentId;
  const now = input.now ?? Date.now();
  const result = (outcome: ReportEmailOutcome, detail?: string): ReportEmailResult =>
    detail ? { publicAssessmentId, outcome, detail } : { publicAssessmentId, outcome };

  // 1. Fresh state read -- the idempotency gate, never a value carried in from
  //    a sweep query or from earlier in the completion request. The completion
  //    path reads the narrow marker row that has been in production since
  //    Etapa 4; the out-of-band paths need completed_at too and read wider.
  const state = (await (input.reason === "completion"
    ? getAssessmentEmailState(publicAssessmentId)
    : getReportEmailState(publicAssessmentId))) as EmailGateState | null;
  if (!state) return result("skipped_not_found");
  if (state.report_email_sent_at) return result("skipped_already_sent");

  // 2. Completion is, by definition, the moment the assessment finished, so
  //    completed_at and freshness are meaningless there -- and requiring them
  //    would make delivery depend on a best-effort write having landed first.
  if (input.reason !== "completion") {
    if (!state.completed_at) return result("skipped_not_completed");
    if (input.reason === "recovery") {
      const hours = input.freshnessHours ?? getReportEmailFreshnessHours();
      const completedAtMs = Date.parse(state.completed_at);
      if (!Number.isFinite(completedAtMs)) return result("skipped_not_completed");
      if (now - completedAtMs > hours * 60 * 60 * 1000) return result("skipped_stale");
    }
  }

  // 3. There must be a real, generated report to quote and link to.
  const aiReportJson =
    input.context?.aiReportJson ??
    (await getReadyCgiReport({ publicAssessmentId }))?.aiReport ??
    "";
  if (!aiReportJson) return result("skipped_report_not_ready");
  const summary = extractExecutiveSummary(aiReportJson);
  if (!summary) return result("skipped_missing_executive_summary");

  // 4. Recipient. Out of band this comes from cgi_leads rather than the
  //    report's frozen lead_json snapshot, so a corrected address is honoured.
  const lead = input.context?.lead ?? (state.lead_id ? await getLeadById(state.lead_id) : null);
  if (!lead) return result("skipped_no_lead");
  const recipient = String(lead.email || "").trim();
  if (!recipient) return result("skipped_recipient");

  // 5. Commercial guard (backfill only), re-read at the last possible moment.
  if (input.reason === "backfill") {
    if (!state.lead_id) return result("skipped_no_lead");
    const lookup = await getCrmOpportunityByLeadId(state.lead_id);
    if (!lookup.ok) return result("skipped_commercial_state_unknown");
    const opportunity = lookup.opportunity;
    if (opportunity) {
      const status = String(opportunity.status || "").trim();
      if (status && status !== BACKFILL_ALLOWED_CRM_STATUS) {
        return result("skipped_commercial_contact", `crm_status:${status}`);
      }
      if (opportunity.last_contact_at) {
        return result("skipped_commercial_contact", "last_contact_at");
      }
      if (opportunity.next_action_at) {
        return result("skipped_commercial_contact", "next_action_at");
      }
    }
  }

  // 6. Token last, immediately before the send -- issuing rotates whatever
  //    token already exists, so it must never happen on a path that then
  //    decides not to send.
  const token = await issueReportAccessToken(publicAssessmentId);
  if (!token) return result("error_token");

  // Reentrada de opt-in: so faz sentido para quem ainda NAO consentiu. Quem ja
  // consentiu nao precisa ver convite nenhum. Se o token de contato nao estiver
  // configurado, a linha simplesmente nao existe -- o e-mail sai igual.
  const contactToken =
    lead.consent_marketing === true || !state.lead_id
      ? null
      : await ensureContactToken(state.lead_id, lead.contact_token_hash);

  const content = buildCgiReportReadyEmail({
    name: String(lead.name || ""),
    company: String(lead.company || ""),
    executiveSummary: summary,
    reportAccessUrl: buildReportAccessUrl(token.token),
    insightsOptInUrl: contactToken ? buildCgiInsightsOptInUrl(contactToken) : null,
  });

  const dispatchResult = await dispatchCgiParticipantEmail({
    appsScriptUrl: input.appsScriptUrl,
    relayToken: input.relayToken,
    recipient,
    content,
    emailKind: "report_ready",
    dryRun: input.dryRun,
  });

  // 7. Ledger (Communication Engine, fase 1). ADITIVO e DEPOIS do envio: o
  //    marcador report_email_sent_at continua sendo a fonte operacional de
  //    idempotência, e recordCommunicationSafely nunca lança nem altera o
  //    resultado devolvido daqui. Dry run não vira linha: não houve
  //    comunicação. Ordem deliberada -- o marcador primeiro, o ledger depois --
  //    para que, se algo falhar entre os dois, o que sobrevive seja a garantia
  //    de não reenviar, não a contabilidade.
  const ledger = (
    status: "sent" | "failed",
    extra: { errorCode?: string } = {}
  ): Promise<unknown> =>
    recordCommunicationSafely({
      type: "report_delivery",
      status,
      leadId: state.lead_id || input.context?.leadId || null,
      assessmentId: state.id || null,
      publicAssessmentId,
      recipient,
      subject: content.subject,
      provider: "apps_script_mailapp",
      actor: input.reason === "completion" ? "system:completion" : `system:${input.reason}`,
      // F-A -- estado REAL do consentimento no momento do evento, lido do lead.
      // null quando a pessoa nunca respondeu, que e diferente de "recusou".
      // Nao altera elegibilidade: a entrega do relatorio e transacional e nao
      // depende de consentimento. Isto e auditoria.
      consentMarketing:
        typeof lead.consent_marketing === "boolean" ? lead.consent_marketing : null,
      metadata: { reason: input.reason },
      now,
      ...(extra.errorCode ? { errorCode: extra.errorCode } : {}),
    });

  if (dispatchResult.status === "sent") {
    // 8. Writeback only after confirmed delivery. If this PATCH itself fails
    //    the send already happened, so the assessment stays retryable and a
    //    rerun would duplicate -- logSupabaseFailure inside markReportEmailSent
    //    is what makes that visible rather than silent.
    const marked = await markReportEmailSent(publicAssessmentId);
    await ledger("sent");
    return marked ? result("sent") : result("sent", "writeback_failed");
  }
  if (dispatchResult.status === "dry_run") return result("dry_run");
  const dispatchError =
    dispatchResult.status === "error" ? dispatchResult.error : dispatchResult.reason;
  await ledger("failed", { errorCode: dispatchError });
  return result("error_dispatch", dispatchError);
}
