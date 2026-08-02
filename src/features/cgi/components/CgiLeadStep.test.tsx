import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { cgiUi, initialLead } from "../config";
import { CgiLeadStep } from "./CgiLeadStep";

// CgiLeadStep uses hooks (useRef/useEffect for the IntersectionObserver),
// so - unlike the hook-free components elsewhere in this folder - it can't
// be invoked as a plain function outside a React render pass. SSR-rendering
// it to a markup string sidesteps that without needing jsdom or a DOM-based
// testing library: effects simply don't run during SSR, which is fine here
// since none of the assertions below depend on the observer firing.
function renderPt(props: Parameters<typeof CgiLeadStep>[0]): string {
  return renderToStaticMarkup(createElement(CgiLeadStep, props));
}

const baseProps = {
  t: cgiUi.pt,
  lead: initialLead,
  website: "",
  devAnswersJson: "",
  isSubmitting: false,
  hasSavedAssessment: false,
  isLeadSubmitting: false,
  consent: { privacy: false, marketing: false },
  submitIdentification: vi.fn(),
  updateLead: vi.fn(),
  setConsent: vi.fn(),
  setWebsite: vi.fn(),
  setDevAnswersJson: vi.fn(),
  generateFromAnswersJson: vi.fn(),
  regenerateSavedAssessment: vi.fn(),
  onLeadFormView: vi.fn(),
};

describe("CgiLeadStep - pt-BR lead form", () => {
  it("never renders the word 'assessment'", () => {
    const html = renderPt(baseProps);
    expect(html.toLowerCase()).not.toContain("assessment");
  });

  it("renders the first field (name) as an identifiable, labeled input", () => {
    const html = renderPt(baseProps);

    expect(html).toContain('id="name"');
    expect(html).toContain('for="name"');
  });

  it("shows the estimated time and the deliverables the user will receive", () => {
    const html = renderPt(baseProps);

    expect(html).toContain(cgiUi.pt.leadTimeEstimate);
    cgiUi.pt.leadDeliverables.forEach((item) => {
      expect(html).toContain(item);
    });
  });
});
