export type Step = "lead" | "context" | "assessment" | "phone" | "result";
export type CgiReportStatus =
  | "idle"
  | "report_generating"
  | "report_ready"
  | "report_ready_with_warnings"
  | "report_failed";
export type CgiSecondarySyncStatus = "idle" | "secondary_sync_pending" | "secondary_sync_failed" | "secondary_sync_succeeded";

export type LeadForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  companyWebsite: string;
  role: string;
  sector: string;
  sectorOther: string;
  commercialRelationshipModel: string;
  commercialRelationshipOther: string;
  employeeCount: string;
  annualRevenue: string;
  currentChallenge: string;
  growthGoal: string;
  investmentIntent: string;
  comments: string;
};

export type LeadPayload = Omit<LeadForm, "sectorOther" | "commercialRelationshipOther">;

export type CgiConsentState = {
  privacy: boolean;
  marketing: boolean;
};

export type CgiAttribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_page: string | null;
  gclid: string | null;
  fbclid: string | null;
  li_fat_id: string | null;
  touched_at: string;
};

export type CgiAssessmentState = {
  public_assessment_id: string;
  status: "created" | "lead_captured" | "started" | "in_progress" | "completed" | "abandoned";
  current_question: number;
  answers: Record<string, number>;
  lead: LeadForm | null;
  first_touch: CgiAttribution | null;
  last_touch: CgiAttribution | null;
  last_activity_at: string;
  sent_events: Record<string, string>;
  sent_progress: number[];
};

export type SavedCgiAssessment = {
  lead: LeadForm;
  answers: Record<string, number>;
  savedAt: string;
  aiReport?: string;
  aiStatus?: string;
  reportStatus?: CgiReportStatus;
};

/** Router-state handoff from CgiReportView (token resolved to an incomplete
 * assessment) to CGI (renders the actual form). Lives only in React Router's
 * in-memory location.state -- never written to any Storage API, so it
 * naturally disappears on a hard refresh instead of needing manual cleanup.
 * "completed" is deliberately excluded: that case is handled entirely by
 * CgiReportView itself (state: "ready"), never reaches this handoff. */
export type CgiResumeHandoff = {
  publicAssessmentId: string;
  status: "created" | "lead_captured" | "started" | "in_progress" | "abandoned";
  answers: Record<string, number>;
  lead: LeadPayload | null;
};
