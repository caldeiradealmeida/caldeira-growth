import footerLogo from "@/assets/brand/Black logo - no background.svg";
import reportSignature from "@/assets/report/assinatura-denis.png";
import reportCover from "@/assets/report/cgi-report-cover.png";
import type { Language } from "@/lib/routing";
import type { CgiScoreResult } from "@/lib/cgiScore";
import { cgiUi } from "../config";
import type { LeadForm } from "../types";

export function parseAiReport(value: string): {
  report_title?: string;
  report_subtitle?: string;
  executive_summary?: string;
  strategic_diagnosis?: string;
  priority_diagnosis?: string;
  dimension_reading?: Array<{
    dimension?: string;
    score?: number;
    analysis?: string;
    implication?: string;
  }>;
  critical_bottlenecks?: string[];
  strategic_bets?: string[];
  renunciations?: string[];
  governance_system?: string[];
  final_recommendations?: string[];
  attention_points?: string[];
  recommended_next_steps?: string[];
} | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getSubmitErrorMessage(data: unknown, t = cgiUi.pt): string {
  if (!data || typeof data !== "object") {
    return t.savedBody;
  }

  const error = String((data as { error?: unknown }).error || "");
  const upstream = (data as { upstream?: { error?: unknown; raw?: unknown } }).upstream;

  if (error === "apps_script_outdated_or_wrong_deployment") {
    return "Seu resultado foi calculado, mas o Google Apps Script publicado ainda parece estar na versão antiga ou a URL configurada aponta para outra implantação. Atualize a implantação do Web App no Apps Script e confirme que ela está publicada para 'Qualquer pessoa'.";
  }

  if (error === "not_configured") {
    return "Seu resultado foi calculado, mas a URL do Google Apps Script não está configurada no servidor.";
  }

  if (error === "invalid_email_domain") {
    return t.invalidEmailBody;
  }

  if (error === "upstream_request_failed") {
    return "Seu resultado foi calculado, mas o servidor não conseguiu se comunicar com o Google Apps Script.";
  }

  if (String(upstream?.error || "") === "validation") {
    return "Seu resultado foi calculado, mas o Google Apps Script recusou o payload. Isso costuma indicar que a implantação publicada ainda é a versão antiga do script.";
  }

  if (typeof upstream?.raw === "string" && upstream.raw.includes("Função de script não encontrada")) {
    return "Seu resultado foi calculado, mas a implantação publicada do Google Apps Script não contém as funções novas. Publique uma nova versão do Web App com o script atualizado.";
  }

  return t.savedBody;
}

export function getSaveErrorMessage(save: unknown, t = cgiUi.pt): string {
  if (!save || typeof save !== "object") {
    return t.savedBody;
  }

  const error = String((save as { error?: unknown }).error || "");
  if (error === "not_configured") {
    return "Seu relatório foi gerado, mas a URL do Google Apps Script não está configurada no servidor.";
  }
  if (error === "apps_script_outdated_or_wrong_deployment") {
    return "Seu relatório foi gerado, mas o Google Apps Script publicado parece estar em uma versão antiga.";
  }
  if (error === "upstream_request_failed") {
    return "Seu relatório foi gerado, mas o servidor não conseguiu se comunicar com o Google Apps Script.";
  }
  return t.savedBody;
}

export function scrollToAssessment() {
  window.setTimeout(() => {
    document
      .getElementById("cgi-assessment")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

export function formatAiReportText(
  aiReport: ReturnType<typeof parseAiReport>,
  fallback: CgiScoreResult,
  t: (typeof cgiUi)[Language]
) {
  if (!aiReport) return "";

  const list = (items?: string[]) =>
    Array.isArray(items) ? items.map((item) => `- ${item}`).join("\n") : "";
  const dimensionReading = Array.isArray(aiReport.dimension_reading)
    ? aiReport.dimension_reading
        .map((item, index) => {
          const matchingDimension =
            typeof item.score === "number"
              ? fallback.dimensionScores.find(
                  (score) => score.score === item.score
                )
              : undefined;
          const dimensionLabel =
            matchingDimension?.title ||
            fallback.dimensionScores[index]?.title ||
            item.dimension ||
            t.dimensionReadingTitle;
          const scoreValue = item.score ?? matchingDimension?.score;
          return [
            `- ${dimensionLabel}${scoreValue ? ` (${scoreValue}/100)` : ""}`,
            item.analysis,
            item.implication,
          ]
            .filter(Boolean)
            .join(": ");
        })
        .join("\n")
    : "";

  return [
    aiReport.report_title,
    aiReport.report_subtitle,
    aiReport.executive_summary,
    aiReport.strategic_diagnosis || aiReport.priority_diagnosis,
    dimensionReading ? `${t.dimensionReadingTitle}:\n${dimensionReading}` : "",
    list(aiReport.critical_bottlenecks)
      ? `${t.criticalBottlenecksTitle}:\n${list(aiReport.critical_bottlenecks)}`
      : "",
    list(aiReport.strategic_bets)
      ? `${t.strategicBetsTitle}:\n${list(aiReport.strategic_bets)}`
      : "",
    list(aiReport.renunciations)
      ? `${t.renunciationsTitle}:\n${list(aiReport.renunciations)}`
      : "",
    list(aiReport.governance_system)
      ? `${t.governanceTitle}:\n${list(aiReport.governance_system)}`
      : "",
    list(aiReport.final_recommendations || aiReport.recommended_next_steps)
      ? `${t.finalRecommendationsTitle}:\n${list(
          aiReport.final_recommendations || aiReport.recommended_next_steps
        )}`
      : "",
    !aiReport.executive_summary && fallback.diagnostic ? fallback.diagnostic : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildReportText({
  lead,
  result,
  aiReport,
  t,
}: {
  lead: LeadForm;
  result: CgiScoreResult;
  aiReport: ReturnType<typeof parseAiReport>;
  t: (typeof cgiUi)[Language];
}) {
  const aiText = formatAiReportText(aiReport, result, t);
  const attention = result.attentionPoints
    .map((item) => `- ${item.title}: ${item.score}/100`)
    .join("\n");

  return [
    `${t.reportDocTitle} - ${lead.company || "Caldeira Growth"}`,
    "Caldeira Growth Index",
    "",
    `${t.company}: ${lead.company}`,
    `${t.respondent}: ${lead.name}`,
    `${t.role}: ${lead.role}`,
    "",
    t.diagnosis,
    aiText || result.diagnostic,
    "",
    t.attentionTitle,
    attention,
    "",
    t.contact,
    t.contactText,
    "",
    "Denis Caldeira de Almeida",
    t.founderLine,
    "contato@caldeiragrowth.com",
    "www.caldeiragrowth.com",
  ].join("\n");
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

export function formatReportListItem(line: string) {
  const text = line.replace(/^- /, "");
  const labelMatch = text.match(/^([^:]{1,90}):\s*(.*)$/);
  if (!labelMatch) return escapeHtml(text);

  return `<strong>${escapeHtml(labelMatch[1])}:</strong> ${escapeHtml(
    labelMatch[2]
  )}`;
}

export function formatReportBodyHtml(reportText: string) {
  const escapedSignature = escapeAttr(reportSignature);
  const sectionTitles = new Set([
    "Diagnóstico",
    "Diagnosis",
    "Diagnóstico",
    "3 principais pontos de atenção",
    "3 main attention points",
    "3 principales puntos de atención",
    "Sumário Executivo",
    "Contexto e diagnóstico",
    "Leitura por dimensão",
    "Gargalos críticos",
    "Apostas estratégicas recomendadas",
    "Renúncias estratégicas",
    "Sistema mínimo de governança",
    "Recomendações finais",
    "Contato",
  ]);

  return reportText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length === 1 && sectionTitles.has(lines[0])) {
        return `<h2>${escapeHtml(lines[0])}</h2>`;
      }
      if (lines.length === 1 && /:$/.test(lines[0])) {
        return `<h3>${escapeHtml(lines[0])}</h3>`;
      }
      if (lines.length > 1 && /:$/.test(lines[0])) {
        const rest = lines.slice(1);
        const content = rest.every((line) => line.startsWith("- "))
          ? `<ul>${rest
              .map((line) => `<li>${formatReportListItem(line)}</li>`)
              .join("")}</ul>`
          : `<p>${escapeHtml(rest.join("\n")).replace(/\n/g, "<br />")}</p>`;
        return `<h3>${escapeHtml(lines[0])}</h3>${content}`;
      }
      if (lines[0] === "Denis Caldeira de Almeida") {
        return `
          <div class="signature-block">
            <img src="${escapedSignature}" alt="Assinatura Denis Caldeira" />
            <p>
              <strong>Denis Caldeira de Almeida</strong><br />
              ${escapeHtml(lines.slice(1).join("\n")).replace(/\n/g, "<br />")}
            </p>
          </div>
        `;
      }
      if (
        block.startsWith("Para aprofundar este diagnóstico") ||
        block.startsWith("To deepen this diagnosis") ||
        block.startsWith("Para profundizar este diagnóstico")
      ) {
        return `<p class="contact-callout">${escapeHtml(block)}</p>`;
      }
      if (lines.every((line) => line.startsWith("- "))) {
        return `<ul>${lines
          .map((line) => `<li>${formatReportListItem(line)}</li>`)
          .join("")}</ul>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

export function buildFinalScoreHtml(result: CgiScoreResult, finalScoreLabel: string) {
  return `
    <section class="final-score">
      <div>
        <p class="final-score-label">${escapeHtml(finalScoreLabel)}</p>
        <p class="final-score-number">${result.finalScore}</p>
      </div>
      <div class="final-score-copy">
        <p class="final-score-level">${escapeHtml(result.level.title)}</p>
        <p>${escapeHtml(result.level.summary)}</p>
      </div>
    </section>
  `;
}

export function buildScoreBarsHtml(result: CgiScoreResult, title: string) {
  return `
    <section class="score-bars">
      <h2>${escapeHtml(title)}</h2>
      ${result.dimensionScores
        .map(
          (item) => `
            <div class="score-row">
              <div class="score-label">
                <span>${escapeHtml(item.title)}</span>
                <strong>${item.score}/100</strong>
              </div>
              <div class="score-track">
                <div class="score-fill" style="width: ${Math.max(
                  0,
                  Math.min(100, item.score)
                )}%"></div>
              </div>
            </div>
          `
        )
        .join("")}
    </section>
  `;
}

export function buildMethodologyHtml(t: (typeof cgiUi)[Language]) {
  return `
    <section class="method-note">
      <p class="method-eyebrow">${escapeHtml(t.methodEyebrow)}</p>
      <h2>${escapeHtml(t.methodReportTitle)}</h2>
      ${t.methodReportBody.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      <p class="method-signature">${escapeHtml(t.methodSignature)}</p>
    </section>
  `;
}

export function buildReportHtml(
  reportText: string,
  companyName: string,
  result: CgiScoreResult,
  t: (typeof cgiUi)[Language],
  lang: Language
) {
  const bodyHtml = formatReportBodyHtml(reportText);
  const finalScoreHtml = buildFinalScoreHtml(result, t.finalScore);
  const scoreBarsHtml = buildScoreBarsHtml(result, t.scoreByDimension);
  const methodologyHtml = buildMethodologyHtml(t);
  const escapedCompany = escapeHtml(companyName || "Caldeira Growth");
  const escapedTitle = `${escapeHtml(t.reportDocTitle)} - ${escapedCompany}`;
  const escapedLogo = escapeAttr(footerLogo);
  const escapedCover = escapeAttr(reportCover);
  const reportDate = escapeHtml(
    new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : lang === "es" ? "es-419" : "en", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date())
  );

  return `<!doctype html>
<html lang="${lang === "pt" ? "pt-BR" : lang === "es" ? "es-419" : "en"}">
  <head>
    <meta charset="utf-8" />
    <title>${escapedTitle}</title>
    <style>
      @page { size: A4; margin: 24mm 22mm 34mm; }
      @page:first { margin: 0; }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { font-family: Arial, sans-serif; color: #252b35; line-height: 1.58; margin: 0; background: #e7e2d9; }
      .screen-toolbar { background: #ffffff; border-bottom: 1px solid #d8d1c5; color: #344763; font: 600 13px Arial, sans-serif; padding: 12px 18px; position: sticky; top: 0; z-index: 10; text-align: center; }
      .report { margin: 28px auto 56px; width: 210mm; max-width: calc(100vw - 32px); box-shadow: 0 18px 45px rgba(30, 37, 48, .16); }
      .cover { width: 210mm; min-height: 297mm; box-sizing: border-box; color: #f5f7f8; position: relative; overflow: hidden; background: #334257; }
      .cover-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .cover-content { position: relative; z-index: 1; min-height: 297mm; box-sizing: border-box; padding: 270px 70px 92px; display: flex; flex-direction: column; justify-content: space-between; }
      .cover-kicker { font-size: 15px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.82); }
      .cover h1 { font-family: Georgia, serif; font-size: 54px; line-height: 1.03; font-weight: 700; margin: 18px 0 20px; max-width: 720px; }
      .cover .meta { font-family: Georgia, serif; font-size: 24px; color: rgba(255,255,255,.9); }
      .cover-details { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,.86); }
      .page { background: #f7f4ef; min-height: 297mm; padding: 60px 70px 132px; }
      h2 { font-family: Georgia, serif; font-size: 30px; font-weight: 700; margin: 34px 0 14px; color: #2e3340; }
      h2:first-child { margin-top: 0; }
      h3 { font-family: Georgia, serif; font-size: 20px; font-weight: 700; margin: 24px 0 10px; color: #2e3340; }
      .rule { height: 2px; background: #344763; margin: 0 0 28px; }
      p { font-size: 14px; margin: 0 0 16px; text-align: justify; }
      ul { margin: 0 0 18px 20px; padding: 0; }
      li { font-size: 14px; margin: 0 0 8px; text-align: justify; }
      h2, h3, .score-row, p, li { break-inside: avoid; }
      .final-score { align-items: center; background: #344763; color: #f7f4ef; display: grid; gap: 28px; grid-template-columns: 180px 1fr; margin: 0 0 34px; padding: 28px 32px; break-inside: avoid; }
      .final-score-label { font-size: 13px; font-weight: 800; letter-spacing: .16em; margin: 0 0 2px; text-align: left; text-transform: uppercase; }
      .final-score-number { font-family: Georgia, serif; font-size: 88px; font-weight: 700; line-height: .95; margin: 0; text-align: left; }
      .final-score-copy p { color: rgba(247,244,239,.86); font-size: 14px; margin: 0; text-align: left; }
      .final-score-copy .final-score-level { color: #ffffff; font-family: Georgia, serif; font-size: 27px; font-weight: 700; line-height: 1.12; margin: 0 0 8px; }
      .score-bars { margin: 26px 0 34px; }
      .score-row { margin: 0 0 18px; }
      .score-label { display: flex; justify-content: space-between; gap: 20px; font-size: 14px; font-weight: 700; margin-bottom: 7px; }
      .score-track { height: 13px; border-radius: 999px; background: #d4dbe2; overflow: hidden; }
      .score-fill { height: 100%; border-radius: 999px; background: #344763; }
      .method-note { background: #efebe4; border-left: 4px solid #344763; margin: 8px 0 34px; padding: 22px 26px 18px; break-inside: avoid; }
      .method-note h2 { font-size: 24px; margin: 4px 0 12px; }
      .method-note p { font-size: 13px; margin-bottom: 10px; }
      .method-eyebrow { color: #344763; font-size: 11px !important; font-weight: 800; letter-spacing: .12em; margin-bottom: 4px !important; text-align: left !important; text-transform: uppercase; }
      .method-signature { color: #344763; font-weight: 700; margin: 12px 0 0 !important; text-align: left !important; }
      .contact-callout { border-left: 4px solid #344763; color: #1f2935; font-size: 15px; font-weight: 700; line-height: 1.62; padding: 4px 0 4px 16px; text-align: left; }
      .signature-block { margin: 34px 0 8px; break-inside: avoid; }
      .signature-block img { display: block; width: 475px; max-width: 90%; height: auto; margin: -10px 0 -58px -48px; }
      .signature-block p { margin-top: 0; text-align: left; }
      footer { border-top: 1px solid #c8cdd4; padding-top: 8px; text-align: center; background: #f7f4ef; }
      footer img { width: 112px; height: auto; }
      @media screen { footer { margin: 44px 70px 0; } }
      @media print {
        .screen-toolbar { display: none; }
        body { background: #f7f4ef; }
        .report { box-shadow: none; margin: 0; max-width: none; width: auto; }
        .cover { min-height: 297mm; page-break-after: always; width: 210mm; }
        .page { min-height: auto; padding: 0; }
        footer { margin: 18mm 22mm 0; }
      }
    </style>
  </head>
  <body>
    <div class="screen-toolbar">${escapeHtml(t.printInstruction)}</div>
    <main class="report">
      <section class="cover">
        <img class="cover-bg" src="${escapedCover}" alt="" />
        <div class="cover-content">
          <div>
            <div class="cover-kicker">Caldeira Growth Index</div>
            <h1>${escapedTitle}</h1>
            <div class="meta">${escapeHtml(t.reportSubtitle)}</div>
          </div>
          <div class="cover-details">
            <div>${escapeHtml(t.company)}: ${escapedCompany}</div>
            <div>${lang === "en" ? "Date" : lang === "es" ? "Fecha" : "Data"}: ${reportDate}</div>
          </div>
        </div>
      </section>
      <section class="page">
        <div class="rule"></div>
        ${finalScoreHtml}
        ${scoreBarsHtml}
        ${methodologyHtml}
        ${bodyHtml}
      </section>
      <footer><img src="${escapedLogo}" alt="Caldeira Growth" /></footer>
    </main>
  </body>
</html>`;
}

export function writeReportDocument(reportWindow: Window, html: string) {
  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
}

export async function waitForReportAssets(reportWindow: Window, timeoutMs = 5000) {
  const documentReady = new Promise<void>((resolve) => {
    if (reportWindow.document.readyState === "complete") {
      resolve();
      return;
    }
    reportWindow.addEventListener("load", () => resolve(), { once: true });
  });

  const fontsReady =
    "fonts" in reportWindow.document
      ? reportWindow.document.fonts.ready.then(() => undefined)
      : Promise.resolve();

  const imagesReady = Promise.all(
    Array.from(reportWindow.document.images).map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
          }
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        })
    )
  ).then(() => undefined);

  let timeoutId = 0;
  const timeout = new Promise<void>((resolve) => {
    timeoutId = window.setTimeout(() => {
      if (import.meta.env.DEV) {
        console.warn("[CGI] Tempo limite ao aguardar assets do relatório.");
      }
      resolve();
    }, timeoutMs);
  });

  await Promise.race([
    Promise.all([documentReady, fontsReady, imagesReady]).then(() => undefined),
    timeout,
  ]);
  window.clearTimeout(timeoutId);
}

export function safePdfFilename(companyName: string) {
  const safeCompany = companyName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return safeCompany ? `Relatorio-CGI-${safeCompany}.pdf` : "Relatorio-CGI.pdf";
}

export function normalizePdfText(value: string) {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/\u00a0/g, " ");
}

type ReportImage = {
  dataUrl: string;
  width: number;
  height: number;
};

export async function imageToDataUrl(src: string): Promise<ReportImage> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image_load_failed:${src}`));
    img.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_context_unavailable");
  context.drawImage(image, 0, 0);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

export async function optionalImageToDataUrl(src: string): Promise<ReportImage | null> {
  try {
    return await imageToDataUrl(src);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[CGI] Asset do PDF não carregou.", { src, error });
    }
    return null;
  }
}

export async function downloadReportPdf({
  reportText,
  companyName,
  result,
  t,
  lang,
}: {
  reportText: string;
  companyName: string;
  result: CgiScoreResult;
  t: (typeof cgiUi)[Language];
  lang: Language;
}) {
  const [{ jsPDF }, coverImage, signatureImage, logoImage] = await Promise.all([
    import("jspdf"),
    optionalImageToDataUrl(reportCover),
    optionalImageToDataUrl(reportSignature),
    optionalImageToDataUrl(footerLogo),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 56;
  const contentWidth = pageWidth - marginX * 2;
  const footerTop = pageHeight - 62;
  let y = 56;

  const drawPageBackground = () => {
    doc.setFillColor(247, 244, 239);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
  };

  const drawFooter = () => {
    doc.setDrawColor(200, 205, 212);
    doc.setLineWidth(0.6);
    doc.line(marginX, footerTop, pageWidth - marginX, footerTop);
    if (logoImage) {
      const logoWidth = 82;
      const logoHeight = logoWidth * (logoImage.height / logoImage.width);
      doc.addImage(
        logoImage.dataUrl,
        "PNG",
        (pageWidth - logoWidth) / 2,
        footerTop + 12,
        logoWidth,
        logoHeight
      );
      return;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(37, 43, 53);
    doc.text("Caldeira Growth", pageWidth / 2, footerTop + 22, { align: "center" });
  };

  const addContentPage = () => {
    drawFooter();
    doc.addPage();
    drawPageBackground();
    y = 56;
  };

  const ensureSpace = (height: number) => {
    if (y + height <= footerTop - 18) return;
    addContentPage();
  };

  const writeWrappedText = (
    text: string,
    options: {
      size?: number;
      style?: "normal" | "bold";
      width?: number;
      indent?: number;
      color?: [number, number, number];
      lineHeight?: number;
      after?: number;
    } = {}
  ) => {
    const size = options.size ?? 10.5;
    const lineHeight = options.lineHeight ?? size * 1.45;
    const indent = options.indent ?? 0;
    const width = options.width ?? contentWidth - indent;
    doc.setFont("helvetica", options.style ?? "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(options.color ?? [37, 43, 53]));
    const lines = doc.splitTextToSize(normalizePdfText(text), width) as string[];
    ensureSpace(lines.length * lineHeight + (options.after ?? 9));
    doc.text(lines, marginX + indent, y, {
      baseline: "top",
      maxWidth: width,
    });
    y += lines.length * lineHeight + (options.after ?? 9);
  };

  const writePdfListItem = (line: string, options: { indent?: number; after?: number } = {}) => {
    const indent = options.indent ?? 12;
    const after = options.after ?? 6;
    const size = 10.5;
    const lineHeight = size * 1.45;
    const width = contentWidth - indent;
    const text = normalizePdfText(line.replace(/^- /, "").replace(/^•\s*/, ""));
    const labelMatch = text.match(/^([^:]{1,90}):\s*(.*)$/);
    const fullText = `• ${text}`;
    const lines = doc.splitTextToSize(fullText, width) as string[];

    ensureSpace(lines.length * lineHeight + after);
    doc.setFontSize(size);
    doc.setTextColor(37, 43, 53);

    if (!labelMatch) {
      doc.setFont("helvetica", "normal");
      doc.text(lines, marginX + indent, y, {
        baseline: "top",
        maxWidth: width,
      });
      y += lines.length * lineHeight + after;
      return;
    }

    const prefix = `• ${labelMatch[1]}:`;
    lines.forEach((wrappedLine, index) => {
      const lineY = y + index * lineHeight;
      if (index === 0 && wrappedLine.startsWith(prefix)) {
        doc.setFont("helvetica", "bold");
        doc.text(prefix, marginX + indent, lineY, { baseline: "top" });
        const prefixWidth = doc.getTextWidth(prefix);
        const suffix = wrappedLine.slice(prefix.length);
        if (suffix) {
          doc.setFont("helvetica", "normal");
          doc.text(suffix, marginX + indent + prefixWidth, lineY, {
            baseline: "top",
          });
        }
        return;
      }
      doc.setFont("helvetica", "normal");
      doc.text(wrappedLine, marginX + indent, lineY, {
        baseline: "top",
        maxWidth: width,
      });
    });
    y += lines.length * lineHeight + after;
  };

  const writeHeading = (text: string, level: 2 | 3 = 2) => {
    const size = level === 2 ? 20 : 14;
    ensureSpace(size * 2.2);
    doc.setFont("times", "bold");
    doc.setFontSize(size);
    doc.setTextColor(46, 51, 64);
    doc.text(normalizePdfText(text.replace(/:$/, "")), marginX, y, {
      baseline: "top",
      maxWidth: contentWidth,
    });
    y += size * 1.45;
  };

  const drawCover = () => {
    doc.setFillColor(51, 66, 87);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    if (coverImage) {
      doc.addImage(coverImage.dataUrl, "PNG", 0, 0, pageWidth, pageHeight);
    }
    doc.setTextColor(245, 247, 248);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("CALDEIRA GROWTH INDEX", marginX, 260, { charSpace: 1.6 });
    doc.setFont("times", "bold");
    doc.setFontSize(34);
    const title = `${t.reportDocTitle} - ${companyName || "Caldeira Growth"}`;
    doc.text(doc.splitTextToSize(normalizePdfText(title), 360), marginX, 290, {
      baseline: "top",
    });
    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.text(normalizePdfText(t.reportSubtitle), marginX, 385, {
      baseline: "top",
      maxWidth: 380,
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const dateLabel = lang === "en" ? "Date" : lang === "es" ? "Fecha" : "Data";
    const reportDate = new Intl.DateTimeFormat(
      lang === "pt" ? "pt-BR" : lang === "es" ? "es-419" : "en",
      { day: "2-digit", month: "long", year: "numeric" }
    ).format(new Date());
    doc.text(`${t.company}: ${normalizePdfText(companyName || "Caldeira Growth")}`, marginX, 690);
    doc.text(`${dateLabel}: ${normalizePdfText(reportDate)}`, marginX, 712);
  };

  const drawFinalScore = () => {
    ensureSpace(118);
    doc.setFillColor(52, 71, 99);
    doc.rect(marginX, y, contentWidth, 106, "F");
    doc.setTextColor(247, 244, 239);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(t.finalScore.toUpperCase(), marginX + 24, y + 24);
    doc.setFont("times", "bold");
    doc.setFontSize(52);
    doc.text(String(result.finalScore), marginX + 24, y + 48, { baseline: "top" });
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text(normalizePdfText(result.level.title), marginX + 160, y + 27, {
      baseline: "top",
      maxWidth: contentWidth - 184,
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const summary = doc.splitTextToSize(
      normalizePdfText(result.level.summary),
      contentWidth - 184
    ) as string[];
    doc.text(summary.slice(0, 3), marginX + 160, y + 58, { baseline: "top" });
    y += 126;
  };

  const drawScoreBars = () => {
    writeHeading(t.scoreByDimension);
    result.dimensionScores.forEach((item) => {
      ensureSpace(34);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(37, 43, 53);
      doc.text(normalizePdfText(item.title), marginX, y, { baseline: "top" });
      doc.text(`${item.score}/100`, pageWidth - marginX, y, {
        align: "right",
        baseline: "top",
      });
      y += 18;
      doc.setFillColor(212, 219, 226);
      doc.roundedRect(marginX, y, contentWidth, 8, 4, 4, "F");
      doc.setFillColor(52, 71, 99);
      doc.roundedRect(
        marginX,
        y,
        contentWidth * Math.max(0, Math.min(100, item.score)) / 100,
        8,
        4,
        4,
        "F"
      );
      y += 22;
    });
    y += 8;
  };

  const drawMethodology = () => {
    const boxPaddingX = 18;
    const boxPaddingY = 16;
    const textWidth = contentWidth - boxPaddingX * 2;
    const paragraphs = t.methodReportBody.map(
      (paragraph) => doc.splitTextToSize(normalizePdfText(paragraph), textWidth) as string[]
    );
    const titleLines = doc.splitTextToSize(
      normalizePdfText(t.methodReportTitle),
      textWidth
    ) as string[];
    const lineHeight = 12.5;
    const boxHeight =
      boxPaddingY * 2 +
      13 +
      titleLines.length * 19 +
      paragraphs.reduce((sum, lines) => sum + lines.length * lineHeight + 8, 0) +
      14;

    ensureSpace(boxHeight + 18);
    doc.setFillColor(239, 235, 228);
    doc.rect(marginX, y, contentWidth, boxHeight, "F");
    doc.setFillColor(52, 71, 99);
    doc.rect(marginX, y, 4, boxHeight, "F");

    let blockY = y + boxPaddingY;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(52, 71, 99);
    doc.text(normalizePdfText(t.methodEyebrow).toUpperCase(), marginX + boxPaddingX, blockY, {
      baseline: "top",
      charSpace: 0.8,
    });
    blockY += 17;

    doc.setFont("times", "bold");
    doc.setFontSize(17);
    doc.setTextColor(46, 51, 64);
    doc.text(titleLines, marginX + boxPaddingX, blockY, { baseline: "top" });
    blockY += titleLines.length * 19 + 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(37, 43, 53);
    paragraphs.forEach((lines) => {
      doc.text(lines, marginX + boxPaddingX, blockY, {
        baseline: "top",
        maxWidth: textWidth,
      });
      blockY += lines.length * lineHeight + 8;
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.setTextColor(52, 71, 99);
    doc.text(normalizePdfText(t.methodSignature), marginX + boxPaddingX, blockY, {
      baseline: "top",
    });
    y += boxHeight + 22;
  };

  const drawReportBody = () => {
    reportText
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .forEach((block) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        if (lines.length === 1 && /:$/.test(lines[0])) {
          writeHeading(lines[0], 3);
          return;
        }
        if (lines.length === 1 && lines[0].length <= 80) {
          writeWrappedText(lines[0], { size: 10.5, style: "normal", after: 8 });
          return;
        }
        if (lines.length > 1 && /:$/.test(lines[0])) {
          writeHeading(lines[0], 3);
          lines.slice(1).forEach((line) => {
            if (line.startsWith("- ")) {
              writePdfListItem(line, { indent: 12, after: 6 });
            } else {
              writeWrappedText(line);
            }
          });
          return;
        }
        if (lines.every((line) => line.startsWith("- "))) {
          lines.forEach((line) => writePdfListItem(line, { indent: 12, after: 6 }));
          y += 6;
          return;
        }
        if (lines[0] === "Denis Caldeira de Almeida") {
          ensureSpace(250);
          if (signatureImage) {
            const signatureWidth = 450;
            const signatureHeight = signatureWidth * (signatureImage.height / signatureImage.width);
            doc.addImage(
              signatureImage.dataUrl,
              "PNG",
              marginX - 105,
              y - 78,
              signatureWidth,
              signatureHeight
            );
            y += 178;
          }
          writeWrappedText(lines.join("\n"), { style: "bold", after: 5 });
          return;
        }
        writeWrappedText(block);
      });
  };

  drawCover();
  doc.addPage();
  drawPageBackground();
  doc.setDrawColor(52, 71, 99);
  doc.setLineWidth(1.2);
  doc.line(marginX, 50, pageWidth - marginX, 50);
  y = 78;
  drawFinalScore();
  drawScoreBars();
  drawMethodology();
  drawReportBody();
  drawFooter();
  doc.save(safePdfFilename(companyName));
}
