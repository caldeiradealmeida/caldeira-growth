import { describe, expect, it } from "vitest";
import {
  CGI_COMMENTS_MAX_LENGTH,
  hasAbusiveProfessionalContent,
  hasForbiddenMetadataKeys,
  isAllowedCgiEvent,
  normalizeLead,
  sanitizeEventMetadata,
  validateProfessionalContent,
  validateNormalizedLeadContext,
  validateNormalizedLeadIdentity,
} from "../../api/_cgi-validation";

describe("CGI event validation", () => {
  it("rejects events outside the official Phase 1 taxonomy", () => {
    expect(isAllowedCgiEvent("cgi_report_requested")).toBe(true);
    expect(isAllowedCgiEvent("cgi_scheduler_opened")).toBe(false);
    expect(isAllowedCgiEvent("cgi_meeting_scheduled")).toBe(false);
  });

  it("removes PII and non-allowlisted metadata from event payloads", () => {
    const sanitized = sanitizeEventMetadata("cgi_lead_submitted", {
      company_size: "11-50",
      industry: "Consultoria",
      investment_intent: "Sim",
      email: "lead@example.com",
      company: "Empresa Exemplo",
      answers: { q1: 5 },
      unexpected: "value",
    });

    expect(sanitized).toEqual({
      company_size: "11-50",
      industry: "Consultoria",
      investment_intent: "Sim",
    });
    expect(hasForbiddenMetadataKeys({ email: "lead@example.com" })).toBe(true);
  });

  it("accepts the low-friction identity step without phone or company context", () => {
    const lead = normalizeLead({
      name: "Lead Exemplo",
      email: "lead@example.com",
      company: "Empresa Exemplo",
      role: "CEO",
    });

    expect(validateNormalizedLeadIdentity(lead)).toBeNull();
    expect(validateNormalizedLeadContext(lead)).toBe("missing_sector");
  });

  it("allows context completion without phone", () => {
    const lead = normalizeLead({
      name: "Lead Exemplo",
      email: "lead@example.com",
      company: "Empresa Exemplo",
      role: "CEO",
      sector: "Tecnologia",
      commercial_relationship_model: "B2B",
      employee_count: "11-50",
      annual_revenue_range: "Prefiro não informar",
      current_challenge: "Escalar vendas",
      growth_goal: "11-25%",
      investment_intent: "Ainda avaliando",
    });

    expect(validateNormalizedLeadContext(lead)).toBeNull();
  });

  it("rejects abusive or obfuscated text in professional fields", () => {
    expect(hasAbusiveProfessionalContent("m.e.r.d.a")).toBe(true);
    expect(hasAbusiveProfessionalContent("Empresa de software B2B")).toBe(false);
    expect(
      validateProfessionalContent({
        strict: [{ field: "name", value: "Lead p0rr4" }],
      })
    ).toBe("invalid_name");
  });

  it("limits the optional assessment comment to 1000 characters", () => {
    expect(
      validateProfessionalContent({
        contextual: [
          {
            field: "comments",
            value: "a".repeat(CGI_COMMENTS_MAX_LENGTH + 1),
            maxLength: CGI_COMMENTS_MAX_LENGTH,
          },
        ],
      })
    ).toBe("invalid_comments");
  });
});
