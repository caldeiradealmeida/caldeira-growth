import { beforeEach, describe, expect, it, vi } from "vitest";

// A escrita da classificação passa por RPC, e não por UPDATE na tabela.
// `authenticated` tem apenas SELECT em cgi_leads e deve continuar tendo: um
// GRANT de UPDATE, mesmo por coluna, abriria a tabela ao browser do CRM. E é a
// RPC, no servidor, que decide quem classificou -- o cliente não manda
// classified_by.

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock("../lib/supabaseClient", () => ({
  crmSupabase: { rpc: mocks.rpc, from: mocks.from },
}));

import { CLASSIFICATION_LABELS, LEAD_CLASSIFICATIONS, classifyLead } from "./classifyLead";

describe("classifyLead", () => {
  beforeEach(() => {
    mocks.rpc.mockReset().mockResolvedValue({ data: null, error: null });
    mocks.from.mockReset();
  });

  it("chama a RPC com os argumentos que o servidor espera", async () => {
    await classifyLead({ leadId: "lead_1", classification: "spam", note: "troll de 31/08" });
    expect(mocks.rpc).toHaveBeenCalledWith("cgi_classify_lead", {
      p_lead_id: "lead_1",
      p_classification: "spam",
      p_note: "troll de 31/08",
    });
  });

  it("NUNCA escreve direto na tabela", async () => {
    await classifyLead({ leadId: "lead_1", classification: "test" });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("não manda classified_by nem classified_at -- quem preenche é o servidor", async () => {
    await classifyLead({ leadId: "lead_1", classification: "test" });
    const args = mocks.rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(args).sort()).toEqual(["p_classification", "p_lead_id", "p_note"]);
  });

  it("nota vazia vira null, não string em branco", async () => {
    await classifyLead({ leadId: "lead_1", classification: "invalid", note: "   " });
    expect((mocks.rpc.mock.calls[0][1] as { p_note: unknown }).p_note).toBeNull();
    await classifyLead({ leadId: "lead_1", classification: "invalid" });
    expect((mocks.rpc.mock.calls[1][1] as { p_note: unknown }).p_note).toBeNull();
  });

  it("não depende de crm_opportunities -- era esse o defeito de is_test_excluded", async () => {
    // A RPC endereça o lead pelo id. Não há leitura, criação ou upsert de
    // oportunidade em nenhum ponto do caminho.
    await classifyLead({ leadId: "lead_sem_oportunidade", classification: "spam" });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("erro do servidor sobe, não é engolido", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "forbidden" } });
    await expect(classifyLead({ leadId: "lead_1", classification: "spam" })).rejects.toThrow("forbidden");
  });

  it("os quatro valores têm rótulo", () => {
    expect(LEAD_CLASSIFICATIONS).toEqual(["legitimate", "test", "spam", "invalid"]);
    for (const v of LEAD_CLASSIFICATIONS) expect(CLASSIFICATION_LABELS[v]).toBeTruthy();
  });
});
