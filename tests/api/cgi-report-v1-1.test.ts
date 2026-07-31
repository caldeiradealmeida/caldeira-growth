import { describe, expect, it } from "vitest";
import {
  buildCgiReportEvidence,
  buildReportRetryInstruction,
  buildCgiReportSystemPrompt,
  estimateGeneratedReportMetrics,
  getCgiReportTimeoutBudget,
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
    expect(prompt).toContain("2 a 3 strings");
    expect(prompt).toContain("Não invente dados");
    expect(prompt).toContain("não substituem um diagnóstico organizacional completo");
    expect(prompt).toContain("response_evidence.by_dimension");
    expect(prompt).toContain("perspectiva do respondente");
    expect(prompt).toContain("não substituir uma etapa de diagnóstico aprofundado");
    expect(prompt).toContain("nunca acima de 11.200 caracteres");
    expect(prompt).toContain("no máximo 7 páginas úteis");
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

  it("normalizes markdown code fences before validation", () => {
    const normalized = normalizeGeneratedReportJson(
      "```json\n" + JSON.stringify(validReport()) + "\n```"
    );
    const validation = validateGeneratedReportJson(normalized);

    expect(validation.ok).toBe(true);
  });

  it("normalizes object-shaped lists into arrays before validation", () => {
    const normalized = normalizeGeneratedReportJson(
      JSON.stringify(
        validReport({
          evidence_summary: {
            first: "Evidencia 1",
            second: "Evidencia 2",
            third: "Evidencia 3",
          },
          hypotheses_to_validate: {
            first: "Hipotese 1: validar a leitura do CGI com outras liderancas.",
            second: "Hipotese 2: confrontar percepcao com indicadores.",
            third: "Hipotese 3: confirmar se o gargalo aparece no ciclo de gestao.",
          },
        })
      )
    );
    const parsed = JSON.parse(normalized);
    const validation = validateGeneratedReportJson(normalized);

    expect(parsed.evidence_summary).toHaveLength(3);
    expect(parsed.hypotheses_to_validate).toHaveLength(3);
    expect(validation.ok).toBe(true);
  });

  it("accepts safe alternate keys inside structured list objects after normalization", () => {
    const normalized = normalizeGeneratedReportJson(
      JSON.stringify(
        validReport({
          strategic_bets: [
            {
              titulo: "Sequenciar prioridades",
              acao_prioritaria: "focar poucas alavancas",
              resultado_esperado: "maior previsibilidade",
              horizonte: "60 a 90 dias",
            },
            {
              title: "Validar canal",
              action: "testar canal prioritario",
              outcome: "criterio comercial mais claro",
              deadline: "proximo ciclo",
            },
            {
              tema: "Governanca comercial",
              decisao: "definir indicadores",
              expected_result: "decisoes melhores",
              prazo: "mensal",
            },
          ],
        })
      )
    );
    const validation = validateGeneratedReportJson(normalized);

    expect(validation.ok).toBe(true);
  });

  it("keeps number-like strings and extra sections from blocking an otherwise valid report", () => {
    const validation = validateGeneratedReportJson(
      validReport({
        extra_section_not_rendered: { status: "ignored" },
        dimension_reading: [
          { dimension: "Estrategia", score: "80", analysis: "Analise", implication: "Implicacao" },
          { dimension: "Mercado", score: "70", analysis: "Analise", implication: "Implicacao" },
          { dimension: "Crescimento", score: "60", analysis: "Analise", implication: "Implicacao" },
          { dimension: "Execucao", score: "50", analysis: "Analise", implication: "Implicacao" },
          { dimension: "Lideranca", score: "40", analysis: "Analise", implication: "Implicacao" },
        ],
      })
    );

    expect(validation.ok).toBe(true);
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

  it("reports missing fields with structured path, code and sanitized type metadata", () => {
    const report = validReport();
    delete (report as Record<string, unknown>).executive_summary;

    const validation = validateGeneratedReportJson(report);

    expect(validation.ok).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "executive_summary",
          path: "executive_summary",
          code: "missing_required",
          message: "missing_key",
          expected: "required key",
          received_type: "undefined",
          section: "executive_summary",
        }),
      ])
    );
  });

  it("reports null nested fields with exact paths", () => {
    const validation = validateGeneratedReportJson(
      validReport({
        dimension_reading: [
          { dimension: "Estrategia", score: 80, analysis: null, implication: "Implicacao" },
          { dimension: "Mercado", score: 70, analysis: "Analise", implication: "Implicacao" },
          { dimension: "Crescimento", score: 60, analysis: "Analise", implication: "Implicacao" },
          { dimension: "Execucao", score: 50, analysis: "Analise", implication: "Implicacao" },
          { dimension: "Lideranca", score: 40, analysis: "Analise", implication: "Implicacao" },
        ],
      })
    );

    expect(validation.ok).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "dimension_reading.0.analysis",
          code: "missing_required",
          received_type: "null",
          received_summary: "null",
        }),
      ])
    );
  });

  it("separates correctable array errors from editorial label warnings without raw content", () => {
    const validation = validateGeneratedReportJson(
      JSON.stringify(
        validReport({
          strategic_bets: ["Sem rotulo", "Sem rotulo", "Sem rotulo"],
          hypotheses_to_validate: [],
        })
      )
    );

    expect(validation.ok).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "hypotheses_to_validate",
          code: "invalid_array_length",
          expected: "array with 2 to 4 items",
          received_summary: "array(length=0)",
        }),
      ])
    );
    expect(validation.correctable_errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "hypotheses_to_validate", category: "correctable_structural" }),
      ])
    );
    expect(validation.editorial_warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "strategic_bets.0",
          code: "invalid_structure",
          expected: "string with required labels in order",
          received_type: "string",
          received_summary: expect.stringContaining("string(length="),
          category: "editorial",
        }),
      ])
    );
    expect(JSON.stringify(validation.errors)).not.toContain("Sem rotulo");
    expect(JSON.stringify(validation.editorial_warnings)).not.toContain("Sem rotulo");
  });

  it("reports truncated JSON as an invalid JSON validation error", () => {
    const validation = validateGeneratedReportJson('{"report_title":"Relatorio CGI"');

    expect(validation.ok).toBe(false);
    expect(validation.errors[0]).toMatchObject({
      path: "$",
      code: "invalid_json",
      expected: "valid JSON object",
      received_type: "string",
    });
  });

  it("feeds specific validation paths into retry instructions", () => {
    const validation = validateGeneratedReportJson(
      validReport({
        strategic_bets: ["Sem rotulo", "Sem rotulo", "Sem rotulo"],
      })
    );
    const retryInstruction = buildReportRetryInstruction(
      [{ attempt: 1, errors: validation.editorial_warnings }],
      2
    );

    expect(retryInstruction).toContain("Erros específicos da validação anterior");
    expect(retryInstruction).toContain("strategic_bets.0: invalid_structure");
  });

  it("estimates the analytical report size against the seven-page content budget", () => {
    const metrics = estimateGeneratedReportMetrics(validReport());
    const validation = validateGeneratedReportJson(validReport());

    expect(metrics.pageLimit).toBe(7);
    expect(metrics.estimatedContentPages).toBeLessThanOrEqual(7);
    expect(validation.metrics?.estimatedContentPages).toBeLessThanOrEqual(7);
  });

  it("keeps the worst-case single-retry timeout budget safely below Vercel's function ceiling", () => {
    const budget = getCgiReportTimeoutBudget();

    // Conservative recovery policy: one primary attempt plus at most one
    // retry, only for a proven transient failure.
    expect(budget.maxFullAttempts).toBe(2);
    expect(budget.openAiAttemptTimeoutMs).toBeGreaterThanOrEqual(70000);
    expect(budget.openAiAttemptTimeoutMs).toBeLessThanOrEqual(80000);
    expect(budget.openAiWorstCaseMs).toBe(budget.openAiAttemptTimeoutMs * 2);
    expect(budget.theoreticalWorstCaseMs).toBeLessThan(budget.vercelFunctionTimeoutMs);
    expect(budget.theoreticalWorstCaseMs).toBeLessThan(budget.safeExecutionBudgetMs);
  });

  it("treats unnormalized punctuation artifacts as nonblocking editorial warnings", () => {
    const validation = validateGeneratedReportJson({
      ...validReport(),
      executive_summary:
        "As respostas deste executivo indicam maturidade intermediaria.. A hipotese deve ser validada com outras liderancas.",
    });

    expect(validation.ok).toBe(true);
    expect(validation.reportStatus).toBe("report_ready_with_warnings");
    expect(validation.editorial_warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "$",
          message: "contains duplicated punctuation or unsafe spacing artifacts",
        }),
      ])
    );
  });

  it("accepts missing labels as warnings instead of fatal validation errors", () => {
    const validation = validateGeneratedReportJson(
      JSON.stringify(validReport({ strategic_bets: ["Item 1", "Item 2", "Item 3"] }))
    );

    expect(validation.ok).toBe(true);
    expect(validation.reportStatus).toBe("report_ready_with_warnings");
    expect(validation.editorial_warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "strategic_bets",
          message: "item does not follow the required labeled structure",
        }),
      ])
    );
  });

  it("accepts two or four decision items with warnings instead of fatal retries", () => {
    const twoItems = validateGeneratedReportJson(
      JSON.stringify(validReport({ strategic_bets: ["a", "b"] }))
    );
    const fourItems = validateGeneratedReportJson(
      JSON.stringify(validReport({ final_recommendations: ["a", "b", "c", "d"] }))
    );

    expect(twoItems.ok).toBe(true);
    expect(fourItems.ok).toBe(true);
    expect(twoItems.reportStatus).toBe("report_ready_with_warnings");
    expect(fourItems.reportStatus).toBe("report_ready_with_warnings");
    expect(twoItems.editorial_warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "strategic_bets", message: "preferred cardinality is exactly 3 items" }),
      ])
    );
    expect(fourItems.editorial_warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "final_recommendations",
          message: "preferred cardinality is exactly 3 items",
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
    expect(oneBlock.ok).toBe(true);
    expect(emptyParagraph.ok).toBe(true);
    expect(oneBlock.reportStatus).toBe("report_ready_with_warnings");
    expect(emptyParagraph.editorial_warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "strategic_diagnosis" }),
      ])
    );
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
          message: "must not exceed 11200 serialized characters",
        }),
      ])
    );
  });

  it("keeps respondent-perspective gaps as warnings instead of fatal retries", () => {
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

    expect(validation.ok).toBe(true);
    expect(validation.reportStatus).toBe("report_ready_with_warnings");
    expect(validation.editorial_warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "$",
          message: "must frame conclusions from the respondent perspective",
        }),
      ])
    );
  });
});
