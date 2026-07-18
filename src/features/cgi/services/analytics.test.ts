import { beforeEach, describe, expect, it, vi } from "vitest";
import { pushCgiDataLayerEvent } from "./analytics";

describe("CGI analytics payloads", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      dataLayer: [],
      location: { pathname: "/cgi" },
    });
  });

  it("pushes dataLayer events without PII fields", () => {
    pushCgiDataLayerEvent("cgi_lead_submitted", {
      event_id: "evt_1",
      anonymous_session_id: "session_1",
      public_assessment_id: "assessment_1",
      name: "Lead Name",
      email: "lead@example.com",
      phone: "+5511999999999",
      company: "Empresa Exemplo",
      company_size: "11-50",
      investment_intent: "Sim",
    });

    expect(window.dataLayer?.[0]).toEqual({
      event: "cgi_lead_submitted",
      event_id: "evt_1",
      anonymous_session_id: "session_1",
      public_assessment_id: "assessment_1",
      company_size: "11-50",
      investment_intent: "Sim",
    });
  });
});
