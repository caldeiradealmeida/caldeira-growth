import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { cgiUi } from "../config";
import { buildReportBlocks, type ReportBlockItem } from "./reportBlocks";
import {
  buildReportHtml,
  getSubmitErrorMessage,
  measurePdfItemHeight,
  measurePdfItemLeadHeight,
  normalizePdfText,
  PDF_SIGNATURE_WIDTH_PT,
  shouldBreakToKeepTogether,
  WEB_SIGNATURE_WIDTH_PX,
} from "./report";

describe("getSubmitErrorMessage", () => {
  it("maps report persistence outages to a temporary recoverable error", () => {
    const message = getSubmitErrorMessage(
      {
        ok: false,
        error: "report_persistence_unavailable",
        report_status: "report_failed",
        message: "supabase_internal_detail",
      },
      cgiUi.pt
    );

    expect(message).toBe(
      "Não foi possível iniciar a geração do relatório neste momento. Tente novamente em alguns instantes."
    );
    expect(message).toContain("Tente novamente");
    expect(message).not.toContain("supabase_internal_detail");
    expect(message).not.toContain("relatório foi preparado");
  });

  it("maps AI generation failures to a temporary recoverable error", () => {
    const message = getSubmitErrorMessage(
      {
        ok: false,
        error: "report_generation_failed",
        report_status: "report_failed",
      },
      cgiUi.pt
    );

    expect(message).toBe("Não foi possível concluir o parecer neste momento. Tente novamente.");
    expect(message).not.toContain("relatório foi preparado");
  });
});

describe("normalizePdfText", () => {
  it("substitutes the word 'para' for a right-arrow, since standard PDF fonts have no glyph for it", () => {
    // Standard PDF fonts (Helvetica/Times) only cover the WinAnsi/Latin-1
    // range - jsPDF has been observed rendering "→" (U+2192) as the garbled
    // "!'" pair instead. This must never reach doc.text() as a literal "→".
    expect(normalizePdfText("tráfego → diagnóstico → proposta")).toBe(
      "tráfego para diagnóstico para proposta"
    );
  });
});

describe("shouldBreakToKeepTogether", () => {
  it("never breaks for a block bigger than a full page - it must be left to split internally", () => {
    expect(
      shouldBreakToKeepTogether({
        estimatedHeight: 900,
        currentY: 100,
        pageUsableHeight: 700,
        bottomThreshold: 780,
      })
    ).toBe(false);
  });

  it("breaks to a fresh page when a block that fits on one page doesn't fit in what's left of the current one", () => {
    expect(
      shouldBreakToKeepTogether({
        estimatedHeight: 200,
        currentY: 650,
        pageUsableHeight: 700,
        bottomThreshold: 780,
      })
    ).toBe(true);
  });

  it("does not break when the block already fits where it currently is", () => {
    expect(
      shouldBreakToKeepTogether({
        estimatedHeight: 100,
        currentY: 200,
        pageUsableHeight: 700,
        bottomThreshold: 780,
      })
    ).toBe(false);
  });
});

describe("measurePdfItemHeight / measurePdfItemLeadHeight (page-break measurement)", () => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const CONTENT_WIDTH = 500;
  const PAGE_USABLE_HEIGHT = 706; // matches report.ts's footerTop - 18 - 56 for A4
  const BOTTOM_THRESHOLD = 762; // matches report.ts's footerTop - 18 for A4

  it("a section heading's required following height (title + first field) is smaller than the whole item, so it never demands the entire item fit before starting", () => {
    const ritual: ReportBlockItem = {
      number: 1,
      title: "Ritual 1 — Reunião semanal de alinhamento estratégico",
      segments: [
        { label: "Frequência", text: "Semanal, às segundas-feiras pela manhã." },
        { label: "Participantes", text: "CEO, diretor comercial e head de growth." },
        { label: "Indicadores", text: "Pipeline gerado e taxa de conversão de vendas." },
        { label: "Decisão esperada", text: "Ajuste de prioridades comerciais para a semana." },
      ],
      emphasis: true,
    };
    const leadHeight = measurePdfItemLeadHeight(doc, ritual, CONTENT_WIDTH);
    const fullHeight = measurePdfItemHeight(doc, ritual, CONTENT_WIDTH);
    expect(leadHeight).toBeGreaterThan(0);
    expect(leadHeight).toBeLessThan(fullHeight);
  });

  it("moves a small item whole to a fresh page when it doesn't fit here, but lets a page-sized item split internally instead", () => {
    const smallItem: ReportBlockItem = {
      number: 1,
      title: "Gargalo 1 — Baixa clareza de proposta de valor",
      segments: [
        { label: "Sinal observado", text: "Dispersão de oferta observada nas respostas." },
        { label: "Causa provável", text: "Falta de tese explícita de posicionamento." },
        { label: "Impacto estratégico", text: "Menor conversão e dificuldade de precificação." },
      ],
      emphasis: true,
    };
    const smallHeight = measurePdfItemHeight(doc, smallItem, CONTENT_WIDTH);
    expect(smallHeight).toBeLessThan(PAGE_USABLE_HEIGHT);
    expect(
      shouldBreakToKeepTogether({
        estimatedHeight: smallHeight,
        currentY: 680,
        pageUsableHeight: PAGE_USABLE_HEIGHT,
        bottomThreshold: BOTTOM_THRESHOLD,
      })
    ).toBe(true);

    const hugeItem: ReportBlockItem = {
      ...smallItem,
      segments: smallItem.segments.map((segment) => ({
        ...segment,
        text: segment.text.repeat(60),
      })),
    };
    const hugeHeight = measurePdfItemHeight(doc, hugeItem, CONTENT_WIDTH);
    expect(hugeHeight).toBeGreaterThan(PAGE_USABLE_HEIGHT);
    expect(
      shouldBreakToKeepTogether({
        estimatedHeight: hugeHeight,
        currentY: 680,
        pageUsableHeight: PAGE_USABLE_HEIGHT,
        bottomThreshold: BOTTOM_THRESHOLD,
      })
    ).toBe(false);
  });
});

describe("signature sizing (web vs. PDF are independent constants)", () => {
  it("PDF signature width is unchanged - it was already approved at its current size/position", () => {
    expect(PDF_SIGNATURE_WIDTH_PT).toBe(75);
  });

  it("web signature width is exactly 130% of its previous 440px", () => {
    expect(WEB_SIGNATURE_WIDTH_PX).toBe(572);
  });

  it("web and PDF sizes are independent - changing one must never imply the other", () => {
    expect(WEB_SIGNATURE_WIDTH_PX).not.toBe(PDF_SIGNATURE_WIDTH_PT);
  });

  it("the generated report HTML's stylesheet actually uses the web signature constant, not a stray hardcoded pixel value", () => {
    const result = {
      finalScore: 68,
      level: { title: "x", summary: "" },
      diagnostic: "",
      dimensionScores: [],
      attentionPoints: [],
    } as never;
    const lead = { company: "Acme" } as never;
    const html = buildReportHtml(null, lead, result, cgiUi.pt, "pt");
    expect(html).toContain(`.back-cover-signature img { filter: brightness(0) invert(1); height: auto; width: ${WEB_SIGNATURE_WIDTH_PX}px; }`);
    expect(html).not.toContain("width: 440px");
    expect(html).not.toContain("width: 220px");
  });

  it("keeps the web signature+text group centered and vertically aligned, not stuck to the left", () => {
    const result = {
      finalScore: 68,
      level: { title: "x", summary: "" },
      diagnostic: "",
      dimensionScores: [],
      attentionPoints: [],
    } as never;
    const lead = { company: "Acme" } as never;
    const html = buildReportHtml(null, lead, result, cgiUi.pt, "pt");
    expect(html).toContain(
      ".back-cover-signature { align-items: center; display: flex; gap: 14px; justify-content: center; }"
    );
  });
});

describe("'Recomendações finais' orphaned section title (reproduces the confirmed case)", () => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const CONTENT_WIDTH = 500;
  const PAGE_USABLE_HEIGHT = 706; // matches report.ts's footerTop - 18 - 56 for A4
  const BOTTOM_THRESHOLD = 762; // matches report.ts's footerTop - 18 for A4
  const t = cgiUi.pt;

  function buildFinalRecommendationsBlocks() {
    const result = {
      finalScore: 68,
      level: { title: "x", summary: "" },
      diagnostic: "",
      dimensionScores: [],
      attentionPoints: [],
    } as never;
    return buildReportBlocks({
      result,
      t,
      aiReport: {
        final_recommendations: [
          "Recomendação: Estruturar processo comercial mínimo. Prioridade: alta. Próximo passo: mapear etapas do funil atual e nomear um responsável único. Condição de validação: reduzir o ciclo de vendas em pelo menos 20% no próximo trimestre fiscal.",
        ],
      },
    });
  }

  it("computes a heading+lead height that, near the bottom of a page, requires starting a fresh page before drawing the heading", () => {
    const blocks = buildFinalRecommendationsBlocks();
    const heading = blocks.find(
      (block) => block.kind === "heading" && block.text === t.finalRecommendationsTitle
    );
    const numbered = blocks.find((block) => block.kind === "numbered") as {
      items: ReportBlockItem[];
    };
    expect(heading).toBeDefined();
    expect(numbered.items[0]).toBeDefined();

    const headingHeight = 20 * 1.45; // level 2
    const leadHeight = measurePdfItemLeadHeight(doc, numbered.items[0], CONTENT_WIDTH);
    const combinedHeight = headingHeight + leadHeight;

    // The confirmed bug: near the bottom of a page, only the heading fit
    // (reserving a flat minimum), so it got drawn there while "Recomendação
    // 1"'s title and first field were pushed to the next page, orphaning
    // "Recomendações finais" alone at the bottom. Measuring the section
    // title + Recomendação 1's title + first field as one group must call
    // for a page break instead.
    expect(
      shouldBreakToKeepTogether({
        estimatedHeight: combinedHeight,
        currentY: 700, // near the bottom of the content area
        pageUsableHeight: PAGE_USABLE_HEIGHT,
        bottomThreshold: BOTTOM_THRESHOLD,
      })
    ).toBe(true);
  });

  it("does not force a break when there is already enough room", () => {
    const blocks = buildFinalRecommendationsBlocks();
    const numbered = blocks.find((block) => block.kind === "numbered") as {
      items: ReportBlockItem[];
    };
    const headingHeight = 20 * 1.45;
    const leadHeight = measurePdfItemLeadHeight(doc, numbered.items[0], CONTENT_WIDTH);

    expect(
      shouldBreakToKeepTogether({
        estimatedHeight: headingHeight + leadHeight,
        currentY: 100, // near the top of the page - plenty of room
        pageUsableHeight: PAGE_USABLE_HEIGHT,
        bottomThreshold: BOTTOM_THRESHOLD,
      })
    ).toBe(false);
  });
});
