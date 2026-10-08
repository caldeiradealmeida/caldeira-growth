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

  it("maps report_generating", () => {
    expect(parseReportAccessResponse({ ok: true, state: "report_generating" })).toEqual({
      kind: "report_generating",
    });
  });

  it("maps report_failed", () => {
    expect(parseReportAccessResponse({ ok: true, state: "report_failed" })).toEqual({
      kind: "report_failed",
    });
  });

  it("maps a well-formed resume response, including a null lead", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "resume",
      data: {
        publicAssessmentId: "pub_1",
        status: "created",
        answers: {},
        currentQuestion: 0,
        progressPercent: 0,
        lead: null,
      },
    });
    expect(result).toEqual({
      kind: "resume",
      handoff: { publicAssessmentId: "pub_1", status: "created", answers: {}, lead: null },
    });
  });

  it("maps a resume response with answers and a lead", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "resume",
      data: {
        publicAssessmentId: "pub_1",
        status: "in_progress",
        answers: { q1: 4, q2: 3 },
        currentQuestion: 16,
        progressPercent: 40,
        lead: { name: "Marines", company: "Empresa Teste" },
      },
    });
    expect(result.kind).toBe("resume");
    if (result.kind === "resume") {
      expect(result.handoff.answers).toEqual({ q1: 4, q2: 3 });
      expect(result.handoff.lead).toEqual({ name: "Marines", company: "Empresa Teste" });
      expect(result.handoff.status).toBe("in_progress");
    }
  });

  it("degrades to error for a resume response with a completed/unknown status", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "resume",
      data: { publicAssessmentId: "pub_1", status: "completed", answers: {} },
    });
    expect(result).toEqual({ kind: "error" });
  });

  it("degrades to error for a resume response missing publicAssessmentId", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "resume",
      data: { status: "in_progress", answers: {} },
    });
    expect(result).toEqual({ kind: "error" });
  });

  it("degrades to error for a resume response with a malformed answers field", () => {
    const result = parseReportAccessResponse({
      ok: true,
      state: "resume",
      data: { publicAssessmentId: "pub_1", status: "in_progress", answers: [] },
    });
    expect(result).toEqual({ kind: "error" });
  });
});
