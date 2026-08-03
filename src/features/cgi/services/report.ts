import footerLogo from "@/assets/brand/Black logo - no background.svg";
import reportSignature from "@/assets/report/assinatura-denis.png";
import reportCover from "@/assets/report/cgi-report-cover.png";
import type { Language } from "@/lib/routing";
import type { CgiScoreResult } from "@/lib/cgiScore";
import { cgiUi } from "../config";
import type { LeadForm } from "../types";
import { buildReportBlocks, type ReportBlock, type ReportBlockItem } from "./reportBlocks";

// Web and PDF signature sizes are deliberately two independent constants,
// not one shared value scaled per output - they're tuned separately for
// each medium's layout. Web is now 645px (+~13% over the prior 572px, per a
// web-only visual polish pass); PDF stays exactly 75pt - it was already
// approved at its current size/position and is untouched here. Both
// preserve the source image's aspect ratio (height is always derived from
// width). The PDF signature is pre-cropped to its visible ink before being
// loaded (see optionalImageToDataUrl's trimTransparentPadding below); the
// web <img> uses the raw asset directly and relies on the negative margins
// on .back-cover-signature img (below) to visually crop the same
// transparent padding instead, so the signature and the contact text read
// as one block rather than two.
export const WEB_SIGNATURE_WIDTH_PX = 645;
export const PDF_SIGNATURE_WIDTH_PT = 75;

export function parseAiReport(value: string): {
  report_title?: string;
  report_subtitle?: string;
  executive_summary?: string;
  methodology_note?: string;
  evidence_summary?: string[] | string;
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
  hypotheses_to_validate?: string[];
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

  if (error === "invalid_professional_content") {
    return t.invalidProfessionalFieldBody;
  }

  if (error === "report_persistence_unavailable") {
    return "Não foi possível iniciar a geração do relatório neste momento. Tente novamente em alguns instantes.";
  }

  if (error === "report_generation_failed") {
    return "Não foi possível concluir o parecer neste momento. Tente novamente.";
  }

  if (error === "report_failed") {
    return "Não foi possível concluir o parecer neste momento. Tente novamente.";
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

const SCROLL_VISUAL_MARGIN_PX = 16;
// If a smooth window.scrollTo hasn't moved the page at all shortly after
// being issued, force an instant jump. element.scrollIntoView/window.scrollTo
// with behavior:"smooth" is known to silently no-op under some browser/tab
// timing conditions (e.g. a backgrounded tab, or a scroll requested from a
// deferred callback) - this guarantees the user is never left stranded on
// the hero with no visible movement.
const SCROLL_START_CHECK_MS = 250;
const FOCUS_POLL_INTERVAL_MS = 100;
const FOCUS_MAX_WAIT_MS = 1500;

export function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function getFixedHeaderHeight(): number {
  const header = document.querySelector("header");
  return header && typeof header.getBoundingClientRect === "function"
    ? header.getBoundingClientRect().height
    : 0;
}

// Absolute document position, not the viewport-relative rect scrollIntoView
// uses internally - computed fresh on every call so it reflects whatever
// just rendered (e.g. a step change committed the same tick). Exported so
// the header-offset/margin math can be unit-tested without needing a full
// DOM + fake-timer harness for the scroll/focus orchestration around it.
export function computeScrollDestination(target: HTMLElement): number {
  const absoluteTop = target.getBoundingClientRect().top + window.scrollY;
  return Math.max(0, absoluteTop - getFixedHeaderHeight() - SCROLL_VISUAL_MARGIN_PX);
}

export function scrollToAssessment(options?: { focusId?: string }) {
  window.setTimeout(() => {
    const target =
      (options?.focusId && document.getElementById(options.focusId)) ||
      document.getElementById("cgi-assessment");
    if (!target) return;

    const destination = computeScrollDestination(target);
    const reducedMotion = prefersReducedMotion();
    const startY = window.scrollY;

    window.scrollTo({ top: destination, behavior: reducedMotion ? "auto" : "smooth" });

    if (!reducedMotion) {
      window.setTimeout(() => {
        const barelyMoved = Math.abs(window.scrollY - startY) < 2;
        const shouldHaveMoved = Math.abs(destination - startY) > 2;
        if (barelyMoved && shouldHaveMoved) {
          window.scrollTo({ top: destination, behavior: "auto" });
        }
      }, SCROLL_START_CHECK_MS);
    }

    if (!options?.focusId) return;

    const focusField = () => {
      document.getElementById(options.focusId!)?.focus({ preventScroll: true });
    };

    if (reducedMotion) {
      focusField();
      return;
    }

    // Focus only once the scroll has actually settled near its destination
    // (or a max wait elapses, as a safety net) - never on a fixed guessed
    // delay, and never before the scroll has had a chance to complete.
    const deadline = Date.now() + FOCUS_MAX_WAIT_MS;
    const pollUntilSettled = () => {
      const settled = Math.abs(window.scrollY - destination) < 2;
      if (settled || Date.now() >= deadline) {
        focusField();
        return;
      }
      window.setTimeout(pollUntilSettled, FOCUS_POLL_INTERVAL_MS);
    };
    window.setTimeout(pollUntilSettled, FOCUS_POLL_INTERVAL_MS);
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
  const textOrList = (value?: string[] | string) => {
    if (Array.isArray(value)) return list(value);
    return typeof value === "string" ? value.trim() : "";
  };
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
          // Analysis and implication are two distinct sentences, not two
          // halves of one "label: value" pair - joining them with ": "
          // produced artifacts like "foco.: O risco…" whenever the analysis
          // already ended in its own period. Keep them on their own lines.
          const bodyLines = [item.analysis, item.implication]
            .filter(Boolean)
            .join("\n  ");
          return [
            `- ${dimensionLabel}${scoreValue ? ` (${scoreValue}/100)` : ""}`,
            bodyLines ? `  ${bodyLines}` : "",
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n")
    : "";

  return [
    aiReport.report_title,
    aiReport.report_subtitle,
    aiReport.methodology_note
      ? `${t.methodologyNoteTitle}:\n${aiReport.methodology_note}`
      : "",
    textOrList(aiReport.evidence_summary)
      ? `${t.evidenceSummaryTitle}:\n${textOrList(aiReport.evidence_summary)}`
      : "",
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
    list(aiReport.hypotheses_to_validate)
      ? `${t.hypothesesTitle}:\n${list(aiReport.hypotheses_to_validate)}`
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

function renderSegmentHtml(segment: { label: string; text: string }) {
  if (!segment.label) return `<p>${escapeHtml(segment.text)}</p>`;
  return `<p class="segment"><span class="segment-label">${escapeHtml(
    segment.label
  )}</span>${escapeHtml(segment.text)}</p>`;
}

function renderReportItemHtml(item: ReportBlockItem) {
  const segmentsHtml = item.segments.map(renderSegmentHtml).join("");
  const titleHtml = item.emphasis
    ? `<h3>${escapeHtml(item.title)}</h3>`
    : `<p class="numbered-item">${escapeHtml(item.title)}</p>`;
  return `<div class="report-item">${titleHtml}${segmentsHtml}</div>`;
}

export function renderReportBlocksHtml(blocks: ReportBlock[]) {
  return blocks
    .map((block) => {
      if (block.kind === "heading") {
        return block.level === 2
          ? `<h2>${escapeHtml(block.text)}</h2>`
          : `<h3>${escapeHtml(block.text)}</h3>`;
      }
      if (block.kind === "paragraph") {
        return `<p>${escapeHtml(block.text)}</p>`;
      }
      return `<div class="report-item-list">${block.items
        .map(renderReportItemHtml)
        .join("")}</div>`;
    })
    .join("\n");
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

export function buildBackCoverHtml(t: (typeof cgiUi)[Language]) {
  const escapedSignature = escapeAttr(reportSignature);
  return `
    <section class="back-cover">
      <div class="back-cover-content">
        <p class="back-cover-eyebrow">Caldeira Growth Index</p>
        <h2>${escapeHtml(t.contact)}</h2>
        <p>${escapeHtml(t.contactText)}</p>
      </div>
      <div class="back-cover-signature">
        <img src="${escapedSignature}" alt="Assinatura Denis Caldeira" />
        <p>
          <strong>Denis Caldeira de Almeida</strong><br />
          ${escapeHtml(t.founderLine)}<br />
          contato@caldeiragrowth.com · www.caldeiragrowth.com
        </p>
      </div>
    </section>
  `;
}

export function buildReportHtml(
  aiReport: ReturnType<typeof parseAiReport>,
  lead: LeadForm,
  result: CgiScoreResult,
  t: (typeof cgiUi)[Language],
  lang: Language
) {
  const blocks = buildReportBlocks({ aiReport, result, t });
  const bodyHtml = renderReportBlocksHtml(blocks);
  const attention = result.attentionPoints
    .map((item) => `<li>${formatReportListItem(`- ${item.title}: ${item.score}/100`)}</li>`)
    .join("");
  const attentionHtml = `<h2>${escapeHtml(t.attentionTitle)}</h2><ul>${attention}</ul>`;
  const backCoverHtml = buildBackCoverHtml(t);
  const finalScoreHtml = buildFinalScoreHtml(result, t.finalScore);
  const scoreBarsHtml = buildScoreBarsHtml(result, t.scoreByDimension);
  const methodologyHtml = buildMethodologyHtml(t);
  const companyName = lead.company;
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
      h2 { font-family: Georgia, serif; font-size: 30px; font-weight: 700; margin: 34px 0 14px; color: #2e3340; break-after: avoid; page-break-after: avoid; }
      h2:first-child { margin-top: 0; }
      h3 { font-family: Georgia, serif; font-size: 20px; font-weight: 700; margin: 24px 0 10px; color: #2e3340; break-after: avoid; page-break-after: avoid; }
      .rule { height: 2px; background: #344763; margin: 0 0 28px; }
      p { font-size: 14px; line-height: 1.5; margin: 0 0 16px; text-align: justify; hyphens: auto; -webkit-hyphens: auto; }
      ul { margin: 0 0 18px 20px; padding: 0; }
      li { font-size: 14px; line-height: 1.5; margin: 0 0 8px; text-align: justify; hyphens: auto; -webkit-hyphens: auto; }
      h2, h3, .score-row, p, li { break-inside: avoid; page-break-inside: avoid; }
      .report-item-list { margin: 0 0 26px; }
      .report-item { break-inside: avoid; page-break-inside: avoid; margin: 0 0 22px; }
      .report-item h3 { margin-top: 0; }
      .numbered-item { font-weight: 700; margin: 0 0 8px; text-align: left; }
      .segment { margin: 0 0 12px; }
      .segment-label { color: #5b6b85; display: block; font-size: 9.5px; font-weight: 700; letter-spacing: .08em; margin: 6px 0 3px; text-transform: uppercase; }
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
      .back-cover { background: #334257; box-sizing: border-box; color: #f5f7f8; display: flex; flex-direction: column; justify-content: space-between; min-height: 297mm; padding: 92px 70px; }
      .back-cover-eyebrow { color: rgba(255,255,255,.72); font-size: 13px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
      .back-cover h2 { color: #ffffff; font-size: 34px; margin: 16px 0 18px; }
      .back-cover-content p { color: rgba(255,255,255,.88); font-size: 16px; max-width: 480px; text-align: left; }
      .back-cover-signature { align-items: center; display: flex; gap: 10px; justify-content: center; }
      /* The source PNG has a large transparent margin around the actual
         signature stroke (the PDF path crops this via trimTransparentPadding
         before embedding it; this <img> renders the raw asset). These
         negative margins crop that same empty space visually so the
         signature and the contact text read as one block instead of two,
         and align-items:center centers against the now ink-hugging box. */
      .back-cover-signature img { filter: brightness(0) invert(1); height: auto; width: ${WEB_SIGNATURE_WIDTH_PX}px; margin: -117px -223px; }
      .back-cover-signature p { color: rgba(255,255,255,.88); font-size: 13px; margin: 0; text-align: left; }
      footer { border-top: 1px solid #c8cdd4; padding-top: 8px; text-align: center; background: #f7f4ef; }
      footer img { width: 112px; height: auto; }
      @media screen { footer { margin: 44px 70px 0; } }
      @media print {
        .screen-toolbar { display: none; }
        body { background: #f7f4ef; }
        .report { box-shadow: none; margin: 0; max-width: none; width: auto; }
        .cover { min-height: 297mm; page-break-after: always; width: 210mm; }
        .page { min-height: auto; padding: 0; }
        .back-cover { break-before: page; page-break-before: always; min-height: 297mm; }
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
        ${attentionHtml}
      </section>
      ${backCoverHtml}
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
    // Standard PDF fonts (Helvetica/Times) only cover the WinAnsi/Latin-1
    // range and have no glyph for "→" (U+2192) - jsPDF has been observed
    // rendering it as the garbled "!'" pair instead. Substitute the word
    // "para" so a sequence phrase like "tráfego → diagnóstico → proposta"
    // stays readable in the PDF. The web/HTML renderer keeps the real "→"
    // (see reportBlocks.ts/normalizeReportText), since browser fonts render
    // it correctly.
    .replace(/\s*→\s*/g, " para ");
  // Note: U+00A0 (non-breaking space) is intentionally NOT normalized
  // away here - it glues the last two words of item titles together so
  // a line wrap never strands a single short word alone (see
  // reportBlocks.ts/preventOrphanWord). It is a valid WinAnsi character
  // and renders identically to a plain space in jsPDF base fonts.
}

// --- PDF pagination measurement (pure, exported for testing) --------------
//
// Only the two jsPDF methods actually needed for text-wrapping measurement -
// narrow on purpose so these functions can be exercised with a real jsPDF
// document in a plain Node test, without any of downloadReportPdf's DOM/
// canvas/image dependencies.
type PdfTextMeasurer = {
  setFontSize: (size: number) => unknown;
  splitTextToSize: (text: string, width: number) => string[];
};

export function measureWrappedLineCount(
  doc: PdfTextMeasurer,
  text: string,
  size: number,
  width: number
): number {
  doc.setFontSize(size);
  return doc.splitTextToSize(normalizePdfText(text), width).length;
}

// Mirrors writeSegment's exact layout math (see below): an unlabeled segment
// is just a wrapped body paragraph; a labeled one adds the label's own
// fixed-height line above it.
export function measurePdfSegmentHeight(
  doc: PdfTextMeasurer,
  segment: { label: string; text: string },
  contentWidth: number
): number {
  if (!segment.label) {
    const lines = measureWrappedLineCount(doc, segment.text, 10.5, contentWidth);
    return lines * (10.5 * 1.45) + 8;
  }
  const bodyLines = measureWrappedLineCount(doc, segment.text, 10.5, contentWidth);
  return 15 + bodyLines * (10.5 * 1.45) + 10;
}

// Mirrors writeReportItem's exact layout math: title height plus every
// segment's height plus the item's own trailing gap.
export function measurePdfItemHeight(
  doc: PdfTextMeasurer,
  item: ReportBlockItem,
  contentWidth: number
): number {
  const size = item.emphasis ? 12.5 : 10.5;
  const titleLines = measureWrappedLineCount(doc, item.title, size, contentWidth);
  const titleHeight = titleLines * size * 1.3 + 8;
  const segmentsHeight = item.segments.reduce(
    (sum, segment) => sum + measurePdfSegmentHeight(doc, segment, contentWidth),
    0
  );
  return titleHeight + segmentsHeight + 6;
}

// Title height plus just the first field - used to decide whether a section
// heading has enough room to start its first item, without requiring the
// whole (possibly much longer) item to fit.
export function measurePdfItemLeadHeight(
  doc: PdfTextMeasurer,
  item: ReportBlockItem,
  contentWidth: number
): number {
  const size = item.emphasis ? 12.5 : 10.5;
  const titleLines = measureWrappedLineCount(doc, item.title, size, contentWidth);
  const titleHeight = titleLines * size * 1.3 + 8;
  const firstSegmentHeight = item.segments[0]
    ? measurePdfSegmentHeight(doc, item.segments[0], contentWidth)
    : 0;
  return titleHeight + firstSegmentHeight;
}

// A block (item, or heading + its first item's lead) is moved to a fresh
// page only when it actually fits within a full page's usable height and
// doesn't fit in what's left of the current one - never for a block bigger
// than a page (that still breaks internally) and never adding blank space
// beyond what already didn't fit.
export function shouldBreakToKeepTogether({
  estimatedHeight,
  currentY,
  pageUsableHeight,
  bottomThreshold,
}: {
  estimatedHeight: number;
  currentY: number;
  pageUsableHeight: number;
  bottomThreshold: number;
}): boolean {
  if (estimatedHeight > pageUsableHeight) return false;
  return currentY + estimatedHeight > bottomThreshold;
}

type ReportImage = {
  dataUrl: string;
  width: number;
  height: number;
};

function findOpaqueBoundingBox(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const { data } = context.getImageData(0, 0, width, height);
  const alphaThreshold = 10;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export async function imageToDataUrl(
  src: string,
  options: { trimTransparentPadding?: boolean } = {}
): Promise<ReportImage> {
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

  if (options.trimTransparentPadding) {
    // Some brand assets (e.g. the signature PNG) are exported on a large
    // canvas with mostly transparent padding around the actual artwork,
    // which makes them render tiny at any reasonable bounding-box size.
    // Crop to the actual opaque content (plus a small margin) so sizing it
    // in the PDF/HTML actually controls its visible size.
    const box = findOpaqueBoundingBox(context, canvas.width, canvas.height);
    if (box) {
      const margin = Math.round(Math.max(box.width, box.height) * 0.06);
      const cropX = Math.max(0, box.x - margin);
      const cropY = Math.max(0, box.y - margin);
      const cropWidth = Math.min(canvas.width - cropX, box.width + margin * 2);
      const cropHeight = Math.min(canvas.height - cropY, box.height + margin * 2);
      const trimmed = document.createElement("canvas");
      trimmed.width = cropWidth;
      trimmed.height = cropHeight;
      const trimmedContext = trimmed.getContext("2d");
      if (trimmedContext) {
        trimmedContext.drawImage(
          canvas,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );
        return {
          dataUrl: trimmed.toDataURL("image/png"),
          width: trimmed.width,
          height: trimmed.height,
        };
      }
    }
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

export async function optionalImageToDataUrl(
  src: string,
  options: { trimTransparentPadding?: boolean } = {}
): Promise<ReportImage | null> {
  try {
    return await imageToDataUrl(src, options);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[CGI] Asset do PDF não carregou.", { src, error });
    }
    return null;
  }
}

export async function downloadReportPdf({
  aiReport,
  lead,
  result,
  t,
  lang,
}: {
  aiReport: ReturnType<typeof parseAiReport>;
  lead: LeadForm;
  result: CgiScoreResult;
  t: (typeof cgiUi)[Language];
  lang: Language;
}) {
  const companyName = lead.company;
  const [{ jsPDF }, coverImage, signatureImage, logoImage] = await Promise.all([
    import("jspdf"),
    optionalImageToDataUrl(reportCover),
    optionalImageToDataUrl(reportSignature, { trimTransparentPadding: true }),
    optionalImageToDataUrl(footerLogo),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  // Slightly narrower margins than before to widen the useful text column,
  // one of the concrete PDF-quality asks (wider column reduces the ragged/
  // gappy look that plain justification alone can create).
  const marginX = 48;
  const contentWidth = pageWidth - marginX * 2;
  const footerTop = pageHeight - 62;
  // Minimum trailing space a heading/item title must be able to share a
  // page with before it's allowed to start - prevents an orphaned title at
  // the bottom of a page with its own content pushed to the next one.
  const KEEP_WITH_NEXT_MIN = 64;
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

  // Like ensureSpace, but also requires room for a minimum amount of
  // following content on the same page - used before headings/item titles
  // so a title never gets stranded alone at the bottom of a page with its
  // own content pushed to the next one.
  const ensureSpaceWithFollowing = (height: number, followingMinHeight: number) => {
    if (y + height + followingMinHeight <= footerTop - 18) return;
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
      justify?: boolean;
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
    // Justify body copy (jsPDF supports "justify" natively on an array of
    // pre-wrapped lines, and leaves the final line of the block ragged as
    // usual) - single-line text just renders left-aligned either way.
    const justify = options.justify ?? lines.length > 1;
    // charSpace is a persistent jsPDF graphics-state property, not a
    // one-shot text() option - without resetting it here explicitly, body
    // copy written right after a letter-spaced segment label (see
    // writeSegment below) would silently inherit that label's spacing.
    doc.text(lines, marginX + indent, y, {
      baseline: "top",
      maxWidth: width,
      align: justify ? "justify" : "left",
      charSpace: 0,
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
        charSpace: 0,
      });
      y += lines.length * lineHeight + after;
      return;
    }

    const prefix = `• ${labelMatch[1]}:`;
    lines.forEach((wrappedLine, index) => {
      const lineY = y + index * lineHeight;
      if (index === 0 && wrappedLine.startsWith(prefix)) {
        doc.setFont("helvetica", "bold");
        doc.text(prefix, marginX + indent, lineY, { baseline: "top", charSpace: 0 });
        const prefixWidth = doc.getTextWidth(prefix);
        const suffix = wrappedLine.slice(prefix.length);
        if (suffix) {
          doc.setFont("helvetica", "normal");
          doc.text(suffix, marginX + indent + prefixWidth, lineY, {
            baseline: "top",
            charSpace: 0,
          });
        }
        return;
      }
      doc.setFont("helvetica", "normal");
      doc.text(wrappedLine, marginX + indent, lineY, {
        baseline: "top",
        maxWidth: width,
        charSpace: 0,
      });
    });
    y += lines.length * lineHeight + after;
  };

  const writeHeading = (text: string, level: 2 | 3 = 2, followingMinHeight = KEEP_WITH_NEXT_MIN) => {
    const size = level === 2 ? 20 : 14;
    ensureSpaceWithFollowing(size * 2.2, followingMinHeight);
    doc.setFont("times", "bold");
    doc.setFontSize(size);
    doc.setTextColor(46, 51, 64);
    doc.text(normalizePdfText(text.replace(/:$/, "")), marginX, y, {
      baseline: "top",
      maxWidth: contentWidth,
      charSpace: 0,
    });
    y += size * 1.45;
  };

  // --- Conservative "keep together" page-break helpers --------------------
  //
  // A section heading must stay with at least the start of its first item,
  // an item's own title must stay with at least its first field, and an
  // item that fits entirely on one page is moved there whole rather than
  // split across two - but only when it actually fits within a full page's
  // usable height; an item bigger than that still breaks internally exactly
  // as before. These only ever move content that already didn't fit where
  // it was - never add blank space beyond what naturally didn't fit. The
  // pure measurement/decision math lives in standalone functions below
  // (exported for testing); these closures just supply this document's
  // doc/contentWidth/y and perform the actual page-break side effect.
  const PAGE_USABLE_HEIGHT = footerTop - 18 - 56;

  const wrappedLineCount = (text: string, size: number, width: number) =>
    measureWrappedLineCount(doc, text, size, width);

  const measureSegmentHeight = (segment: { label: string; text: string }) =>
    measurePdfSegmentHeight(doc, segment, contentWidth);

  const measureItemHeight = (item: ReportBlockItem) =>
    measurePdfItemHeight(doc, item, contentWidth);

  const measureItemLeadHeight = (item: ReportBlockItem) =>
    measurePdfItemLeadHeight(doc, item, contentWidth);

  const keepTogetherIfFits = (estimatedHeight: number) => {
    if (
      shouldBreakToKeepTogether({
        estimatedHeight,
        currentY: y,
        pageUsableHeight: PAGE_USABLE_HEIGHT,
        bottomThreshold: footerTop - 18,
      })
    ) {
      addContentPage();
    }
  };

  const writeSegment = (segment: { label: string; text: string }) => {
    if (!segment.label) {
      writeWrappedText(segment.text, { size: 10.5, after: 8 });
      return;
    }
    ensureSpaceWithFollowing(13, 16);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(91, 107, 133);
    doc.text(normalizePdfText(segment.label).toUpperCase(), marginX, y, {
      baseline: "top",
      charSpace: 0.5,
    });
    y += 11;
    writeWrappedText(segment.text, { size: 10.5, after: 10 });
  };

  const writeReportItem = (item: ReportBlockItem) => {
    // If the whole item fits on one page, move it there entirely instead of
    // starting it here and splitting it across two pages. An item bigger
    // than a full page is left alone here and breaks internally below,
    // exactly as before.
    keepTogetherIfFits(measureItemHeight(item));
    const size = item.emphasis ? 12.5 : 10.5;
    const font = item.emphasis ? "times" : "helvetica";
    doc.setFontSize(size);
    const titleLines = doc.splitTextToSize(normalizePdfText(item.title), contentWidth) as string[];
    const firstFieldHeight = item.segments[0]
      ? measureSegmentHeight(item.segments[0])
      : KEEP_WITH_NEXT_MIN;
    ensureSpaceWithFollowing(titleLines.length * size * 1.3 + 8, firstFieldHeight);
    doc.setFont(font, "bold");
    doc.setFontSize(size);
    doc.setTextColor(46, 51, 64);
    doc.text(titleLines, marginX, y, { baseline: "top", maxWidth: contentWidth, charSpace: 0 });
    y += titleLines.length * size * 1.3 + 8;
    item.segments.forEach(writeSegment);
    y += 6;
  };

  const writeReportBlocks = (blocks: ReportBlock[]) => {
    blocks.forEach((block, index) => {
      if (block.kind === "heading") {
        // A section heading must stay with at least the start of its first
        // item (title + first field), not just a generic minimum - so it's
        // never left alone with the whole item pushed to the next page.
        const next = blocks[index + 1];
        const followingMinHeight =
          next?.kind === "numbered" && next.items[0]
            ? measureItemLeadHeight(next.items[0])
            : KEEP_WITH_NEXT_MIN;
        // "Recomendações finais" gets an explicit, additional check: measure
        // the section title + Recomendação 1's title + its first field
        // (label and content) as one group, and start a fresh page before
        // drawing the heading at all if that group doesn't fit in what's
        // left here - rather than only reserving a following minimum. Other
        // sections keep only the generic check above.
        if (
          block.text === t.finalRecommendationsTitle &&
          next?.kind === "numbered" &&
          next.items[0]
        ) {
          const headingHeight = (block.level === 2 ? 20 : 14) * 1.45;
          keepTogetherIfFits(headingHeight + followingMinHeight);
        }
        writeHeading(block.text, block.level, followingMinHeight);
        return;
      }
      if (block.kind === "paragraph") {
        writeWrappedText(block.text, { size: 10.5, after: 9 });
        return;
      }
      block.items.forEach(writeReportItem);
    });
  };

  const drawBackCover = () => {
    // Close out the last content page's footer, then start a fresh page
    // with its own deliberate navy closing design (no standard footer/rule)
    // instead of trailing off into mostly-empty space.
    drawFooter();
    doc.addPage();
    doc.setFillColor(51, 66, 87);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setTextColor(245, 247, 248);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("CALDEIRA GROWTH INDEX", marginX, 96, { charSpace: 1.6 });
    doc.setFont("times", "bold");
    doc.setFontSize(30);
    doc.text(doc.splitTextToSize(normalizePdfText(t.contact), 420), marginX, 132, {
      baseline: "top",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12.5);
    doc.setTextColor(230, 233, 238);
    const contactLines = doc.splitTextToSize(normalizePdfText(t.contactText), 440) as string[];
    doc.text(contactLines, marginX, 190, { baseline: "top", maxWidth: 440, lineHeightFactor: 1.5 });

    const cardY = pageHeight - 220;
    const cardHeight = 160;
    const textX = marginX + 190;
    const textWidth = contentWidth - 190 - 24;
    doc.setFillColor(247, 244, 239);
    doc.rect(marginX, cardY, contentWidth, cardHeight, "F");
    if (signatureImage) {
      const signatureWidth = PDF_SIGNATURE_WIDTH_PT;
      const signatureHeight = signatureWidth * (signatureImage.height / signatureImage.width);
      doc.addImage(
        signatureImage.dataUrl,
        "PNG",
        marginX + 24,
        cardY + (cardHeight - signatureHeight) / 2,
        signatureWidth,
        signatureHeight
      );
    }
    let cardTextY = cardY + 48;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(37, 43, 53);
    doc.text("Denis Caldeira de Almeida", textX, cardTextY, { baseline: "top", maxWidth: textWidth });
    cardTextY += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const founderLines = doc.splitTextToSize(normalizePdfText(t.founderLine), textWidth) as string[];
    doc.text(founderLines, textX, cardTextY, { baseline: "top", maxWidth: textWidth });
    cardTextY += founderLines.length * 12 + 6;
    const contactLine = doc.splitTextToSize(
      "contato@caldeiragrowth.com · www.caldeiragrowth.com",
      textWidth
    ) as string[];
    doc.text(contactLine, textX, cardTextY, { baseline: "top", maxWidth: textWidth });
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

  const drawAttentionPoints = () => {
    if (!result.attentionPoints.length) return;
    const listLines = result.attentionPoints.map((item) =>
      wrappedLineCount(`• ${item.title}: ${item.score}/100`, 10.5, contentWidth - 12)
    );
    const listHeight = listLines.reduce((sum, lines) => sum + lines * (10.5 * 1.45) + 6, 0);
    // This whole block (heading + all 3 points) is always small - move it
    // together rather than leaving the heading alone if it doesn't fit here.
    keepTogetherIfFits(20 * 1.45 + listHeight);
    writeHeading(t.attentionTitle, 2, listLines[0] * (10.5 * 1.45) + 6);
    result.attentionPoints.forEach((item) =>
      writePdfListItem(`- ${item.title}: ${item.score}/100`, { indent: 12, after: 6 })
    );
    y += 6;
  };

  const blocks = buildReportBlocks({ aiReport, result, t });

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
  writeReportBlocks(blocks);
  drawAttentionPoints();
  drawBackCover();
  doc.save(safePdfFilename(companyName));
}
