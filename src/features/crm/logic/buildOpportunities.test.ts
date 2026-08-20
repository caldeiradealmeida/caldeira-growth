import { describe, expect, it } from "vitest";
import { buildOpportunities } from "./buildOpportunities";
import type { CgiAssessment, CgiCommunication, CgiLead, CrmOpportunity } from "../types";

function lead(overrides: Partial<CgiLead> & { id: string }): CgiLead {
  return {
    email_normalized: "x@example.com",
    name: "Lead",
    email: "x@example.com",
    phone: "",
    company: "Co",
    company_website: null,
    role: "CEO",
    sector: "Tech",
    commercial_relationship_model: "B2B",
    employee_count: "1-10",
    annual_revenue_range: "Até R$ 1 milhão",
    current_challenge: "x",
    growth_goal: "x",
    investment_intent: "Sim",
    comments: null,
    created_at: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

function assessment(overrides: Partial<CgiAssessment> & { id: string; public_assessment_id: string }): CgiAssessment {
  return {
    lead_id: null,
    status: "created",
    progress_percent: 0,
    current_question: null,
    started_at: null,
    last_activity_at: null,
    completed_at: null,
    cgi_score: null,
    strategy_score: null,
    market_customer_score: null,
    growth_engine_score: null,
    execution_management_score: null,
    leadership_culture_score: null,
    cgi_level: null,
    lowest_dimension: null,
    highest_dimension: null,
    created_at: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("buildOpportunities", () => {
  it("hides leads whose opportunity is marked is_test_excluded", () => {
    const l = lead({ id: "l1" });
    const opp: CrmOpportunity = {
      lead_id: "l1",
      status: "novo",
      owner_email: null,
      notes: null,
      next_action_at: null,
      last_contact_at: null,
      estimated_value: null,
      lost_reason: null,
      is_test_excluded: true,
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
    };

    const rows = buildOpportunities({
      leads: [l],
      opportunities: [opp],
      assessments: [],
      attribution: [],
      reports: [],
      personLinks: [],
    });

    expect(rows).toHaveLength(0);
  });

  it("picks the most recently active assessment as latest, and the max score as best", () => {
    const l = lead({ id: "l1" });
    const older = assessment({
      id: "a1",
      public_assessment_id: "pub1",
      lead_id: "l1",
      cgi_score: 60,
      completed_at: "2026-07-05T00:00:00Z",
      created_at: "2026-07-01T00:00:00Z",
    });
    const newer = assessment({
      id: "a2",
      public_assessment_id: "pub2",
      lead_id: "l1",
      cgi_score: 45,
      completed_at: "2026-07-20T00:00:00Z",
      created_at: "2026-07-15T00:00:00Z",
    });

    const rows = buildOpportunities({
      leads: [l],
      opportunities: [],
      assessments: [older, newer],
      attribution: [],
      reports: [],
      personLinks: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].assessmentCount).toBe(2);
    expect(rows[0].latestAssessment?.id).toBe("a2");
    expect(rows[0].bestScore).toBe(60);
  });

  it("resolves the report from any of the lead's assessments, not just the latest", () => {
    const l = lead({ id: "l1" });
    const older = assessment({
      id: "a1",
      public_assessment_id: "pub1",
      lead_id: "l1",
      completed_at: "2026-07-05T00:00:00Z",
      created_at: "2026-07-01T00:00:00Z",
    });
    const newer = assessment({
      id: "a2",
      public_assessment_id: "pub2",
      lead_id: "l1",
      completed_at: "2026-07-20T00:00:00Z",
      created_at: "2026-07-15T00:00:00Z",
    });

    const rows = buildOpportunities({
      leads: [l],
      opportunities: [],
      assessments: [older, newer],
      attribution: [],
      reports: [
        {
          id: "report1",
          public_assessment_id: "pub1",
          report_status: "report_ready",
          language: "pt",
          ai_report_text: null,
          report_json: null,
          version: 1,
          created_at: "2026-07-06T00:00:00Z",
        },
      ],
      personLinks: [],
    });

    expect(rows[0].latestReport?.public_assessment_id).toBe("pub1");
  });

  it("takes origin attribution from the earliest assessment, not the latest", () => {
    const l = lead({ id: "l1" });
    const older = assessment({
      id: "a1",
      public_assessment_id: "pub1",
      lead_id: "l1",
      created_at: "2026-07-01T00:00:00Z",
    });
    const newer = assessment({
      id: "a2",
      public_assessment_id: "pub2",
      lead_id: "l1",
      created_at: "2026-07-15T00:00:00Z",
    });

    const rows = buildOpportunities({
      leads: [l],
      opportunities: [],
      assessments: [older, newer],
      attribution: [
        { assessment_id: "a1", first_utm_source: "meta", first_utm_medium: "paid_social", first_utm_campaign: null, first_referrer: null, first_landing_page: null, first_touch_at: null },
        { assessment_id: "a2", first_utm_source: "google", first_utm_medium: "cpc", first_utm_campaign: null, first_referrer: null, first_landing_page: null, first_touch_at: null },
      ],
      reports: [],
      personLinks: [],
    });

    expect(rows[0].originAttribution?.first_utm_source).toBe("meta");
  });

  it("leaves latestAssessment null and bestScore null for a lead with zero assessments", () => {
    const rows = buildOpportunities({
      leads: [lead({ id: "l1" })],
      opportunities: [],
      assessments: [],
      attribution: [],
      reports: [],
      personLinks: [],
    });

    expect(rows[0].latestAssessment).toBeNull();
    expect(rows[0].bestScore).toBeNull();
    expect(rows[0].assessmentCount).toBe(0);
  });
});

describe("buildOpportunities -- ledger de comunicações", () => {
  function communication(overrides: Partial<CgiCommunication> & { id: string }): CgiCommunication {
    return {
      lead_id: "lead_1",
      assessment_id: null,
      public_assessment_id: null,
      communication_type: "report_delivery",
      communication_class: "transactional",
      channel: "email",
      status: "sent",
      scheduled_at: null,
      sent_at: "2026-08-19T12:00:00Z",
      failed_at: null,
      cancelled_at: null,
      recipient_masked: "x***@example.com",
      subject: "Seu CGI",
      error_code: null,
      reason: null,
      actor: "system:completion",
      created_at: "2026-08-19T12:00:00Z",
      ...overrides,
    };
  }

  const baseInput = {
    leads: [lead({ id: "lead_1" })],
    opportunities: [] as CrmOpportunity[],
    assessments: [] as CgiAssessment[],
    attribution: [],
    reports: [],
    personLinks: [],
  };

  it("anexa as comunicações do lead, mais recente primeiro", () => {
    const rows = buildOpportunities({
      ...baseInput,
      communications: [
        communication({ id: "antiga", created_at: "2026-08-10T12:00:00Z" }),
        communication({ id: "nova", created_at: "2026-08-20T12:00:00Z" }),
        communication({ id: "de_outro_lead", lead_id: "lead_2" }),
      ],
    });

    expect(rows[0].communications.map((c) => c.id)).toEqual(["nova", "antiga"]);
  });

  it("trata a ausência do ledger como lista vazia, nunca como erro", () => {
    const rows = buildOpportunities(baseInput);
    expect(rows[0].communications).toEqual([]);
  });
});
