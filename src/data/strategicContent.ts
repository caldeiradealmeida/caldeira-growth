import type { Language } from "@/lib/routing";

type Localized<T> = Record<Language, T>;

export const siteMeta: Localized<{
  title: string;
  description: string;
}> = {
  pt: {
    title:
      "Caldeira Growth | Arquitetura de Crescimento para Negócios e Lideranças",
    description:
      "Consultoria, desenvolvimento executivo e palestras para empresas que precisam alinhar estratégia, cultura, liderança e execução.",
  },
  en: {
    title:
      "Caldeira Growth | Growth Architecture for Businesses and Leaders",
    description:
      "Consulting, executive development and speaking for organizations that need to align strategy, culture, leadership and execution.",
  },
  es: {
    title:
      "Caldeira Growth | Arquitectura de Crecimiento para Negocios y Líderes",
    description:
      "Consultoría, desarrollo ejecutivo y conferencias para empresas que necesitan alinear estrategia, cultura, liderazgo y ejecución.",
  },
};

export const navigation: Localized<{
  home: string;
  consulting: string;
  executiveDevelopment: string;
  speaking: string;
  content: string;
  about: string;
  contact: string;
  articles: string;
  media: string;
  book: string;
  cgi: string;
}> = {
  pt: {
    home: "Início",
    consulting: "Consultoria",
    executiveDevelopment: "Desenvolvimento Executivo",
    speaking: "Palestras",
    content: "Conteúdo",
    about: "Sobre",
    contact: "Contato",
    articles: "Artigos",
    media: "Mídia",
    book: "Livro",
    cgi: "CGI",
  },
  en: {
    home: "Home",
    consulting: "Consulting",
    executiveDevelopment: "Executive Development",
    speaking: "Speaking",
    content: "Content",
    about: "About",
    contact: "Contact",
    articles: "Articles",
    media: "Media",
    book: "Book",
    cgi: "CGI",
  },
  es: {
    home: "Inicio",
    consulting: "Consultoría",
    executiveDevelopment: "Desarrollo Ejecutivo",
    speaking: "Conferencias",
    content: "Contenidos",
    about: "Sobre Nosotros",
    contact: "Contacto",
    articles: "Artículos",
    media: "Medios",
    book: "Libro",
    cgi: "CGI",
  },
};

export const testimonials = [
  {
    quote:
      "Denis traz clareza ao analisar cenários complexos e traduz isso em direcionamento prático.",
    attribution: "Fabio Kadi, Sócio Diretor, Kadi Advogados",
    target: "Homepage e Consultoria",
    proof: "clareza estratégica e direcionamento prático",
  },
  {
    quote:
      "Sua capacidade de conectar diferentes áreas e provocar decisões estratégicas foi um diferencial claro.",
    attribution: "Alessandro Pacanowski, CEO, Roda Conveniência",
    target: "Homepage e Consultoria",
    proof: "integração entre áreas e decisões estratégicas",
  },
];

export const homeContent: Localized<{
  heroTitle: string;
  heroText: string;
  primaryCta: string;
  secondaryCta: string;
  painsTitle: string;
  painsIntro: string;
  pains: string[];
  thesisTitle: string;
  thesisParagraphs: string[];
  howTitle: string;
  howSteps: Array<{ title: string; body: string }>;
  solutionsTitle: string;
  solutions: Array<{ title: string; body: string; cta: string; route: "consulting" | "executiveDevelopment" | "speaking" }>;
  differenceTitle: string;
  differenceParagraphs: string[];
  credentialsTitle: string;
  credentials: string[];
  finalTitle: string;
  finalText: string;
  finalCta: string;
}> = {
  pt: {
    heroTitle: "Arquitetura de Crescimento para Negócios e Lideranças",
    heroText:
      "Projetamos sistemas de crescimento que alinham estratégia, cultura, liderança e execução.",
    primaryCta: "Agendar uma conversa",
    secondaryCta: "Conhecer nossa abordagem",
    painsTitle:
      "Os desafios de crescimento raramente estão em uma única área",
    painsIntro:
      "À medida que uma empresa cresce, aumentam também a complexidade, as interdependências e a necessidade de coordenação. O que funcionou em uma etapa pode deixar de ser suficiente para o ciclo seguinte.",
    pains: [
      "Crescemos, mas perdemos foco.",
      "Temos estratégia, mas a execução não acontece.",
      "O time executivo não está alinhado.",
      "Há muitas iniciativas e pouca prioridade.",
      "O crescimento desacelerou.",
      "A complexidade aumentou mais rapidamente do que nossa capacidade de gestão.",
      "Os indicadores existem, mas não orientam as decisões mais importantes.",
      "As decisões continuam concentradas em poucas pessoas.",
    ],
    thesisTitle:
      "Crescimento não é um evento. É uma capacidade organizacional.",
    thesisParagraphs: [
      "Empresas não crescem de forma sustentável apenas porque possuem uma boa estratégia, lançam um novo produto ou aumentam a pressão comercial.",
      "O crescimento se sustenta quando estratégia, cultura, liderança, estrutura, indicadores, governança e execução funcionam como partes de um mesmo sistema.",
      "A Caldeira Growth ajuda organizações e lideranças a compreender, desenhar e fortalecer esse sistema. Chamamos essa abordagem de Arquitetura de Crescimento.",
    ],
    howTitle: "Da compreensão do problema à capacidade de execução",
    howSteps: [
      {
        title: "Diagnóstico",
        body:
          "Compreendemos o negócio, o contexto, as restrições, as oportunidades e os gargalos que limitam o crescimento.",
      },
      {
        title: "Arquitetura",
        body:
          "Definimos escolhas, prioridades, capacidades, indicadores e mecanismos de gestão necessários para o próximo ciclo.",
      },
      {
        title: "Alinhamento",
        body:
          "Construímos um entendimento comum entre acionistas, conselho, CEO e lideranças sobre direção, responsabilidades e critérios de decisão.",
      },
      {
        title: "Execução",
        body:
          "Traduzimos a estratégia em iniciativas, responsáveis, métricas, rituais e decisões concretas.",
      },
      {
        title: "Governança",
        body:
          "Estruturamos mecanismos de acompanhamento, aprendizado e correção necessários para sustentar o crescimento.",
      },
    ],
    solutionsTitle: "Uma tese, diferentes formas de atuação",
    solutions: [
      {
        title: "Consultoria",
        body:
          "Ajudamos empresas a redefinir prioridades, alinhar lideranças e transformar estratégia em execução, atuando sobre estratégia, modelo de negócio, cultura, indicadores, governança e execução.",
        cta: "Conhecer a Consultoria",
        route: "consulting",
      },
      {
        title: "Desenvolvimento Executivo",
        body:
          "Formamos lideranças capazes de compreender o negócio como um sistema, tomar decisões melhores e conduzir ciclos de transformação. PDE, workshops e mentorias são customizados ao contexto da organização.",
        cta: "Conhecer o Desenvolvimento Executivo",
        route: "executiveDevelopment",
      },
      {
        title: "Palestras",
        body:
          "Criamos palestras de alta densidade para organizações que precisam ampliar repertório, provocar reflexão e mobilizar lideranças diante de transformações relevantes.",
        cta: "Conhecer as Palestras",
        route: "speaking",
      },
    ],
    differenceTitle:
      "Experiência executiva, visão de conselho e capacidade de execução",
    differenceParagraphs: [
      "A Caldeira Growth combina experiência operacional em empresas globais e negócios de alto crescimento, atuação em conselhos e capacidade de desenvolver lideranças.",
      "Essa combinação permite transitar entre estratégia e execução, entre o conselho e a operação, entre a complexidade dos problemas e a clareza necessária para tomar decisões.",
      "Nosso trabalho não termina na recomendação. Buscamos construir entendimento, alinhamento e capacidade organizacional para que a estratégia seja executada.",
    ],
    credentialsTitle: "Experiências em contextos reais de crescimento e transformação",
    credentials: [
      "Telefónica Vivo, Google, Meta, QuintoAndar e Addi",
      "Atuação em conselhos e ambientes de governança",
      "Mentor Endeavor e autor de Cresça ou Desapareça",
      "Programas executivos, palestras, mídia e entrevistas",
    ],
    finalTitle:
      "O próximo ciclo de crescimento exige mais clareza, alinhamento e capacidade de execução?",
    finalText:
      "Converse com a Caldeira Growth sobre os desafios atuais da sua organização.",
    finalCta: "Agendar uma conversa",
  },
  en: {
    heroTitle: "Growth Architecture for Businesses and Leaders",
    heroText:
      "We design growth systems that align strategy, culture, leadership and execution.",
    primaryCta: "Schedule a conversation",
    secondaryCta: "Explore our approach",
    painsTitle: "Growth challenges rarely sit within a single function",
    painsIntro:
      "As a company grows, complexity, interdependence and the need for coordination grow with it. What worked at one stage may no longer be enough for the next cycle.",
    pains: [
      "We grew, but lost focus.",
      "We have a strategy, but execution does not follow.",
      "The executive team is not fully aligned.",
      "We have too many initiatives and too few priorities.",
      "Growth has slowed.",
      "Complexity has grown faster than our management capabilities.",
      "We have metrics, but they do not guide the most important decisions.",
      "Too many decisions remain concentrated in a few people.",
    ],
    thesisTitle: "Growth is not an event. It is an organizational capability.",
    thesisParagraphs: [
      "Companies do not grow sustainably simply because they have a good strategy, launch a new product or increase commercial pressure.",
      "Growth becomes sustainable when strategy, culture, leadership, structure, metrics, governance and execution operate as parts of the same system.",
      "Caldeira Growth helps organizations and leaders understand, design and strengthen that system. We call this approach Growth Architecture.",
    ],
    howTitle: "From understanding the problem to execution capability",
    howSteps: [],
    solutionsTitle: "One thesis, different forms of work",
    solutions: [],
    differenceTitle: "Executive experience, board perspective and execution capability",
    differenceParagraphs: [],
    credentialsTitle: "Experience in real growth and transformation contexts",
    credentials: [],
    finalTitle:
      "Does your next growth cycle require greater clarity, alignment and execution capability?",
    finalText:
      "Talk to Caldeira Growth about your organization's current challenges.",
    finalCta: "Schedule a conversation",
  },
  es: {
    heroTitle: "Arquitectura de Crecimiento para Negocios y Líderes",
    heroText:
      "Diseñamos sistemas de crecimiento que integran estrategia, cultura, liderazgo y ejecución.",
    primaryCta: "Agendar una conversación",
    secondaryCta: "Conocer nuestro enfoque",
    painsTitle:
      "Los desafíos de crecimiento rara vez se concentran en una sola área",
    painsIntro:
      "A medida que una empresa crece, también aumentan la complejidad, las interdependencias y la necesidad de coordinación. Lo que funcionó en una etapa puede dejar de ser suficiente para el siguiente ciclo.",
    pains: [
      "Crecimos, pero perdimos el foco.",
      "Tenemos estrategia, pero la ejecución no sucede.",
      "El equipo ejecutivo no está alineado.",
      "Hay demasiadas iniciativas y pocas prioridades.",
      "El crecimiento se desaceleró.",
      "La complejidad creció más rápido que nuestra capacidad de gestión.",
      "Existen indicadores, pero no orientan las decisiones más importantes.",
      "Demasiadas decisiones siguen concentradas en pocas personas.",
    ],
    thesisTitle:
      "El crecimiento no es un evento. Es una capacidad organizacional.",
    thesisParagraphs: [
      "Las empresas no crecen de forma sostenible únicamente porque tengan una buena estrategia, lancen un nuevo producto o aumenten la presión comercial.",
      "El crecimiento se sostiene cuando la estrategia, la cultura, el liderazgo, la estructura, los indicadores, la gobernanza y la ejecución funcionan como partes de un mismo sistema.",
      "Caldeira Growth ayuda a organizaciones y líderes a comprender, diseñar y fortalecer ese sistema. Llamamos a este enfoque Arquitectura de Crecimiento.",
    ],
    howTitle: "De la comprensión del problema a la capacidad de ejecución",
    howSteps: [],
    solutionsTitle: "Una tesis, diferentes formas de actuación",
    solutions: [],
    differenceTitle:
      "Experiencia ejecutiva, visión de consejo y capacidad de ejecución",
    differenceParagraphs: [],
    credentialsTitle:
      "Experiencias en contextos reales de crecimiento y transformación",
    credentials: [],
    finalTitle:
      "¿El próximo ciclo de crecimiento requiere más claridad, alineación y capacidad de ejecución?",
    finalText:
      "Converse con Caldeira Growth sobre los desafíos actuales de su organización.",
    finalCta: "Agendar una conversación",
  },
};

export const consultingContent: Localized<{
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string[];
  painsTitle: string;
  pains: string[];
  frontsTitle: string;
  fronts: Array<{ title: string; body: string }>;
  formatsTitle: string;
  formats: Array<{ title: string; body: string }>;
  finalTitle: string;
  finalText: string;
  cta: string;
}> = {
  pt: {
    metaTitle: "Consultoria | Arquitetura de Crescimento para Empresas",
    metaDescription:
      "Consultoria para empresas que precisam alinhar estratégia, cultura, liderança e execução para sustentar novos ciclos de crescimento.",
    eyebrow: "Consultoria",
    title: "Arquitetura de Crescimento para Empresas",
    subtitle:
      "Ajudamos organizações a alinhar estratégia, cultura, liderança e execução para sustentar novos ciclos de crescimento.",
    intro: [
      "O crescimento raramente é limitado por um único problema.",
      "Uma empresa pode ter uma estratégia consistente e, ainda assim, não conseguir executá-la. Pode possuir profissionais competentes, mas sem alinhamento suficiente entre áreas. Pode ter metas, indicadores e projetos, mas não uma visão comum sobre prioridades.",
      "Em outros casos, o próprio modelo de negócio que gerou crescimento no passado começa a demonstrar limitações diante de uma nova escala, de mudanças competitivas ou do aumento da complexidade.",
      "A Caldeira Growth atua nesses pontos de interdependência. Nosso trabalho consiste em compreender o sistema atual da organização, identificar suas principais restrições e construir uma arquitetura mais coerente para o próximo ciclo.",
    ],
    painsTitle: "Situações em que podemos contribuir",
    pains: [
      "O crescimento desacelerou e não existe consenso sobre as causas.",
      "A empresa possui muitas iniciativas, mas poucas prioridades reais.",
      "A estratégia foi definida, mas não se traduz em decisões cotidianas.",
      "O time executivo possui leituras diferentes sobre o negócio.",
      "A complexidade cresceu mais rapidamente do que os mecanismos de gestão.",
      "Os indicadores não ajudam a distinguir sintomas de causas.",
      "A organização depende excessivamente do fundador ou de poucos executivos.",
      "O modelo de negócio precisa ser revisto ou fortalecido.",
      "Conselho, acionistas e gestão não compartilham a mesma leitura sobre riscos e prioridades.",
      "A cultura existente não sustenta os comportamentos necessários para a estratégia.",
      "A empresa precisa preparar seu sistema de gestão para uma nova escala.",
      "Existem boas iniciativas, mas elas não formam um sistema coerente.",
    ],
    frontsTitle: "Frentes de atuação",
    fronts: [
      {
        title: "Estratégia de crescimento",
        body:
          "Apoiamos a organização na compreensão do contexto, na definição das escolhas fundamentais e na construção de prioridades claras.",
      },
      {
        title: "Modelo de negócio",
        body:
          "Analisamos como a empresa cria, entrega e captura valor, identificando oportunidades, restrições e alternativas de evolução.",
      },
      {
        title: "Alinhamento executivo",
        body:
          "Criamos espaços estruturados para que acionistas, conselhos, CEOs e lideranças desenvolvam uma leitura comum sobre contexto, escolhas e responsabilidades.",
      },
      {
        title: "Cultura e organização",
        body:
          "Conectamos estratégia a comportamentos, incentivos, estrutura, papéis e mecanismos de decisão.",
      },
      {
        title: "Indicadores e sistema de gestão",
        body:
          "Apoiamos o desenho de métricas, responsabilidades, rituais e fóruns que transformam prioridades em acompanhamento sistemático.",
      },
      {
        title: "Governança",
        body:
          "Contribuímos para o desenho e o fortalecimento de mecanismos de decisão, acompanhamento, responsabilização e gestão de riscos.",
      },
      {
        title: "Execução",
        body:
          "Traduzimos escolhas estratégicas em iniciativas, responsáveis, marcos, métricas e rituais de acompanhamento.",
      },
    ],
    formatsTitle: "Formatos adaptados ao contexto da organização",
    formats: [
      {
        title: "Projetos estratégicos",
        body:
          "Projetos com escopo, diagnóstico, desenho e entregáveis definidos para desafios específicos.",
      },
      {
        title: "Aconselhamento a CEOs e lideranças",
        body:
          "Acompanhamento recorrente para decisões, prioridades, estruturação da agenda e condução da execução.",
      },
      {
        title: "Advisory",
        body:
          "Contribuição independente para decisões estratégicas, crescimento, organização e governança.",
      },
      {
        title: "Workshops estratégicos",
        body:
          "Encontros estruturados para construir entendimento, fazer escolhas, alinhar lideranças e definir planos de ação.",
      },
      {
        title: "Acompanhamento da execução",
        body:
          "Apoio na criação e condução dos mecanismos necessários para transformar decisões em entregas.",
      },
    ],
    finalTitle: "O desafio da sua empresa não precisa caber em uma categoria pronta",
    finalText:
      "Cada organização possui uma combinação particular de história, cultura, capacidades, oportunidades e restrições. Converse conosco sobre o seu contexto.",
    cta: "Agendar uma conversa",
  },
  en: {
    metaTitle: "Consulting | Growth Architecture for Organizations",
    metaDescription:
      "Consulting for organizations that need to align strategy, culture, leadership and execution to sustain new growth cycles.",
    eyebrow: "Consulting",
    title: "Growth Architecture for Organizations",
    subtitle:
      "We help organizations align strategy, culture, leadership and execution to sustain new growth cycles.",
    intro: [
      "Growth is rarely limited by a single problem.",
      "A company may have a consistent strategy and still fail to execute it. It may have competent people without sufficient alignment across functions.",
      "Caldeira Growth works at those points of interdependence, helping the organization understand its current system and design a more coherent architecture for the next cycle.",
    ],
    painsTitle: "Situations where we can contribute",
    pains: [
      "Growth has slowed and there is no consensus on the causes.",
      "The company has many initiatives but few real priorities.",
      "Strategy has been defined but does not translate into daily decisions.",
      "The executive team has different readings of the business.",
      "Complexity has grown faster than management mechanisms.",
    ],
    frontsTitle: "Areas of work",
    fronts: [
      { title: "Growth strategy", body: "We support context reading, strategic choices and clear priorities." },
      { title: "Business model", body: "We analyze how the company creates, delivers and captures value." },
      { title: "Executive alignment", body: "We structure conversations that build a shared reading among leaders." },
      { title: "Culture and organization", body: "We connect strategy to behaviors, incentives, roles and decisions." },
      { title: "Metrics and management system", body: "We design metrics, responsibilities and rituals for systematic follow-up." },
      { title: "Governance", body: "We strengthen decision, accountability and risk-management mechanisms." },
      { title: "Execution", body: "We translate strategic choices into initiatives, owners, milestones and routines." },
    ],
    formatsTitle: "Formats adapted to the organization's context",
    formats: [
      { title: "Strategic projects", body: "Defined scope, diagnosis, design and deliverables for specific challenges." },
      { title: "CEO and leadership advisory", body: "Recurring support for decisions, priorities and execution cadence." },
      { title: "Advisory", body: "Independent contribution to strategy, growth, organization and governance." },
      { title: "Strategic workshops", body: "Structured sessions for choices, alignment and action plans." },
      { title: "Execution follow-up", body: "Support to turn decisions into concrete delivery mechanisms." },
    ],
    finalTitle: "Your company's challenge does not need to fit a ready-made category",
    finalText: "Every organization has a specific combination of history, culture, capabilities, opportunities and constraints.",
    cta: "Schedule a conversation",
  },
  es: {
    metaTitle: "Consultoría | Arquitectura de Crecimiento para Empresas",
    metaDescription:
      "Consultoría para empresas que necesitan alinear estrategia, cultura, liderazgo y ejecución para sostener nuevos ciclos de crecimiento.",
    eyebrow: "Consultoría",
    title: "Arquitectura de Crecimiento para Empresas",
    subtitle:
      "Ayudamos a las organizaciones a alinear estrategia, cultura, liderazgo y ejecución para sostener nuevos ciclos de crecimiento.",
    intro: [
      "El crecimiento rara vez está limitado por un único problema.",
      "Una empresa puede tener una estrategia consistente y aun así no conseguir ejecutarla. Puede tener profesionales competentes, pero sin suficiente alineación entre áreas.",
      "Caldeira Growth actúa en esos puntos de interdependencia para comprender el sistema actual y construir una arquitectura más coherente para el siguiente ciclo.",
    ],
    painsTitle: "Situaciones en las que podemos contribuir",
    pains: [
      "El crecimiento se desaceleró y no existe consenso sobre las causas.",
      "La empresa tiene muchas iniciativas, pero pocas prioridades reales.",
      "La estrategia fue definida, pero no se traduce en decisiones cotidianas.",
      "El equipo ejecutivo tiene lecturas diferentes sobre el negocio.",
      "La complejidad creció más rápido que los mecanismos de gestión.",
    ],
    frontsTitle: "Frentes de actuación",
    fronts: [
      { title: "Estrategia de crecimiento", body: "Apoyamos la comprensión del contexto, las decisiones fundamentales y prioridades claras." },
      { title: "Modelo de negocio", body: "Analizamos cómo la empresa crea, entrega y captura valor." },
      { title: "Alineación ejecutiva", body: "Creamos espacios estructurados para una lectura común entre líderes." },
      { title: "Cultura y organización", body: "Conectamos estrategia con comportamientos, incentivos, roles y decisiones." },
      { title: "Indicadores y sistema de gestión", body: "Diseñamos métricas, responsabilidades y rituales de seguimiento." },
      { title: "Gobernanza", body: "Fortalecemos mecanismos de decisión, seguimiento, responsabilidad y riesgos." },
      { title: "Ejecución", body: "Traducimos decisiones estratégicas en iniciativas, responsables, hitos y rutinas." },
    ],
    formatsTitle: "Formatos adaptados al contexto de la organización",
    formats: [
      { title: "Proyectos estratégicos", body: "Proyectos con alcance, diagnóstico, diseño y entregables definidos." },
      { title: "Acompañamiento a CEOs y líderes", body: "Apoyo recurrente para decisiones, prioridades y ejecución." },
      { title: "Advisory", body: "Contribución independiente para estrategia, crecimiento, organización y gobernanza." },
      { title: "Workshops estratégicos", body: "Encuentros estructurados para elegir, alinear y definir planes de acción." },
      { title: "Acompañamiento de la ejecución", body: "Apoyo para transformar decisiones en entregas concretas." },
    ],
    finalTitle: "El desafío de su empresa no necesita encajar en una categoría lista",
    finalText:
      "Cada organización tiene una combinación particular de historia, cultura, capacidades, oportunidades y restricciones.",
    cta: "Agendar una conversación",
  },
};

export const executiveContent: Localized<{
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string[];
  painsTitle: string;
  pains: string[];
  pdeTitle: string;
  pdeParagraphs: string[];
  topics: string[];
  caseTitle: string;
  caseText: string[];
  workshopsTitle: string;
  workshopsText: string;
  workshops: string[];
  mentoringTitle: string;
  mentoringText: string;
  mentoring: string[];
  finalTitle: string;
  finalText: string;
  cta: string;
}> = {
  pt: {
    metaTitle: "Desenvolvimento Executivo | Caldeira Growth",
    metaDescription:
      "Programas de desenvolvimento executivo, PDE, workshops e mentorias para lideranças que precisam transformar estratégia em execução.",
    eyebrow: "Desenvolvimento Executivo",
    title: "Desenvolvimento Executivo",
    subtitle:
      "Formamos lideranças capazes de compreender o negócio, tomar melhores decisões e transformar estratégia em execução.",
    intro: [
      "O aumento de responsabilidade executiva exige mais do que domínio técnico.",
      "À medida que um profissional assume posições de maior complexidade, precisa ampliar sua compreensão sobre estratégia, cultura, finanças, modelo de negócio, liderança, riscos, governança e alocação de recursos.",
      "Também precisa aprender a tomar decisões em ambientes ambíguos, integrar diferentes áreas e assumir responsabilidade sobre o resultado da organização como um todo.",
      "A Caldeira Growth desenvolve programas customizados a partir dos desafios reais da empresa e das responsabilidades concretas de seus executivos.",
    ],
    painsTitle: "Quando o desenvolvimento executivo se torna uma prioridade",
    pains: [
      "Executivos tecnicamente competentes precisam ampliar sua visão de negócio.",
      "A empresa promoveu lideranças, mas o nível de responsabilidade cresceu mais rapidamente do que sua preparação.",
      "As áreas funcionam bem individualmente, mas não tomam decisões de forma integrada.",
      "A estratégia é compreendida pela alta liderança, mas não pelos demais níveis executivos.",
      "Os gestores dominam suas funções, mas não compreendem os impactos financeiros e organizacionais de suas decisões.",
      "A empresa precisa formar sucessores e reduzir a dependência de poucas pessoas.",
      "A liderança precisa conduzir mudanças de cultura, estrutura ou modelo de negócio.",
      "Os executivos precisam aprender a trabalhar com risco, incerteza e alocação de capital.",
      "A empresa precisa criar uma linguagem comum entre diferentes áreas, países ou unidades.",
    ],
    pdeTitle: "Programa de Desenvolvimento Executivo — PDE",
    pdeParagraphs: [
      "O PDE é o principal programa de desenvolvimento de lideranças da Caldeira Growth.",
      "Ele é desenhado para empresas que precisam acelerar a maturidade de seus executivos e prepará-los para desafios estratégicos de maior complexidade.",
      "Não se trata de um curso padronizado. O programa parte da realidade da empresa, de sua estratégia, de seu modelo de negócio e dos desafios concretos enfrentados por seus participantes.",
      "Cada programa combina conteúdo, discussão, aplicação prática e reflexão sobre situações reais da organização.",
    ],
    topics: [
      "estratégia",
      "cultura",
      "liderança",
      "modelo de negócio",
      "growth",
      "finanças",
      "indicadores",
      "execução",
      "riscos",
      "governança",
      "tomada de decisão",
      "alocação de capital",
      "inovação",
      "inteligência artificial",
      "integração entre áreas",
    ],
    caseTitle: "Desenvolvimento executivo conectado aos desafios reais do negócio",
    caseText: [
      "Na MR, a Caldeira Growth desenvolveu um Programa de Desenvolvimento Executivo voltado à ampliação da capacidade estratégica e gerencial de lideranças que atuavam em diferentes mercados.",
      "O programa integrou temas que normalmente são tratados de forma separada, como estratégia, cultura, liderança, modelo de negócio, finanças, growth, indicadores, riscos, organização comercial e alocação de capital.",
      "Mais do que transmitir conceitos, o trabalho buscou desenvolver uma visão integrada do negócio e fortalecer a capacidade dos executivos de analisar problemas, fazer escolhas e conectar suas decisões ao resultado da organização.",
    ],
    workshopsTitle: "Workshops Executivos",
    workshopsText:
      "Intervenções estruturadas para organizações que precisam alinhar lideranças, tomar decisões ou avançar sobre um desafio específico.",
    workshops: [
      "planejamento estratégico",
      "alinhamento executivo",
      "definição de prioridades",
      "cultura",
      "modelo de negócio",
      "indicadores",
      "organização da execução",
      "tomada de decisão",
      "construção de planos de ação",
    ],
    mentoringTitle: "Mentoria de CEOs, Fundadores e Executivos",
    mentoringText:
      "Acompanhamento individual para lideranças que enfrentam crescimento, transição, aumento de complexidade ou novas responsabilidades.",
    mentoring: [
      "estruturação da agenda executiva",
      "decisões estratégicas",
      "gestão de prioridades",
      "construção de equipes",
      "relação com conselho e acionistas",
      "desenvolvimento de visão de negócio",
      "transições de carreira",
      "preparação para novas responsabilidades",
      "condução de transformações",
    ],
    finalTitle:
      "Desenvolver executivos é desenvolver a capacidade de crescimento da organização",
    finalText: "Converse conosco sobre os desafios da sua liderança.",
    cta: "Conhecer o PDE e os programas executivos",
  },
  en: {
    metaTitle: "Executive Development | Caldeira Growth",
    metaDescription:
      "Executive development programs, workshops and mentoring for leaders who need to turn strategy into execution.",
    eyebrow: "Executive Development",
    title: "Executive Development",
    subtitle:
      "We develop leaders who can understand the business, make better decisions and turn strategy into execution.",
    intro: [
      "Increased executive responsibility requires more than technical mastery.",
      "As professionals move into more complex roles, they need to expand their understanding of strategy, culture, finance, business models, leadership, risk, governance and resource allocation.",
    ],
    painsTitle: "When executive development becomes a priority",
    pains: [
      "Technically competent executives need to expand their business perspective.",
      "The level of responsibility grew faster than leadership preparation.",
      "Functions perform individually but do not make integrated decisions.",
    ],
    pdeTitle: "Executive Development Program — PDE",
    pdeParagraphs: [
      "The PDE is Caldeira Growth's main leadership development program.",
      "It is designed for companies that need to accelerate executive maturity and prepare leaders for more complex strategic challenges.",
    ],
    topics: ["strategy", "culture", "leadership", "business model", "growth", "finance", "execution", "governance", "decision-making"],
    caseTitle: "Executive development connected to real business challenges",
    caseText: ["At MR, Caldeira Growth developed an Executive Development Program focused on expanding strategic and managerial capabilities across different markets."],
    workshopsTitle: "Executive Workshops",
    workshopsText: "Structured interventions for organizations that need to align leaders, make decisions or advance a specific challenge.",
    workshops: ["strategic planning", "executive alignment", "priorities", "culture", "business model", "execution"],
    mentoringTitle: "Mentoring for CEOs, Founders and Executives",
    mentoringText: "Individual support for leaders facing growth, transition, complexity or new responsibilities.",
    mentoring: ["executive agenda", "strategic decisions", "priorities", "teams", "board and shareholder relations"],
    finalTitle: "Developing executives means developing the organization's growth capability",
    finalText: "Talk to us about your leadership challenges.",
    cta: "Discuss PDE and executive programs",
  },
  es: {
    metaTitle: "Desarrollo Ejecutivo | Caldeira Growth",
    metaDescription:
      "Programas de desarrollo ejecutivo, workshops y mentorías para líderes que necesitan transformar estrategia en ejecución.",
    eyebrow: "Desarrollo Ejecutivo",
    title: "Desarrollo Ejecutivo",
    subtitle:
      "Formamos líderes capaces de comprender el negocio, tomar mejores decisiones y transformar la estrategia en ejecución.",
    intro: [
      "El aumento de responsabilidad ejecutiva exige más que dominio técnico.",
      "A medida que un profesional asume posiciones de mayor complejidad, necesita ampliar su comprensión sobre estrategia, cultura, finanzas, modelo de negocio, liderazgo, riesgos, gobernanza y asignación de recursos.",
    ],
    painsTitle: "Cuándo el desarrollo ejecutivo se vuelve una prioridad",
    pains: [
      "Ejecutivos técnicamente competentes necesitan ampliar su visión de negocio.",
      "El nivel de responsabilidad creció más rápido que la preparación de los líderes.",
      "Las áreas funcionan individualmente, pero no toman decisiones de forma integrada.",
    ],
    pdeTitle: "Programa de Desarrollo Ejecutivo — PDE",
    pdeParagraphs: [
      "El PDE es el principal programa de desarrollo de liderazgos de Caldeira Growth.",
      "Está diseñado para empresas que necesitan acelerar la madurez de sus ejecutivos y prepararlos para desafíos estratégicos de mayor complejidad.",
    ],
    topics: ["estrategia", "cultura", "liderazgo", "modelo de negocio", "growth", "finanzas", "ejecución", "gobernanza", "toma de decisión"],
    caseTitle: "Desarrollo ejecutivo conectado a desafíos reales del negocio",
    caseText: ["En MR, Caldeira Growth desarrolló un Programa de Desarrollo Ejecutivo orientado a ampliar la capacidad estratégica y gerencial de líderes en diferentes mercados."],
    workshopsTitle: "Workshops Ejecutivos",
    workshopsText: "Intervenciones estructuradas para organizaciones que necesitan alinear líderes, tomar decisiones o avanzar sobre un desafío específico.",
    workshops: ["planificación estratégica", "alineación ejecutiva", "prioridades", "cultura", "modelo de negocio", "ejecución"],
    mentoringTitle: "Mentoría de CEOs, Fundadores y Ejecutivos",
    mentoringText: "Acompañamiento individual para líderes que enfrentan crecimiento, transición, complejidad o nuevas responsabilidades.",
    mentoring: ["agenda ejecutiva", "decisiones estratégicas", "prioridades", "equipos", "relación con consejo y accionistas"],
    finalTitle: "Desarrollar ejecutivos es desarrollar la capacidad de crecimiento de la organización",
    finalText: "Conversemos sobre los desafíos de su liderazgo.",
    cta: "Conocer el PDE y los programas ejecutivos",
  },
};

export const speakingContent: Localized<{
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string[];
  themesTitle: string;
  themes: Array<{ title: string; body: string }>;
  experienceTitle: string;
  experience: string[];
  finalTitle: string;
  finalText: string;
  cta: string;
}> = {
  pt: {
    metaTitle: "Palestras | Caldeira Growth",
    metaDescription:
      "Palestras para organizações em transformação sobre crescimento, estratégia, liderança, inteligência artificial e negócios.",
    eyebrow: "Palestras",
    title: "Palestras para Organizações em Transformação",
    subtitle:
      "Conteúdos de alta densidade sobre crescimento, estratégia, liderança, inteligência artificial e transformação dos negócios.",
    intro: [
      "Uma palestra relevante não deve apenas informar ou entreter.",
      "Ela deve ampliar o repertório, organizar questões complexas e criar novas possibilidades de discussão dentro da organização.",
      "As palestras da Caldeira Growth conectam experiência executiva, estratégia, tecnologia e transformação dos negócios a uma linguagem acessível para diferentes públicos.",
      "Cada conteúdo pode ser adaptado ao contexto, ao setor e aos desafios da organização contratante.",
    ],
    themesTitle: "Temas",
    themes: [
      {
        title: "Como as empresas crescem",
        body:
          "Uma reflexão sobre estratégia, escolhas, modelos de negócio, capacidades organizacionais e execução.",
      },
      {
        title: "O profissional na era da inteligência artificial",
        body:
          "Uma análise sobre as mudanças no trabalho, a automação de atividades, as novas capacidades exigidas e o papel de profissionais e lideranças na construção de uma relação produtiva com a inteligência artificial.",
      },
      {
        title: "Liderança sob incerteza",
        body:
          "Uma discussão sobre tomada de decisão, responsabilidade, cultura, alinhamento e execução em ambientes nos quais não existem respostas completas.",
      },
      {
        title: "Estratégia em ambientes de transformação",
        body:
          "Uma leitura sobre os impactos de tecnologia, competição, inteligência artificial, geopolítica e mudanças de mercado sobre as escolhas das empresas.",
      },
      {
        title: "Governança e crescimento",
        body:
          "Uma reflexão sobre o papel de conselhos, acionistas, CEOs e lideranças executivas na construção de organizações capazes de crescer com clareza, responsabilidade e disciplina.",
      },
      {
        title: "Modelos de negócio",
        body:
          "Uma análise sobre as diferentes formas pelas quais empresas criam, entregam e capturam valor, e sobre como mudanças no modelo podem transformar trajetórias de crescimento.",
      },
    ],
    experienceTitle: "Experiência com diferentes contextos e públicos",
    experience: [
      "Referências aprovadas para palestras incluem Cescon Barrieu, Bom Sabor e Nasdaq + 3DOTS.",
      "A prova social deve preservar fotos, vídeos, depoimentos, logos, entrevistas e registros já autorizados no repositório.",
    ],
    finalTitle: "Uma palestra deve continuar produzindo perguntas depois que termina",
    finalText:
      "Converse conosco sobre o contexto e os objetivos do seu evento.",
    cta: "Solicitar informações",
  },
  en: {
    metaTitle: "Speaking | Caldeira Growth",
    metaDescription:
      "Speaking for organizations in transformation on growth, strategy, leadership, artificial intelligence and business transformation.",
    eyebrow: "Speaking",
    title: "Speaking for Organizations in Transformation",
    subtitle:
      "High-density perspectives on growth, strategy, leadership, artificial intelligence and business transformation.",
    intro: [
      "A relevant talk should not only inform or entertain.",
      "It should expand repertoire, organize complex questions and create new conversations inside the organization.",
    ],
    themesTitle: "Themes",
    themes: [
      { title: "How companies grow", body: "Strategy, choices, business models, organizational capabilities and execution." },
      { title: "Work in the age of artificial intelligence", body: "Changes in work, automation and the new capabilities required from professionals and leaders." },
      { title: "Leadership under uncertainty", body: "Decision-making, responsibility, culture, alignment and execution where answers are incomplete." },
      { title: "Strategy in transformation environments", body: "Technology, competition, AI, geopolitics and market changes shaping company choices." },
    ],
    experienceTitle: "Experience with different contexts and audiences",
    experience: ["Approved speaking references include Cescon Barrieu, Bom Sabor and Nasdaq + 3DOTS."],
    finalTitle: "A talk should keep producing questions after it ends",
    finalText: "Talk to us about your event context and objectives.",
    cta: "Request information",
  },
  es: {
    metaTitle: "Conferencias | Caldeira Growth",
    metaDescription:
      "Conferencias para organizaciones en transformación sobre crecimiento, estrategia, liderazgo, inteligencia artificial y negocios.",
    eyebrow: "Conferencias",
    title: "Conferencias para Organizaciones en Transformación",
    subtitle:
      "Contenidos de alta densidad sobre crecimiento, estrategia, liderazgo, inteligencia artificial y transformación de los negocios.",
    intro: [
      "Una conferencia relevante no debe apenas informar o entretener.",
      "Debe ampliar repertorio, ordenar cuestiones complejas y crear nuevas conversaciones dentro de la organización.",
    ],
    themesTitle: "Temas",
    themes: [
      { title: "Cómo crecen las empresas", body: "Estrategia, decisiones, modelos de negocio, capacidades organizacionales y ejecución." },
      { title: "El profesional en la era de la inteligencia artificial", body: "Cambios en el trabajo, automatización y nuevas capacidades requeridas." },
      { title: "Liderazgo bajo incertidumbre", body: "Toma de decisión, responsabilidad, cultura, alineación y ejecución." },
      { title: "Estrategia en ambientes de transformación", body: "Tecnología, competencia, IA, geopolítica y cambios de mercado." },
    ],
    experienceTitle: "Experiencia con diferentes contextos y públicos",
    experience: ["Referencias aprobadas para conferencias incluyen Cescon Barrieu, Bom Sabor y Nasdaq + 3DOTS."],
    finalTitle: "Una conferencia debe seguir produciendo preguntas después de terminar",
    finalText: "Conversemos sobre el contexto y los objetivos de su evento.",
    cta: "Solicitar información",
  },
};

export const contentHub: Localized<{
  metaTitle: string;
  metaDescription: string;
  title: string;
  subtitle: string;
  items: Array<{ title: string; body: string; cta: string; kind: "articles" | "media" | "book" | "cgi" }>;
}> = {
  pt: {
    metaTitle: "Conteúdo | Caldeira Growth",
    metaDescription:
      "Ideias sobre crescimento, estratégia, liderança, inteligência artificial, governança e transformação.",
    title: "Ideias sobre crescimento, estratégia e transformação",
    subtitle:
      "A Caldeira Growth produz conteúdos para lideranças que precisam compreender mudanças estruturais, tomar decisões e preparar suas organizações para novos ciclos.",
    items: [
      { title: "Artigos", body: "Textos sobre estratégia, crescimento, decisão, liderança e transformação.", cta: "Ler artigos", kind: "articles" },
      { title: "Na mídia", body: "Entrevistas, reportagens e publicações externas com reflexões de Denis Caldeira.", cta: "Ver mídia", kind: "media" },
      { title: "Livro", body: "Cresça ou Desapareça reúne método e prática para decidir sob pressão e conduzir crescimento com rigor.", cta: "Conhecer o livro", kind: "book" },
      { title: "Caldeira Growth Index", body: "Assessment para diagnosticar capacidades de crescimento e refletir sobre prioridades da organização.", cta: "Acessar CGI", kind: "cgi" },
    ],
  },
  en: {
    metaTitle: "Content | Caldeira Growth",
    metaDescription:
      "Perspectives on growth, strategy, leadership, artificial intelligence, governance and transformation.",
    title: "Perspectives on growth, strategy and transformation",
    subtitle:
      "Caldeira Growth produces insights for leaders who need to understand structural change, make decisions and prepare their organizations for new growth cycles.",
    items: [
      { title: "Articles", body: "Writing on strategy, growth, decision-making, leadership and transformation.", cta: "Read articles", kind: "articles" },
      { title: "Media", body: "Interviews, articles and external publications.", cta: "View media", kind: "media" },
      { title: "Book", body: "Grow or Disappear brings method and practice for disciplined growth.", cta: "Visit book site", kind: "book" },
      { title: "Caldeira Growth Index", body: "Assessment to diagnose growth capabilities and priorities.", cta: "Open CGI", kind: "cgi" },
    ],
  },
  es: {
    metaTitle: "Contenidos | Caldeira Growth",
    metaDescription:
      "Ideas sobre crecimiento, estrategia, liderazgo, inteligencia artificial, gobernanza y transformación.",
    title: "Ideas sobre crecimiento, estrategia y transformación",
    subtitle:
      "Caldeira Growth produce contenidos para líderes que necesitan comprender cambios estructurales, tomar decisiones y preparar sus organizaciones para nuevos ciclos.",
    items: [
      { title: "Artículos", body: "Textos sobre estrategia, crecimiento, decisión, liderazgo y transformación.", cta: "Leer artículos", kind: "articles" },
      { title: "Medios", body: "Entrevistas, reportajes y publicaciones externas.", cta: "Ver medios", kind: "media" },
      { title: "Libro", body: "Cresça ou Desapareça reúne método y práctica para crecimiento disciplinado.", cta: "Conocer el libro", kind: "book" },
      { title: "Caldeira Growth Index", body: "Assessment para diagnosticar capacidades de crecimiento y prioridades.", cta: "Acceder al CGI", kind: "cgi" },
    ],
  },
};

export const aboutContent: Localized<{
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  institutionalTitle: string;
  manifesto: Array<{ title: string; paragraphs: string[] }>;
  trajectoryTitle: string;
  trajectory: string[];
  credentialsTitle: string;
  credentials: string[];
  ctaTitle: string;
  ctaText: string;
  cta: string;
}> = {
  pt: {
    metaTitle: "Sobre | Caldeira Growth",
    metaDescription:
      "Conheça a tese institucional da Caldeira Growth, a Arquitetura de Crescimento e a trajetória que formou essa abordagem.",
    eyebrow: "Sobre",
    title: "Crescimento é uma capacidade organizacional",
    subtitle:
      "A Caldeira Growth nasceu da observação de que os desafios de crescimento raramente estão concentrados em uma única área.",
    institutionalTitle: "A Caldeira Growth e a Arquitetura do Crescimento",
    manifesto: [
      {
        title: "O padrão recorrente",
        paragraphs: [
          "A Caldeira Growth nasceu da observação de um padrão recorrente.",
          "Ao longo de mais de duas décadas trabalhando em empresas de diferentes portes, setores e estágios de maturidade, percebi que os desafios de crescimento raramente estavam onde as organizações acreditavam que estavam.",
          "Empresas que não cresciam atribuíam seus resultados ao marketing. Organizações que perdiam eficiência culpavam a execução. Lideranças pressionadas buscavam respostas em novas tecnologias, produtos ou metodologias de gestão.",
          "Em muitos casos, entretanto, o problema estava na relação entre diferentes partes da organização.",
        ],
      },
      {
        title: "Crescimento como sistema",
        paragraphs: [
          "O crescimento sustentável é resultado de um sistema.",
          "Quando observamos organizações que conseguem crescer de forma consistente ao longo do tempo, percebemos um alinhamento entre elementos que normalmente são tratados de forma isolada: estratégia, cultura, liderança, estrutura organizacional, métricas, governança e alocação de recursos.",
          "A ausência desse alinhamento cria fricção. A estratégia aponta para uma direção, mas a cultura incentiva comportamentos incompatíveis. As metas existem, mas os indicadores não refletem as prioridades do negócio.",
          "Nessas circunstâncias, o crescimento deixa de ser uma consequência do sistema e passa a depender de esforços extraordinários.",
        ],
      },
      {
        title: "Arquitetura de Crescimento",
        paragraphs: [
          "Foi a partir dessa constatação que surgiu a Caldeira Growth.",
          "Não fomos criados para ser apenas mais uma consultoria estratégica. Também não fomos criados para atuar isoladamente em vendas, marketing, inovação ou transformação digital.",
          "Nosso propósito é ajudar organizações a construir sistemas capazes de sustentar o crescimento. Chamamos isso de Arquitetura de Crescimento.",
          "Uma arquitetura é mais do que um plano. É o desenho dos elementos que sustentam determinado resultado.",
        ],
      },
      {
        title: "Como trabalhamos",
        paragraphs: [
          "Nosso trabalho consiste em compreender e tornar essa arquitetura mais clara.",
          "Isso começa pela análise do negócio: como a empresa cria valor, para quem cria valor, quais são suas restrições, quais capacidades precisam ser fortalecidas e quais decisões terão maior impacto sobre sua trajetória.",
          "A partir desse diagnóstico, trabalhamos no desenho dos elementos que sustentam o crescimento: prioridades estratégicas, alinhamento da liderança, sistemas de gestão, indicadores, cultura e competências.",
          "Não acreditamos em fórmulas universais. Cada empresa possui uma história, uma cultura, um contexto competitivo e uma combinação específica de oportunidades e restrições.",
        ],
      },
      {
        title: "A capacidade",
        paragraphs: [
          "A experiência que sustenta essa abordagem foi construída em ambientes diversos: empresas globais de tecnologia, negócios de alto crescimento, conselhos de administração, programas de desenvolvimento executivo e projetos de transformação.",
          "Essa diversidade permite transitar entre diferentes níveis da organização: estratégia com conselhos e acionistas, prioridades com CEOs, modelos operacionais com executivos e práticas de execução com equipes de liderança.",
          "A Caldeira Growth existe para ajudar líderes a enxergar a organização como um todo. Nosso objetivo não é apenas entregar recomendações.",
          "É contribuir para a construção de organizações mais alinhadas, mais conscientes de suas escolhas e mais preparadas para crescer. Porque crescimento não é um evento. É uma capacidade.",
        ],
      },
    ],
    trajectoryTitle: "Experiências que formaram essa visão",
    trajectory: [
      "A abordagem da Caldeira Growth foi construída ao longo de uma trajetória que combina engenharia, economia, tecnologia, crescimento, gestão executiva e governança.",
      "Denis Caldeira atuou por mais de 26 anos em tecnologia e negócios, incluindo posições de liderança na Telefónica Vivo, Google, Meta, QuintoAndar e Addi.",
      "Na Google e na Meta, liderou operações voltadas a pequenas e médias empresas na América Latina, trabalhando com crescimento, tecnologia, vendas, transformação de negócios e desenvolvimento de equipes em diferentes mercados.",
      "É fundador da Caldeira Growth, mentor Endeavor e autor do livro Cresça ou Desapareça.",
    ],
    credentialsTitle: "Credenciais e atuação",
    credentials: [
      "Experiência executiva em empresas globais de tecnologia e negócios de alto crescimento.",
      "Atuação em conselhos e ambientes de governança associados a CIMED, MASP, Sura, Cruzeiro e Instituto Tiago Camilo, conforme a natureza de cada relação.",
      "Consultoria, desenvolvimento executivo, palestras, mentoria e conteúdo como manifestações da mesma tese de Arquitetura de Crescimento.",
      "Livro Cresça ou Desapareça como expressão editorial da abordagem de crescimento, decisão e execução.",
    ],
    ctaTitle: "Converse sobre o próximo ciclo de crescimento da sua organização",
    ctaText: "A primeira conversa parte do contexto real da empresa.",
    cta: "Agendar uma conversa",
  },
  en: {
    metaTitle: "About | Caldeira Growth",
    metaDescription:
      "Learn about Caldeira Growth's institutional thesis, Growth Architecture and the trajectory behind the approach.",
    eyebrow: "About",
    title: "Growth is an organizational capability",
    subtitle:
      "Caldeira Growth was created from the observation that growth challenges rarely sit within a single function.",
    institutionalTitle: "Caldeira Growth and Growth Architecture",
    manifesto: [
      { title: "The recurring pattern", paragraphs: ["Caldeira Growth was created from the observation of a recurring pattern.", "Sustainable growth is the result of a system, not a single isolated initiative."] },
      { title: "Growth Architecture", paragraphs: ["Our purpose is to help organizations build systems capable of sustaining growth.", "We call this approach Growth Architecture."] },
    ],
    trajectoryTitle: "Experiences that shaped this view",
    trajectory: ["The approach combines engineering, economics, technology, growth, executive management and governance.", "Denis Caldeira has 26+ years in technology and business, including leadership roles at Telefónica Vivo, Google, Meta, QuintoAndar and Addi."],
    credentialsTitle: "Credentials and work",
    credentials: ["Executive experience in global technology companies and high-growth businesses.", "Board and governance experience.", "Author of Cresça ou Desapareça."],
    ctaTitle: "Talk about your organization's next growth cycle",
    ctaText: "The first conversation starts from the company's real context.",
    cta: "Schedule a conversation",
  },
  es: {
    metaTitle: "Sobre Nosotros | Caldeira Growth",
    metaDescription:
      "Conozca la tesis institucional de Caldeira Growth, la Arquitectura de Crecimiento y la trayectoria detrás del enfoque.",
    eyebrow: "Sobre Nosotros",
    title: "El crecimiento es una capacidad organizacional",
    subtitle:
      "Caldeira Growth nació de la observación de que los desafíos de crecimiento rara vez se concentran en una sola área.",
    institutionalTitle: "Caldeira Growth y la Arquitectura de Crecimiento",
    manifesto: [
      { title: "El patrón recurrente", paragraphs: ["Caldeira Growth nació de la observación de un patrón recurrente.", "El crecimiento sostenible es resultado de un sistema, no de una iniciativa aislada."] },
      { title: "Arquitectura de Crecimiento", paragraphs: ["Nuestro propósito es ayudar a organizaciones a construir sistemas capaces de sostener el crecimiento.", "Llamamos a este enfoque Arquitectura de Crecimiento."] },
    ],
    trajectoryTitle: "Experiencias que formaron esta visión",
    trajectory: ["El enfoque combina ingeniería, economía, tecnología, crecimiento, gestión ejecutiva y gobernanza.", "Denis Caldeira actuó por más de 26 años en tecnología y negocios, incluyendo posiciones de liderazgo en Telefónica Vivo, Google, Meta, QuintoAndar y Addi."],
    credentialsTitle: "Credenciales y actuación",
    credentials: ["Experiencia ejecutiva en empresas globales de tecnología y negocios de alto crecimiento.", "Experiencia en consejos y ambientes de gobernanza.", "Autor del libro Cresça ou Desapareça."],
    ctaTitle: "Conversemos sobre el próximo ciclo de crecimiento de su organización",
    ctaText: "La primera conversación parte del contexto real de la empresa.",
    cta: "Agendar una conversación",
  },
};

homeContent.en.howSteps = [
  { title: "Diagnosis", body: "We understand the business, context, constraints, opportunities and bottlenecks limiting growth." },
  { title: "Architecture", body: "We define choices, priorities, capabilities, metrics and management mechanisms for the next cycle." },
  { title: "Alignment", body: "We build shared understanding among shareholders, board, CEO and leaders." },
  { title: "Execution", body: "We translate strategy into initiatives, owners, metrics, rituals and concrete decisions." },
  { title: "Governance", body: "We structure follow-up, learning and correction mechanisms to sustain growth." },
];
homeContent.en.solutions = [
  { title: "Consulting", body: "We help companies reset priorities, align leaders and turn strategy into execution.", cta: "Explore Consulting", route: "consulting" },
  { title: "Executive Development", body: "We develop leaders who understand the business as a system and lead transformation cycles.", cta: "Explore Executive Development", route: "executiveDevelopment" },
  { title: "Speaking", body: "High-density talks for organizations that need to expand repertoire and mobilize leaders.", cta: "Explore Speaking", route: "speaking" },
];
homeContent.en.differenceParagraphs = [
  "Caldeira Growth combines operational experience in global companies and high-growth businesses, board work and executive development capability.",
  "This combination allows movement between strategy and execution, between board and operation, and between complex problems and the clarity required to decide.",
  "Our work does not end with recommendations. We seek to build understanding, alignment and organizational capability so strategy can be executed.",
];
homeContent.en.credentials = [
  "Telefónica Vivo, Google, Meta, QuintoAndar and Addi",
  "Board and governance experience",
  "Endeavor mentor and author of Cresça ou Desapareça",
  "Executive programs, speaking, media and interviews",
];

homeContent.es.howSteps = [
  { title: "Diagnóstico", body: "Comprendemos el negocio, el contexto, las restricciones, las oportunidades y los cuellos de botella que limitan el crecimiento." },
  { title: "Arquitectura", body: "Definimos decisiones, prioridades, capacidades, indicadores y mecanismos de gestión para el siguiente ciclo." },
  { title: "Alineación", body: "Construimos un entendimiento común entre accionistas, consejo, CEO y líderes." },
  { title: "Ejecución", body: "Traducimos la estrategia en iniciativas, responsables, métricas, rituales y decisiones concretas." },
  { title: "Gobernanza", body: "Estructuramos mecanismos de seguimiento, aprendizaje y corrección para sostener el crecimiento." },
];
homeContent.es.solutions = [
  { title: "Consultoría", body: "Ayudamos a empresas a redefinir prioridades, alinear líderes y transformar estrategia en ejecución.", cta: "Conocer la Consultoría", route: "consulting" },
  { title: "Desarrollo Ejecutivo", body: "Formamos líderes capaces de comprender el negocio como un sistema y conducir ciclos de transformación.", cta: "Conocer el Desarrollo Ejecutivo", route: "executiveDevelopment" },
  { title: "Conferencias", body: "Conferencias de alta densidad para ampliar repertorio y movilizar líderes.", cta: "Conocer las Conferencias", route: "speaking" },
];
homeContent.es.differenceParagraphs = [
  "Caldeira Growth combina experiencia operativa en empresas globales y negocios de alto crecimiento, actuación en consejos y capacidad de desarrollar líderes.",
  "Esa combinación permite transitar entre estrategia y ejecución, entre consejo y operación, y entre problemas complejos y la claridad necesaria para decidir.",
  "Nuestro trabajo no termina en la recomendación. Buscamos construir entendimiento, alineación y capacidad organizacional para que la estrategia sea ejecutada.",
];
homeContent.es.credentials = [
  "Telefónica Vivo, Google, Meta, QuintoAndar y Addi",
  "Actuación en consejos y ambientes de gobernanza",
  "Mentor Endeavor y autor de Cresça ou Desapareça",
  "Programas ejecutivos, conferencias, medios y entrevistas",
];
