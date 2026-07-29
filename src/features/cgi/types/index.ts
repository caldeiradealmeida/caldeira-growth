export type Step = "lead" | "context" | "assessment" | "phone" | "result";
export type CgiReportStatus = "idle" | "report_generating" | "report_ready" | "report_failed";
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
