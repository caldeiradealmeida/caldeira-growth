import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { cgiUi } from "../config";
import { CgiPhoneStep } from "./CgiPhoneStep";

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
  t: cgiUi.pt,
  lead: {
    phone: "",
  } as never,
  isSubmitting: false,
  isLeadSubmitting: false,
  updateLead: vi.fn(),
};

describe("CgiPhoneStep", () => {
  it("no longer renders the removed 'Quero conversar sobre o diagnóstico' CTA", () => {
    const viewResult = vi.fn();
    const element = CgiPhoneStep({ ...baseProps, viewResult });
    const text = textContent(element);
    expect(text).not.toContain("Quero conversar sobre o diagnóstico");
    expect(text).not.toContain("I want to discuss the diagnosis");
  });

  it("renders a single action, 'Ver meu resultado', wired to viewResult", () => {
    const viewResult = vi.fn();
    const element = CgiPhoneStep({ ...baseProps, viewResult });
    const button = findByOnClick(element, viewResult);
    expect(button).not.toBeNull();
    expect(textContent(button)).toContain(cgiUi.pt.viewResult);
  });

  it("disables the single action while a phone submission is in flight, same as before", () => {
    const viewResult = vi.fn();
    const element = CgiPhoneStep({ ...baseProps, viewResult, isLeadSubmitting: true });
    const button = findByOnClick(element, viewResult);
    expect((button?.props as { disabled?: boolean }).disabled).toBe(true);
  });
});
