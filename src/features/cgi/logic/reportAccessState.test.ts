import { describe, expect, it } from "vitest";
import { parseReportAccessResponse } from "./reportAccessState";

function validScore() {
  return {
    finalScore: 75,
    level: { id: "structured", title: "Crescimento Estruturado", summary: "", recommendation: "" },
    dimensionScores: [{ dimensionId: "strategy", title: "Estratégia", score: 75, average: 4, answered: 8, total: 8 }],
    attentionPoints: [],
    diagnostic: "",
  };
}

describe("parseReportAccessResponse", () => {
  it("maps link_unavailable", () => {
    expect(parseReportAccessResponse({ ok: true, state: "link_unavailable" })).toEqual({
      kind: "link_unavailable",
    });
  });

  it("maps report_unavailable", () => {
    expect(parseReportAccessResponse({ ok: true, state: "report_unavailable" })).toEqual({
      kind: "report_unavailable",
    });
  });

  it("maps a well-formed ready response", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "ready",
      data: {
        language: "pt",
        score: validScore(),
        lead: { name: "Lead Teste", company: "Empresa Teste" },
        reportJson: { report_title: "Relatório CGI", executive_summary: "Resumo." },
      },
    });
    expect(result.kind).toBe("ready");
    if (result.kind === "ready") {
      expect(result.score.finalScore).toBe(75);
      expect(result.language).toBe("pt");
      expect(result.lead).toEqual({ name: "Lead Teste", company: "Empresa Teste" });
      expect(result.reportJson).toEqual({ report_title: "Relatório CGI", executive_summary: "Resumo." });
    }
  });

  it("falls back to pt for an unrecognized language", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "ready",
      data: { language: "fr", score: validScore(), lead: {}, reportJson: {} },
    });
    expect(result.kind).toBe("ready");
    if (result.kind === "ready") expect(result.language).toBe("pt");
  });

  it("degrades to error when data is missing", () => {
    expect(parseReportAccessResponse({ ok: true, state: "ready" })).toEqual({ kind: "error" });
  });

  it("degrades to error when score is missing finalScore", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "ready",
      data: { language: "pt", score: { dimensionScores: [] }, lead: {}, reportJson: {} },
    });
    expect(result).toEqual({ kind: "error" });
  });

  it("degrades to error when dimensionScores isn't an array", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "ready",
      data: { language: "pt", score: { finalScore: 75 }, lead: {}, reportJson: {} },
    });
    expect(result).toEqual({ kind: "error" });
  });

  it("degrades to error when lead is missing", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "ready",
      data: { language: "pt", score: validScore(), reportJson: {} },
    });
    expect(result).toEqual({ kind: "error" });
  });

  it("degrades to error when reportJson is missing", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "ready",
      data: { language: "pt", score: validScore(), lead: {} },
    });
    expect(result).toEqual({ kind: "error" });
  });

  it("degrades to error for an unrecognized state", () => {
    expect(parseReportAccessResponse({ ok: true, state: "something_else" })).toEqual({ kind: "error" });
  });

  it("degrades to error for null/non-object input", () => {
    expect(parseReportAccessResponse(null)).toEqual({ kind: "error" });
    expect(parseReportAccessResponse("string")).toEqual({ kind: "error" });
  });
});
