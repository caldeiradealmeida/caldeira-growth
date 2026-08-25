import { describe, expect, it } from "vitest";
import {
  buildCgiInsightD7Email,
  buildCgiInsightsOptInUrl,
  buildCgiReportFollowupD2Email,
  buildCgiReportReadyEmail,
  buildCgiUnsubscribeUrl,
  type CgiInsightDimensionId,
} from "../../api/_cgi-email-content.js";

const DIMENSOES: CgiInsightDimensionId[] = [
  "strategy", "market", "growthMachine", "execution", "leadership",
];

const d7 = (dimensionId: CgiInsightDimensionId) =>
  buildCgiInsightD7Email({
    name: "Belmir",
    company: "Grupo MNGT",
    dimensionId,
    unsubscribeUrl: buildCgiUnsubscribeUrl("token-abcdefghijklmno"),
  });

describe("D+2 — copy de entrega, não de conteúdo", () => {
  const email = buildCgiReportFollowupD2Email({
    name: "Ana", company: "ACME", reportAccessUrl: "https://x/cgi/relatorio#t=abc",
  });

  it("o assunto é sobre acesso, não sobre o relatório", () => {
    expect(email.subject).toBe("Seu relatório CGI — ACME: conseguiu abrir?");
  });

  it("repete o link e não repete o conteúdo do relatório", () => {
    expect(email.plainText).toContain("https://x/cgi/relatorio#t=abc");
    expect(email.plainText).not.toMatch(/dimens(ã|a)o mais fr(á|a)gil/i);
  });

  it("NÃO leva rodapé de descadastro: é transacional", () => {
    // Oferecer descadastro numa confirmação de entrega confunde as duas coisas.
    expect(email.plainText).not.toMatch(/descadastrar|cancele o recebimento/i);
    expect(email.htmlBody).not.toMatch(/descadastrar|cancele o recebimento/i);
  });

  it("sem urgência artificial e sem linguagem de marketing", () => {
    expect(email.plainText).not.toMatch(/não perca|última chance|urgente|imperdível|garanta/i);
  });

  it("assina como Denis", () => {
    expect(email.plainText).toContain("Denis Caldeira");
  });
});

describe("D+7 — uma leitura por dimensão", () => {
  it("existe conteúdo próprio para cada uma das cinco dimensões", () => {
    const assuntos = DIMENSOES.map((d) => d7(d).subject);
    expect(new Set(assuntos).size).toBe(5);
    const corpos = DIMENSOES.map((d) => d7(d).plainText);
    expect(new Set(corpos).size).toBe(5);
  });

  it("o assunto nomeia a dimensão e a empresa", () => {
    expect(d7("growthMachine").subject).toBe("Sobre Máquina de Crescimento na Grupo MNGT");
    expect(d7("leadership").subject).toBe("Sobre Liderança e Cultura de Crescimento na Grupo MNGT");
  });

  it("cada e-mail diz de onde veio a escolha da dimensão", () => {
    for (const dim of DIMENSOES) {
      expect(d7(dim).plainText).toMatch(/Seu CGI apontou/);
    }
  });

  it("SEMPRE leva o link de descadastro: é nurturing", () => {
    for (const dim of DIMENSOES) {
      expect(d7(dim).plainText).toContain("/cgi/descadastrar#t=token-abcdefghijklmno");
      expect(d7(dim).htmlBody).toContain("/cgi/descadastrar#t=token-abcdefghijklmno");
    }
  });

  it("é curto: uma leitura, não um artigo", () => {
    for (const dim of DIMENSOES) {
      const palavras = d7(dim).plainText.split(/\s+/).filter(Boolean).length;
      expect(palavras).toBeLessThan(280);
    }
  });

  it("sem gatilho, sem venda agressiva, sem pedido de reunião", () => {
    for (const dim of DIMENSOES) {
      const texto = d7(dim).plainText;
      expect(texto).not.toMatch(/não perca|última chance|urgente|imperdível|agende (uma|já)|vagas limitadas|garanta/i);
      expect(texto).not.toMatch(/parab(é|e)ns/i);
    }
  });

  it("escapa HTML no nome e na empresa", () => {
    const email = buildCgiInsightD7Email({
      name: '<script>alert(1)</script>', company: 'A & B "Ltda"',
      dimensionId: "strategy", unsubscribeUrl: buildCgiUnsubscribeUrl("token-abcdefghijklmno"),
    });
    expect(email.htmlBody).not.toContain("<script>");
    expect(email.htmlBody).toContain("&lt;script&gt;");
    expect(email.htmlBody).toContain("&amp;");
  });
});

describe("URLs de preferência", () => {
  it("o token vai no fragmento, nunca na query string", () => {
    expect(buildCgiUnsubscribeUrl("tok")).toBe("https://www.caldeiragrowth.com/cgi/descadastrar#t=tok");
    expect(buildCgiInsightsOptInUrl("tok")).toBe("https://www.caldeiragrowth.com/cgi/insights#t=tok");
    expect(buildCgiUnsubscribeUrl("tok")).not.toContain("?");
  });
});

describe("linha de opt-in no e-mail de entrega", () => {
  const base = {
    name: "Ana", company: "ACME",
    executiveSummary: "Uma leitura inicial.",
    reportAccessUrl: "https://x/cgi/relatorio#t=abc",
  };

  it("sem URL de opt-in, o e-mail sai exatamente como antes", () => {
    const sem = buildCgiReportReadyEmail(base);
    const nulo = buildCgiReportReadyEmail({ ...base, insightsOptInUrl: null });
    expect(sem.plainText).toBe(nulo.plainText);
    expect(sem.htmlBody).toBe(nulo.htmlBody);
    expect(sem.plainText).not.toMatch(/insights/i);
  });

  it("com URL, entra uma linha só — e depois da assinatura", () => {
    const com = buildCgiReportReadyEmail({
      ...base, insightsOptInUrl: "https://x/cgi/insights#t=tok",
    });
    expect(com.plainText).toContain("https://x/cgi/insights#t=tok");
    // O e-mail continua sendo a entrega do relatório: o convite é pós-escrito.
    expect(com.plainText.indexOf("Denis Caldeira")).toBeLessThan(
      com.plainText.indexOf("cgi/insights")
    );
  });

  it("não transforma o transacional em marketing", () => {
    const com = buildCgiReportReadyEmail({
      ...base, insightsOptInUrl: "https://x/cgi/insights#t=tok",
    });
    expect(com.subject).toBe("Seu relatório CGI — ACME");
    expect(com.plainText).not.toMatch(/não perca|exclusivo|garanta|vagas|agora mesmo/i);
  });

  it("o assunto e o corpo do relatório não mudam com o convite", () => {
    const sem = buildCgiReportReadyEmail(base);
    const com = buildCgiReportReadyEmail({ ...base, insightsOptInUrl: "https://x/cgi/insights#t=tok" });
    expect(com.subject).toBe(sem.subject);
    expect(com.plainText.startsWith(sem.plainText)).toBe(true);
  });
});
