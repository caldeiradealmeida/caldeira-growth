export type Step = "lead" | "assessment" | "result";

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

export type SavedCgiAssessment = {
  lead: LeadForm;
  answers: Record<string, number>;
  savedAt: string;
};
