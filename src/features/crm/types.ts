export type CgiDimension = "strategy" | "market" | "growthMachine" | "execution" | "leadership";

export type CgiLead = {
  id: string;
  email_normalized: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  company_website: string | null;
  role: string;
  sector: string;
  commercial_relationship_model: string;
  employee_count: string;
  annual_revenue_range: string;
  current_challenge: string;
  growth_goal: string;
  investment_intent: string;
  comments: string | null;
  created_at: string;
};

export type CgiAssessment = {
  id: string;
  public_assessment_id: string;
  lead_id: string | null;
  status: "created" | "lead_captured" | "started" | "in_progress" | "completed" | "abandoned";
  progress_percent: number;
  current_question: number | null;
  started_at: string | null;
  last_activity_at: string | null;
  completed_at: string | null;
  cgi_score: number | null;
  strategy_score: number | null;
  market_customer_score: number | null;
  growth_engine_score: number | null;
  execution_management_score: number | null;
  leadership_culture_score: number | null;
  cgi_level: "reactive" | "intentional" | "structured" | "scalable" | null;
  lowest_dimension: CgiDimension | null;
  highest_dimension: CgiDimension | null;
  created_at: string;
};

export type CgiAnswer = {
  id: string;
  assessment_id: string;
  question_id: string;
  dimension_id: CgiDimension;
  answer_value: number;
};

export type CgiAttribution = {
  assessment_id: string;
  first_utm_source: string | null;
  first_utm_medium: string | null;
  first_utm_campaign: string | null;
  first_referrer: string | null;
  first_landing_page: string | null;
  first_touch_at: string | null;
};

export type CgiReport = {
  id: string;
  public_assessment_id: string;
  report_status: "report_generating" | "report_ready" | "report_failed";
  language: "pt" | "en" | "es" | null;
  ai_report_text: string | null;
  report_json: unknown;
  lead_json: unknown;
  score_json: unknown;
  model: string | null;
  version: number;
  generation_completed_at: string | null;
  created_at: string;
};

/** Lean projection used by the opportunities list (CrmList), which only ever
 * renders report_status -- avoids pulling lead_json/score_json/answers_json
 * for every row in the list. */
export type CgiReportSummary = Pick<
  CgiReport,
  "id" | "public_assessment_id" | "report_status" | "language" | "ai_report_text" | "report_json" | "version" | "created_at"
>;

export type CrmOpportunityStatus =
  | "novo"
  | "revisado"
  | "contato_pendente"
  | "contato_realizado"
  | "reuniao_agendada"
  | "enviar_proposta"
  | "proposta_enviada"
  | "convertido"
  | "sem_interesse"
  | "descartado";

export type CrmOpportunity = {
  lead_id: string;
  status: CrmOpportunityStatus;
  owner_email: string | null;
  notes: string | null;
  next_action_at: string | null;
  last_contact_at: string | null;
  estimated_value: number | null;
  lost_reason: string | null;
  is_test_excluded: boolean;
  created_at: string;
  updated_at: string;
};

export type CrmPerson = {
  id: string;
  display_name: string | null;
  primary_email_normalized: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type CrmPersonLink = {
  lead_id: string;
  person_id: string;
  linked_by_email: string;
  linked_at: string;
};

/** One row per opportunity (cgi_leads.id), assembled client-side from several
 * RLS-scoped reads -- no server-side view/RPC exists for this, by design
 * (schema changes are frozen for v0.1). */
export type OpportunityRow = {
  lead: CgiLead;
  opportunity: CrmOpportunity | null;
  personId: string | null;
  assessmentCount: number;
  latestAssessment: CgiAssessment | null;
  bestScore: number | null;
  lastActivityAt: string | null;
  latestReport: CgiReportSummary | null;
  originAttribution: CgiAttribution | null;
};
