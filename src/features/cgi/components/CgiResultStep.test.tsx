import { Children, isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { cgiUi } from "../config";
import { CgiResultStep } from "./CgiResultStep";

function textContent(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(" ");
  if (!isValidElement(node)) return "";
  const props = node.props as { children?: ReactNode };
  return Children.toArray(props.children).map(textContent).join(" ");
}

const result = {
  finalScore: 68,
  level: { title: "Crescimento Estruturado" },
  diagnostic: "Diagnostico calculado.",
  dimensionScores: [
    { dimensionId: "strategy", title: "Estratégia", score: 78 },
    { dimensionId: "market", title: "Mercado e Cliente", score: 38 },
  ],
  attentionPoints: [],
};

const baseProps = {
  t: cgiUi.pt,
  config: {
    primaryCta: { href: "#", label: "Solicitar conversa" },
  } as never,
  result: result as never,
  aiReport: null,
  aiStatus: "idle",
  submitError: "",
  secondarySyncMessage: "",
  reportReady: false,
  isSubmitting: false,
  isGeneratingPdf: false,
  hasSavedAssessment: true,
  reportProgress: 0,
  openReport: vi.fn(),
  downloadPdf: vi.fn(),
  retryReport: vi.fn(),
  regenerateSavedAssessment: vi.fn(),
  onCtaClick: vi.fn(),
};

describe("CgiResultStep", () => {
  it("shows a processing message instead of prepared copy before the report is ready", () => {
    const text = textContent(CgiResultStep(baseProps));

    expect(text).toContain("Seus dados foram salvos. O parecer está sendo preparado.");
    expect(text).not.toContain("o relatório foi preparado");
  });

  it("shows a recoverable failure message without prepared copy", () => {
    const text = textContent(
      CgiResultStep({
        ...baseProps,
        submitError: "Não foi possível concluir o parecer neste momento. Tente novamente.",
      })
    );

    expect(text).toContain("Não foi possível concluir o parecer neste momento. Tente novamente.");
    expect(text).not.toContain("o relatório foi preparado");
  });

  it("shows prepared copy only after the report is ready", () => {
    const text = textContent(
      CgiResultStep({
        ...baseProps,
        reportReady: true,
        aiStatus: "generated",
      })
    );

    expect(text).toContain("O parecer foi preparado.");
  });

  it.each(["pt", "en", "es"] as const)(
    "keeps the progress copy to just the CGI-logic line and 'Método Caldeira Growth', dropping the redundant AI mentions (%s)",
    (lang) => {
      const t = cgiUi[lang];
      const text = textContent(
        CgiResultStep({ ...baseProps, t, isSubmitting: true, reportProgress: 0 })
      );

      // Title, the one kept body line, and the brand line all still render.
      expect(text).toContain(t.reportAlertTitle);
      expect(text).toContain(t.reportAlertBody);
      expect(text).toContain(t.proprietaryBody);
      expect(t.proprietaryBody.toLowerCase()).not.toMatch(/intelig|artificial/);

      // The two removed sentences must never appear, in any language.
      expect(text.toLowerCase()).not.toMatch(
        /apoia a consolida|consolidation and (report )?personali[sz]ation|apoya la consolidaci/
      );
      expect(text.toLowerCase()).not.toMatch(
        /aplicada [àa] personaliza|applied to (report )?personali[sz]ation|aplicada a la personalizaci/
      );

      // Progress stages (percentage-driven copy) still render untouched.
      expect(text).toContain(t.reportStages[0]);
    }
  );
});
