import { Children, isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { cgiUi } from "../config";
import { CgiLanding } from "./CgiLanding";

function textContent(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(" ");
  if (!isValidElement(node)) return "";
  const props = node.props as { children?: ReactNode };
  return Children.toArray(props.children).map(textContent).join(" ");
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
});
