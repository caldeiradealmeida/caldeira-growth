import { describe, expect, it } from "vitest";
import {
  buildCgiReportEvidence,
  buildCgiReportSystemPrompt,
  normalizeReportListItem,
  normalizeGeneratedReportJson,
  sanitizeReportText,
  validateGeneratedReportJson,
} from "../../api/cgi-assessment";
import { calculateCgiScore } from "../../api/cgi-core";

const dimensionTranslations = {
  pt: {
    strategy: "Estratégia",
    market: "Mercado e Cliente",
    growthMachine: "Máquina de Crescimento",
    execution: "Execução e Gestão",
    leadership: "Liderança e Cultura de Crescimento",
  },
  en: {
    strategy: "Strategy",
    market: "Market and Customer",
    growthMachine: "Growth Machine",
    execution: "Execution and Management",
    leadership: "Leadership and Growth Culture",
  },
  es: {
    strategy: "Estrategia",
    market: "Mercado y Cliente",
    growthMachine: "Máquina de Crecimiento",
    execution: "Ejecución y Gestión",
    leadership: "Liderazgo y Cultura de Crecimiento",
  },
};

function answersByDimension(values: number[]) {
  return Object.fromEntries(
    Array.from({ length: 40 }, (_, index) => [
      `q${index + 1}`,
      values[Math.floor(index / 8)],
    ])
  );
}

function paragraph(topic: string) {
  return `${topic} As respostas deste executivo indicam um padrao suficientemente especifico para sustentar esta leitura executiva, mantendo a causa como hipotese a validar em conversa posterior.`;
}

const criticalItem =
  "Título: Execucao sob pressao. Sinal observado: As respostas deste executivo indicam menor consistencia de cadencia e responsabilizacao nas rotinas de acompanhamento. Causa provável: a empresa pode estar operando com prioridades concorrentes e rituais de gestao ainda pouco decisivos. Impacto estratégico: sem validacao com outras liderancas e dados internos, ha risco de dispersao de energia, atraso em escolhas criticas e perda de qualidade do crescimento.";
const betItem =
  "Título: Sequenciar prioridades comerciais. Ação prioritária: concentrar a lideranca em poucas alavancas de crescimento observadas no CGI, evitando ampliar iniciativas antes de validar capacidade de execucao. Resultado esperado: maior foco na leitura de mercado, na maquina de crescimento e nas decisoes de alocacao. Horizonte: proximo ciclo de 60 a 90 dias, com validacao executiva.";
const renunciationItem =
  "Escolha: reduzir dispersao estrategica. O que deixar de fazer: evitar novas frentes sem criterio claro de cliente, margem e capacidade. Recurso ou capacidade protegida: foco da lideranca e energia de execucao. Racional estratégico: a partir da perspectiva do respondente, a renuncia protege a organizacao de crescimento com complexidade desnecessaria.";
const governanceItem =
  "Ritual: revisao executiva de prioridades. Frequência: semanal. Participantes: liderancas diretamente ligadas as metas do ciclo. Indicadores: avancos, desvios, gargalos e decisoes pendentes. Decisão esperada: remover bloqueios e validar se as hipoteses do CGI seguem consistentes com dados internos.";
const recommendationItem =
  "Recomendação: validar o principal gargalo antes de ampliar iniciativas. Prioridade: alta, porque o diagnostico sugere tensao entre ambicao e disciplina de execucao. Próximo passo: discutir o padrao com outras liderancas e confrontar com indicadores internos. Condição de validação: confirmar se o sinal aparece em dados operacionais e nao apenas na percepcao individual.";

function listItems(value: string) {
  return [value, value, value];
}

function validReport(overrides: Record<string, unknown> = {}) {
  return {
    report_title: "Relatorio CGI",
    report_subtitle: "Diagnostico executivo",
    email_subject: "Relatorio CGI",
    methodology_note: "Nota metodologica do CGI.",
    evidence_summary: ["Evidencia 1", "Evidencia 2", "Evidencia 3"],
    executive_summary:
      "As respostas deste executivo indicam uma organizacao com sinais relevantes de maturidade, mas ainda dependente de validacao com outras liderancas e dados internos. O score geral posiciona o caso em faixa intermediaria, com duas forcas observadas na clareza de direcao e na leitura de mercado. Ao mesmo tempo, o diagnostico sugere uma tensao central entre ambicao de crescimento e disciplina de execucao, o que exige priorizacao sem transformar a percepcao individual em verdade definitiva sobre toda a empresa.",
    strategic_diagnosis: [
      paragraph("Primeiro paragrafo."),
      paragraph("Segundo paragrafo."),
      paragraph("Terceiro paragrafo."),
      paragraph("Quarto paragrafo."),
    ].join("\n\n"),
    dimension_reading: [
      { dimension: "Estrategia", score: 80, analysis: "Analise", implication: "Implicacao" },
      { dimension: "Mercado", score: 70, analysis: "Analise", implication: "Implicacao" },
      { dimension: "Crescimento", score: 60, analysis: "Analise", implication: "Implicacao" },
      { dimension: "Execucao", score: 50, analysis: "Analise", implication: "Implicacao" },
      { dimension: "Lideranca", score: 40, analysis: "Analise", implication: "Implicacao" },
    ],
    critical_bottlenecks: listItems(criticalItem),
    strategic_bets: listItems(betItem),
    renunciations: listItems(renunciationItem),
    governance_system: listItems(governanceItem),
    hypotheses_to_validate: [
      "Hipotese 1: validar a leitura do CGI com outras liderancas.",
      "Hipotese 2: confrontar percepcao do respondente com indicadores internos.",
      "Hipotese 3: confirmar se o gargalo aparece no ciclo de gestao.",
    ],
    final_recommendations: listItems(recommendationItem),
    ...overrides,
  };
}

describe("CGI report v1.1 prompt contract", () => {
  it("keeps scoring unchanged while building evidence for a strategy-strong execution-weak profile", () => {
    const answers = answersByDimension([5, 4, 3, 1, 4]);
    const score = calculateCgiScore(answers);
    const evidence = buildCgiReportEvidence({
      answers,
      score,
      language: "pt",
      dimensionTranslations,
    });

    expect(score.dimensionScores.map((item) => item.score)).toEqual([
      100, 75, 50, 0, 75,
    ]);
    expect(score.finalScore).toBe(60);
    expect(evidence.methodology_version).toBe("1.1.0");
    expect(evidence.scoring_version).toBe("1.0.0");
    expect(evidence.overall.strongest_dimensions[0]).toMatchObject({
      dimension_id: "strategy",
      score: 100,
    });
    expect(evidence.overall.weakest_dimensions[0]).toMatchObject({
      dimension_id: "execution",
      score: 0,
    });
  });

  it("produces distinct evidence patterns for three required validation profiles", () => {
    const profileA = buildCgiReportEvidence({
      answers: answersByDimension([5, 4, 3, 1, 4]),
      score: calculateCgiScore(answersByDimension([5, 4, 3, 1, 4])),
      language: "pt",
      dimensionTranslations,
    });
    const profileB = buildCgiReportEvidence({
      answers: answersByDimension([3, 5, 1, 3, 4]),
      score: calculateCgiScore(answersByDimension([3, 5, 1, 3, 4])),
      language: "pt",
      dimensionTranslations,
    });
    const profileCAnswers = {
      ...answersByDimension([5, 5, 5, 5, 5]),
      q34: 2,
      q38: 3,
    };
    const profileC = buildCgiReportEvidence({
      answers: profileCAnswers,
      score: calculateCgiScore(profileCAnswers),
      language: "pt",
      dimensionTranslations,
    });

    expect(profileA.overall.weakest_dimensions[0].dimension_id).toBe("execution");
    expect(profileB.overall.weakest_dimensions[0].dimension_id).toBe("growthMachine");
    expect(profileC.overall.weakest_dimensions[0].dimension_id).toBe("leadership");
    expect(JSON.stringify(profileA.by_dimension)).not.toEqual(
      JSON.stringify(profileB.by_dimension)
    );
    expect(JSON.stringify(profileB.by_dimension)).not.toEqual(
      JSON.stringify(profileC.by_dimension)
    );
  });

  it("captures different respondent perceptions for the same company", () => {
    const ceoAnswers = answersByDimension([5, 5, 4, 3, 4]);
    const regionalAnswers = answersByDimension([3, 4, 2, 2, 3]);
    const ceoEvidence = buildCgiReportEvidence({
      answers: ceoAnswers,
      score: calculateCgiScore(ceoAnswers),
      language: "pt",
      dimensionTranslations,
    });
    const regionalEvidence = buildCgiReportEvidence({
      answers: regionalAnswers,
      score: calculateCgiScore(regionalAnswers),
      language: "pt",
      dimensionTranslations,
    });

    expect(ceoEvidence.overall.final_score).toBeGreaterThan(
      regionalEvidence.overall.final_score
    );
    expect(ceoEvidence.overall.weakest_dimensions[0].dimension_id).not.toBe(
      regionalEvidence.overall.weakest_dimensions[0].dimension_id
    );
  });

  it("includes methodological note, traceability and hallucination protections in the system prompt", () => {
    const prompt = buildCgiReportSystemPrompt("REGRA CRÍTICA DE IDIOMA");

    expect(prompt).toContain("methodology_note");
    expect(prompt).toContain("evidence_summary");
    expect(prompt).toContain("hypotheses_to_validate");
    expect(prompt).toContain("exatamente 3 strings");
    expect(prompt).toContain("Não invente dados");
    expect(prompt).toContain("não substituem um diagnóstico organizacional completo");
    expect(prompt).toContain("response_evidence.by_dimension");
    expect(prompt).toContain("perspectiva do respondente");
    expect(prompt).toContain("não substituir uma etapa de diagnóstico aprofundado");
    expect(prompt).toContain("nunca acima de 16.500 caracteres");
    expect(prompt).toContain("Sinal observado");
    expect(prompt).toContain("Condição de validação");
  });

  it("sanitizes duplicated punctuation without corrupting decimals or URLs", () => {
    const sanitized = sanitizeReportText(
      "As respostas indicam 3.5 pontos.. Veja https://exemplo.com/a..b e www.exemplo.com.br/x..y ;; fim ,."
    );

    expect(sanitized).toContain("3.5");
    expect(sanitized).toContain("https://exemplo.com/a..b");
    expect(sanitized).toContain("www.exemplo.com.br/x..y");
    expect(sanitized).not.toContain("pontos..");
    expect(sanitized).not.toContain(";;");
    expect(sanitized).not.toContain(",.");
  });

  it("keeps valid string arrays unchanged after normalization", () => {
    const normalized = normalizeGeneratedReportJson(
      JSON.stringify({
        critical_bottlenecks: ["Item 1", "Item 2", "Item 3"],
        strategic_bets: ["Item 1", "Item 2", "Item 3"],
        renunciations: ["Item 1", "Item 2", "Item 3"],
        governance_system: ["Item 1", "Item 2", "Item 3"],
        final_recommendations: ["Item 1", "Item 2", "Item 3"],
      })
    );
    const parsed = JSON.parse(normalized);

    expect(parsed.critical_bottlenecks).toEqual(["Item 1", "Item 2", "Item 3"]);
    expect(parsed.strategic_bets).toEqual(["Item 1", "Item 2", "Item 3"]);
    expect(parsed.renunciations).toEqual(["Item 1", "Item 2", "Item 3"]);
    expect(parsed.governance_system).toEqual(["Item 1", "Item 2", "Item 3"]);
    expect(parsed.final_recommendations).toEqual(["Item 1", "Item 2", "Item 3"]);
  });

  it("converts structured objects into readable executive strings", () => {
    const normalized = normalizeGeneratedReportJson(
      JSON.stringify({
        critical_bottlenecks: [
          { signal: "execucao baixa", cause: "cadencia fraca", impact: "atrasos" },
          {
            action: "definir donos",
            expected_result: "mais accountability",
            deadline: "30 dias",
          },
          {
            cadence: "semanal",
            participants: "diretoria",
            indicators: "metas e desvios",
            decision: "remover bloqueios",
          },
        ],
      })
    );
    const parsed = JSON.parse(normalized);

    expect(parsed.critical_bottlenecks).toHaveLength(3);
    expect(parsed.critical_bottlenecks[0]).toContain("Sinal observado: execucao baixa");
    expect(parsed.critical_bottlenecks[0]).toContain("Causa provável: cadencia fraca");
    expect(parsed.critical_bottlenecks[0]).toContain("Impacto estratégico: atrasos");
    expect(parsed.critical_bottlenecks[1]).toContain("Acao: definir donos");
    expect(parsed.critical_bottlenecks[1]).toContain("Resultado esperado: mais accountability");
    expect(parsed.critical_bottlenecks[2]).toContain("Cadencia: semanal");
    expect(parsed.critical_bottlenecks.join(" ")).not.toContain("[object Object]");
  });

  it("normalizes punctuation artifacts across report sections", () => {
    const normalized = normalizeGeneratedReportJson(
      JSON.stringify(
        validReport({
          executive_summary:
            "As respostas deste executivo indicam maturidade intermediaria.. A hipotese deve ser validada com outras liderancas ,.",
          critical_bottlenecks: [
            {
              title: "Gargalo..",
              signal: "sinal observado ;;",
              cause: "causa provavel ,.",
              impact: "impacto estrategico..",
            },
            criticalItem,
            criticalItem,
          ],
        })
      )
    );
    const parsed = JSON.parse(normalized);

    expect(parsed.executive_summary).not.toContain("..");
    expect(parsed.executive_summary).not.toContain(",.");
    expect(parsed.critical_bottlenecks.join(" ")).not.toContain(";;");
    expect(parsed.critical_bottlenecks[0]).toContain("Título: Gargalo.");
  });

  it("converts unexpected nested objects without raw JSON or object tokens", () => {
    const text = normalizeReportListItem({
      unexpected: "valor principal",
      nested: { detail: "detalhe relevante", ignored: null },
      list: ["primeiro", { second: "segundo" }],
    });

    expect(text).toContain("valor principal");
    expect(text).toContain("detalhe relevante");
    expect(text).toContain("primeiro");
    expect(text).toContain("segundo");
    expect(text).not.toContain("[object Object]");
    expect(text).not.toContain("{");
    expect(text).not.toContain("}");
  });

  it("rejects invalid list values after normalization", () => {
    const normalized = normalizeGeneratedReportJson(
      JSON.stringify(
        validReport({
          critical_bottlenecks: [null, undefined, {}, "[object Object]"],
        })
      )
    );
    const validation = validateGeneratedReportJson(normalized);

    expect(validation.ok).toBe(false);
    expect(validation.errors.some((error) => error.field === "critical_bottlenecks")).toBe(
      true
    );
  });

  it("rejects unnormalized punctuation artifacts", () => {
    const validation = validateGeneratedReportJson({
      ...validReport(),
      executive_summary:
        "As respostas deste executivo indicam maturidade intermediaria.. A hipotese deve ser validada com outras liderancas.",
    });

    expect(validation.ok).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "$",
          message: "contains duplicated punctuation or unsafe spacing artifacts",
        }),
      ])
    );
  });

  it("rejects items outside the standardized labeled structure", () => {
    const validation = validateGeneratedReportJson(
      JSON.stringify(validReport({ strategic_bets: ["Item 1", "Item 2", "Item 3"] }))
    );

    expect(validation.ok).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "strategic_bets",
          message: "item does not follow the required labeled structure",
        }),
      ])
    );
  });

  it("rejects exact-three list fields with two or four items", () => {
    const twoItems = validateGeneratedReportJson(
      JSON.stringify(validReport({ strategic_bets: ["a", "b"] }))
    );
    const fourItems = validateGeneratedReportJson(
      JSON.stringify(validReport({ final_recommendations: ["a", "b", "c", "d"] }))
    );

    expect(twoItems.ok).toBe(false);
    expect(fourItems.ok).toBe(false);
    expect(twoItems.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "strategic_bets", message: "must contain exactly 3 items" }),
      ])
    );
    expect(fourItems.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "final_recommendations",
          message: "must contain exactly 3 items",
        }),
      ])
    );
  });

  it("validates strategic diagnosis paragraph structure", () => {
    const fourParagraphs = validateGeneratedReportJson(JSON.stringify(validReport()));
    const fiveParagraphs = validateGeneratedReportJson(
      JSON.stringify(
        validReport({
          strategic_diagnosis: [
            paragraph("Primeiro."),
            paragraph("Segundo."),
            paragraph("Terceiro."),
            paragraph("Quarto."),
            paragraph("Quinto."),
          ].join("\n\n"),
        })
      )
    );
    const oneBlock = validateGeneratedReportJson(
      JSON.stringify(validReport({ strategic_diagnosis: [paragraph("Unico."), paragraph("Outro.")].join(" ") }))
    );
    const emptyParagraph = validateGeneratedReportJson(
      JSON.stringify(
        validReport({
          strategic_diagnosis: [
            paragraph("Primeiro."),
            "",
            "curto",
            paragraph("Quarto."),
          ].join("\n\n"),
        })
      )
    );

    expect(fourParagraphs.ok).toBe(true);
    expect(fiveParagraphs.ok).toBe(true);
    expect(oneBlock.ok).toBe(false);
    expect(emptyParagraph.ok).toBe(false);
  });

  it("validates total serialized report size", () => {
    const validation = validateGeneratedReportJson(
      JSON.stringify(
        validReport({
          strategic_diagnosis: [
            paragraph("Primeiro.") + " ".repeat(4500) + "conteudo extenso",
            paragraph("Segundo.") + " ".repeat(4500) + "conteudo extenso",
            paragraph("Terceiro.") + " ".repeat(4500) + "conteudo extenso",
            paragraph("Quarto.") + " ".repeat(4500) + "conteudo extenso",
          ].join("\n\n"),
        })
      )
    );

    expect(validation.ok).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "$",
          message: "must not exceed 16500 serialized characters",
        }),
      ])
    );
  });

  it("requires respondent-perspective language", () => {
    const validation = validateGeneratedReportJson(
      JSON.stringify(
        validReport({
          executive_summary:
            "Resumo executivo com pontuacao, faixa de maturidade, duas forcas reais e uma tensao central sustentada pelas respostas.",
          strategic_diagnosis: [
            "A organizacao possui maturidade intermediaria e opera com desafios relevantes de execucao que precisam ser resolvidos pela lideranca para sustentar crescimento.",
            "A empresa demonstra clareza em algumas frentes, mas precisa corrigir gargalos de gestao para ampliar previsibilidade e melhorar a qualidade das decisoes.",
            "O sistema comercial apresenta oportunidades importantes, com risco de dispersao caso a lideranca mantenha muitas iniciativas simultaneas.",
            "As recomendacoes devem concentrar energia em prioridades executivas, governanca e disciplina de acompanhamento para melhorar resultados.",
          ].map((value) => `${value} ${value}`).join("\n\n"),
          critical_bottlenecks: listItems(
            "Título: Gargalo. Sinal observado: baixa execucao. Causa provável: rotina fraca. Impacto estratégico: atrasos relevantes."
          ),
          final_recommendations: listItems(
            "Recomendação: ajustar gestao. Prioridade: alta. Próximo passo: revisar indicadores. Condição de validação: confirmar em dados."
          ),
        })
      )
    );

    expect(validation.ok).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "$",
          message: "must frame conclusions from the respondent perspective",
        }),
      ])
    );
  });
});
