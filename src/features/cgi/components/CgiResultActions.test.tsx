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

function textContent(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(" ");
  if (!isValidElement(node)) return "";
  const props = node.props as { children?: ReactNode };
  return Children.toArray(props.children).map(textContent).join(" ");
}

const baseProps = {
  config: { primaryCta: { href: "#", label: "Solicitar uma conversa estratégica" } } as never,
  reportReady: true,
  isGeneratingPdf: false,
  isSubmitting: false,
  submitError: "",
  hasSavedAssessment: false,
  reportProgress: 0,
  openReport: vi.fn(),
  downloadPdf: vi.fn(),
  retryReport: vi.fn(),
  regenerateSavedAssessment: vi.fn(),
  onCtaClick: vi.fn(),
};

describe("CgiResultActions - email button fully removed", () => {
  it.each(["pt", "en", "es"] as const)(
    "never renders an email/mailto action, keeps only the 3 approved actions (%s)",
    (lang) => {
      const element = CgiResultActions({ ...baseProps, t: cgiUi[lang] });
      const text = textContent(element);

      expect(text).not.toContain("e-mail");
      expect(text).not.toContain("email");
      expect(text).not.toContain("correo");
      expect(text).toContain("Solicitar uma conversa estratégica");
      expect(text).toContain(cgiUi[lang].printVersion);
      expect(text).toContain(cgiUi[lang].downloadPdf);
    }
  );
});

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
      retryReport,
      regenerateSavedAssessment: vi.fn(),
      onCtaClick: vi.fn(),
    });

    const retryButton = findByOnClick(element, retryReport);

    expect(retryButton).not.toBeNull();
    expect((retryButton?.props as { disabled?: boolean }).disabled).toBe(false);
  });
});
