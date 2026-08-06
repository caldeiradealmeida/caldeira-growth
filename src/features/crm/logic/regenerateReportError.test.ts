import { describe, expect, it } from "vitest";
import { regenerateReportErrorMessage } from "./regenerateReportError";

describe("regenerateReportErrorMessage", () => {
  it("returns a specific message for known error codes", () => {
    expect(regenerateReportErrorMessage("forbidden")).toMatch(/permissão/i);
    expect(regenerateReportErrorMessage("score_mismatch")).toMatch(/bloqueada por segurança/i);
  });

  it("explains the two-phase migration gap without implying data loss", () => {
    const message = regenerateReportErrorMessage("versioning_not_enabled");
    expect(message).toMatch(/múltiplas versões/i);
    expect(message).toMatch(/nenhum dado foi alterado/i);
  });

  it("falls back to a generic message for unknown codes", () => {
    expect(regenerateReportErrorMessage("something_unexpected")).toBe(
      "Não foi possível regenerar o relatório agora."
    );
  });

  it("falls back to a generic message when no code is given", () => {
    expect(regenerateReportErrorMessage(undefined)).toBe("Não foi possível regenerar o relatório agora.");
    expect(regenerateReportErrorMessage(null)).toBe("Não foi possível regenerar o relatório agora.");
  });
});
