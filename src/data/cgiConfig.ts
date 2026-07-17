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
  label: "Solicitar uma conversa estratégica",
  href: "/contato",
} as const;

export type CgiLocalizedConfig = {
  scale: typeof CGI_SCALE;
  dimensions: CgiDimension[];
  questions: CgiQuestion[];
  levels: CgiLevel[];
  qualificationFields: CgiQualificationField[];
  primaryCta: {
    label: string;
    href: string;
  };
};

const cgiQuestionTranslations: Record<
  "en" | "es",
  Record<string, { text: string; helpText: string }>
> = {
  en: {
    q1: { text: "Our company has a clear view of where it wants to be in the next three years.", helpText: "Assess whether leadership understands a future direction, not only a generic ambition to grow." },
    q2: { text: "The main leaders share the same understanding of strategic priorities.", helpText: "Consider whether directors, partners and leaders make decisions from the same priorities or if each area follows its own agenda." },
    q3: { text: "We clearly know which opportunities we will NOT pursue in the next 12 months.", helpText: "Strategy also requires renunciation. A mature company knows which projects, segments or bets should stay outside the current focus." },
    q4: { text: "Investment decisions follow defined strategic priorities.", helpText: "Observe whether hiring, technology, marketing, expansion and new projects receive resources by strategic criteria or by immediate pressure." },
    q5: { text: "Strategic objectives are translated into concrete goals for teams.", helpText: "Strategy must reach daily work. Assess whether teams know how their goals contribute to the broader direction." },
    q6: { text: "We review our strategy in a structured way at least once a year.", helpText: "Consider whether there are formal strategy-review rituals with data, learning and decisions, instead of loose reactive conversations." },
    q7: { text: "We can explain simply why our company grows or does not grow.", helpText: "A strong strategic reading explains the drivers and constraints of growth without relying on vague justifications." },
    q8: { text: "We have clarity on the main bottlenecks limiting our next growth phase.", helpText: "Assess whether leadership knows the few bottlenecks that must be removed first to unlock the next stage." },
    q9: { text: "We have a clear definition of our ideal customer.", helpText: "The ideal customer is not any buyer. It is the profile with stronger fit, value and growth potential for the company." },
    q10: { text: "Our value proposition is easily understood by customers.", helpText: "Consider whether the market quickly understands which problem the company solves, why it matters and why it should choose you." },
    q11: { text: "We know exactly why customers choose us instead of competitors.", helpText: "Assess whether the company knows its real differentiators from the customer's point of view, not only from internal discourse." },
    q12: { text: "We have regular processes to listen to customers and learn from them.", helpText: "This includes interviews, feedback, surveys, loss analysis and structured conversations that generate practical decisions." },
    q13: { text: "We monitor competitors and market movements in a structured way.", helpText: "Observe whether the company tracks competitive, technological and behavioral shifts continuously, not only after losing a sale." },
    q14: { text: "We know which segments offer the greatest growth potential.", helpText: "Assess whether segmentation considers potential, margin, sales cycle, fit and execution capacity." },
    q15: { text: "We can quickly identify relevant changes in customer behavior.", helpText: "Mature companies detect change early: new objections, different channels, new expectations and lower perceived value." },
    q16: { text: "The market perceives our company consistently with our desired positioning.", helpText: "Compare intended positioning with the actual perception of customers, prospects, partners and talent." },
    q17: { text: "Our company has clear growth goals for the next 12 months.", helpText: "Clear goals indicate how much to grow, where to grow, with which indicators and under which margin or capacity limits." },
    q18: { text: "We can forecast future revenue with reasonable accuracy.", helpText: "Assess the quality of forecast, pipeline, recurrence, portfolio and visibility over future revenue inflows." },
    q19: { text: "New customer generation happens consistently throughout the year.", helpText: "Consistency means not depending only on occasional referrals, seasonality or last-minute commercial effort." },
    q20: { text: "Marketing and sales work with aligned objectives.", helpText: "Observe whether the areas share ICP, goals, qualification criteria, messages and responsibility for conversion." },
    q21: { text: "We know the main indicators that explain our growth.", helpText: "This includes demand generation, conversion, ticket, churn, margin, sales cycle and commercial productivity." },
    q22: { text: "We depend little on a single person, channel or customer to grow.", helpText: "High dependency increases risk. Assess concentration in founders, specific salespeople, few customers or one acquisition channel." },
    q23: { text: "Our commercial process is documented and replicable.", helpText: "Consider whether sales depend on improvisation or on stages, criteria, materials, playbooks and pipeline management." },
    q24: { text: "We know which initiatives have the greatest impact on revenue and profitability.", helpText: "Mature companies prioritize initiatives by economic impact, not only urgency, internal preference or visibility." },
    q25: { text: "Company priorities are regularly followed up by leaders.", helpText: "Assess whether there is a management cadence to review priorities, make decisions and remove obstacles." },
    q26: { text: "There is clarity about who is responsible for each relevant objective.", helpText: "Clear accountability reduces gray zones. Each important objective needs an owner, deadline and success criteria." },
    q27: { text: "Management meetings result in concrete decisions and actions.", helpText: "Consider whether meetings end with decisions, owners and next steps, or only with status updates." },
    q28: { text: "We use indicators to guide important decisions.", helpText: "Data does not replace judgment, but it reduces decisions based only on opinion, hierarchy or urgency." },
    q29: { text: "Strategic projects are usually completed within the expected deadline.", helpText: "Assess the ability to turn intention into delivery, even when unexpected issues and operating pressure arise." },
    q30: { text: "We can quickly identify performance deviations.", helpText: "Deviations must appear early enough for correction, not only after the target has already been missed." },
    q31: { text: "Recurring problems are addressed at their causes, not only their symptoms.", helpText: "Consider whether the company solves the origin of problems or only repeatedly manages emergencies with temporary solutions." },
    q32: { text: "There is execution discipline even during periods of pressure or change.", helpText: "Maturity appears when the company maintains focus, rituals and accountability during turbulent phases." },
    q33: { text: "Our leaders take responsibility for company results.", helpText: "Assess whether leaders act as owners of the result or transfer responsibility to context, team or other areas." },
    q34: { text: "Leaders develop people and build successors.", helpText: "Sustainable growth requires leaders who expand organizational capacity, not only deliver through individual effort." },
    q35: { text: "Feedback is part of the management routine.", helpText: "Consider whether conversations about performance, behavior and development happen frequently and clearly." },
    q36: { text: "The company can attract and retain relevant talent.", helpText: "Assess whether the talent proposition, leadership, culture and growth perspective sustain retention of the right people." },
    q37: { text: "There is effective collaboration across areas.", helpText: "Effective collaboration appears in decisions, shared priorities and conflict resolution, not only in good relationships." },
    q38: { text: "Difficult decisions are made when necessary.", helpText: "This includes decisions about people, focus, cuts, investments, customers, channels and changes the company tends to postpone." },
    q39: { text: "The culture favors learning, adaptation and continuous improvement.", helpText: "Assess whether mistakes generate learning, ideas circulate and the company adapts without losing accountability for results." },
    q40: { text: "The team shows genuine commitment to company objectives.", helpText: "Genuine commitment appears in energy, priority, collaboration and willingness to face real trade-offs." },
  },
  es: {
    q1: { text: "Nuestra empresa tiene una visión clara de dónde quiere estar en los próximos tres años.", helpText: "Evalúe si existe una dirección futura comprendida por el liderazgo, no solo una ambición genérica de crecer." },
    q2: { text: "Los principales líderes comparten la misma comprensión de las prioridades estratégicas.", helpText: "Considere si directores, socios y líderes deciden a partir de las mismas prioridades o si cada área opera con su propia agenda." },
    q3: { text: "Sabemos claramente qué oportunidades NO perseguiremos en los próximos 12 meses.", helpText: "La estrategia también exige renuncia. Una empresa madura sabe qué proyectos, segmentos o apuestas deben quedar fuera del foco actual." },
    q4: { text: "Las decisiones de inversión siguen prioridades estratégicas definidas.", helpText: "Observe si contrataciones, tecnología, marketing, expansión y nuevos proyectos reciben recursos por criterio estratégico o por presión del momento." },
    q5: { text: "Los objetivos estratégicos se traducen en metas concretas para los equipos.", helpText: "La estrategia debe llegar al día a día. Evalúe si los equipos saben cómo sus metas contribuyen a la dirección mayor." },
    q6: { text: "Revisamos nuestra estrategia de forma estructurada al menos una vez al año.", helpText: "Considere si hay rituales formales de revisión estratégica, con datos, aprendizajes y decisiones, en lugar de conversaciones sueltas y reactivas." },
    q7: { text: "Podemos explicar de forma simple por qué nuestra empresa crece o no crece.", helpText: "Una buena lectura estratégica permite explicar los motores y frenos del crecimiento sin depender de justificaciones vagas." },
    q8: { text: "Tenemos claridad sobre los principales cuellos de botella que limitan nuestra próxima fase de crecimiento.", helpText: "Evalúe si el liderazgo sabe cuáles pocos cuellos de botella deben removerse primero para destrabar la próxima etapa." },
    q9: { text: "Tenemos una definición clara de nuestro cliente ideal.", helpText: "El cliente ideal no es cualquier comprador. Es el perfil con mayor ajuste, valor y potencial de crecimiento para la empresa." },
    q10: { text: "Nuestra propuesta de valor es fácilmente comprendida por los clientes.", helpText: "Considere si el mercado entiende rápidamente qué problema resuelve la empresa, por qué importa y por qué elegirlos." },
    q11: { text: "Sabemos exactamente por qué los clientes nos eligen en lugar de los competidores.", helpText: "Evalúe si la empresa conoce sus diferenciales reales desde la visión del cliente, no solo desde el discurso interno." },
    q12: { text: "Tenemos procesos regulares para escuchar a los clientes y aprender de ellos.", helpText: "Incluye entrevistas, feedback, encuestas, análisis de pérdidas y conversaciones estructuradas que generan decisiones prácticas." },
    q13: { text: "Monitoreamos competidores y movimientos de mercado de forma estructurada.", helpText: "Observe si la empresa acompaña cambios competitivos, tecnológicos y de comportamiento de forma continua, no solo cuando pierde una venta." },
    q14: { text: "Tenemos claridad sobre qué segmentos ofrecen mayor potencial de crecimiento.", helpText: "Evalúe si hay segmentación por potencial, margen, ciclo de venta, ajuste y capacidad de ejecución." },
    q15: { text: "Podemos identificar rápidamente cambios relevantes en el comportamiento de los clientes.", helpText: "Las empresas maduras perciben señales de cambio temprano: objeciones nuevas, canales diferentes, nuevas expectativas y caída del valor percibido." },
    q16: { text: "Nuestra empresa es percibida por el mercado de forma coherente con el posicionamiento deseado.", helpText: "Compare el posicionamiento pretendido con la percepción real de clientes, prospectos, socios y talento." },
    q17: { text: "Nuestra empresa tiene metas claras de crecimiento para los próximos 12 meses.", helpText: "Metas claras indican cuánto crecer, dónde crecer, con qué indicadores y bajo qué límites de margen o capacidad." },
    q18: { text: "Podemos prever nuestros ingresos futuros con precisión razonable.", helpText: "Evalúe la calidad del forecast, pipeline, recurrencia, cartera y visibilidad sobre ingresos futuros." },
    q19: { text: "La generación de nuevos clientes ocurre de forma consistente durante el año.", helpText: "Consistencia significa no depender solo de recomendaciones ocasionales, estacionalidad o esfuerzo comercial de última hora." },
    q20: { text: "Marketing y ventas trabajan con objetivos alineados.", helpText: "Observe si las áreas comparten ICP, metas, criterios de calificación, mensajes y responsabilidad sobre la conversión." },
    q21: { text: "Conocemos los principales indicadores que explican nuestro crecimiento.", helpText: "Incluye generación de demanda, conversión, ticket, churn, margen, ciclo de venta y productividad comercial." },
    q22: { text: "Dependemos poco de una única persona, canal o cliente para crecer.", helpText: "La alta dependencia aumenta el riesgo. Evalúe concentración en fundadores, vendedores específicos, pocos clientes o un único canal de adquisición." },
    q23: { text: "Nuestro proceso comercial está documentado y es replicable.", helpText: "Considere si la venta depende de improvisación o si hay etapas, criterios, materiales, playbook y gestión de pipeline." },
    q24: { text: "Sabemos qué iniciativas tienen mayor impacto sobre ingresos y rentabilidad.", helpText: "Empresas maduras priorizan iniciativas por impacto económico, no solo por urgencia, preferencia interna o visibilidad." },
    q25: { text: "Las prioridades de la empresa son acompañadas regularmente por los líderes.", helpText: "Evalúe si hay una cadencia de gestión para revisar prioridades, tomar decisiones y remover obstáculos." },
    q26: { text: "Existe claridad sobre quién es responsable por cada objetivo relevante.", helpText: "La responsabilidad clara reduce zonas grises. Cada objetivo importante necesita dueño, plazo y criterio de éxito." },
    q27: { text: "Las reuniones de gestión resultan en decisiones y acciones concretas.", helpText: "Considere si las reuniones terminan con decisiones, responsables y próximos pasos, o solo con actualización de estado." },
    q28: { text: "Usamos indicadores para orientar decisiones importantes.", helpText: "Los datos no sustituyen el juicio, pero reducen decisiones basadas solo en opinión, jerarquía o urgencia." },
    q29: { text: "Los proyectos estratégicos suelen concluirse dentro del plazo esperado.", helpText: "Evalúe la capacidad de transformar intención en entrega, incluso cuando surgen imprevistos y presiones operativas." },
    q30: { text: "Podemos identificar rápidamente desvíos de desempeño.", helpText: "Los desvíos deben aparecer temprano para permitir corrección, no solo después de que la meta ya se perdió." },
    q31: { text: "Los problemas recurrentes se tratan en sus causas y no solo en sus síntomas.", helpText: "Considere si la empresa resuelve el origen de los problemas o solo apaga urgencias repetidas con soluciones temporales." },
    q32: { text: "Existe disciplina en la ejecución incluso durante períodos de presión o cambio.", helpText: "La madurez aparece cuando la empresa mantiene foco, rituales y responsabilidades en fases turbulentas." },
    q33: { text: "Nuestros líderes asumen responsabilidad por los resultados de la empresa.", helpText: "Evalúe si los líderes se colocan como dueños del resultado o transfieren responsabilidad al contexto, al equipo u otras áreas." },
    q34: { text: "Los líderes desarrollan personas y forman sucesores.", helpText: "El crecimiento sostenible exige líderes capaces de ampliar la capacidad organizacional, no solo entregar por esfuerzo individual." },
    q35: { text: "El feedback forma parte de la rutina de gestión.", helpText: "Considere si las conversaciones sobre desempeño, comportamiento y desarrollo ocurren con frecuencia y claridad." },
    q36: { text: "La empresa puede atraer y retener talento relevante.", helpText: "Evalúe si la propuesta para talentos, liderazgo, cultura y perspectiva de crecimiento sostienen la retención de las personas correctas." },
    q37: { text: "Existe colaboración efectiva entre áreas.", helpText: "La colaboración efectiva aparece en decisiones, prioridades compartidas y resolución de conflictos, no solo en buen relacionamiento." },
    q38: { text: "Las decisiones difíciles se toman cuando son necesarias.", helpText: "Incluye decisiones sobre personas, foco, recortes, inversiones, clientes, canales y cambios que la empresa evita postergar." },
    q39: { text: "La cultura favorece aprendizaje, adaptación y mejora continua.", helpText: "Evalúe si los errores generan aprendizaje, si las ideas circulan y si la empresa se adapta sin perder responsabilidad por resultados." },
    q40: { text: "El equipo demuestra compromiso genuino con los objetivos de la empresa.", helpText: "El compromiso genuino aparece en energía, prioridad, colaboración y disposición para enfrentar trade-offs reales." },
  },
};

export const CGI_LOCALIZED_CONFIG: Record<"pt" | "en" | "es", CgiLocalizedConfig> = {
  pt: {
    scale: CGI_SCALE,
    dimensions: CGI_DIMENSIONS,
    questions: CGI_QUESTIONS,
    levels: CGI_LEVELS,
    qualificationFields: CGI_QUALIFICATION_FIELDS,
    primaryCta: CGI_PRIMARY_CTA,
  },
  en: {
    scale: [
      { value: 1, label: "Strongly disagree" },
      { value: 2, label: "Partially disagree" },
      { value: 3, label: "Neither agree nor disagree" },
      { value: 4, label: "Partially agree" },
      { value: 5, label: "Strongly agree" },
    ] as typeof CGI_SCALE,
    dimensions: [
      { id: "strategy", title: "Strategy", shortTitle: "Strategy", weight: 20, diagnostic: "Assesses clarity of direction, priorities, choices and translation of strategy into concrete goals." },
      { id: "market", title: "Market and Customer", shortTitle: "Market", weight: 20, diagnostic: "Assesses ideal-customer focus, value proposition, competitive reading and positioning consistency." },
      { id: "growthMachine", title: "Growth Machine", shortTitle: "Growth", weight: 20, diagnostic: "Assesses commercial predictability, marketing-sales alignment, channels and growth indicators." },
      { id: "execution", title: "Execution and Management", shortTitle: "Execution", weight: 20, diagnostic: "Assesses management discipline, priority follow-up, responsibilities and ability to correct deviations." },
      { id: "leadership", title: "Leadership and Growth Culture", shortTitle: "Leadership", weight: 20, diagnostic: "Assesses leadership accountability, people development, collaboration and learning culture." },
    ],
    questions: CGI_QUESTIONS.map((question) => ({
      ...question,
      ...cgiQuestionTranslations.en[question.id],
    })),
    levels: [
      { id: "reactive", min: 0, max: 39, title: "Reactive Growth", summary: "Growth depends more on isolated efforts, urgencies and occasional opportunities than on a consistent management system.", recommendation: "The focus should be to create strategic clarity, identify a few critical bottlenecks and establish a basic execution cadence." },
      { id: "intentional", min: 40, max: 59, title: "Intentional Growth", summary: "The company already has clear growth intent, but still operates with relevant gaps in predictability, focus or discipline.", recommendation: "The next step is to turn intent into a system: goals, indicators, management rituals and clearer responsibilities." },
      { id: "structured", min: 60, max: 79, title: "Structured Growth", summary: "The company has important growth foundations, but may still be limited by misalignments or specific bottlenecks.", recommendation: "The focus should be to strengthen weaker points, increase predictability and reduce dependence on isolated people or channels." },
      { id: "scalable", min: 80, max: 100, title: "Scalable Growth", summary: "The company shows a high level of maturity and tends to grow with more consistency, provided it preserves focus and adaptability.", recommendation: "The next challenge is to sophisticate the growth machine, accelerate learning and prepare leaders for larger scale cycles." },
    ],
    qualificationFields: [
      { id: "employeeCount", label: "Number of employees", options: ["1-10", "11-50", "51-200", "201-1000", "More than 1000"] },
      { id: "annualRevenue", label: "Approximate annual revenue", options: ["Up to US$ 200k", "US$ 200k-2M", "US$ 2M-10M", "US$ 10M-40M", "Above US$ 40M", "Prefer not to say"] },
      { id: "currentChallenge", label: "Main current challenge", options: ["Grow revenue", "Reduce expenses", "Increase margin", "Structure management", "Scale sales", "Develop leaders", "Digital/AI transformation", "Other"] },
      { id: "growthGoal", label: "Growth target for the next 12 months", options: ["Up to 10%", "11-25%", "26-50%", "Above 50%", "I don't know"] },
      { id: "investmentIntent", label: "Do you intend to invest in organizational growth and development in the next 12 months?", options: ["Yes", "No", "Still evaluating"] },
    ],
    primaryCta: { label: "Request a strategic conversation", href: "/en/contact" },
  },
  es: {
    scale: [
      { value: 1, label: "Totalmente en desacuerdo" },
      { value: 2, label: "Parcialmente en desacuerdo" },
      { value: 3, label: "Ni de acuerdo ni en desacuerdo" },
      { value: 4, label: "Parcialmente de acuerdo" },
      { value: 5, label: "Totalmente de acuerdo" },
    ] as typeof CGI_SCALE,
    dimensions: [
      { id: "strategy", title: "Estrategia", shortTitle: "Estrategia", weight: 20, diagnostic: "Evalúa claridad de dirección, prioridades, elecciones y traducción de la estrategia en metas concretas." },
      { id: "market", title: "Mercado y Cliente", shortTitle: "Mercado", weight: 20, diagnostic: "Evalúa foco en el cliente ideal, propuesta de valor, lectura competitiva y consistencia de posicionamiento." },
      { id: "growthMachine", title: "Máquina de Crecimiento", shortTitle: "Crecimiento", weight: 20, diagnostic: "Evalúa previsibilidad comercial, alineación entre marketing y ventas, canales e indicadores de crecimiento." },
      { id: "execution", title: "Ejecución y Gestión", shortTitle: "Ejecución", weight: 20, diagnostic: "Evalúa disciplina de gestión, seguimiento de prioridades, responsabilidades y capacidad de corregir desvíos." },
      { id: "leadership", title: "Liderazgo y Cultura de Crecimiento", shortTitle: "Liderazgo", weight: 20, diagnostic: "Evalúa responsabilidad del liderazgo, desarrollo de personas, colaboración y cultura de aprendizaje." },
    ],
    questions: CGI_QUESTIONS.map((question) => ({
      ...question,
      ...cgiQuestionTranslations.es[question.id],
    })),
    levels: [
      { id: "reactive", min: 0, max: 39, title: "Crecimiento Reactivo", summary: "El crecimiento depende más de esfuerzos puntuales, urgencias y oportunidades aisladas que de un sistema de gestión consistente.", recommendation: "El foco debe ser crear claridad estratégica, identificar pocos cuellos de botella críticos y establecer una cadencia básica de ejecución." },
      { id: "intentional", min: 40, max: 59, title: "Crecimiento Intencional", summary: "La empresa ya tiene intención clara de crecimiento, pero todavía opera con brechas relevantes de previsibilidad, foco o disciplina.", recommendation: "El próximo paso es transformar intención en sistema: metas, indicadores, rituales de gestión y responsabilidades más nítidas." },
      { id: "structured", min: 60, max: 79, title: "Crecimiento Estructurado", summary: "La empresa tiene fundamentos importantes de crecimiento, pero aún puede estar limitada por desalineamientos o cuellos de botella específicos.", recommendation: "El foco debe ser fortalecer los puntos más débiles, aumentar previsibilidad y reducir dependencia de personas o canales aislados." },
      { id: "scalable", min: 80, max: 100, title: "Crecimiento Escalable", summary: "La empresa demuestra alto nivel de madurez y tiende a crecer con más consistencia, siempre que preserve foco y capacidad de adaptación.", recommendation: "El próximo desafío es sofisticar la máquina de crecimiento, acelerar aprendizajes y preparar liderazgos para ciclos mayores de escala." },
    ],
    qualificationFields: [
      { id: "employeeCount", label: "Número de empleados", options: ["1-10", "11-50", "51-200", "201-1000", "Más de 1000"] },
      { id: "annualRevenue", label: "Facturación anual aproximada", options: ["Hasta US$ 200k", "US$ 200k-2M", "US$ 2M-10M", "US$ 10M-40M", "Más de US$ 40M", "Prefiero no informar"] },
      { id: "currentChallenge", label: "Principal desafío actual", options: ["Crecer ingresos", "Reducir gastos", "Aumentar margen", "Estructurar gestión", "Escalar ventas", "Desarrollar líderes", "Transformación digital/IA", "Otro"] },
      { id: "growthGoal", label: "Meta de crecimiento para los próximos 12 meses", options: ["Hasta 10%", "11-25%", "26-50%", "Más de 50%", "No sé informar"] },
      { id: "investmentIntent", label: "¿Pretende invertir en crecimiento y desarrollo de la organización en los próximos 12 meses?", options: ["Sí", "No", "Aún evaluando"] },
    ],
    primaryCta: { label: "Solicitar una conversación estratégica", href: "/es/contacto" },
  },
};

export function getCgiConfig(lang: "pt" | "en" | "es"): CgiLocalizedConfig {
  return CGI_LOCALIZED_CONFIG[lang] ?? CGI_LOCALIZED_CONFIG.pt;
}
