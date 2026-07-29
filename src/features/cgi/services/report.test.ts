import { describe, expect, it } from "vitest";
import { cgiUi } from "../config";
import { getSubmitErrorMessage } from "./report";

describe("getSubmitErrorMessage", () => {
  it("maps report persistence outages to a temporary recoverable error", () => {
    const message = getSubmitErrorMessage(
      {
        ok: false,
        error: "report_persistence_unavailable",
        report_status: "report_failed",
        message: "supabase_internal_detail",
      },
      cgiUi.pt
    );

    expect(message).toBe(
      "Não foi possível iniciar a geração do relatório neste momento. Tente novamente em alguns instantes."
    );
    expect(message).toContain("Tente novamente");
    expect(message).not.toContain("supabase_internal_detail");
    expect(message).not.toContain("relatório foi preparado");
  });

  it("maps AI generation failures to a temporary recoverable error", () => {
    const message = getSubmitErrorMessage(
      {
        ok: false,
        error: "report_generation_failed",
        report_status: "report_failed",
      },
      cgiUi.pt
    );

    expect(message).toBe(
      "Não foi possível gerar o relatório neste momento. Tente novamente em alguns instantes."
    );
    expect(message).not.toContain("relatório foi preparado");
  });
});
