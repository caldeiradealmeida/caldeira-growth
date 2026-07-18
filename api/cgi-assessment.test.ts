import { beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./cgi-assessment";

vi.mock("node:dns/promises", () => ({
  resolveMx: vi.fn(async () => [{ exchange: "mail.example.com", priority: 10 }]),
  resolve4: vi.fn(async () => ["93.184.216.34"]),
  resolve6: vi.fn(async () => []),
}));

vi.mock("./_cgi-supabase.js", () => ({
  createEventId: vi.fn(() => "completion_event_generated"),
  insertFunnelEvent: vi.fn(),
  upsertAnswers: vi.fn(),
  upsertAssessment: vi.fn(async () => {
    throw new Error("unexpected_supabase_failure");
  }),
}));

function createResponse() {
  return {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

describe("POST /api/cgi-assessment Supabase completion best-effort", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "";
    process.env.CONTACT_FORM_URL = "";
    process.env.VITE_CONTACT_FORM_URL = "";
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("continues the main flow when Supabase completion persistence throws", async () => {
    const answers = Object.fromEntries(
      Array.from({ length: 40 }, (_, index) => [`q${index + 1}`, 4])
    );
    const response = createResponse();

    await handler(
      {
        method: "POST",
        headers: {},
        body: {
          action: "cgi_assessment",
          language: "pt",
          lead: {
            name: "Lead Teste",
            email: "lead@example.com",
            phone: "+5511999999999",
            company: "Empresa Teste",
            companyWebsite: "",
            role: "CEO",
            sector: "Tecnologia e software",
            commercialRelationshipModel: "B2B",
            employeeCount: "11-50",
            annualRevenue: "R$ 1-10 milhões",
            currentChallenge: "Escalar vendas",
            growthGoal: "Acima de 50%",
            investmentIntent: "Sim",
            comments: "",
          },
          answers,
          startedAt: String(Date.now() - 10000),
          website: "",
          anonymous_session_id: "session_1",
          public_assessment_id: "assessment_1",
          completion_event_id: "completion_event_1",
        },
      } as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      save: { ok: false, error: "not_configured" },
      ai: { status: "not_configured" },
    });
    expect(console.error).toHaveBeenCalledWith(
      "[CGI Supabase]",
      expect.objectContaining({
        operation: "persist_completed_assessment",
        public_assessment_id: "assessment_1",
      })
    );
  });
});
