import { describe, expect, it } from "vitest";
import {
  hasForbiddenMetadataKeys,
  isAllowedCgiEvent,
  sanitizeEventMetadata,
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
});
