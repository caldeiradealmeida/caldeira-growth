import {
  NURTURE_WINDOWS,
  OFFER_TYPE,
  buildSuppressionRecord,
  decideNurture,
  type NurtureCandidate,
  type NurtureDecision,
} from "./_cgi-nurture.js";
import { maskEmail } from "./_cgi-report-followup.js";
import {
  getNurtureLeads,
  getNurtureOpportunities,
  getRecordedCommunicationTypes,
  getReportAccessTimestamps,
  getReportFollowupCandidates,
  getReportLanguages,
  type NurtureLeadRow,
} from "./_cgi-supabase.js";

// D+14 -- a oferta (livro + sessao CGI). Montagem do plano, somente leitura.
//
// Mesmo desenho do D+2 (_cgi-report-followup.ts): este modulo carrega estado,
// chama decideNurture e devolve um plano. Nao envia, nao escreve. O executor
// fica no sweep, e o modo inspect para aqui -- e e isso que torna o inspect o
// "modo ensaio" da oferta: ele mostra para quem sairia, e por que nao sairia,
// sem tocar em nada.
//
// Mora no mesmo endpoint do D+2 (api/cgi/report-followup-sweep.ts) porque o
// projeto esta em 12/12 funcoes no plano Hobby e em 2/2 crons. Um modulo
// separado mantem a leitura do D+2 intacta.

const DIA_MS = 86_400_000;

export type OfferPlanItem = {
  publicAssessmentId: string;
  assessmentId: string;
  leadId: string | null;
  lead: NurtureLeadRow | null;
  decision: NurtureDecision;
  recipientMasked: string;
  reportEmailSentAtIso: string | null;
  daysSinceDelivery: number | null;
  lowestDimensionId: string | null;
  cgiLevel: string | null;
};

export type OfferPlan = {
  windowFromIso: string;
  windowToIso: string;
  candidates: number;
  items: OfferPlanItem[];
  degraded: boolean;
  failedReads: string[];
};

export function offerWindow(now: number): { fromIso: string; toIso: string } {
  const janela = NURTURE_WINDOWS[OFFER_TYPE];
  return {
    fromIso: new Date(now - janela.toDays * DIA_MS).toISOString(),
    toIso: new Date(now - janela.fromDays * DIA_MS).toISOString(),
  };
}

export async function planOffer(input: {
  now: number;
  limit: number;
  env?: Record<string, string | undefined>;
}): Promise<OfferPlan> {
  const { fromIso, toIso } = offerWindow(input.now);

  const consulta = await getReportFollowupCandidates({
    sentFromIso: fromIso,
    sentToIso: toIso,
    limit: input.limit,
  });
  const candidatos = consulta.rows;
  const publicIds = candidatos.map((c) => c.public_assessment_id);
  const leadIds = candidatos.map((c) => c.lead_id).filter((id): id is string => Boolean(id));

  const [acessosRead, leadsRead, oportunidadesRead, registradosRead, idiomasRead] = await Promise.all([
    getReportAccessTimestamps(publicIds),
    getNurtureLeads(leadIds),
    getNurtureOpportunities(leadIds),
    getRecordedCommunicationTypes(publicIds),
    getReportLanguages(publicIds),
  ]);

  // Fail-closed, mesma regra do D+2: qualquer leitura que decide seguranca
  // comercial falhou -> a varredura inteira e suprimida. A janela tem 16 dias;
  // a proxima execucao tenta de novo.
  const failedReads = [
    consulta.ok ? null : "candidates",
    acessosRead.ok ? null : "report_access",
    leadsRead.ok ? null : "leads",
    oportunidadesRead.ok ? null : "crm_opportunities",
    registradosRead.ok ? null : "ledger",
    idiomasRead.ok ? null : "report_language",
  ].filter((nome): nome is string => nome !== null);
  const degraded = failedReads.length > 0;

  const items: OfferPlanItem[] = candidatos.map((c) => {
    const lead = c.lead_id ? leadsRead.rows.get(c.lead_id) ?? null : null;
    const oportunidade = c.lead_id ? oportunidadesRead.rows.get(c.lead_id) ?? null : null;

    const candidate: NurtureCandidate = {
      publicAssessmentId: c.public_assessment_id,
      leadId: c.lead_id,
      reportEmailSentAtIso: c.report_email_sent_at,
      reportOpenedAtIso: acessosRead.rows.get(c.public_assessment_id) ?? null,
      consentMarketing: lead?.consent_marketing ?? null,
      unsubscribedAtIso: lead?.unsubscribed_at ?? null,
      crmStatus: oportunidade?.status ?? "novo",
      lastContactAtIso: oportunidade?.last_contact_at ?? null,
      lowestDimensionId: c.lowest_dimension ?? null,
      alreadyRecordedTypes: registradosRead.rows.get(c.public_assessment_id) ?? [],
      leadClassification: lead?.classification ?? null,
      reportLanguage: idiomasRead.rows.get(c.public_assessment_id) ?? null,
    };

    const decision: NurtureDecision = degraded
      ? {
          decision: "suppress",
          type: OFFER_TYPE,
          reason: "infrastructure_error",
          publicAssessmentId: c.public_assessment_id,
        }
      : decideNurture(OFFER_TYPE, candidate, { now: input.now, env: input.env ?? process.env });

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
      lowestDimensionId: c.lowest_dimension ?? null,
      cgiLevel: c.cgi_level ?? null,
    };
  });

  return {
    windowFromIso: fromIso,
    windowToIso: toIso,
    candidates: candidatos.length,
    items,
    degraded,
    failedReads,
  };
}

export function offerSuppressionsFromPlan(plan: OfferPlan) {
  return plan.items
    .map((item) => buildSuppressionRecord(item.decision))
    .filter((linha): linha is NonNullable<typeof linha> => linha !== null);
}

export function offerSendablesFromPlan(plan: OfferPlan): OfferPlanItem[] {
  if (plan.degraded) return [];
  return plan.items.filter(
    (item) => item.decision.decision === "send" && Boolean(item.lead?.email)
  );
}
