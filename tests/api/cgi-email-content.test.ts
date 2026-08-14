import { describe, expect, it } from "vitest";
import {
  buildCgiAbandonmentEmail,
  buildCgiReportReadyEmail,
  escapeHtml,
  extractExecutiveSummary,
} from "../../api/_cgi-email-content";

describe("extractExecutiveSummary", () => {
  it("extracts executive_summary from a valid report JSON string", () => {
    const json = JSON.stringify({ report_title: "x", executive_summary: "Resumo executivo real." });
    expect(extractExecutiveSummary(json)).toBe("Resumo executivo real.");
  });

  it("collapses whitespace but never rewrites content", () => {
    const json = JSON.stringify({ executive_summary: "  Linha  um.\n\n  Linha dois.  " });
    expect(extractExecutiveSummary(json)).toBe("Linha um. Linha dois.");
  });

  it("returns null for malformed JSON", () => {
    expect(extractExecutiveSummary("{not json")).toBeNull();
  });

  it("returns null when executive_summary is missing", () => {
    expect(extractExecutiveSummary(JSON.stringify({ report_title: "x" }))).toBeNull();
  });

  it("returns null when executive_summary is empty/whitespace-only", () => {
    expect(extractExecutiveSummary(JSON.stringify({ executive_summary: "   " }))).toBeNull();
  });

  it("returns null when executive_summary is not a string", () => {
    expect(extractExecutiveSummary(JSON.stringify({ executive_summary: 123 }))).toBeNull();
  });

  it("returns null for an empty input string", () => {
    expect(extractExecutiveSummary("")).toBeNull();
  });
});

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<script>"'&`)).toBe("&lt;script&gt;&quot;&#39;&amp;");
  });
});

describe("buildCgiReportReadyEmail", () => {
  const base = {
    name: "Marines Silva",
    company: "Empresa Teste",
    executiveSummary: "Resumo executivo do relatório.",
    reportAccessUrl: "https://www.caldeiragrowth.com/cgi/relatorio#t=abc123",
  };

  it("includes company in the subject", () => {
    const email = buildCgiReportReadyEmail(base);
    expect(email.subject).toBe("Seu relatório CGI — Empresa Teste");
  });

  it("omits the dash when company is empty", () => {
    const email = buildCgiReportReadyEmail({ ...base, company: "" });
    expect(email.subject).toBe("Seu relatório CGI");
  });

  it("includes name, executive summary and the CTA url in plain text", () => {
    const email = buildCgiReportReadyEmail(base);
    expect(email.plainText).toContain("Olá, Marines Silva.");
    expect(email.plainText).toContain("Resumo executivo do relatório.");
    expect(email.plainText).toContain(base.reportAccessUrl);
    expect(email.plainText).toContain("Ler meu relatório CGI");
  });

  it("includes the signature exactly as specified", () => {
    const email = buildCgiReportReadyEmail(base);
    expect(email.plainText).toContain("Denis Caldeira\nCEO e Founder\nCaldeira Growth Consulting");
    expect(email.htmlBody).toContain("Denis Caldeira<br />CEO e Founder<br />Caldeira Growth Consulting");
  });

  it("HTML-escapes name and executive summary in the html body", () => {
    const email = buildCgiReportReadyEmail({
      ...base,
      name: "<b>Injected</b>",
      executiveSummary: 'Summary with "quotes" & <tags>.',
    });
    expect(email.htmlBody).not.toContain("<b>Injected</b>");
    expect(email.htmlBody).toContain("&lt;b&gt;Injected&lt;/b&gt;");
    expect(email.htmlBody).toContain("&quot;quotes&quot;");
    expect(email.htmlBody).toContain("&lt;tags&gt;");
  });

  it("embeds the CTA url as a real href in the html body", () => {
    const email = buildCgiReportReadyEmail(base);
    expect(email.htmlBody).toContain(`href="${base.reportAccessUrl}"`);
  });

  it("never mentions 'Parabéns', meeting requests, or urgency language", () => {
    const email = buildCgiReportReadyEmail(base);
    const combined = `${email.subject} ${email.plainText} ${email.htmlBody}`.toLowerCase();
    expect(combined).not.toContain("parabéns");
    expect(combined).not.toContain("agendar");
    expect(combined).not.toContain("última chance");
  });

  it("has non-empty subject/plainText/htmlBody suitable for MailApp.sendEmail(recipient, subject, plainText, {htmlBody})", () => {
    const email = buildCgiReportReadyEmail(base);
    expect(email.subject.length).toBeGreaterThan(0);
    expect(email.plainText.length).toBeGreaterThan(0);
    expect(email.htmlBody.length).toBeGreaterThan(0);
  });
});

describe("buildCgiAbandonmentEmail", () => {
  const base = {
    name: "Marines Silva",
    reportAccessUrl: "https://www.caldeiragrowth.com/cgi/relatorio#t=abc123",
  };

  it("uses the exact subject from the brief", () => {
    const email = buildCgiAbandonmentEmail(base);
    expect(email.subject).toBe("Seu diagnóstico CGI ficou em aberto");
  });

  it("includes the CTA copy and url", () => {
    const email = buildCgiAbandonmentEmail(base);
    expect(email.plainText).toContain("Continuar meu diagnóstico");
    expect(email.plainText).toContain(base.reportAccessUrl);
    expect(email.htmlBody).toContain(`href="${base.reportAccessUrl}"`);
  });

  it("never uses guilt/urgency/scarcity language", () => {
    const email = buildCgiAbandonmentEmail(base);
    const combined = `${email.subject} ${email.plainText}`.toLowerCase();
    expect(combined).not.toContain("não perca");
    expect(combined).not.toContain("última chance");
    expect(combined).not.toContain("você está quase");
  });

  it("includes the signature exactly as specified", () => {
    const email = buildCgiAbandonmentEmail(base);
    expect(email.plainText).toContain("Denis Caldeira\nCEO e Founder\nCaldeira Growth Consulting");
  });

  it("HTML-escapes the name", () => {
    const email = buildCgiAbandonmentEmail({ ...base, name: "<script>alert(1)</script>" });
    expect(email.htmlBody).not.toContain("<script>alert(1)</script>");
  });
});
