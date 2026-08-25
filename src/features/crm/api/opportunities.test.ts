import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// O Pipe monta a fila a partir de várias leituras independentes. Este arquivo
// existe por causa de uma regressão real em Production: uma leitura acessória
// (o sinal de abertura de relatório) não tinha GRANT para `authenticated`,
// devolveu 42501 permission denied, e derrubou a tela inteira.
//
// A regra que estes testes travam: leitura essencial pode derrubar; leitura
// acessória, nunca.

type Resultado = { data: unknown; error: { message: string } | null };

const supabaseMocks = vi.hoisted(() => ({
  porTabela: new Map<string, Resultado | (() => never)>(),
  tabelasConsultadas: [] as string[],
}));

vi.mock("../lib/supabaseClient", () => {
  const builder = (tabela: string) => {
    const resolver = () => {
      const configurado = supabaseMocks.porTabela.get(tabela);
      if (typeof configurado === "function") configurado();
      return Promise.resolve((configurado as Resultado) ?? { data: [], error: null });
    };
    const b: Record<string, unknown> = {
      select: () => b,
      in: () => b,
      order: () => b,
      then: (ok: (v: unknown) => unknown, falha?: (e: unknown) => unknown) => resolver().then(ok, falha),
    };
    return b;
  };
  return {
    crmSupabase: {
      from: (tabela: string) => {
        supabaseMocks.tabelasConsultadas.push(tabela);
        return builder(tabela);
      },
    },
  };
});

import { fetchOpportunityRows } from "./opportunities";

const LEAD = {
  id: "lead_1", email_normalized: "b@mngt.com", name: "Belmir Menegatti", email: "b@mngt.com",
  phone: "", company: "Grupo MNGT", company_website: null, role: "", sector: "",
  commercial_relationship_model: "", employee_count: "", annual_revenue_range: "R$ 50-200 milhões",
  current_challenge: "", growth_goal: "", investment_intent: "Sim", comments: null,
  created_at: "2026-07-26T00:00:00Z",
};

const ASSESSMENT = {
  id: "a_1", public_assessment_id: "PID1", lead_id: "lead_1", status: "completed",
  progress_percent: 100, current_question: 40, started_at: null,
  last_activity_at: "2026-07-26T23:00:00Z", completed_at: "2026-07-26T23:57:17Z",
  cgi_score: 82, strategy_score: null, market_customer_score: null, growth_engine_score: null,
  execution_management_score: null, leadership_culture_score: null, cgi_level: "structured",
  lowest_dimension: null, highest_dimension: null, report_email_sent_at: null,
  abandonment_email_sent_at: null, created_at: "2026-07-26T22:00:00Z",
};

function cenarioBase() {
  supabaseMocks.porTabela.clear();
  supabaseMocks.tabelasConsultadas.length = 0;
  supabaseMocks.porTabela.set("cgi_leads", { data: [LEAD], error: null });
  supabaseMocks.porTabela.set("cgi_assessments", { data: [ASSESSMENT], error: null });
  supabaseMocks.porTabela.set("crm_opportunities", { data: [], error: null });
  supabaseMocks.porTabela.set("crm_people_links", { data: [], error: null });
  supabaseMocks.porTabela.set("cgi_attribution", { data: [], error: null });
  supabaseMocks.porTabela.set("cgi_reports", { data: [], error: null });
  supabaseMocks.porTabela.set("cgi_communications", { data: [], error: null });
  supabaseMocks.porTabela.set("crm_report_access_v", { data: [], error: null });
}

describe("fetchOpportunityRows — leitura acessória nunca derruba o Pipe", () => {
  beforeEach(() => {
    cenarioBase();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("permission denied em crm_report_access_v não derruba o Pipe", async () => {
    // Este é o erro literal de Production.
    supabaseMocks.porTabela.set("crm_report_access_v", {
      data: null,
      error: { message: "permission denied for table crm_report_access_v" },
    });

    const rows = await fetchOpportunityRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].lead.company).toBe("Grupo MNGT");
    // Sem o sinal, ninguém aparece como "abriu o relatório" -- e é só isso que
    // se perde.
    expect(rows[0].reportOpenedAt).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "[CRM] sinal de abertura de relatório indisponível:",
      "permission denied for table crm_report_access_v"
    );
  });

  it("VIEW AINDA NÃO EXISTE (Preview antes da migration) não derruba o Pipe", async () => {
    // Este é o estado exato do Preview de 05be3f8: a migration não foi aplicada,
    // então o PostgREST não conhece a relação e responde PGRST205.
    supabaseMocks.porTabela.set("crm_report_access_v", {
      data: null,
      error: {
        message:
          "Could not find the table 'public.crm_report_access_v' in the schema cache",
        code: "PGRST205",
      },
    });

    const rows = await fetchOpportunityRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].lead.company).toBe("Grupo MNGT");
    expect(rows[0].reportOpenedAt).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "[CRM] sinal de abertura de relatório indisponível:",
      "Could not find the table 'public.crm_report_access_v' in the schema cache"
    );
  });

  it("erro de rede na mesma leitura também é absorvido", async () => {
    supabaseMocks.porTabela.set("crm_report_access_v", () => {
      throw new Error("Failed to fetch");
    });

    const rows = await fetchOpportunityRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].reportOpenedAt).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "[CRM] sinal de abertura de relatório indisponível:",
      "Failed to fetch"
    );
  });

  it("o ledger de comunicações continua igualmente fail-soft", async () => {
    supabaseMocks.porTabela.set("cgi_communications", {
      data: null,
      error: { message: "permission denied for table cgi_communications" },
    });

    const rows = await fetchOpportunityRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].communications).toEqual([]);
  });

  it("as duas leituras acessórias podem falhar juntas sem quebrar a tela", async () => {
    supabaseMocks.porTabela.set("crm_report_access_v", {
      data: null, error: { message: "permission denied for table crm_report_access_v" },
    });
    supabaseMocks.porTabela.set("cgi_communications", {
      data: null, error: { message: "permission denied for table cgi_communications" },
    });

    const rows = await fetchOpportunityRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].reportOpenedAt).toBeNull();
    expect(rows[0].communications).toEqual([]);
  });

  it("o caminho feliz continua entregando o sinal de abertura", async () => {
    // Fail-soft não pode virar silêncio: quando a leitura funciona, o dado chega.
    supabaseMocks.porTabela.set("crm_report_access_v", {
      data: [{ public_assessment_id: "PID1", last_accessed_at: "2026-08-20T13:02:47Z" }],
      error: null,
    });

    const rows = await fetchOpportunityRows();
    expect(rows[0].reportOpenedAt).toBe("2026-08-20T13:02:47Z");
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("leitura ESSENCIAL continua derrubando: fail-soft não virou regra geral", async () => {
    supabaseMocks.porTabela.set("cgi_leads", {
      data: null, error: { message: "permission denied for table cgi_leads" },
    });

    await expect(fetchOpportunityRows()).rejects.toThrow(/permission denied for table cgi_leads/);
  });

  it("não consulta a view de acesso quando não há assessment nenhum", async () => {
    supabaseMocks.porTabela.set("cgi_assessments", { data: [], error: null });

    await fetchOpportunityRows();
    expect(supabaseMocks.tabelasConsultadas).not.toContain("crm_report_access_v");
  });
});
