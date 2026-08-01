import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { cgiUi } from "../config";
import { CgiLanding } from "./CgiLanding";
import { scrollToAssessment } from "../services/report";

vi.mock("../services/report", () => ({
  scrollToAssessment: vi.fn(),
}));

function textContent(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(" ");
  if (!isValidElement(node)) return "";
  const props = node.props as { children?: ReactNode };
  return Children.toArray(props.children).map(textContent).join(" ");
}

function findByOnClick(root: ReactNode): ReactElement | null {
  if (!isValidElement(root)) return null;
  const props = root.props as { children?: ReactNode; onClick?: unknown };
  if (typeof props.onClick === "function") return root;
  for (const child of Children.toArray(props.children)) {
    const match = findByOnClick(child);
    if (match) return match;
  }
  return null;
}

const baseConfig = {
  primaryCta: { href: "#", label: "Solicitar uma conversa estratégica" },
} as never;

describe("CgiLanding - pt-BR hero", () => {
  it("uses 'Iniciar diagnóstico' as the CTA label, never 'assessment'", () => {
    const element = CgiLanding({
      t: cgiUi.pt,
      config: baseConfig,
      onStartClick: vi.fn(),
    });
    const text = textContent(element);

    expect(text).toContain("Iniciar diagnóstico");
    expect(text.toLowerCase()).not.toContain("assessment");
  });

  it("renders the CTA as an explicit type=\"button\" (never a submit)", () => {
    const element = CgiLanding({
      t: cgiUi.pt,
      config: baseConfig,
      onStartClick: vi.fn(),
    });
    const cta = findByOnClick(element);

    expect((cta?.props as { type?: string }).type).toBe("button");
  });

  it("clicking the CTA fires onStartClick and scrolls to the first field, not the section", () => {
    const onStartClick = vi.fn();
    const element = CgiLanding({ t: cgiUi.pt, config: baseConfig, onStartClick });
    const cta = findByOnClick(element);

    (cta?.props as { onClick: () => void }).onClick();

    expect(onStartClick).toHaveBeenCalledTimes(1);
    expect(scrollToAssessment).toHaveBeenCalledWith({ focusId: "name" });
  });

  it("the CTA is a plain button, not a link disguised as one (no href to follow)", () => {
    const element = CgiLanding({
      t: cgiUi.pt,
      config: baseConfig,
      onStartClick: vi.fn(),
    });
    const cta = findByOnClick(element);

    expect((cta?.props as { href?: string }).href).toBeUndefined();
  });
});
