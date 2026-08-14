// Pure, testable construction of the two automated CGI participant emails
// (report-ready, abandonment). Deliberately built here in TypeScript, not in
// Apps Script, so the actual copy/HTML/escaping logic runs through the same
// Vitest suite as the rest of the codebase -- Apps Script only ever receives
// an already-rendered {subject, plainText, htmlBody} and relays it via
// MailApp.sendEmail, it does not template anything itself.
//
// Tone/copy match the exact brief: personal, executive, sober -- no hype, no
// emojis, no urgency, no "Parabéns", no meeting request. Not localized
// (pt only) -- the report-access link itself is already pt-only today
// (Etapa 1/3), so this introduces no new gap.

export type CgiEmailContent = {
  subject: string;
  plainText: string;
  htmlBody: string;
};

const SIGNATURE_PLAIN = "Denis Caldeira\nCEO e Founder\nCaldeira Growth Consulting";
const SIGNATURE_HTML =
  "Denis Caldeira<br />CEO e Founder<br />Caldeira Growth Consulting";

export function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Collapses runs of whitespace and trims -- the only normalization applied
 * to an already-generated executive_summary. Never rewrites content. */
function normalizeWhitespace(value: string): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/** Extracts executive_summary from the same JSON string already produced by
 * report generation (ai.text / normalizeGeneratedReportJson) -- no second
 * OpenAI call, no re-generation. Returns null (not a placeholder) on any
 * parse failure or missing/empty field, so callers can degrade safely
 * instead of inventing generic copy the report doesn't actually contain. */
export function extractExecutiveSummary(aiReportJson: string): string | null {
  if (!aiReportJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(aiReportJson);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const raw = (parsed as Record<string, unknown>).executive_summary;
  if (typeof raw !== "string") return null;
  const normalized = normalizeWhitespace(raw);
  return normalized.length > 0 ? normalized : null;
}

function htmlShell(bodyHtml: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background-color:#f5f4f1;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:40px 40px 32px 40px;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;font-size:16px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButtonHtml(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td style="border-radius:4px;background-color:#1a1a1a;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function buildCgiReportReadyEmail(input: {
  name: string;
  company: string;
  executiveSummary: string;
  reportAccessUrl: string;
}): CgiEmailContent {
  const name = String(input.name || "").trim();
  const company = String(input.company || "").trim();
  const summary = String(input.executiveSummary || "").trim();
  const url = input.reportAccessUrl;

  const subject = `Seu relatório CGI${company ? ` — ${company}` : ""}`;

  const plainText = [
    `Olá, ${name}.`,
    "",
    "Seu relatório CGI está pronto.",
    "",
    summary,
    "",
    "Ao abrir o relatório, minha sugestão é não começar pela nota. Ela sintetiza o estágio atual, mas não é a parte mais importante do diagnóstico.",
    "",
    "Procure principalmente onde as cinco dimensões não avançam no mesmo ritmo, quais gargalos podem limitar o próximo ciclo e quais hipóteses precisam ser validadas antes de virarem decisões. É nessas tensões — mais do que no número final — que costuma estar a parte mais útil do CGI.",
    "",
    "Ler meu relatório CGI:",
    url,
    "",
    "O CGI traduz para um diagnóstico prático princípios que desenvolvi em Cresça ou Desapareça e na minha atuação com empresas e lideranças. Ele foi desenhado para levantar boas hipóteses, não para substituir contexto.",
    "",
    SIGNATURE_PLAIN,
  ].join("\n");

  const htmlBody = htmlShell(`
    <p style="margin:0 0 20px 0;">Olá, ${escapeHtml(name)}.</p>
    <p style="margin:0 0 20px 0;">Seu relatório CGI está pronto.</p>
    <p style="margin:0 0 20px 0;">${escapeHtml(summary)}</p>
    <p style="margin:0 0 20px 0;">Ao abrir o relatório, minha sugestão é não começar pela nota. Ela sintetiza o estágio atual, mas não é a parte mais importante do diagnóstico.</p>
    <p style="margin:0 0 20px 0;">Procure principalmente onde as cinco dimensões não avançam no mesmo ritmo, quais gargalos podem limitar o próximo ciclo e quais hipóteses precisam ser validadas antes de virarem decisões. É nessas tensões — mais do que no número final — que costuma estar a parte mais útil do CGI.</p>
    ${ctaButtonHtml("Ler meu relatório CGI", url)}
    <p style="margin:20px 0;font-size:14px;color:#555555;">O CGI traduz para um diagnóstico prático princípios que desenvolvi em Cresça ou Desapareça e na minha atuação com empresas e lideranças. Ele foi desenhado para levantar boas hipóteses, não para substituir contexto.</p>
    <p style="margin:28px 0 0 0;font-size:15px;">${SIGNATURE_HTML}</p>
  `);

  return { subject, plainText, htmlBody };
}

export function buildCgiAbandonmentEmail(input: {
  name: string;
  reportAccessUrl: string;
}): CgiEmailContent {
  const name = String(input.name || "").trim();
  const url = input.reportAccessUrl;

  const subject = "Seu diagnóstico CGI ficou em aberto";

  const plainText = [
    `Olá, ${name}.`,
    "",
    "Você iniciou o Caldeira Growth Index, mas o diagnóstico ficou incompleto.",
    "",
    "O CGI observa cinco dimensões que, em conjunto, ajudam a entender a capacidade de uma empresa sustentar crescimento. As respostas isoladas dizem pouco; é a combinação entre elas que permite identificar tensões, gargalos e prioridades.",
    "",
    "Como você já iniciou o diagnóstico, vale concluir a leitura para que essas relações apareçam com clareza.",
    "",
    "Continuar meu diagnóstico:",
    url,
    "",
    "O link retoma o CGI a partir do progresso que já ficou salvo.",
    "",
    "O método traduz princípios que desenvolvi em Cresça ou Desapareça e na minha atuação com empresas e lideranças.",
    "",
    SIGNATURE_PLAIN,
  ].join("\n");

  const htmlBody = htmlShell(`
    <p style="margin:0 0 20px 0;">Olá, ${escapeHtml(name)}.</p>
    <p style="margin:0 0 20px 0;">Você iniciou o Caldeira Growth Index, mas o diagnóstico ficou incompleto.</p>
    <p style="margin:0 0 20px 0;">O CGI observa cinco dimensões que, em conjunto, ajudam a entender a capacidade de uma empresa sustentar crescimento. As respostas isoladas dizem pouco; é a combinação entre elas que permite identificar tensões, gargalos e prioridades.</p>
    <p style="margin:0 0 20px 0;">Como você já iniciou o diagnóstico, vale concluir a leitura para que essas relações apareçam com clareza.</p>
    ${ctaButtonHtml("Continuar meu diagnóstico", url)}
    <p style="margin:20px 0;font-size:14px;color:#555555;">O link retoma o CGI a partir do progresso que já ficou salvo.</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#555555;">O método traduz princípios que desenvolvi em Cresça ou Desapareça e na minha atuação com empresas e lideranças.</p>
    <p style="margin:28px 0 0 0;font-size:15px;">${SIGNATURE_HTML}</p>
  `);

  return { subject, plainText, htmlBody };
}
