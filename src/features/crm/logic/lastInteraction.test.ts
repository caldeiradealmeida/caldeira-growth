import { describe, expect, it } from "vitest";
import { deriveLastInteraction } from "./lastInteraction";
import type { OpportunityRow } from "../types";

const AGORA = Date.parse("2026-09-16T12:00:00Z");
const dias = (n: number) => new Date(AGORA - n * 86_400_000).toISOString();

function row(over: {
  lastContactAt?: string | null;
  comms?: Array<{ status: string; sent_at: string | null }>;
  openedAt?: string | null;
  cgiActivityAt?: string | null;
}): OpportunityRow {
  return {
    lead: { id: "1", created_at: dias(30) },
    opportunity: over.lastContactAt ? { last_contact_at: over.lastContactAt } : null,
    communications: over.comms ?? [],
    reportOpenedAt: over.openedAt ?? null,
    latestAssessment: over.cgiActivityAt ? { last_activity_at: over.cgiActivityAt } : null,
  } as unknown as OpportunityRow;
}

describe("deriveLastInteraction", () => {
  it("escolhe o movimento mais recente entre as quatro fontes", () => {
    const r = deriveLastInteraction(
      row({
        lastContactAt: dias(10),
        comms: [{ status: "sent", sent_at: dias(2) }],
        openedAt: dias(5),
        cgiActivityAt: dias(20),
      }),
      AGORA
    );
    expect(r.kind).toBe("automatico");
    expect(r.daysAgo).toBe(2);
  });

  it("contato humano ganha quando é o mais recente", () => {
    const r = deriveLastInteraction(
      row({ lastContactAt: dias(1), comms: [{ status: "sent", sent_at: dias(4) }] }),
      AGORA
    );
    expect(r.kind).toBe("humano");
  });

  it("abertura do relatório conta como interação", () => {
    expect(deriveLastInteraction(row({ openedAt: dias(3) }), AGORA).kind).toBe("relatorio");
  });

  it("e-mail que não saiu NÃO é interação", () => {
    // `sending` e `failed` não são movimento: ninguém do outro lado viu nada.
    const r = deriveLastInteraction(
      row({
        comms: [
          { status: "sending", sent_at: dias(1) },
          { status: "failed", sent_at: dias(1) },
          { status: "sent", sent_at: dias(9) },
        ],
      }),
      AGORA
    );
    expect(r.daysAgo).toBe(9);
  });

  it("sem nenhuma interação devolve vazio, não uma data inventada", () => {
    const r = deriveLastInteraction(row({}), AGORA);
    expect(r).toMatchObject({ atIso: null, kind: "nenhuma", daysAgo: null });
  });

  it("hoje é zero, não negativo", () => {
    const r = deriveLastInteraction(row({ lastContactAt: new Date(AGORA - 1000).toISOString() }), AGORA);
    expect(r.daysAgo).toBe(0);
  });

  it("data impossível é ignorada em vez de virar 1970", () => {
    const r = deriveLastInteraction(row({ lastContactAt: "ontem de manhã", openedAt: dias(6) }), AGORA);
    expect(r.kind).toBe("relatorio");
  });
});
