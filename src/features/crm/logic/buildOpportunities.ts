import type {
  CgiAssessment,
  CgiAttribution,
  CgiLead,
  CgiReportSummary,
  CrmOpportunity,
  CrmPersonLink,
  OpportunityRow,
} from "../types";

function activityTimestamp(a: CgiAssessment): number {
  const t = a.completed_at || a.last_activity_at || a.created_at;
  return t ? new Date(t).getTime() : 0;
}

/** Assembles one OpportunityRow per cgi_leads row from independently-fetched,
 * RLS-scoped table reads. No server-side view/RPC exists for this on purpose --
 * schema is frozen for v0.1, so the join happens here instead of in SQL. */
export function buildOpportunities(input: {
  leads: CgiLead[];
  opportunities: CrmOpportunity[];
  assessments: CgiAssessment[];
  attribution: CgiAttribution[];
  reports: CgiReportSummary[];
  personLinks: CrmPersonLink[];
}): OpportunityRow[] {
  const opportunityByLead = new Map(input.opportunities.map((o) => [o.lead_id, o]));
  const personLinkByLead = new Map(input.personLinks.map((l) => [l.lead_id, l.person_id]));
  const attributionByAssessment = new Map(input.attribution.map((a) => [a.assessment_id, a]));
  // A public_assessment_id can now have multiple report versions (manual
  // regeneration) -- always keep the highest version, not just whichever
  // row happens to be last in the fetched array.
  const reportByPublicAssessmentId = new Map<string, CgiReportSummary>();
  for (const r of input.reports) {
    const current = reportByPublicAssessmentId.get(r.public_assessment_id);
    if (!current || (r.version ?? 0) > (current.version ?? 0)) {
      reportByPublicAssessmentId.set(r.public_assessment_id, r);
    }
  }

  const assessmentsByLead = new Map<string, CgiAssessment[]>();
  for (const a of input.assessments) {
    if (!a.lead_id) continue;
    const list = assessmentsByLead.get(a.lead_id) ?? [];
    list.push(a);
    assessmentsByLead.set(a.lead_id, list);
  }

  const rows: OpportunityRow[] = [];

  for (const lead of input.leads) {
    const opportunity = opportunityByLead.get(lead.id) ?? null;
    if (opportunity?.is_test_excluded) continue;

    const leadAssessments = assessmentsByLead.get(lead.id) ?? [];
    const sorted = [...leadAssessments].sort((a, b) => activityTimestamp(b) - activityTimestamp(a));
    const latestAssessment = sorted[0] ?? null;
    const earliestAssessment = leadAssessments.reduce<CgiAssessment | null>((earliest, a) => {
      if (!earliest) return a;
      return new Date(a.created_at).getTime() < new Date(earliest.created_at).getTime() ? a : earliest;
    }, null);

    const bestScore = leadAssessments.reduce<number | null>((best, a) => {
      if (a.cgi_score === null) return best;
      return best === null ? a.cgi_score : Math.max(best, a.cgi_score);
    }, null);

    const lastActivityAt = sorted.length
      ? new Date(activityTimestamp(sorted[0])).toISOString()
      : null;

    // Most recent report across ALL of the lead's assessments, not just the
    // latest one -- a lead with multiple assessments may have their report
    // attached to an older attempt.
    const reportsForLead = leadAssessments
      .map((a) => reportByPublicAssessmentId.get(a.public_assessment_id))
      .filter((r): r is CgiReportSummary => Boolean(r))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latestReport = reportsForLead[0] ?? null;

    const originAttribution = earliestAssessment
      ? attributionByAssessment.get(earliestAssessment.id) ?? null
      : null;

    rows.push({
      lead,
      opportunity,
      personId: personLinkByLead.get(lead.id) ?? null,
      assessmentCount: leadAssessments.length,
      latestAssessment,
      bestScore,
      lastActivityAt,
      latestReport,
      originAttribution,
    });
  }

  return rows;
}
