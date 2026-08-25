import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// F-B e F-D -- o que o upsert do lead escreve, e o que ele deliberadamente
// NÃO escreve, na coluna de consentimento.
//
// Estes testes dirigem api/_cgi-supabase.ts contra um fetch stubbado e olham
// as requisições reais que saem: URL, método e corpo. É o nível certo, porque
// o defeito que eles travam é exatamente uma questão de qual corpo é enviado.

const ORIGINAL_ENV = { ...process.env };

type Req = { url: string; method: string; body: Record<string, unknown> };

let requests: Req[] = [];

function stubSupabase(assessment: Record<string, unknown> | null) {
  requests = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = String(init?.method || "GET");
      let body: Record<string, unknown> = {};
      try {
        body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
      } catch {
        body = {};
      }
      requests.push({ url, method, body });

      if (url.includes("cgi_assessments") && method === "GET") {
        return new Response(JSON.stringify(assessment ? [assessment] : []), { status: 200 });
      }
      if (url.includes("cgi_leads") && method === "POST") {
        return new Response(JSON.stringify([{ id: "lead_novo" }]), { status: 201 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    })
  );
}

const LEAD = {
  name: "Ana", email: "ana@acme.com", phone: "+5511999998888", company: "ACME",
  company_website: null, role: "CEO", sector: "Serviços",
  commercial_relationship_model: "B2B", employee_count: "10-50",
  annual_revenue_range: "R$ 1-10 milhões", current_challenge: "x",
  growth_goal: "y", investment_intent: "Sim", comments: null,
};

async function persist(consentMarketing: boolean | null, leadJaExiste = true) {
  const { persistLeadForAssessment } = await import("../../api/_cgi-supabase.js");
  stubSupabase({
    id: "assess_1",
    public_assessment_id: "PID1",
    lead_id: leadJaExiste ? "lead_1" : null,
    status: "lead_captured",
  });
  return persistLeadForAssessment({
    publicAssessmentId: "PID1",
    anonymousSessionId: "sess_1",
    lead: LEAD as never,
    consentPrivacy: true,
    consentMarketing,
    privacyPolicyVersion: "2026-07-17",
  });
}

const escritasNoLead = () =>
  requests.filter((r) => r.url.includes("cgi_leads") && r.method !== "GET");

beforeEach(() => {
  process.env.SUPABASE_URL = "https://projeto.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-de-teste";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

describe("F-B -- proveniência do consentimento do formulário inicial", () => {
  it("opt-in grava a origem e a data, numa escrita própria", async () => {
    await persist(true);
    const provenancia = escritasNoLead().find((r) => "consent_marketing_source" in r.body);

    expect(provenancia).toBeDefined();
    expect(provenancia?.body.consent_marketing_source).toBe("cgi_initial_form");
    expect(typeof provenancia?.body.consent_marketing_at).toBe("string");
  });

  it("a escrita da data é filtrada para acontecer só na primeira vez", async () => {
    // O filtro é avaliado no servidor: uma gravação posterior da mesma sessão
    // simplesmente não casa nenhuma linha, então a data original sobrevive sem
    // precisar de read-then-write.
    await persist(true);
    const provenancia = escritasNoLead().find((r) => "consent_marketing_source" in r.body);
    expect(provenancia?.url).toContain("consent_marketing_at=is.null");
  });

  it("sem opt-in não grava origem nem data", async () => {
    await persist(false);
    expect(escritasNoLead().some((r) => "consent_marketing_source" in r.body)).toBe(false);
  });

  it("não usa consent_timestamp como data de consentimento", async () => {
    // consent_timestamp continua sendo escrito -- é dado legado --, mas ele sai
    // em TODA gravação do lead, inclusive quando não houve consentimento
    // nenhum. É por isso que ele não pode responder "quando consentiu", e é por
    // isso que consent_marketing_at existe numa escrita separada e filtrada.
    await persist(false);
    const semConsentimento = escritasNoLead().find((r) => "consent_privacy" in r.body);
    expect(semConsentimento?.body.consent_timestamp).toBeDefined();
    expect(escritasNoLead().some((r) => "consent_marketing_at" in r.body)).toBe(false);

    await persist(true);
    const comConsentimento = escritasNoLead().find((r) => "consent_privacy" in r.body);
    expect(comConsentimento?.body).not.toHaveProperty("consent_marketing_at");
    expect(escritasNoLead().some((r) => "consent_marketing_at" in r.body)).toBe(true);
  });
});

describe("F-D -- uma gravação posterior não derruba consentimento", () => {
  it("consent_marketing NUNCA é escrito como false pelo upsert do lead", async () => {
    for (const valor of [false, null]) {
      await persist(valor);
      for (const req of escritasNoLead()) {
        expect(req.body).not.toHaveProperty("consent_marketing");
      }
    }
  });

  it("true é escrito, porque nasce de ação explícita", async () => {
    await persist(true);
    const principal = escritasNoLead().find((r) => "consent_privacy" in r.body);
    expect(principal?.body.consent_marketing).toBe(true);
  });

  it("sessão retomada, que nasce sem consentimento, não apaga um opt-in anterior", async () => {
    // É o cenário real: o resume não reidrata o consentimento, então a etapa
    // seguinte postaria false. Com a regra atual, esse false não vira escrita.
    await persist(false);
    const corpos = escritasNoLead().map((r) => JSON.stringify(r.body));
    expect(corpos.some((c) => c.includes('"consent_marketing":false'))).toBe(false);
  });

  it("o resto do lead continua sendo atualizado normalmente", async () => {
    await persist(false);
    const principal = escritasNoLead().find((r) => "consent_privacy" in r.body);
    expect(principal?.body.company).toBe("ACME");
    expect(principal?.body.consent_privacy).toBe(true);
  });
});
