import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CgiMarketingPreference } from "./CgiMarketingPreference";
import {
  MARKETING_PREFERENCE_COPY,
  estadoAposChamada,
} from "@/features/cgi/logic/marketingPreference";

// Mesma abordagem do resto da pasta: SSR para o markup, função pura para a
// decisão. Sem jsdom e sem biblioteca de teste de DOM nova -- o comportamento
// de rede já está coberto em features/cgi/services/marketingConsent.test.ts.
const render = (modo: "optout" | "optin") =>
  renderToStaticMarkup(createElement(CgiMarketingPreference, { modo }));

describe("descadastro — uma frase, uma ação", () => {
  const html = render("optout");

  it("promete exatamente o combinado para a V1", () => {
    expect(MARKETING_PREFERENCE_COPY.optout.corpo).toBe(
      "Você não receberá mais conteúdos e insights da Caldeira Growth."
    );
    expect(MARKETING_PREFERENCE_COPY.optout.acao).toBe("Cancelar recebimento de insights");
  });

  it("tem um único botão: não é Preference Center", () => {
    expect((html.match(/<button/g) || []).length).toBe(1);
    expect(html).not.toMatch(/frequ(ê|e)ncia|prefer(ê|e)ncias|gerenciar|categoria/i);
  });

  it("a confirmação deixa claro que o transacional continua", () => {
    expect(MARKETING_PREFERENCE_COPY.optout.feito).toMatch(
      /diagn(ó|o)sticos que você mesmo solicitar continuam/i
    );
  });

  it("não renderiza e-mail nem qualquer dado do lead", () => {
    expect(html).not.toContain("@");
  });

  it("nasce com a ação desabilitada até o token ser lido do fragmento", () => {
    // SSR não roda efeitos, então este é exatamente o estado inicial no browser:
    // sem token, sem ação possível.
    expect(html).toMatch(/<button[^>]*disabled/);
  });
});

describe("opt-in — a ação é explícita", () => {
  const html = render("optin");

  it("o CTA é uma escolha, não uma consequência de abrir a página", () => {
    expect(MARKETING_PREFERENCE_COPY.optin.acao).toBe("Quero receber insights personalizados");
    expect(html).toContain("Quero receber insights personalizados");
  });

  it("diz o que a pessoa vai receber e que dá para cancelar", () => {
    expect(MARKETING_PREFERENCE_COPY.optin.corpo).toMatch(/cancelar a qualquer momento/i);
  });

  it("não usa linguagem de marketing nem urgência", () => {
    const texto = Object.values(MARKETING_PREFERENCE_COPY.optin).join(" ");
    expect(texto).not.toMatch(/não perca|exclusivo|gratuito|garanta|agora mesmo|vagas/i);
  });
});

describe("resultado da chamada", () => {
  it("link inválido é a única coisa que não conclui", () => {
    expect(estadoAposChamada("invalid_link")).toBe("sem_link");
    expect(estadoAposChamada("ok")).toBe("concluido");
    // Falha de rede não vira erro na cara da pessoa.
    expect(estadoAposChamada("unavailable")).toBe("concluido");
  });
});
