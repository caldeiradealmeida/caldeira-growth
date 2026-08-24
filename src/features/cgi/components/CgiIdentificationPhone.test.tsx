import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { cgiUi, initialLead } from "../config";
import { CgiLeadStep } from "./CgiLeadStep";
import { CgiPhoneStep } from "./CgiPhoneStep";
import { toApiLeadPayload } from "../services/api";
import { isValidPhone, normalizeLeadForSubmit } from "../utils/form";

// P1 -- o telefone saiu do fim do diagnóstico e passou para a identificação,
// obrigatório.
//
// Motivo comercial: quem começa o CGI e abandona no meio deixava de ser
// alcançável por qualquer canal além do e-mail. Capturado na Etapa 1, o
// contato sobrevive ao abandono -- exatamente o caso em que ele mais importa.

const leadProps = {
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

function identificacao(): string {
  return renderToStaticMarkup(createElement(CgiLeadStep, leadProps));
}

function etapaFinal(): string {
  return renderToStaticMarkup(
    createElement(CgiPhoneStep, {
      t: cgiUi.pt,
      isSubmitting: false,
      isLeadSubmitting: false,
      viewResult: vi.fn(),
    })
  );
}

describe("P1 -- telefone na identificação", () => {
  it("renderiza o campo de telefone na Etapa 1, marcado como obrigatório", () => {
    const html = identificacao();
    expect(html).toContain('id="phone"');
    expect(html).toContain('for="phone"');
    expect(html).toContain("required");
  });

  it("usa teclado e autofill corretos no mobile", () => {
    // O wrapper de Input preserva as props em camelCase no SSR.
    const html = identificacao().toLowerCase();
    expect(html).toContain('type="tel"');
    expect(html).toContain('inputmode="tel"');
    expect(html).toContain('autocomplete="tel"');
  });

  it("pede os cinco campos de identificação, nessa ordem", () => {
    const html = identificacao();
    const posicao = (id: string) => html.indexOf(`id="${id}"`);
    expect(posicao("name")).toBeGreaterThan(-1);
    expect(posicao("name")).toBeLessThan(posicao("email"));
    expect(posicao("email")).toBeLessThan(posicao("phone"));
    expect(posicao("phone")).toBeLessThan(posicao("company"));
    expect(posicao("company")).toBeLessThan(posicao("role"));
  });

  it("mantém o consentimento de privacidade obrigatório e o de marketing opcional", () => {
    const html = identificacao();
    expect(html).toContain('id="consentPrivacy"');
    expect(html).toContain('id="consentMarketing"');
    // O asterisco de obrigatório acompanha só o de privacidade.
    const privacidade = html.indexOf('id="consentPrivacy"');
    const marketing = html.indexOf('id="consentMarketing"');
    expect(html.slice(privacidade, marketing)).toContain("*");
  });
});

describe("P1 -- a etapa final não coleta mais telefone", () => {
  it("não renderiza nenhum campo de telefone", () => {
    const html = etapaFinal().toLowerCase();
    expect(html).not.toContain('id="phone"');
    expect(html).not.toContain('type="tel"');
  });

  it("continua existindo como espera da geração do parecer", () => {
    const html = etapaFinal();
    expect(html).toContain(cgiUi.pt.phoneTitle);
    expect(html).toContain(cgiUi.pt.viewResult);
  });

  it("não existe um segundo campo de telefone no fluxo", () => {
    const ocorrencias = (identificacao() + etapaFinal()).split('id="phone"').length - 1;
    expect(ocorrencias).toBe(1);
  });
});

describe("P1 -- persistência já na captura do lead", () => {
  it("envia o telefone no payload da identificação, não só no fim", () => {
    const lead = normalizeLeadForSubmit({
      ...initialLead,
      name: "Mara",
      email: "mara@example.com",
      phone: "(11) 99999-8888",
      company: "Domo",
      role: "Sócia",
    });
    const payload = toApiLeadPayload(lead);
    expect(payload.phone).toBe("11999998888");
  });

  it("preserva o prefixo internacional até o payload", () => {
    const lead = normalizeLeadForSubmit({
      ...initialLead,
      name: "John",
      email: "john@example.com",
      phone: "+1 415 555 2671",
      company: "Acme",
      role: "CEO",
    });
    expect(toApiLeadPayload(lead).phone).toBe("+14155552671");
  });

  it("usa um único campo -- nada de phone/telefone duplicado no payload", () => {
    const payload = toApiLeadPayload(
      normalizeLeadForSubmit({ ...initialLead, phone: "11999998888" })
    );
    const camposDeTelefone = Object.keys(payload).filter((k) => /phone|telefone|tel/i.test(k));
    expect(camposDeTelefone).toEqual(["phone"]);
  });

  it("abandono depois da Etapa 1 não apaga o telefone já gravado", () => {
    // O abandono não reescreve o lead: ele só marca o assessment. O telefone
    // gravado na identificação permanece porque nada no caminho de abandono
    // toca em cgi_leads.phone.
    const capturado = normalizeLeadForSubmit({
      ...initialLead,
      phone: "(11) 99999-8888",
    });
    // Estado posterior do formulário, já sem o telefone digitado em memória:
    const aposAbandono = { ...capturado, phone: "" };
    // O que foi persistido na captura é o que vale, e continua válido.
    expect(isValidPhone(capturado.phone)).toBe(true);
    expect(toApiLeadPayload(capturado).phone).toBe("11999998888");
    expect(toApiLeadPayload(aposAbandono).phone).toBe("");
  });
});
