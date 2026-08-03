import { describe, expect, it } from "vitest";
import { cgiUi, type ReportFieldKey } from "../config";
import {
  buildReportBlocks,
  normalizeReportText,
  stripHypothesisPrefix,
} from "./reportBlocks";

const NBSP = " ";
const stripNbsp = (value: string) => value.replace(new RegExp(NBSP, "g"), " ");

function numberedItems(blocks: ReturnType<typeof buildReportBlocks>, afterHeading: string) {
  const headingIndex = blocks.findIndex(
    (block) => block.kind === "heading" && block.text === afterHeading
  );
  const block = blocks[headingIndex + 1] as {
    kind: "numbered";
    items: { number: number; title: string; segments: { label: string; text: string }[] }[];
  };
  return block.items;
}

describe("normalizeReportText", () => {
  it("repairs the corrupted arrow artifact ('!' + curly/straight quote) back to a plain arrow", () => {
    expect(normalizeReportText("tráfego !’ diagnóstico !’ debrief executivo !’ proposta")).toBe(
      "tráfego → diagnóstico → debrief executivo → proposta"
    );
    expect(normalizeReportText("tráfego !' diagnóstico")).toBe("tráfego → diagnóstico");
  });

  it("leaves an already-clean arrow as-is", () => {
    expect(normalizeReportText("tráfego → diagnóstico → proposta")).toBe(
      "tráfego → diagnóstico → proposta"
    );
  });

  it("normalizes other arrow-like variants to a plain arrow", () => {
    expect(normalizeReportText("A ➜ B")).toBe("A → B");
    expect(normalizeReportText("A ⇒ B")).toBe("A → B");
    expect(normalizeReportText("A -> B")).toBe("A → B");
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
      { dimensionId: "strategy", title: "Estratégia", score: 72, average: 3 },
      { dimensionId: "market", title: "Mercado e Cliente", score: 65, average: 3 },
      { dimensionId: "growthMachine", title: "Máquina de Crescimento", score: 59, average: 3 },
      { dimensionId: "execution", title: "Execução e Gestão", score: 48, average: 2 },
      { dimensionId: "leadership", title: "Liderança e Cultura de Crescimento", score: 55, average: 3 },
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
    expect(paragraphTexts.join(" ")).not.toContain(".:");
  });

  it("capitalizes a paragraph that came back starting with a lowercase letter", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        executive_summary: "a empresa demonstra repertório técnico elevado.",
      },
    });
    const paragraph = blocks.find((block) => block.kind === "paragraph") as { text: string };
    expect(paragraph.text).toBe("A empresa demonstra repertório técnico elevado.");
  });

  it("always uses the five canonical dimensions, in fixed order, and never the AI's own dimension text or score - even if the AI mislabels or duplicates one", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        dimension_reading: [
          { dimension: "Estratégia", score: 72, analysis: "Análise 1.", implication: "Implicação 1." },
          { dimension: "Mercado e Cliente", score: 65, analysis: "Análise 2.", implication: "Implicação 2." },
          // The model mislabels this one as "Máquina de Crescimento" twice
          // and never mentions "Execução e Gestão" by name - exactly the
          // confirmed bug. The canonical dimension name must still be used,
          // driven by position, not by this text.
          { dimension: "Máquina de Crescimento", score: 59, analysis: "Análise 3.", implication: "Implicação 3." },
          { dimension: "Máquina de Crescimento", score: 48, analysis: "Análise 4.", implication: "Implicação 4." },
          { dimension: "Liderança e Cultura de Crescimento", score: 55, analysis: "Análise 5.", implication: "Implicação 5." },
        ],
      },
    });

    const headings = blocks
      .filter((block) => block.kind === "heading" && block.level === 3)
      .map((block) => (block as { text: string }).text);

    expect(headings).toEqual([
      "Estratégia (72/100)",
      "Mercado e Cliente (65/100)",
      "Máquina de Crescimento (59/100)",
      "Execução e Gestão (48/100)",
      "Liderança e Cultura de Crescimento (55/100)",
    ]);
    // "Máquina de Crescimento" must appear exactly once, not twice.
    expect(headings.filter((heading) => heading.startsWith("Máquina de Crescimento"))).toHaveLength(1);
    expect(headings.some((heading) => heading.startsWith("Execução e Gestão"))).toBe(true);
  });

  it("splits a gargalo into a short title plus its three canonical fields, even without periods between clauses", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        critical_bottlenecks: [
          "Título: Baixa clareza de proposta de valor Sinal observado: dispersão de oferta observada nas respostas Causa provável: falta de tese explícita de posicionamento Impacto estratégico: menor conversão e dificuldade de precificação",
        ],
      },
    });

    const items = numberedItems(blocks, t.criticalBottlenecksTitle);
    expect(items).toHaveLength(1);
    expect(stripNbsp(items[0].title)).toBe("Gargalo 1 — Baixa clareza de proposta de valor");
    expect(items[0].title).not.toContain("Sinal observado");
    expect(items[0].title).not.toContain("Causa provável");
    expect(items[0].segments.map((segment) => segment.label)).toEqual([
      "Sinal observado",
      "Causa provável",
      "Impacto estratégico",
    ]);
    expect(items[0].segments[0].text).toBe("Dispersão de oferta observada nas respostas");
  });

  it("splits a gargalo correctly when properly period-delimited too", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        critical_bottlenecks: [
          "Título: Máquina de crescimento artesanal. Sinal observado: geração de leads manual. Causa provável: ausência de funil. Impacto estratégico: previsibilidade baixa.",
        ],
      },
    });
    const items = numberedItems(blocks, t.criticalBottlenecksTitle);
    expect(stripNbsp(items[0].title)).toBe("Gargalo 1 — Máquina de crescimento artesanal");
    expect(items[0].segments.map((segment) => segment.label)).toEqual([
      "Sinal observado",
      "Causa provável",
      "Impacto estratégico",
    ]);
  });

  it("splits an aposta into title + AÇÃO PRIORITÁRIA / RESULTADO ESPERADO / HORIZONTE", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        strategic_bets: [
          "Título: Expandir para novo segmento. Ação prioritária: validar oferta com 10 clientes piloto. Resultado esperado: confirmação de encaixe de mercado. Horizonte: 90 dias.",
        ],
      },
    });
    const items = numberedItems(blocks, t.strategicBetsTitle);
    expect(stripNbsp(items[0].title)).toBe("Aposta 1 — Expandir para novo segmento");
    expect(items[0].segments.map((segment) => segment.label)).toEqual([
      "Ação prioritária",
      "Resultado esperado",
      "Horizonte",
    ]);
  });

  it("splits a renúncia into title + O QUE DEIXAR DE FAZER / RECURSO OU CAPACIDADE PROTEGIDA / RACIONAL ESTRATÉGICO", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        renunciations: [
          "Escolha: Parar de atender clientes fora do perfil ideal. O que deixar de fazer: propostas customizadas para leads pequenos. Recurso ou capacidade protegida: tempo do time comercial sênior. Racional estratégico: foco em contas de maior potencial.",
        ],
      },
    });
    const items = numberedItems(blocks, t.renunciationsTitle);
    expect(stripNbsp(items[0].title)).toBe("Renúncia 1 — Parar de atender clientes fora do perfil ideal");
    expect(items[0].segments.map((segment) => segment.label)).toEqual([
      "O que deixar de fazer",
      "Recurso ou capacidade protegida",
      "Racional estratégico",
    ]);
  });

  it("splits a ritual into title plus all five canonical blocks, even without periods between clauses", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        governance_system: [
          "Ritual: Reunião semanal de alinhamento estratégico entre diretoria e liderança comercial Frequência: semanal, às segundas-feiras pela manhã Participantes: CEO, diretor comercial e head de growth Indicadores: pipeline gerado, taxa de conversão e ciclo de vendas Decisão esperada: ajuste de prioridades comerciais para a semana",
        ],
      },
    });
    const items = numberedItems(blocks, t.governanceTitle);
    expect(stripNbsp(items[0].title)).toBe(
      "Ritual 1 — Reunião semanal de alinhamento estratégico entre diretoria e liderança comercial"
    );
    expect(items[0].segments.map((segment) => segment.label)).toEqual([
      "Frequência",
      "Participantes",
      "Indicadores",
      "Decisão esperada",
    ]);
    expect(items[0].segments).toHaveLength(5 - 1);
  });

  it("splits a recomendação into title + PRIORIDADE / PRÓXIMO PASSO / CONDIÇÃO DE VALIDAÇÃO", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        final_recommendations: [
          "Recomendação: Estruturar processo comercial mínimo. Prioridade: alta. Próximo passo: mapear etapas do funil atual. Condição de validação: reduzir ciclo de vendas em 20% no próximo trimestre.",
        ],
      },
    });
    const items = numberedItems(blocks, t.finalRecommendationsTitle);
    expect(stripNbsp(items[0].title)).toBe("Recomendação 1 — Estruturar processo comercial mínimo");
    expect(items[0].segments.map((segment) => segment.label)).toEqual([
      "Prioridade",
      "Próximo passo",
      "Condição de validação",
    ]);
  });

  it("renders a hypothesis with only its ordinal in the title and the entire sentence as normal-weight body - never extracting a title from it", () => {
    const longHypothesis =
      "A principal alavanca de crescimento está na clareza da proposta de valor para o segmento-alvo, que precisa ser validada com os próximos dez clientes antes de qualquer investimento adicional em aquisição paga.";
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        hypotheses_to_validate: [longHypothesis, "Segunda hipótese, também deve ficar íntegra."],
      },
    });
    const items = numberedItems(blocks, t.hypothesesTitle);
    expect(items[0].title).toBe("Hipótese 1");
    expect(items[0].segments).toEqual([{ label: "", text: capitalize(longHypothesis) }]);
    expect(items[1].title).toBe("Hipótese 2");
    expect(items[1].segments[0].text).toContain("Segunda hipótese");

    function capitalize(value: string) {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
  });

  it("strips a redundant 'Hipótese:' prefix from the body without extracting any additional title", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        hypotheses_to_validate: [
          "Hipótese: A maior alavanca é a clareza de segmento.",
          "Hypothesis: The main lever is segment clarity.",
        ],
      },
    });
    const items = numberedItems(blocks, t.hypothesesTitle);
    expect(items[0].title).toBe("Hipótese 1");
    expect(items[0].segments[0].text).not.toMatch(/^Hip[oó]tese\s*:/i);
    expect(items[0].segments[0].text).toBe("A maior alavanca é a clareza de segmento.");
    expect(items[1].segments[0].text).not.toMatch(/^Hypothesis\s*:/i);
    expect(items[1].segments[0].text).toBe("The main lever is segment clarity.");
    // An empty segment label is what makes the renderer (report.ts) draw the
    // body as a plain, non-bold paragraph - only item.title ("Hipótese N")
    // ever gets the bold/heading treatment.
    expect(items[0].segments[0].label).toBe("");
    expect(items[1].segments[0].label).toBe("");
  });

  it("keeps the last two words of an item title glued with a non-breaking space, to avoid an orphaned last word", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        critical_bottlenecks: [
          "Título: Baixa clareza de proposta de valor. Sinal observado: x. Causa provável: y. Impacto estratégico: z.",
        ],
      },
    });
    const items = numberedItems(blocks, t.criticalBottlenecksTitle);
    expect(items[0].title).toContain(`de${NBSP}valor`);
    expect(items[0].title.includes("de valor")).toBe(false);
  });

  it("never renders a labeled-contract item's field content as part of the (bold) title, for any of the five canonical sections", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        critical_bottlenecks: ["Título: X. Sinal observado: aaa. Causa provável: bbb. Impacto estratégico: ccc."],
        strategic_bets: ["Título: X. Ação prioritária: aaa. Resultado esperado: bbb. Horizonte: ccc."],
        renunciations: ["Escolha: X. O que deixar de fazer: aaa. Recurso ou capacidade protegida: bbb. Racional estratégico: ccc."],
        governance_system: ["Ritual: X. Frequência: aaa. Participantes: bbb. Indicadores: ccc. Decisão esperada: ddd."],
        final_recommendations: ["Recomendação: X. Prioridade: aaa. Próximo passo: bbb. Condição de validação: ccc."],
      },
    });

    const numberedBlocks = blocks.filter((block) => block.kind === "numbered") as {
      items: { title: string; segments: { label: string; text: string }[] }[];
    }[];

    for (const block of numberedBlocks) {
      for (const item of block.items) {
        for (const segment of item.segments) {
          expect(item.title).not.toContain(segment.text);
        }
      }
    }
  });

  it("keeps evidence items as a single unlabeled, non-emphasis line", () => {
    const blocks = buildReportBlocks({
      result,
      t,
      aiReport: {
        evidence_summary: ["Score geral de 68/100, na faixa de crescimento estruturado."],
      },
    });
    const items = numberedItems(blocks, t.evidenceSummaryTitle);
    expect(items[0].emphasis).toBe(false);
    expect(items[0].segments).toEqual([]);
    expect(items[0].title).toContain("Score geral de 68/100");
  });
});

const MINIMAL_RESULT = {
  finalScore: 68,
  level: { id: "structured", title: "x", summary: "" },
  diagnostic: "",
  dimensionScores: [],
  attentionPoints: [],
} as never;

// Every field-contract section, with its raw AI text always written using
// the pt-BR contract labels (api/cgi-assessment.ts's prompt hands the model
// these labels literally, in Portuguese, regardless of report language -
// see the investigation notes in reportBlocks.ts). This is deliberately the
// worst case: it proves the renderer corrects the label language even when
// the raw text itself never varies.
const SECTION_FIXTURES: Array<{
  field: "critical_bottlenecks" | "strategic_bets" | "renunciations" | "governance_system" | "final_recommendations";
  titleKey: keyof (typeof cgiUi)["pt"];
  raw: string;
  keys: ReportFieldKey[];
}> = [
  {
    field: "critical_bottlenecks",
    titleKey: "criticalBottlenecksTitle",
    raw: "Título: Baixa clareza de proposta de valor. Sinal observado: dispersão de oferta observada. Causa provável: falta de tese explícita de posicionamento. Impacto estratégico: menor conversão e dificuldade de precificação.",
    keys: ["observedSignal", "probableCause", "strategicImpact"],
  },
  {
    field: "strategic_bets",
    titleKey: "strategicBetsTitle",
    raw: "Título: Expandir para novo segmento. Ação prioritária: validar oferta com 10 clientes piloto. Resultado esperado: confirmação de encaixe de mercado. Horizonte: 90 dias.",
    keys: ["priorityAction", "expectedResult", "horizon"],
  },
  {
    field: "renunciations",
    titleKey: "renunciationsTitle",
    raw: "Escolha: Parar de atender clientes fora do perfil ideal. O que deixar de fazer: propostas customizadas para leads pequenos. Recurso ou capacidade protegida: tempo do time comercial sênior. Racional estratégico: foco em contas de maior potencial.",
    keys: ["whatToStop", "protectedResource", "strategicRationale"],
  },
  {
    field: "governance_system",
    titleKey: "governanceTitle",
    raw: "Ritual: Reunião semanal de alinhamento estratégico. Frequência: semanal, às segundas-feiras. Participantes: CEO, diretor comercial e head de growth. Indicadores: pipeline gerado e taxa de conversão. Decisão esperada: ajuste de prioridades comerciais.",
    keys: ["frequency", "participants", "indicators", "expectedDecision"],
  },
  {
    field: "final_recommendations",
    titleKey: "finalRecommendationsTitle",
    raw: "Recomendação: Estruturar processo comercial mínimo. Prioridade: alta. Próximo passo: mapear etapas do funil atual. Condição de validação: reduzir ciclo de vendas em 20% no próximo trimestre.",
    keys: ["priority", "nextStep", "validationCondition"],
  },
];

describe("field labels are localized per report language, not hardcoded Portuguese", () => {
  for (const fixture of SECTION_FIXTURES) {
    it.each(["pt", "en", "es"] as const)(
      `renders ${fixture.field} labels in the report's own language (%s), even though the raw text always uses the pt-BR contract`,
      (lang) => {
        const t = cgiUi[lang];
        const blocks = buildReportBlocks({
          result: MINIMAL_RESULT,
          t,
          aiReport: { [fixture.field]: [fixture.raw] } as never,
        });
        const items = numberedItems(blocks, t[fixture.titleKey] as string);
        expect(items[0].segments.map((segment) => segment.label)).toEqual(
          fixture.keys.map((key) => t.reportFieldLabels[key])
        );
      }
    );
  }

  it("never shows a Portuguese field label anywhere in an English report", () => {
    const t = cgiUi.en;
    const ptLabels = Object.values(cgiUi.pt.reportFieldLabels);
    const blocks = buildReportBlocks({
      result: MINIMAL_RESULT,
      t,
      aiReport: Object.fromEntries(
        SECTION_FIXTURES.map((fixture) => [fixture.field, [fixture.raw]])
      ) as never,
    });
    const allLabels = blocks
      .filter((block) => block.kind === "numbered")
      .flatMap((block) => (block as { items: { segments: { label: string }[] }[] }).items)
      .flatMap((item) => item.segments.map((segment) => segment.label))
      .filter(Boolean);

    for (const label of allLabels) {
      expect(ptLabels).not.toContain(label);
    }
    expect(allLabels.length).toBeGreaterThan(0);
  });

  it("never shows a Portuguese or English field label anywhere in a Spanish report", () => {
    const t = cgiUi.es;
    const otherLabels = [
      ...Object.values(cgiUi.pt.reportFieldLabels),
      ...Object.values(cgiUi.en.reportFieldLabels),
    ];
    const blocks = buildReportBlocks({
      result: MINIMAL_RESULT,
      t,
      aiReport: Object.fromEntries(
        SECTION_FIXTURES.map((fixture) => [fixture.field, [fixture.raw]])
      ) as never,
    });
    const allLabels = blocks
      .filter((block) => block.kind === "numbered")
      .flatMap((block) => (block as { items: { segments: { label: string }[] }[] }).items)
      .flatMap((item) => item.segments.map((segment) => segment.label))
      .filter(Boolean);

    for (const label of allLabels) {
      // "Impacto estratégico"/"Racional estratégico"/"Horizonte"/etc are
      // identical spellings in pt and es by coincidence - only flag a label
      // that's an EXCLUSIVELY pt or en spelling, not a shared cognate.
      const isSharedCognate = cgiUi.pt.reportFieldLabels &&
        Object.values(cgiUi.es.reportFieldLabels).includes(label);
      expect(isSharedCognate || !otherLabels.includes(label)).toBe(true);
    }
    expect(allLabels.length).toBeGreaterThan(0);
  });

  it("recognizes en/es-labeled raw text too, and still renders the label in the report's own language", () => {
    const t = cgiUi.pt;
    const blocks = buildReportBlocks({
      result: MINIMAL_RESULT,
      t,
      aiReport: {
        critical_bottlenecks: [
          "Title: Low value proposition clarity. Observed signal: scattered offer. Probable cause: no explicit positioning thesis. Strategic impact: lower conversion.",
        ],
      },
    });
    const items = numberedItems(blocks, t.criticalBottlenecksTitle);
    expect(items[0].segments.map((segment) => segment.label)).toEqual([
      t.reportFieldLabels.observedSignal,
      t.reportFieldLabels.probableCause,
      t.reportFieldLabels.strategicImpact,
    ]);
    expect(items[0].title).not.toContain("Title:");
  });

  it("keeps the exact same field order and count across pt/en/es for the same raw contract (structural parity)", () => {
    const perLanguageLabelCounts = (["pt", "en", "es"] as const).map((lang) => {
      const t = cgiUi[lang];
      const blocks = buildReportBlocks({
        result: MINIMAL_RESULT,
        t,
        aiReport: { critical_bottlenecks: [SECTION_FIXTURES[0].raw] },
      });
      const items = numberedItems(blocks, t.criticalBottlenecksTitle);
      return items[0].segments.length;
    });
    expect(perLanguageLabelCounts).toEqual([3, 3, 3]);
  });
});

describe("hypothesis prefix stripping handles a repeated ordinal number, in pt/en/es", () => {
  it.each([
    ["pt", "Hipótese 1: A maior alavanca é a clareza de segmento.", "Hipótese 1"],
    ["pt", "Hipótese 2: Segunda hipótese redigida.", "Hipótese 2"],
    ["en", "Hypothesis 1: The main lever is segment clarity.", "Hypothesis 1"],
    ["es", "Hipótesis 1: La principal palanca es la claridad de segmento.", "Hipótesis 1"],
  ] as const)("strips the numbered '%s' prefix so it never duplicates the item title", (lang, raw, expectedPrefix) => {
    const t = cgiUi[lang];
    const blocks = buildReportBlocks({
      result: MINIMAL_RESULT,
      t,
      aiReport: { hypotheses_to_validate: [raw] },
    });
    const items = numberedItems(blocks, t.hypothesesTitle);
    expect(items[0].segments[0].text).not.toContain(expectedPrefix);
    expect(items[0].segments[0].text.toLowerCase()).not.toMatch(
      /^(hip[oó]tese|hip[oó]tesis|hypothesis)\s*\d*\s*:/i
    );
  });

  it("the standalone stripHypothesisPrefix helper handles pt/en/es, numbered or not", () => {
    expect(stripHypothesisPrefix("Hipótese: texto")).toBe("texto");
    expect(stripHypothesisPrefix("Hipótese 3: texto")).toBe("texto");
    expect(stripHypothesisPrefix("Hypothesis: text")).toBe("text");
    expect(stripHypothesisPrefix("Hypothesis 12: text")).toBe("text");
    expect(stripHypothesisPrefix("Hipótesis: texto")).toBe("texto");
    expect(stripHypothesisPrefix("Hipótesis 4: texto")).toBe("texto");
    // Never touches a sentence that doesn't start with the prefix.
    expect(stripHypothesisPrefix("A hipótese central é clareza.")).toBe(
      "A hipótese central é clareza."
    );
  });
});

describe("normalizeReportText - character normalization", () => {
  it("strips C0 control characters but preserves tab, newline and carriage return", () => {
    const bell = String.fromCharCode(7); // BEL, an arbitrary control byte like the reported U+0011
    const backspace = String.fromCharCode(8);
    const unitSeparator = String.fromCharCode(31);
    const raw = `non${bell}negotiable${backspace} case ${unitSeparator}by-case`;
    expect(normalizeReportText(raw)).toBe("nonnegotiable case by-case");

    const withNewline = `line one${String.fromCharCode(10)}line two`;
    expect(normalizeReportText(withNewline)).toContain(String.fromCharCode(10));
  });

  it("strips C1 control characters (U+007F-U+009F)", () => {
    const del = String.fromCharCode(127);
    const c1 = String.fromCharCode(140);
    expect(normalizeReportText(`high${del}quality${c1} score`)).toBe("highquality score");
  });

  it("removes soft hyphen (U+00AD) entirely", () => {
    const softHyphen = String.fromCharCode(0xad);
    expect(normalizeReportText(`knowledge${softHyphen}intensive`)).toBe("knowledgeintensive");
  });

  it("converts hyphen (U+2010) and non-breaking hyphen (U+2011) to a plain ASCII hyphen", () => {
    const hyphenU2010 = String.fromCharCode(0x2010);
    const hyphenU2011 = String.fromCharCode(0x2011);
    expect(normalizeReportText(`day${hyphenU2010}to${hyphenU2010}day`)).toBe("day-to-day");
    expect(normalizeReportText(`non${hyphenU2011}negotiable`)).toBe("non-negotiable");
    expect(normalizeReportText(`high${hyphenU2011}fit low${hyphenU2010}ticket`)).toBe(
      "high-fit low-ticket"
    );
  });

  it("produces no U+0000-U+001F, U+007F-U+009F, U+00AD, U+2010 or U+2011 in its output, ever", () => {
    const dirty = [
      "non", String.fromCharCode(0x2011), "negotiable ",
      "knowledge", String.fromCharCode(0xad), "intensive ",
      "case", String.fromCharCode(0x2010), "by", String.fromCharCode(0x2010), "case ",
      "control", String.fromCharCode(17), "char",
    ].join("");
    const clean = normalizeReportText(dirty);
    for (const char of Array.from(clean)) {
      const code = char.codePointAt(0) ?? 0;
      const isBannedControl = (code <= 31 && code !== 9 && code !== 10 && code !== 13) ||
        (code >= 127 && code <= 159);
      const isBannedHyphenVariant = code === 0xad || code === 0x2010 || code === 0x2011;
      expect(isBannedControl || isBannedHyphenVariant).toBe(false);
    }
  });
});

describe("pt output is unchanged (regression guard)", () => {
  it("every reportFieldLabels.pt value matches the exact pre-hotfix hardcoded Portuguese string", () => {
    expect(cgiUi.pt.reportFieldLabels).toEqual({
      observedSignal: "Sinal observado",
      probableCause: "Causa provável",
      strategicImpact: "Impacto estratégico",
      priorityAction: "Ação prioritária",
      expectedResult: "Resultado esperado",
      horizon: "Horizonte",
      whatToStop: "O que deixar de fazer",
      protectedResource: "Recurso ou capacidade protegida",
      strategicRationale: "Racional estratégico",
      frequency: "Frequência",
      participants: "Participantes",
      indicators: "Indicadores",
      expectedDecision: "Decisão esperada",
      priority: "Prioridade",
      nextStep: "Próximo passo",
      validationCondition: "Condição de validação",
    });
  });

  it("pt hypotheses are unaffected by the numbered-prefix fix", () => {
    const t = cgiUi.pt;
    const blocks = buildReportBlocks({
      result: MINIMAL_RESULT,
      t,
      aiReport: {
        hypotheses_to_validate: ["A principal alavanca é a clareza de segmento."],
      },
    });
    const items = numberedItems(blocks, t.hypothesesTitle);
    expect(items[0].title).toBe("Hipótese 1");
    expect(items[0].segments[0].text).toBe("A principal alavanca é a clareza de segmento.");
  });
});
