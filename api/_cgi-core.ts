export type CgiDimensionId =
  | "strategy"
  | "market"
  | "growthMachine"
  | "execution"
  | "leadership";

export type CgiQuestion = {
  id: string;
  dimensionId: CgiDimensionId;
  text: string;
};

export type CgiDimension = {
  id: CgiDimensionId;
  title: string;
  weight: number;
  diagnostic: string;
};

export type CgiScoreResult = {
  finalScore: number;
  level: {
    id: string;
    title: string;
    summary: string;
    recommendation: string;
  };
  dimensionScores: Array<{
    dimensionId: CgiDimensionId;
    title: string;
    score: number;
    average: number;
    answered: number;
    total: number;
  }>;
  attentionPoints: CgiScoreResult["dimensionScores"];
  diagnostic: string;
};

export const CGI_DIMENSIONS: CgiDimension[] = [
  {
    id: "strategy",
    title: "Estratégia",
    weight: 20,
    diagnostic:
      "Avalia clareza de direção, prioridades, escolhas e tradução da estratégia em metas concretas.",
  },
  {
    id: "market",
    title: "Mercado e Cliente",
    weight: 20,
    diagnostic:
      "Avalia foco no cliente ideal, proposta de valor, leitura competitiva e consistência de posicionamento.",
  },
  {
    id: "growthMachine",
    title: "Máquina de Crescimento",
    weight: 20,
    diagnostic:
      "Avalia previsibilidade comercial, alinhamento entre marketing e vendas, canais e indicadores de crescimento.",
  },
  {
    id: "execution",
    title: "Execução e Gestão",
    weight: 20,
    diagnostic:
      "Avalia disciplina de gestão, acompanhamento de prioridades, responsabilidades e capacidade de corrigir desvios.",
  },
  {
    id: "leadership",
    title: "Liderança e Cultura de Crescimento",
    weight: 20,
    diagnostic:
      "Avalia responsabilidade das lideranças, desenvolvimento de pessoas, colaboração e cultura de aprendizado.",
  },
];

export const CGI_QUESTIONS: CgiQuestion[] = [
  { id: "q1", dimensionId: "strategy", text: "Nossa empresa possui uma visão clara de onde quer estar nos próximos três anos." },
  { id: "q2", dimensionId: "strategy", text: "As principais lideranças compartilham a mesma compreensão das prioridades estratégicas." },
  { id: "q3", dimensionId: "strategy", text: "Sabemos claramente quais oportunidades NÃO perseguiremos nos próximos 12 meses." },
  { id: "q4", dimensionId: "strategy", text: "As decisões de investimento seguem prioridades estratégicas definidas." },
  { id: "q5", dimensionId: "strategy", text: "Os objetivos estratégicos são traduzidos em metas concretas para as equipes." },
  { id: "q6", dimensionId: "strategy", text: "Revisamos nossa estratégia de forma estruturada pelo menos uma vez por ano." },
  { id: "q7", dimensionId: "strategy", text: "Conseguimos explicar de forma simples por que nossa empresa cresce ou não cresce." },
  { id: "q8", dimensionId: "strategy", text: "Temos clareza sobre os principais gargalos que limitam nossa próxima fase de crescimento." },
  { id: "q9", dimensionId: "market", text: "Temos uma definição clara do nosso cliente ideal." },
  { id: "q10", dimensionId: "market", text: "Nossa proposta de valor é facilmente compreendida pelos clientes." },
  { id: "q11", dimensionId: "market", text: "Sabemos exatamente por que os clientes nos escolhem em vez dos concorrentes." },
  { id: "q12", dimensionId: "market", text: "Possuímos processos regulares para ouvir clientes e aprender com eles." },
  { id: "q13", dimensionId: "market", text: "Monitoramos concorrentes e movimentos de mercado de forma estruturada." },
  { id: "q14", dimensionId: "market", text: "Temos clareza sobre quais segmentos oferecem maior potencial de crescimento." },
  { id: "q15", dimensionId: "market", text: "Conseguimos identificar rapidamente mudanças relevantes no comportamento dos clientes." },
  { id: "q16", dimensionId: "market", text: "Nossa empresa é percebida pelo mercado de forma consistente com o posicionamento desejado." },
  { id: "q17", dimensionId: "growthMachine", text: "Nossa empresa possui metas claras de crescimento para os próximos 12 meses." },
  { id: "q18", dimensionId: "growthMachine", text: "Conseguimos prever nossa receita futura com razoável precisão." },
  { id: "q19", dimensionId: "growthMachine", text: "A geração de novos clientes ocorre de forma consistente ao longo do ano." },
  { id: "q20", dimensionId: "growthMachine", text: "Marketing e vendas trabalham com objetivos alinhados." },
  { id: "q21", dimensionId: "growthMachine", text: "Conhecemos os principais indicadores que explicam nosso crescimento." },
  { id: "q22", dimensionId: "growthMachine", text: "Dependemos pouco de uma única pessoa, canal ou cliente para crescer." },
  { id: "q23", dimensionId: "growthMachine", text: "Nosso processo comercial é documentado e replicável." },
  { id: "q24", dimensionId: "growthMachine", text: "Sabemos quais iniciativas têm maior impacto sobre receita e lucratividade." },
  { id: "q25", dimensionId: "execution", text: "As prioridades da empresa são acompanhadas regularmente pelas lideranças." },
  { id: "q26", dimensionId: "execution", text: "Existe clareza sobre quem é responsável por cada objetivo relevante." },
  { id: "q27", dimensionId: "execution", text: "As reuniões de gestão resultam em decisões e ações concretas." },
  { id: "q28", dimensionId: "execution", text: "Utilizamos indicadores para orientar decisões importantes." },
  { id: "q29", dimensionId: "execution", text: "Projetos estratégicos costumam ser concluídos dentro do prazo esperado." },
  { id: "q30", dimensionId: "execution", text: "Conseguimos identificar rapidamente desvios de desempenho." },
  { id: "q31", dimensionId: "execution", text: "Problemas recorrentes são tratados em suas causas e não apenas em seus sintomas." },
  { id: "q32", dimensionId: "execution", text: "Existe disciplina na execução mesmo durante períodos de pressão ou mudança." },
  { id: "q33", dimensionId: "leadership", text: "Nossas lideranças assumem responsabilidade pelos resultados da empresa." },
  { id: "q34", dimensionId: "leadership", text: "Os líderes desenvolvem pessoas e formam sucessores." },
  { id: "q35", dimensionId: "leadership", text: "Feedback faz parte da rotina de gestão." },
  { id: "q36", dimensionId: "leadership", text: "A empresa consegue atrair e reter talentos relevantes." },
  { id: "q37", dimensionId: "leadership", text: "Existe colaboração efetiva entre áreas." },
  { id: "q38", dimensionId: "leadership", text: "As decisões difíceis são tomadas quando necessárias." },
  { id: "q39", dimensionId: "leadership", text: "A cultura favorece aprendizado, adaptação e melhoria contínua." },
  { id: "q40", dimensionId: "leadership", text: "O time demonstra comprometimento genuíno com os objetivos da empresa." },
];

const CGI_LEVELS = [
  {
    id: "reactive",
    min: 0,
    max: 39,
    title: "Crescimento Reativo",
    summary:
      "O crescimento depende mais de esforços pontuais, urgências e oportunidades isoladas do que de um sistema de gestão consistente.",
    recommendation:
      "O foco deve ser criar clareza estratégica, identificar poucos gargalos críticos e estabelecer uma cadência básica de execução.",
  },
  {
    id: "intentional",
    min: 40,
    max: 59,
    title: "Crescimento Intencional",
    summary:
      "A empresa já tem intenção clara de crescimento, mas ainda opera com lacunas relevantes de previsibilidade, foco ou disciplina.",
    recommendation:
      "O próximo passo é transformar intenção em sistema: metas, indicadores, ritos de gestão e responsabilidades mais nítidas.",
  },
  {
    id: "structured",
    min: 60,
    max: 79,
    title: "Crescimento Estruturado",
    summary:
      "A empresa possui fundamentos importantes de crescimento, mas ainda pode estar limitada por desalinhamentos ou gargalos específicos.",
    recommendation:
      "O foco deve ser fortalecer os pontos mais fracos, aumentar previsibilidade e reduzir dependência de pessoas ou canais isolados.",
  },
  {
    id: "scalable",
    min: 80,
    max: 100,
    title: "Crescimento Escalável",
    summary:
      "A empresa demonstra alto nível de maturidade e tende a crescer com mais consistência, desde que preserve foco e capacidade de adaptação.",
    recommendation:
      "O próximo desafio é sofisticar a máquina de crescimento, acelerar aprendizados e preparar lideranças para ciclos maiores de escala.",
  },
];

function clampAnswer(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (numeric < 1 || numeric > 5) return null;
  return Math.round(numeric);
}

export function normalizeCgiAnswers(input: Record<string, unknown>): Record<string, number> {
  return CGI_QUESTIONS.reduce<Record<string, number>>((acc, question) => {
    const value = clampAnswer(input[question.id]);
    if (value !== null) acc[question.id] = value;
    return acc;
  }, {});
}

export function areCgiAnswersComplete(answers: Record<string, number>): boolean {
  return CGI_QUESTIONS.every((question) => clampAnswer(answers[question.id]) !== null);
}

export function calculateCgiScore(input: Record<string, unknown>): CgiScoreResult {
  const answers = normalizeCgiAnswers(input);
  const dimensionScores = CGI_DIMENSIONS.map((dimension) => {
    const questions = CGI_QUESTIONS.filter(
      (question) => question.dimensionId === dimension.id
    );
    const values = questions
      .map((question) => answers[question.id])
      .filter((value): value is number => clampAnswer(value) !== null);
    const average =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;
    const score = Math.round(((average - 1) / 4) * 100);

    return {
      dimensionId: dimension.id,
      title: dimension.title,
      score: Math.max(0, Math.min(100, score)),
      average: Number(average.toFixed(2)),
      answered: values.length,
      total: questions.length,
    };
  });

  const finalScore = Math.round(
    dimensionScores.reduce((sum, item) => sum + item.score, 0) /
      dimensionScores.length
  );
  const level =
    CGI_LEVELS.find((item) => finalScore >= item.min && finalScore <= item.max) ||
    CGI_LEVELS[0];
  const attentionPoints = [...dimensionScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return {
    finalScore,
    level,
    dimensionScores,
    attentionPoints,
    diagnostic: `${level.summary} ${level.recommendation}`,
  };
}
