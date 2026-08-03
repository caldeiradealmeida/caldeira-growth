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

describe("CgiResultStep - AI list items show localized field labels, not raw pt-BR", () => {
  // The AI's raw text always uses the pt-BR contract labels regardless of
  // report language (see the investigation notes in reportBlocks.ts) - this
  // is the worst case, and exactly what reached production in English.
  const criticalBottleneckRaw =
    "Título: Baixa clareza de proposta de valor. Sinal observado: dispersão de oferta. Causa provável: falta de tese explícita. Impacto estratégico: menor conversão.";

  it.each(["en", "es"] as const)(
    "never shows a Portuguese field label in the on-screen result view (%s)",
    (lang) => {
      const t = cgiUi[lang];
      const text = textContent(
        CgiResultStep({
          ...baseProps,
          t,
          reportReady: true,
          aiStatus: "generated",
          aiReport: {
            critical_bottlenecks: [criticalBottleneckRaw],
          } as never,
        })
      );

      expect(text).not.toContain("Sinal observado");
      expect(text).not.toContain("Causa provável");
      // "Impacto estratégico" is spelled identically in pt and es - only
      // assert its absence for en, where the translation actually differs.
      if (lang === "en") {
        expect(text).not.toContain("Impacto estratégico");
      }
      expect(text).not.toContain("Título:");
      expect(text).toContain(t.reportFieldLabels.observedSignal);
      expect(text).toContain(t.reportFieldLabels.probableCause);
      expect(text).toContain(t.reportFieldLabels.strategicImpact);
    }
  );

  it("keeps the pt-BR labels unchanged when the report language is pt", () => {
    const text = textContent(
      CgiResultStep({
        ...baseProps,
        t: cgiUi.pt,
        reportReady: true,
        aiStatus: "generated",
        aiReport: {
          critical_bottlenecks: [criticalBottleneckRaw],
        } as never,
      })
    );

    expect(text).toContain("Sinal observado");
    expect(text).toContain("Causa provável");
    expect(text).toContain("Impacto estratégico");
  });

  it("strips a numbered hypothesis prefix on-screen too, in en", () => {
    const text = textContent(
      CgiResultStep({
        ...baseProps,
        t: cgiUi.en,
        reportReady: true,
        aiStatus: "generated",
        aiReport: {
          hypotheses_to_validate: ["Hypothesis 1: The main lever is segment clarity."],
        } as never,
      })
    );

    expect(text).not.toMatch(/Hypothesis\s*1\s*:/);
    expect(text).toContain("The main lever is segment clarity.");
  });
});
