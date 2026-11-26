import type { Language } from "@/lib/routing";

/** WhatsApp de contato da mentoria (apenas dígitos, com DDI). */
export const MENTORING_WHATSAPP = "5511970975819";

export type MentoringContent = {
  meta: { title: string; description: string };
  eyebrow: string;
  heroTitle: string;
  heroText: string;
  primaryCta: string;
  secondaryCta: string;
  formCta: string;
  whatsappMessage: string;
  whoTitle: string;
  whoIntro: string;
  who: Array<{ title: string; body: string }>;
  themesTitle: string;
  themesIntro: string;
  themeGroups: Array<{ title: string; items: Array<{ name: string; body: string }> }>;
  howTitle: string;
  steps: Array<{ title: string; body: string }>;
  formatsTitle: string;
  formats: Array<{ name: string; summary: string; items: string[] }>;
  limitsTitle: string;
  limitsIntro: string;
  limits: string[];
  aboutTitle: string;
  aboutParagraphs: string[];
  aboutFacts: string[];
  testimonialTitle: string;
  finalTitle: string;
  finalText: string;
  /** Chamada da mentoria na home. */
  home: { eyebrow: string; title: string; text: string; bullets: string[]; cta: string; heroCta: string };
};

export const mentoringContent: Record<Language, MentoringContent> = {
  pt: {
    meta: {
      title: "Mentoria Executiva | Denis Caldeira",
      description:
        "Mentoria individual para CEOs, fundadores e executivos. Um interlocutor que já esteve na cadeira, para as decisões que você hoje toma sozinho.",
    },
    eyebrow: "Mentoria executiva",
    heroTitle: "As decisões mais difíceis são as que você toma sozinho.",
    heroText:
      "Mentoria individual para CEOs, fundadores e executivos. Um interlocutor que já esteve na cadeira, sem agenda política e sem interesse no resultado além do seu.",
    primaryCta: "Agendar uma conversa",
    secondaryCta: "Ver como funciona",
    formCta: "Prefiro escrever pelo formulário",
    whatsappMessage: "Olá, Denis. Vi a página de mentoria executiva e gostaria de conversar.",
    whoTitle: "Para quem é",
    whoIntro:
      "Quanto mais alto o cargo, menos gente pode ouvir o que você realmente pensa. A mentoria existe para esse intervalo.",
    who: [
      {
        title: "CEOs e fundadores",
        body: "Quem decide por último e não tem com quem testar o raciocínio antes de levá-lo ao conselho, aos sócios ou ao time.",
      },
      {
        title: "Sócios e diretoria",
        body: "Quem divide o comando e precisa de clareza sobre papéis, sucessão, conflitos entre sócios e o próximo ciclo do negócio.",
      },
      {
        title: "Executivos em ascensão",
        body: "Quem está assumindo times maiores, lidando com a alta liderança e construindo o próximo passo da carreira.",
      },
    ],
    themesTitle: "O que trabalhamos",
    themesIntro: "A pauta é sua. Estes são os temas que mais aparecem.",
    themeGroups: [
      {
        title: "No trabalho",
        items: [
          { name: "Estratégia e visão de longo prazo", body: "para o negócio, para a área e para a sua carreira" },
          { name: "Conversas críticas e conflitos", body: "preparar a conversa difícil e conduzir o desacordo sem romper a relação" },
          { name: "Relação com conselho, sócios e gestores", body: "ser ouvido por quem decide acima ou ao lado de você" },
          { name: "Formação e cobrança do time", body: "o que delegar, a quem, e como cobrar sem centralizar" },
        ],
      },
      {
        title: "Além do cargo",
        items: [
          { name: "Pensamento crítico", body: "estruturar a decisão e questionar as próprias premissas" },
          { name: "Decisões pessoais e financeiras", body: "custo de oportunidade e visão de longo prazo sobre carreira, dinheiro e tempo" },
          { name: "Desenvolvimento pessoal", body: "autoconhecimento, valores e quem você é fora do cargo" },
        ],
      },
    ],
    howTitle: "Como funciona",
    steps: [
      { title: "Conversa inicial", body: "Vinte minutos, sem custo, para entender o seu momento e ver se a mentoria é o que você precisa agora." },
      { title: "Proposta individual", body: "Formato, duração e investimento definidos para o seu caso, por escrito." },
      { title: "Sessões", body: "Encontros online de 75 minutos. Você traz a situação real; saímos com uma decisão e um próximo passo." },
      { title: "Fechamento", body: "Na última sessão revisamos o que avançou em relação às metas definidas no início." },
    ],
    formatsTitle: "Dois formatos",
    formats: [
      {
        name: "Ciclo de 90 dias",
        summary: "Para quem quer acompanhamento ao longo de um período de decisão ou transição.",
        items: [
          "Seis sessões de 75 minutos, a cada duas semanas",
          "Duas ou três metas definidas na primeira sessão",
          "Resumo escrito das decisões após cada encontro",
          "Acesso direto por WhatsApp entre as sessões",
        ],
      },
      {
        name: "Sessão avulsa",
        summary: "Para uma decisão específica que precisa ser tomada agora.",
        items: [
          "Duas horas dedicadas a uma única questão",
          "Briefing enviado por você antes do encontro",
          "Resumo escrito com a decisão e os próximos passos",
        ],
      },
    ],
    limitsTitle: "Confidencial, e com limites claros",
    limitsIntro: "Tudo o que é conversado fica entre nós. E vale dizer o que a mentoria não é.",
    limits: [
      "Não é terapia nem acompanhamento psicológico",
      "Não é recomendação de investimento nem planejamento financeiro",
      "Não é consultoria para a sua empresa",
      "Nada é reportado à sua empresa, ao seu conselho ou a terceiros",
    ],
    aboutTitle: "Com quem você vai conversar",
    aboutParagraphs: [
      "Denis Caldeira passou por Telefônica, Google, Meta, QuintoAndar e Addi. Na Meta, liderou a organização de pequenas e médias empresas para a América Latina.",
      "Hoje é conselheiro de empresas, fundador da Caldeira Growth e autor de Cresça ou Desapareça (Alta Books). Todas as sessões são conduzidas por ele.",
    ],
    aboutFacts: ["Carreira executiva em empresas globais", "Conselheiro de empresas", "Autor de Cresça ou Desapareça"],
    testimonialTitle: "O que diz quem já trabalhou com Denis",
    finalTitle: "Comece por uma conversa de 20 minutos.",
    finalText:
      "Sem custo e sem compromisso. Se a mentoria não for o que você precisa agora, você vai ouvir isso com franqueza.",
    home: {
      eyebrow: "Mentoria executiva",
      title: "Um interlocutor para as decisões que você toma sozinho",
      text: "Mentoria individual com Denis Caldeira para CEOs, fundadores e executivos. Sessões confidenciais, com pauta definida por você.",
      bullets: [
        "Estratégia e visão de longo prazo",
        "Conversas críticas e conflitos",
        "Relação com conselho, sócios e gestores",
        "Decisões de carreira e desenvolvimento pessoal",
      ],
      cta: "Conhecer a mentoria",
      heroCta: "Conheça a mentoria executiva",
    },
  },
  en: {
    meta: {
      title: "Executive Mentoring | Denis Caldeira",
      description:
        "One-to-one mentoring for CEOs, founders and executives. A thinking partner who has held the role, for the decisions you now make alone.",
    },
    eyebrow: "Executive mentoring",
    heroTitle: "The hardest decisions are the ones you make alone.",
    heroText:
      "One-to-one mentoring for CEOs, founders and executives. A thinking partner who has held the role, with no political agenda and no stake in the outcome other than yours.",
    primaryCta: "Book a conversation",
    secondaryCta: "See how it works",
    formCta: "I prefer to write through the form",
    whatsappMessage: "Hi Denis. I saw the executive mentoring page and would like to talk.",
    whoTitle: "Who it is for",
    whoIntro:
      "The more senior the role, the fewer people can hear what you really think. Mentoring exists for that gap.",
    who: [
      {
        title: "CEOs and founders",
        body: "Those who decide last and have no one to test their reasoning with before taking it to the board, the partners or the team.",
      },
      {
        title: "Partners and senior leadership",
        body: "Those who share command and need clarity on roles, succession, conflict between partners and the next cycle of the business.",
      },
      {
        title: "Rising executives",
        body: "Those taking on larger teams, dealing with senior leadership and building the next step of their career.",
      },
    ],
    themesTitle: "What we work on",
    themesIntro: "You set the agenda. These are the themes that come up most often.",
    themeGroups: [
      {
        title: "At work",
        items: [
          { name: "Strategy and long-term vision", body: "for the business, for your area and for your career" },
          { name: "Critical conversations and conflict", body: "preparing the difficult conversation and handling disagreement without breaking the relationship" },
          { name: "Boards, partners and managers", body: "being heard by those who decide above or beside you" },
          { name: "Building and holding a team accountable", body: "what to delegate, to whom, and how to follow up without centralizing" },
        ],
      },
      {
        title: "Beyond the job",
        items: [
          { name: "Critical thinking", body: "structuring decisions and questioning your own assumptions" },
          { name: "Personal and financial decisions", body: "opportunity cost and a long-term view of career, money and time" },
          { name: "Personal development", body: "self-knowledge, values and who you are outside your title" },
        ],
      },
    ],
    howTitle: "How it works",
    steps: [
      { title: "First conversation", body: "Twenty minutes, at no cost, to understand where you are and whether mentoring is what you need now." },
      { title: "Individual proposal", body: "Format, duration and investment defined for your case, in writing." },
      { title: "Sessions", body: "Online meetings of 75 minutes. You bring the real situation; we leave with a decision and a next step." },
      { title: "Close", body: "In the last session we review progress against the goals set at the start." },
    ],
    formatsTitle: "Two formats",
    formats: [
      {
        name: "90-day cycle",
        summary: "For those who want support through a period of decision or transition.",
        items: [
          "Six sessions of 75 minutes, every two weeks",
          "Two or three goals set in the first session",
          "A written summary of decisions after each meeting",
          "Direct access by WhatsApp between sessions",
        ],
      },
      {
        name: "Single session",
        summary: "For one specific decision that needs to be made now.",
        items: [
          "Two hours dedicated to a single question",
          "A briefing sent by you before the meeting",
          "A written summary with the decision and next steps",
        ],
      },
    ],
    limitsTitle: "Confidential, and with clear limits",
    limitsIntro: "Everything discussed stays between us. It is also worth saying what mentoring is not.",
    limits: [
      "It is not therapy or psychological treatment",
      "It is not investment advice or financial planning",
      "It is not consulting for your company",
      "Nothing is reported to your company, your board or anyone else",
    ],
    aboutTitle: "Who you will talk to",
    aboutParagraphs: [
      "Denis Caldeira held leadership roles at Telefónica, Google, Meta, QuintoAndar and Addi. At Meta he led the small business organization for Latin America.",
      "Today he is a board advisor, founder of Caldeira Growth and author of Cresça ou Desapareça (Alta Books). He conducts every session himself.",
    ],
    aboutFacts: ["Executive career at global companies", "Board advisor", "Author of Cresça ou Desapareça"],
    testimonialTitle: "What people who worked with Denis say",
    finalTitle: "Start with a 20-minute conversation.",
    finalText:
      "No cost and no commitment. If mentoring is not what you need now, you will hear that plainly.",
    home: {
      eyebrow: "Executive mentoring",
      title: "A thinking partner for the decisions you make alone",
      text: "One-to-one mentoring with Denis Caldeira for CEOs, founders and executives. Confidential sessions, with the agenda set by you.",
      bullets: [
        "Strategy and long-term vision",
        "Critical conversations and conflict",
        "Boards, partners and managers",
        "Career decisions and personal development",
      ],
      cta: "Explore mentoring",
      heroCta: "Explore executive mentoring",
    },
  },
  es: {
    meta: {
      title: "Mentoría Ejecutiva | Denis Caldeira",
      description:
        "Mentoría individual para CEOs, fundadores y ejecutivos. Un interlocutor que ya estuvo en el cargo, para las decisiones que hoy usted toma solo.",
    },
    eyebrow: "Mentoría ejecutiva",
    heroTitle: "Las decisiones más difíciles son las que usted toma solo.",
    heroText:
      "Mentoría individual para CEOs, fundadores y ejecutivos. Un interlocutor que ya estuvo en el cargo, sin agenda política y sin interés en el resultado más allá del suyo.",
    primaryCta: "Agendar una conversación",
    secondaryCta: "Ver cómo funciona",
    formCta: "Prefiero escribir por el formulario",
    whatsappMessage: "Hola, Denis. Vi la página de mentoría ejecutiva y me gustaría conversar.",
    whoTitle: "Para quién es",
    whoIntro:
      "Cuanto más alto el cargo, menos personas pueden escuchar lo que usted realmente piensa. La mentoría existe para ese espacio.",
    who: [
      {
        title: "CEOs y fundadores",
        body: "Quienes deciden al final y no tienen con quién probar su razonamiento antes de llevarlo al consejo, a los socios o al equipo.",
      },
      {
        title: "Socios y alta dirección",
        body: "Quienes comparten el mando y necesitan claridad sobre roles, sucesión, conflictos entre socios y el próximo ciclo del negocio.",
      },
      {
        title: "Ejecutivos en ascenso",
        body: "Quienes están asumiendo equipos más grandes, tratando con la alta dirección y construyendo el siguiente paso de su carrera.",
      },
    ],
    themesTitle: "Qué trabajamos",
    themesIntro: "La agenda es suya. Estos son los temas que más aparecen.",
    themeGroups: [
      {
        title: "En el trabajo",
        items: [
          { name: "Estrategia y visión de largo plazo", body: "para el negocio, para el área y para su carrera" },
          { name: "Conversaciones críticas y conflictos", body: "preparar la conversación difícil y conducir el desacuerdo sin romper la relación" },
          { name: "Relación con consejo, socios y jefes", body: "ser escuchado por quienes deciden arriba o al lado de usted" },
          { name: "Formación y exigencia del equipo", body: "qué delegar, a quién, y cómo dar seguimiento sin centralizar" },
        ],
      },
      {
        title: "Más allá del cargo",
        items: [
          { name: "Pensamiento crítico", body: "estructurar la decisión y cuestionar las propias premisas" },
          { name: "Decisiones personales y financieras", body: "costo de oportunidad y visión de largo plazo sobre carrera, dinero y tiempo" },
          { name: "Desarrollo personal", body: "autoconocimiento, valores y quién es usted fuera del cargo" },
        ],
      },
    ],
    howTitle: "Cómo funciona",
    steps: [
      { title: "Conversación inicial", body: "Veinte minutos, sin costo, para entender su momento y ver si la mentoría es lo que necesita ahora." },
      { title: "Propuesta individual", body: "Formato, duración e inversión definidos para su caso, por escrito." },
      { title: "Sesiones", body: "Encuentros en línea de 75 minutos. Usted trae la situación real; salimos con una decisión y un siguiente paso." },
      { title: "Cierre", body: "En la última sesión revisamos el avance frente a las metas definidas al inicio." },
    ],
    formatsTitle: "Dos formatos",
    formats: [
      {
        name: "Ciclo de 90 días",
        summary: "Para quien quiere acompañamiento durante un período de decisión o transición.",
        items: [
          "Seis sesiones de 75 minutos, cada dos semanas",
          "Dos o tres metas definidas en la primera sesión",
          "Resumen escrito de las decisiones después de cada encuentro",
          "Acceso directo por WhatsApp entre sesiones",
        ],
      },
      {
        name: "Sesión única",
        summary: "Para una decisión específica que debe tomarse ahora.",
        items: [
          "Dos horas dedicadas a una sola cuestión",
          "Briefing enviado por usted antes del encuentro",
          "Resumen escrito con la decisión y los próximos pasos",
        ],
      },
    ],
    limitsTitle: "Confidencial, y con límites claros",
    limitsIntro: "Todo lo conversado queda entre nosotros. Y conviene decir lo que la mentoría no es.",
    limits: [
      "No es terapia ni tratamiento psicológico",
      "No es recomendación de inversión ni planificación financiera",
      "No es consultoría para su empresa",
      "Nada se reporta a su empresa, a su consejo ni a terceros",
    ],
    aboutTitle: "Con quién va a conversar",
    aboutParagraphs: [
      "Denis Caldeira ocupó cargos de liderazgo en Telefónica, Google, Meta, QuintoAndar y Addi. En Meta lideró la organización de pequeñas y medianas empresas para América Latina.",
      "Hoy es consejero de empresas, fundador de Caldeira Growth y autor de Cresça ou Desapareça (Alta Books). Todas las sesiones las conduce él.",
    ],
    aboutFacts: ["Carrera ejecutiva en empresas globales", "Consejero de empresas", "Autor de Cresça ou Desapareça"],
    testimonialTitle: "Lo que dicen quienes ya trabajaron con Denis",
    finalTitle: "Empiece por una conversación de 20 minutos.",
    finalText:
      "Sin costo y sin compromiso. Si la mentoría no es lo que necesita ahora, lo escuchará con franqueza.",
    home: {
      eyebrow: "Mentoría ejecutiva",
      title: "Un interlocutor para las decisiones que usted toma solo",
      text: "Mentoría individual con Denis Caldeira para CEOs, fundadores y ejecutivos. Sesiones confidenciales, con la agenda definida por usted.",
      bullets: [
        "Estrategia y visión de largo plazo",
        "Conversaciones críticas y conflictos",
        "Relación con consejo, socios y jefes",
        "Decisiones de carrera y desarrollo personal",
      ],
      cta: "Conocer la mentoría",
      heroCta: "Conozca la mentoría ejecutiva",
    },
  },
};
