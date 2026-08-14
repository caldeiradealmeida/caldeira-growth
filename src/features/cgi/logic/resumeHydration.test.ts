import { describe, expect, it } from "vitest";
import { computeResumeHydration } from "./resumeHydration";
import { initialLead } from "../config";
import type { CgiResumeHandoff } from "../types";

// Real CGI_QUESTIONS (default of resolveResumeDimensionIndex) is ordered in
// exactly this dimension sequence, 8 questions each, ids q1..q40 -- so
// answersUpTo(N) here lines up with the real per-dimension boundaries.
const DIMENSIONS = ["strategy", "market", "growthMachine", "execution", "leadership"] as const;

function answersUpTo(count: number): Record<string, number> {
  const answers: Record<string, number> = {};
  for (let i = 1; i <= count; i += 1) answers[`q${i}`] = 4;
  return answers;
}

const lead: CgiResumeHandoff["lead"] = {
  name: "Marines",
  email: "marines@example.com",
  phone: "",
  company: "Empresa Teste",
  companyWebsite: "",
  role: "CEO",
  sector: "Tecnologia e software",
  commercialRelationshipModel: "B2B",
  employeeCount: "1-10",
  annualRevenue: "Prefiro não informar",
  currentChallenge: "Crescer receita",
  growthGoal: "11-25%",
  investmentIntent: "Ainda avaliando",
  comments: "",
};

describe("computeResumeHydration", () => {
  it("lands on step 'lead' when there is no lead at all (status created, never identified)", () => {
    const handoff: CgiResumeHandoff = {
      publicAssessmentId: "pub_1",
      status: "created",
      answers: {},
      lead: null,
    };
    const result = computeResumeHydration(handoff, initialLead, DIMENSIONS);
    expect(result.step).toBe("lead");
    expect(result.lead).toBeNull();
    expect(result.dimensionIndex).toBeNull();
    expect(result.publicAssessmentId).toBe("pub_1");
  });

  it("lands on step 'context' when lead is known but no answers exist yet (lead_captured)", () => {
    const handoff: CgiResumeHandoff = {
      publicAssessmentId: "pub_1",
      status: "lead_captured",
      answers: {},
      lead,
    };
    const result = computeResumeHydration(handoff, initialLead, DIMENSIONS);
    expect(result.step).toBe("context");
    expect(result.lead).not.toBeNull();
    expect(result.dimensionIndex).toBeNull();
  });

  it("lands directly on step 'assessment' with answers already filled in when resuming mid-assessment", () => {
    const handoff: CgiResumeHandoff = {
      publicAssessmentId: "pub_1",
      status: "in_progress",
      answers: answersUpTo(16),
      lead,
    };
    const result = computeResumeHydration(handoff, initialLead, DIMENSIONS);
    expect(result.step).toBe("assessment");
    expect(result.answers).toEqual(answersUpTo(16));
    expect(result.answeredCount).toBe(16);
    expect(result.dimensionIndex).toBe(2);
  });

  it("skips identification and context -- lead/context already informed is not requested again", () => {
    const handoff: CgiResumeHandoff = {
      publicAssessmentId: "pub_1",
      status: "in_progress",
      answers: answersUpTo(8),
      lead,
    };
    const result = computeResumeHydration(handoff, initialLead, DIMENSIONS);
    expect(result.step).not.toBe("lead");
    expect(result.step).not.toBe("context");
    expect(result.lead?.name).toBe("Marines");
    expect(result.lead?.company).toBe("Empresa Teste");
  });

  it("merges the server lead onto initialLead so every LeadForm field is always defined", () => {
    const handoff: CgiResumeHandoff = {
      publicAssessmentId: "pub_1",
      status: "in_progress",
      answers: answersUpTo(8),
      lead,
    };
    const result = computeResumeHydration(handoff, initialLead, DIMENSIONS);
    expect(result.lead?.sectorOther).toBe("");
    expect(result.lead?.commercialRelationshipOther).toBe("");
  });

  it("normalizes/drops invalid answer entries before counting or resolving the dimension", () => {
    const handoff: CgiResumeHandoff = {
      publicAssessmentId: "pub_1",
      status: "in_progress",
      answers: { ...answersUpTo(8), garbage_key: 4, q9: 99 },
      lead,
    };
    const result = computeResumeHydration(handoff, initialLead, DIMENSIONS);
    expect(result.answeredCount).toBe(8);
    expect(result.answers.garbage_key).toBeUndefined();
    expect(result.answers.q9).toBeUndefined();
  });
});
