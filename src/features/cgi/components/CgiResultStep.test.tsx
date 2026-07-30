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
  openEmailDraft: vi.fn(),
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
});
