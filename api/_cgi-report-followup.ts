import {
  NURTURE_WINDOWS,
  buildSuppressionRecord,
  decideNurture,
  type NurtureCandidate,
  type NurtureDecision,
} from "./_cgi-nurture.js";
import { maskRecipient } from "./_cgi-communications.js";
import {
  getNurtureLeads,
  getNurtureOpportunities,
  getRecordedCommunicationTypes,
  getReportAccessTimestamps,
  getReportFollowupCandidates,
  type NurtureLeadRow,
} from "./_cgi-supabase.js";

// D+2 -- montagem dos candidatos e do plano.
//
// Separado do handler HTTP de proposito. Aqui tudo o que acontece e LEITURA:
// carrega o estado, monta o input de elegibilidade, chama decideNurture e
// devolve um plano. Nada aqui envia, nada aqui escreve.
//
// E essa separacao que torna o modo inspect seguro por construcao e nao por
// disciplina: inspect chama planReportFollowup e para. Nao existe caminho de
// codigo que saia do plano para o envio sem passar pelo executor, que e outra
// funcao, chamada em outro lugar.

const DIA_MS = 86_400_000;

export type ReportFollowupPlanItem = {
  publicAssessmentId: string;
  assessmentId: string;
  leadId: string | null;
  lead: NurtureLeadRow | null;
  decision: NurtureDecision;
  /** Destinatario SEMPRE mascarado. O e-mail em claro nunca entra no plano --
   * e o que garante que inspect nao possa vazar endereco. */
  recipientMasked: string;
  reportEmailSentAtIso: string | null;
  daysSinceDelivery: number | null;
};

export type ReportFollowupPlan = {
  windowFromIso: string;
  windowToIso: string;
  candidates: number;
  items: ReportFollowupPlanItem[];
};

/** Mascara do plano. Reusa a do ledger de proposito: duas mascaras diferentes
 * para o mesmo endereco tornariam impossivel cruzar o que o inspect mostrou
 * com o que o ledger gravou. */
export function maskEmail(email: string | null | undefined): string {
  return maskRecipient(email) ?? "(sem e-mail)";
}

/** Janela do D+2 traduzida em duas datas absolutas.
 *
 * Entregue ha 2..5 dias significa report_email_sent_at entre (agora - 5d) e
 * (agora - 2d). Aplicar isso na consulta, e nao so na decisao, e o que impede
 * o executor de carregar a base inteira. */
export function reportFollowupWindow(now: number): { fromIso: string; toIso: string } {
  const janela = NURTURE_WINDOWS.report_followup_d2;
  return {
    fromIso: new Date(now - janela.toDays * DIA_MS).toISOString(),
    toIso: new Date(now - janela.fromDays * DIA_MS).toISOString(),
  };
}

/** Monta o plano. Somente leitura. */
export async function planReportFollowup(input: {
  now: number;
  limit: number;
  env?: Record<string, string | undefined>;
}): Promise<ReportFollowupPlan> {
  const { fromIso, toIso } = reportFollowupWindow(input.now);

  const candidatos = await getReportFollowupCandidates({
    sentFromIso: fromIso,
    sentToIso: toIso,
    limit: input.limit,
  });

  const publicIds = candidatos.map((c) => c.public_assessment_id);
  const leadIds = candidatos.map((c) => c.lead_id).filter((id): id is string => Boolean(id));

  const [acessos, leads, oportunidades, registrados] = await Promise.all([
    getReportAccessTimestamps(publicIds),
    getNurtureLeads(leadIds),
    getNurtureOpportunities(leadIds),
    getRecordedCommunicationTypes(publicIds),
  ]);

  const items: ReportFollowupPlanItem[] = candidatos.map((c) => {
    const lead = c.lead_id ? leads.get(c.lead_id) ?? null : null;
    const oportunidade = c.lead_id ? oportunidades.get(c.lead_id) ?? null : null;

    const candidate: NurtureCandidate = {
      publicAssessmentId: c.public_assessment_id,
      leadId: c.lead_id,
      reportEmailSentAtIso: c.report_email_sent_at,
      reportOpenedAtIso: acessos.get(c.public_assessment_id) ?? null,
      consentMarketing: lead?.consent_marketing ?? null,
      unsubscribedAtIso: lead?.unsubscribed_at ?? null,
      // Ausencia de oportunidade no CRM significa "novo" -- é a mesma
      // convencao que o Pipe usa.
      crmStatus: oportunidade?.status ?? "novo",
      lastContactAtIso: oportunidade?.last_contact_at ?? null,
      lowestDimensionId: null, // irrelevante para o D+2
      alreadyRecordedTypes: registrados.get(c.public_assessment_id) ?? [],
    };

    const decision = decideNurture("report_followup_d2", candidate, {
      now: input.now,
      env: input.env ?? process.env,
    });

    const ms = c.report_email_sent_at ? new Date(c.report_email_sent_at).getTime() : NaN;

    return {
      publicAssessmentId: c.public_assessment_id,
      assessmentId: c.id,
      leadId: c.lead_id,
      lead,
      decision,
      recipientMasked: maskEmail(lead?.email),
      reportEmailSentAtIso: c.report_email_sent_at,
      daysSinceDelivery: Number.isFinite(ms)
        ? Math.round(((input.now - ms) / DIA_MS) * 100) / 100
        : null,
    };
  });

  return { windowFromIso: fromIso, windowToIso: toIso, candidates: candidatos.length, items };
}

/** Linhas de supressao que o plano produziria. Nao escreve -- so descreve. */
export function suppressionsFromPlan(plan: ReportFollowupPlan) {
  return plan.items
    .map((item) => buildSuppressionRecord(item.decision))
    .filter((linha): linha is NonNullable<typeof linha> => linha !== null);
}

export function sendablesFromPlan(plan: ReportFollowupPlan): ReportFollowupPlanItem[] {
  // Um item so e enviavel se a decisao for "send" E houver lead com e-mail.
  // A segunda condicao nao e redundante: decideNurture nao conhece o lead.
  return plan.items.filter(
    (item) => item.decision.decision === "send" && Boolean(item.lead?.email)
  );
}
