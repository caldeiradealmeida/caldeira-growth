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
  helpText: string;
};

export type CgiDimension = {
  id: CgiDimensionId;
  title: string;
  shortTitle: string;
  weight: number;
  diagnostic: string;
};

export type CgiLevel = {
  id: string;
  min: number;
  max: number;
  title: string;
  summary: string;
  recommendation: string;
};

export type CgiQualificationField = {
  id:
    | "employeeCount"
    | "annualRevenue"
    | "currentChallenge"
    | "growthGoal"
    | "investmentIntent";
  label: string;
  options: string[];
};

export const CGI_SCALE = [
  { value: 1, label: "Discordo totalmente" },
  { value: 2, label: "Discordo parcialmente" },
  { value: 3, label: "Nem concordo nem discordo" },
  { value: 4, label: "Concordo parcialmente" },
  { value: 5, label: "Concordo totalmente" },
] as const;

export const CGI_DIMENSIONS: CgiDimension[] = [
  {
    id: "strategy",
    title: "Estratégia",
    shortTitle: "Estratégia",
    weight: 20,
    diagnostic:
      "Avalia clareza de direção, prioridades, escolhas e tradução da estratégia em metas concretas.",
  },
  {
    id: "market",
    title: "Mercado e Cliente",
    shortTitle: "Mercado",
    weight: 20,
    diagnostic:
      "Avalia foco no cliente ideal, proposta de valor, leitura competitiva e consistência de posicionamento.",
  },
  {
    id: "growthMachine",
    title: "Máquina de Crescimento",
    shortTitle: "Crescimento",
    weight: 20,
    diagnostic:
      "Avalia previsibilidade comercial, alinhamento entre marketing e vendas, canais e indicadores de crescimento.",
  },
  {
    id: "execution",
    title: "Execução e Gestão",
    shortTitle: "Execução",
    weight: 20,
    diagnostic:
      "Avalia disciplina de gestão, acompanhamento de prioridades, responsabilidades e capacidade de corrigir desvios.",
  },
  {
    id: "leadership",
    title: "Liderança e Cultura de Crescimento",
    shortTitle: "Liderança",
    weight: 20,
    diagnostic:
      "Avalia responsabilidade das lideranças, desenvolvimento de pessoas, colaboração e cultura de aprendizado.",
  },
];

export const CGI_QUESTIONS: CgiQuestion[] = [
  {
    id: "q1",
    dimensionId: "strategy",
    text: "Nossa empresa possui uma visão clara de onde quer estar nos próximos três anos.",
    helpText:
      "Avalie se existe uma direção futura compreendida pela liderança, não apenas uma ambição genérica de crescer.",
  },
  {
    id: "q2",
    dimensionId: "strategy",
    text: "As principais lideranças compartilham a mesma compreensão das prioridades estratégicas.",
    helpText:
      "Considere se diretoria, sócios e líderes tomam decisões com base nas mesmas prioridades ou se cada área opera com uma agenda própria.",
  },
  {
    id: "q3",
    dimensionId: "strategy",
    text: "Sabemos claramente quais oportunidades NÃO perseguiremos nos próximos 12 meses.",
    helpText:
      "Estratégia também é renúncia. Uma empresa madura sabe quais projetos, segmentos ou apostas devem ficar fora do foco agora.",
  },
  {
    id: "q4",
    dimensionId: "strategy",
    text: "As decisões de investimento seguem prioridades estratégicas definidas.",
    helpText:
      "Observe se contratações, tecnologia, marketing, expansão e novos projetos recebem recursos por critério estratégico ou por pressão do momento.",
  },
  {
    id: "q5",
    dimensionId: "strategy",
    text: "Os objetivos estratégicos são traduzidos em metas concretas para as equipes.",
    helpText:
      "A estratégia precisa chegar ao dia a dia. Avalie se as equipes sabem como suas metas contribuem para a direção maior da empresa.",
  },
  {
    id: "q6",
    dimensionId: "strategy",
    text: "Revisamos nossa estratégia de forma estruturada pelo menos uma vez por ano.",
    helpText:
      "Considere se há ritos formais de revisão estratégica, com dados, aprendizados e decisões, em vez de conversas soltas e reativas.",
  },
  {
    id: "q7",
    dimensionId: "strategy",
    text: "Conseguimos explicar de forma simples por que nossa empresa cresce ou não cresce.",
    helpText:
      "Uma boa leitura estratégica permite explicar os motores e freios do crescimento sem depender de justificativas vagas.",
  },
  {
    id: "q8",
    dimensionId: "strategy",
    text: "Temos clareza sobre os principais gargalos que limitam nossa próxima fase de crescimento.",
    helpText:
      "Avalie se a liderança sabe quais poucos gargalos precisam ser removidos primeiro para destravar a próxima etapa.",
  },
  {
    id: "q9",
    dimensionId: "market",
    text: "Temos uma definição clara do nosso cliente ideal.",
    helpText:
      "Cliente ideal não é qualquer comprador. É o perfil com maior aderência, valor e potencial de crescimento para a empresa.",
  },
  {
    id: "q10",
    dimensionId: "market",
    text: "Nossa proposta de valor é facilmente compreendida pelos clientes.",
    helpText:
      "Considere se o mercado entende rapidamente que problema a empresa resolve, por que isso importa e por que escolher vocês.",
  },
  {
    id: "q11",
    dimensionId: "market",
    text: "Sabemos exatamente por que os clientes nos escolhem em vez dos concorrentes.",
    helpText:
      "Avalie se a empresa conhece seus diferenciais reais a partir da visão do cliente, não apenas do discurso interno.",
  },
  {
    id: "q12",
    dimensionId: "market",
    text: "Possuímos processos regulares para ouvir clientes e aprender com eles.",
    helpText:
      "Inclui entrevistas, feedbacks, pesquisas, análise de perdas e conversas estruturadas que geram decisões práticas.",
  },
  {
    id: "q13",
    dimensionId: "market",
    text: "Monitoramos concorrentes e movimentos de mercado de forma estruturada.",
    helpText:
      "Observe se a empresa acompanha mudanças competitivas, tecnológicas e comportamentais de modo contínuo, não apenas quando perde uma venda.",
  },
  {
    id: "q14",
    dimensionId: "market",
    text: "Temos clareza sobre quais segmentos oferecem maior potencial de crescimento.",
    helpText:
      "Avalie se há segmentação por potencial, margem, ciclo de venda, aderência e capacidade de execução.",
  },
  {
    id: "q15",
    dimensionId: "market",
    text: "Conseguimos identificar rapidamente mudanças relevantes no comportamento dos clientes.",
    helpText:
      "Empresas maduras percebem sinais de mudança cedo: objeções novas, canais diferentes, novas expectativas e queda de valor percebido.",
  },
  {
    id: "q16",
    dimensionId: "market",
    text: "Nossa empresa é percebida pelo mercado de forma consistente com o posicionamento desejado.",
    helpText:
      "Compare o posicionamento pretendido com a percepção real de clientes, prospects, parceiros e talentos.",
  },
  {
    id: "q17",
    dimensionId: "growthMachine",
    text: "Nossa empresa possui metas claras de crescimento para os próximos 12 meses.",
    helpText:
      "Metas claras indicam quanto crescer, onde crescer, com quais indicadores e quais limites de margem ou capacidade.",
  },
  {
    id: "q18",
    dimensionId: "growthMachine",
    text: "Conseguimos prever nossa receita futura com razoável precisão.",
    helpText:
      "Avalie a qualidade do forecast, pipeline, recorrência, carteira e visibilidade sobre entradas futuras de receita.",
  },
  {
    id: "q19",
    dimensionId: "growthMachine",
    text: "A geração de novos clientes ocorre de forma consistente ao longo do ano.",
    helpText:
      "Consistência significa não depender apenas de indicações ocasionais, sazonalidade ou esforço comercial de última hora.",
  },
  {
    id: "q20",
    dimensionId: "growthMachine",
    text: "Marketing e vendas trabalham com objetivos alinhados.",
    helpText:
      "Observe se as áreas compartilham ICP, metas, critérios de qualificação, mensagens e responsabilidade sobre conversão.",
  },
  {
    id: "q21",
    dimensionId: "growthMachine",
    text: "Conhecemos os principais indicadores que explicam nosso crescimento.",
    helpText:
      "Inclui indicadores como geração de demanda, conversão, ticket, churn, margem, ciclo de venda e produtividade comercial.",
  },
  {
    id: "q22",
    dimensionId: "growthMachine",
    text: "Dependemos pouco de uma única pessoa, canal ou cliente para crescer.",
    helpText:
      "Alta dependência aumenta risco. Avalie concentração em fundadores, vendedores específicos, poucos clientes ou um único canal de aquisição.",
  },
  {
    id: "q23",
    dimensionId: "growthMachine",
    text: "Nosso processo comercial é documentado e replicável.",
    helpText:
      "Considere se a venda depende de improviso ou se há etapas, critérios, materiais, playbook e gestão de pipeline.",
  },
  {
    id: "q24",
    dimensionId: "growthMachine",
    text: "Sabemos quais iniciativas têm maior impacto sobre receita e lucratividade.",
    helpText:
      "Empresas maduras priorizam iniciativas por impacto econômico, não apenas por urgência, preferência interna ou visibilidade.",
  },
  {
    id: "q25",
    dimensionId: "execution",
    text: "As prioridades da empresa são acompanhadas regularmente pelas lideranças.",
    helpText:
      "Avalie se há cadência de gestão para revisar prioridades, tomar decisões e remover obstáculos.",
  },
  {
    id: "q26",
    dimensionId: "execution",
    text: "Existe clareza sobre quem é responsável por cada objetivo relevante.",
    helpText:
      "Responsabilidade clara reduz zona cinzenta. Cada objetivo importante precisa ter dono, prazo e critério de sucesso.",
  },
  {
    id: "q27",
    dimensionId: "execution",
    text: "As reuniões de gestão resultam em decisões e ações concretas.",
    helpText:
      "Considere se as reuniões terminam com decisões, responsáveis e próximos passos, ou apenas com atualização de status.",
  },
  {
    id: "q28",
    dimensionId: "execution",
    text: "Utilizamos indicadores para orientar decisões importantes.",
    helpText:
      "Dados não substituem julgamento, mas reduzem decisões baseadas apenas em opinião, hierarquia ou urgência.",
  },
  {
    id: "q29",
    dimensionId: "execution",
    text: "Projetos estratégicos costumam ser concluídos dentro do prazo esperado.",
    helpText:
      "Avalie a capacidade de transformar intenção em entrega, mesmo quando surgem imprevistos e pressões operacionais.",
  },
  {
    id: "q30",
    dimensionId: "execution",
    text: "Conseguimos identificar rapidamente desvios de desempenho.",
    helpText:
      "Desvios precisam aparecer cedo o bastante para permitir correção, não apenas depois que a meta já foi perdida.",
  },
  {
    id: "q31",
    dimensionId: "execution",
    text: "Problemas recorrentes são tratados em suas causas e não apenas em seus sintomas.",
    helpText:
      "Considere se a empresa resolve a origem dos problemas ou apenas apaga incêndios repetidos com as mesmas soluções temporárias.",
  },
  {
    id: "q32",
    dimensionId: "execution",
    text: "Existe disciplina na execução mesmo durante períodos de pressão ou mudança.",
    helpText:
      "A maturidade aparece quando a empresa mantém foco, ritos e responsabilidades mesmo em fases turbulentas.",
  },
  {
    id: "q33",
    dimensionId: "leadership",
    text: "Nossas lideranças assumem responsabilidade pelos resultados da empresa.",
    helpText:
      "Avalie se líderes se colocam como donos do resultado ou se transferem responsabilidade para contexto, equipe ou outras áreas.",
  },
  {
    id: "q34",
    dimensionId: "leadership",
    text: "Os líderes desenvolvem pessoas e formam sucessores.",
    helpText:
      "Crescimento sustentável exige líderes capazes de ampliar capacidade organizacional, não apenas entregar por esforço individual.",
  },
  {
    id: "q35",
    dimensionId: "leadership",
    text: "Feedback faz parte da rotina de gestão.",
    helpText:
      "Considere se conversas sobre desempenho, comportamento e desenvolvimento acontecem com frequência e clareza.",
  },
  {
    id: "q36",
    dimensionId: "leadership",
    text: "A empresa consegue atrair e reter talentos relevantes.",
    helpText:
      "Avalie se a proposta para talentos, liderança, cultura e perspectiva de crescimento sustentam a retenção das pessoas certas.",
  },
  {
    id: "q37",
    dimensionId: "leadership",
    text: "Existe colaboração efetiva entre áreas.",
    helpText:
      "Colaboração efetiva aparece em decisões, prioridades compartilhadas e resolução de conflitos, não apenas em bom relacionamento.",
  },
  {
    id: "q38",
    dimensionId: "leadership",
    text: "As decisões difíceis são tomadas quando necessárias.",
    helpText:
      "Inclui decisões sobre pessoas, foco, cortes, investimentos, clientes, canais e mudanças que a empresa evita adiar.",
  },
  {
    id: "q39",
    dimensionId: "leadership",
    text: "A cultura favorece aprendizado, adaptação e melhoria contínua.",
    helpText:
      "Avalie se erros geram aprendizado, se ideias circulam e se a empresa se adapta sem perder responsabilidade por resultado.",
  },
  {
    id: "q40",
    dimensionId: "leadership",
    text: "O time demonstra comprometimento genuíno com os objetivos da empresa.",
    helpText:
      "Comprometimento genuíno aparece em energia, prioridade, colaboração e disposição para enfrentar trade-offs reais.",
  },
];

export const CGI_LEVELS: CgiLevel[] = [
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

export const CGI_QUALIFICATION_FIELDS: CgiQualificationField[] = [
  {
    id: "employeeCount",
    label: "Número de funcionários",
    options: ["1-10", "11-50", "51-200", "201-1000", "Mais de 1000"],
  },
  {
    id: "annualRevenue",
    label: "Faturamento anual aproximado",
    options: [
      "Até R$ 1 milhão",
      "R$ 1-10 milhões",
      "R$ 10-50 milhões",
      "R$ 50-200 milhões",
      "Acima de R$ 200 milhões",
      "Prefiro não informar",
    ],
  },
  {
    id: "currentChallenge",
    label: "Principal desafio atual",
    options: [
      "Crescer receita",
      "Reduzir despesas",
      "Aumentar margem",
      "Estruturar gestão",
      "Escalar vendas",
      "Desenvolver lideranças",
      "Transformação digital/IA",
      "Outro",
    ],
  },
  {
    id: "growthGoal",
    label: "Meta de crescimento para os próximos 12 meses",
    options: ["Até 10%", "11-25%", "26-50%", "Acima de 50%", "Não sei informar"],
  },
  {
    id: "investmentIntent",
    label:
      "Pretende investir em crescimento e desenvolvimento da organização nos próximos 12 meses?",
    options: ["Sim", "Não", "Ainda avaliando"],
  },
];

export const CGI_PRIMARY_CTA = {
  label: "Agendar uma conversa estratégica",
  href: "/contato",
} as const;
