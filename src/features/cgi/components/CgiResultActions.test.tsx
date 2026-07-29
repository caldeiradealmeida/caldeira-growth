import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { cgiUi } from "../config";
import { CgiResultActions } from "./CgiResultActions";

function findByOnClick(root: ReactNode, onClick: () => void): ReactElement | null {
  if (!isValidElement(root)) return null;
  const props = root.props as { children?: ReactNode; onClick?: unknown };
  if (props.onClick === onClick) return root;

  for (const child of Children.toArray(props.children)) {
    const match = findByOnClick(child, onClick);
    if (match) return match;
  }

  return null;
}

describe("CgiResultActions", () => {
  it("shows an enabled manual retry action after a recoverable report error", () => {
    const retryReport = vi.fn();

    const element = CgiResultActions({
      t: cgiUi.pt,
      config: {
        primaryCta: { href: "#", label: "Agendar conversa" },
      } as never,
      reportReady: false,
      isGeneratingPdf: false,
      isSubmitting: false,
      submitError:
        "Não foi possível iniciar a geração do relatório neste momento. Tente novamente em alguns instantes.",
      hasSavedAssessment: true,
      reportProgress: 0,
      openReport: vi.fn(),
      downloadPdf: vi.fn(),
      openEmailDraft: vi.fn(),
      retryReport,
      regenerateSavedAssessment: vi.fn(),
      onCtaClick: vi.fn(),
    });

    const retryButton = findByOnClick(element, retryReport);

    expect(retryButton).not.toBeNull();
    expect((retryButton?.props as { disabled?: boolean }).disabled).toBe(false);
  });
});
