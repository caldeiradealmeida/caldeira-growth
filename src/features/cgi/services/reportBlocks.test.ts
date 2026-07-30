import { describe, expect, it } from "vitest";
import { cgiUi } from "../config";
import { buildReportBlocks, parseLabeledSegments } from "./reportBlocks";

describe("parseLabeledSegments", () => {
  it("splits a labeled-contract string into its individual label/text segments", () => {
    const raw =
      "Título: Foco executivo. Sinal observado: As respostas deste executivo indicam tensão entre ambição e disciplina. Causa provável: a rotina pode estar absorvendo energia demais. Impacto estratégico: há risco de dispersão se a hipótese não for validada.";

    const segments = parseLabeledSegments(raw);

    expect(segments).toEqual([
      { label: "Título", text: "Foco executivo." },
      {
        label: "Sinal observado",
        text: "As respostas deste executivo indicam tensão entre ambição e disciplina.",
      },
      { label: "Causa provável", text: "a rotina pode estar absorvendo energia demais." },
      {
        label: "Impacto estratégico",
        text: "há risco de dispersão se a hipótese não for validada.",
      },
    ]);
  });

  it("falls back to a single unlabeled segment when there is no label contract", () => {
    const segments = parseLabeledSegments(
      "Hipótese 1: validar a leitura do CGI com outras lideranças."
    );
    // Only one label found -> still returns it as a single labeled segment,
    // not split further.
    expect(segments).toHaveLength(1);
    expect(segments[0].text).toContain("validar a leitura do CGI");
  });

  it("returns an unlabeled segment for plain prose with no label contract at all", () => {
    const segments = parseLabeledSegments(
      "As respostas indicam maturidade intermediária em execução."
    );
    expect(segments).toEqual([
      { label: "", text: "As respostas indicam maturidade intermediária em execução." },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseLabeledSegments("")).toEqual([]);
    expect(parseLabeledSegments("   ")).toEqual([]);
  });

  it("splits English labeled items just as well as Portuguese ones (language-agnostic)", () => {
    const raw =
      "Title: Low clarity of value proposition. Observed signal: reduced scores in value proposition understanding. Probable cause: absence of an explicit positioning thesis. Strategic impact: lower conversion and pricing difficulty.";
    const segments = parseLabeledSegments(raw);
    expect(segments.map((s) => s.label)).toEqual([
      "Title",
      "Observed signal",
      "Probable cause",
      "Strategic impact",
    ]);
  });

  it("splits Spanish labeled items just as well as Portuguese ones (language-agnostic)", () => {
    const raw =
      "Título: Baja claridad de la propuesta de valor. Señal observada: puntuaciones reducidas en comprensión de la propuesta de valor. Causa probable: ausencia de una tesis explícita de posicionamiento. Impacto estratégico: menor conversión y dificultad de precificación.";
    const segments = parseLabeledSegments(raw);
    expect(segments.map((s) => s.label)).toEqual([
      "Título",
      "Señal observada",
      "Causa probable",
      "Impacto estratégico",
    ]);
  });
});

describe("buildReportBlocks localization", () => {
  it("uses the localized executive summary / diagnosis headings, not hardcoded Portuguese", () => {
    const result = {
      finalScore: 68,
      level: { id: "structured", title: "x", summary: "" },
      diagnostic: "",
      dimensionScores: [],
      attentionPoints: [],
    } as never;

    for (const lang of ["pt", "en", "es"] as const) {
      const t = cgiUi[lang];
      const blocks = buildReportBlocks({
        result,
        t,
        aiReport: {
          executive_summary: "Summary text.",
          strategic_diagnosis: "Diagnosis text.",
        },
      });
      const headings = blocks
        .filter((block) => block.kind === "heading")
        .map((block) => (block as { text: string }).text);
      expect(headings).toEqual([t.executiveSummaryTitle, t.diagnosis]);
    }
  });
});

describe("buildReportBlocks", () => {
  const t = cgiUi.pt;
  const result = {
    finalScore: 68,
    level: { id: "structured", title: "Crescimento Estruturado", summary: "" },
    diagnostic: "",
    dimensionScores: [
      { dimensionId: "strategy", title: "Estratégia", score: 59, average: 3 },
      { dimensionId: "market", title: "Mercado e Cliente", score: 19, average: 1 },
    ],
    attentionPoints: [],
  } as never;

  it("never joins dimension analysis/implication with a colon (no .: artifact)", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        dimension_reading: [
          {
            dimension: "Estratégia",
            score: 59,
            analysis: "As respostas indicam foco.",
            implication: "O risco é dispersão.",
          },
        ],
      },
    });

    const paragraphTexts = blocks
      .filter((block) => block.kind === "paragraph")
      .map((block) => (block as { text: string }).text);

    expect(paragraphTexts).toContain("As respostas indicam foco.");
    expect(paragraphTexts).toContain("O risco é dispersão.");
    // The old bug produced a single joined string containing ".: " - assert
    // that artifact never appears anywhere in the rendered blocks.
    expect(paragraphTexts.join(" ")).not.toContain(".:");
  });

  it("numbers labeled-contract items and promotes the Título/Ritual/etc. field to the item heading", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        critical_bottlenecks: [
          "Título: Baixa clareza de proposta de valor. Sinal observado: dispersão de oferta. Causa provável: falta de tese explícita. Impacto estratégico: menor conversão.",
          "Título: Máquina de crescimento artesanal. Sinal observado: geração de leads manual. Causa provável: ausência de funil. Impacto estratégico: previsibilidade baixa.",
        ],
      },
    });

    const numberedBlock = blocks.find((block) => block.kind === "numbered") as {
      kind: "numbered";
      items: { number: number; title: string; segments: { label: string; text: string }[] }[];
    };

    expect(numberedBlock.items).toHaveLength(2);
    expect(numberedBlock.items[0].number).toBe(1);
    expect(numberedBlock.items[0].title).toBe(
      "Gargalo 1 — Baixa clareza de proposta de valor"
    );
    expect(numberedBlock.items[0].segments.map((segment) => segment.label)).toEqual([
      "Sinal observado",
      "Causa provável",
      "Impacto estratégico",
    ]);
    expect(numberedBlock.items[1].title).toBe("Gargalo 2 — Máquina de crescimento artesanal");
  });

  it("numbers plain (unlabeled) items like hypotheses without inventing sub-labels", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        hypotheses_to_validate: [
          "A principal trava está na clareza de segmento e proposta de valor.",
          "O CGI tem maior potencial quando segmentado por estágio.",
        ],
      },
    });

    const numberedBlock = blocks.find((block) => block.kind === "numbered") as {
      items: { title: string; segments: unknown[] }[];
    };

    expect(numberedBlock.items[0].title).toBe(
      "Hipótese 1 — A principal trava está na clareza de segmento e proposta de valor"
    );
    expect(numberedBlock.items[0].segments).toHaveLength(0);
    expect(numberedBlock.items[1].title).toBe(
      "Hipótese 2 — O CGI tem maior potencial quando segmentado por estágio"
    );
  });
});
