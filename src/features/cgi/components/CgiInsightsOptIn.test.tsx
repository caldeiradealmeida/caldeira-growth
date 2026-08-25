import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CgiInsightsOptIn, type CgiInsightsOptInProps } from "./CgiInsightsOptIn";

const base: CgiInsightsOptInProps = {
  anonymousSessionId: "sess_1",
  publicAssessmentId: "PID1",
  alreadyConsented: false,
};

const render = (props: Partial<CgiInsightsOptInProps> = {}) =>
  renderToStaticMarkup(createElement(CgiInsightsOptIn, { ...base, ...props }));

describe("opt-in pós-relatório", () => {
  it("quem ainda não consentiu vê o convite", () => {
    const html = render();
    expect(html).toContain(
      "Quer continuar recebendo leituras e insights sobre os desafios identificados no seu CGI?"
    );
    expect(html).toContain("Quero receber insights personalizados");
  });

  it("quem já consentiu não vê nada", () => {
    expect(render({ alreadyConsented: true })).toBe("");
  });

  it("não renderiza sem sessão ou sem assessment — não há como provar quem é", () => {
    expect(render({ anonymousSessionId: "" })).toBe("");
    expect(render({ publicAssessmentId: "" })).toBe("");
  });

  it("não é checkbox e não vem pré-marcado: a única forma de consentir é clicar", () => {
    const html = render();
    expect(html).not.toContain("<input");
    expect(html).not.toContain("checked");
    expect((html.match(/<button/g) || []).length).toBe(1);
  });

  it("não interfere no relatório: não há link, download ou navegação aqui", () => {
    const html = render();
    expect(html).not.toContain("<a ");
    expect(html).not.toMatch(/download|href/i);
  });

  it("sem linguagem de marketing e sem urgência", () => {
    expect(render()).not.toMatch(/não perca|exclusivo|gratuito|garanta|vagas|agora mesmo/i);
  });
});
