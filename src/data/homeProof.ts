import type { Language } from "@/lib/routing";
import type { CompanyMarkId } from "@/components/home/companyMarks";

/**
 * Proof-oriented home sections: clients, recurring bottlenecks from the CGI,
 * the two proprietary diagnostics (CGI and Relay) and Denis's track record.
 *
 * CGI figures come from 29 completed, legitimate assessments (one per person,
 * latest attempt), finished between 20 Jul and 18 Oct 2026. See the project
 * note "site-redesign-dados-cgi-validados" for the queries and question ids.
 * They are exploratory findings and are labelled as such on the page.
 */

type Localized<T> = Record<Language, T>;

export const homeClients: Localized<{ label: string }> = {
  pt: { label: "Empresas que trabalharam com a Caldeira Growth" },
  en: { label: "Organizations that have worked with Caldeira Growth" },
  es: { label: "Organizaciones que han trabajado con Caldeira Growth" },
};

export type Bottleneck = {
  title: string;
  body: string;
  /** Short evidence line. Omitted when there is no data behind the item. */
  evidence?: string;
  source: "cgi" | "relay";
};

export const homeBottlenecks: Localized<{
  eyebrow: string;
  title: string;
  intro: string;
  items: Bottleneck[];
  highlight: { leftValue: string; leftLabel: string; rightValue: string; rightLabel: string; text: string };
  sourceLabels: Record<Bottleneck["source"], string>;
  ctaTitle: string;
  ctaLabel: string;
  footnote: string;
}> = {
  pt: {
    eyebrow: "O que os diagnósticos mostram",
    title: "Onde o crescimento trava",
    intro:
      "Os gargalos raramente estão onde a liderança olha primeiro. Estes são os padrões que mais aparecem nas empresas que diagnosticamos.",
    items: [
      {
        title: "Receita sem previsibilidade",
        body: "A empresa vende, mas não consegue antecipar o resultado dos próximos meses.",
        evidence: "38% dos líderes não conseguem prever a receita futura",
        source: "cgi",
      },
      {
        title: "Decisões sem leitura de mercado",
        body: "Concorrentes e mudanças no comportamento dos clientes não são acompanhados de forma estruturada.",
        evidence: "41% não monitoram concorrência e mercado de forma estruturada",
        source: "cgi",
      },
      {
        title: "Estratégia que não vira meta",
        body: "As prioridades existem, mas não chegam às equipes como metas e decisões concretas.",
        evidence: "34% dizem que os objetivos não se traduzem em metas para as equipes",
        source: "cgi",
      },
      {
        title: "Crescimento concentrado",
        body: "Poucas pessoas, canais ou clientes sustentam uma parte crítica do negócio.",
        evidence: "34% dependem de uma pessoa, canal ou cliente para crescer",
        source: "cgi",
      },
      {
        title: "Áreas que entregam, cliente que não recebe",
        body: "Cada área cumpre a sua parte e, ainda assim, o pedido chega errado ao fim da cadeia.",
        source: "relay",
      },
    ],
    highlight: {
      leftValue: "55",
      leftLabel: "Máquina de Crescimento",
      rightValue: "69",
      rightLabel: "Liderança e Cultura",
      text: "A dimensão que gera receita tem a menor média. A que os líderes avaliam sobre si mesmos, a maior.",
    },
    sourceLabels: { cgi: "Caldeira Growth Index", relay: "Caldeira Relay" },
    ctaTitle: "Quais destes aparecem na sua empresa?",
    ctaLabel: "Fazer o diagnóstico",
    footnote:
      "Achados exploratórios de 29 diagnósticos do Caldeira Growth Index concluídos entre julho e outubro de 2026, uma resposta por pessoa. Não representam o mercado como um todo.",
  },
  en: {
    eyebrow: "What our diagnostics show",
    title: "Where growth stalls",
    intro:
      "Bottlenecks are rarely where leadership looks first. These are the patterns we find most often in the companies we diagnose.",
    items: [
      {
        title: "Revenue without predictability",
        body: "The company sells, but cannot anticipate the results of the coming months.",
        evidence: "38% of leaders cannot forecast future revenue",
        source: "cgi",
      },
      {
        title: "Decisions without a market view",
        body: "Competitors and shifts in customer behavior are not tracked in a structured way.",
        evidence: "41% do not monitor competitors and the market in a structured way",
        source: "cgi",
      },
      {
        title: "Strategy that never becomes targets",
        body: "Priorities exist, but they do not reach teams as concrete targets and decisions.",
        evidence: "34% say objectives are not translated into team targets",
        source: "cgi",
      },
      {
        title: "Concentrated growth",
        body: "A few people, channels or clients carry a critical share of the business.",
        evidence: "34% depend on a single person, channel or client to grow",
        source: "cgi",
      },
      {
        title: "Every area delivers, the client still doesn't receive",
        body: "Each area does its part, and the order still arrives wrong at the end of the chain.",
        source: "relay",
      },
    ],
    highlight: {
      leftValue: "55",
      leftLabel: "Growth Machine",
      rightValue: "69",
      rightLabel: "Leadership and Culture",
      text: "The dimension that generates revenue has the lowest average. The one leaders rate about themselves, the highest.",
    },
    sourceLabels: { cgi: "Caldeira Growth Index", relay: "Caldeira Relay" },
    ctaTitle: "Which of these show up in your company?",
    ctaLabel: "Take the diagnostic",
    footnote:
      "Exploratory findings from 29 Caldeira Growth Index assessments completed between July and October 2026, one response per person. They do not represent the market as a whole.",
  },
  es: {
    eyebrow: "Lo que muestran los diagnósticos",
    title: "Dónde se traba el crecimiento",
    intro:
      "Los cuellos de botella rara vez están donde el liderazgo mira primero. Estos son los patrones que más aparecen en las empresas que diagnosticamos.",
    items: [
      {
        title: "Ingresos sin previsibilidad",
        body: "La empresa vende, pero no logra anticipar el resultado de los próximos meses.",
        evidence: "El 38% de los líderes no logra prever los ingresos futuros",
        source: "cgi",
      },
      {
        title: "Decisiones sin lectura de mercado",
        body: "La competencia y los cambios en el comportamiento de los clientes no se siguen de forma estructurada.",
        evidence: "El 41% no monitorea la competencia y el mercado de forma estructurada",
        source: "cgi",
      },
      {
        title: "Estrategia que no se convierte en metas",
        body: "Las prioridades existen, pero no llegan a los equipos como metas y decisiones concretas.",
        evidence: "El 34% afirma que los objetivos no se traducen en metas para los equipos",
        source: "cgi",
      },
      {
        title: "Crecimiento concentrado",
        body: "Pocas personas, canales o clientes sostienen una parte crítica del negocio.",
        evidence: "El 34% depende de una persona, canal o cliente para crecer",
        source: "cgi",
      },
      {
        title: "Áreas que cumplen, cliente que no recibe",
        body: "Cada área hace su parte y, aun así, el pedido llega mal al final de la cadena.",
        source: "relay",
      },
    ],
    highlight: {
      leftValue: "55",
      leftLabel: "Máquina de Crecimiento",
      rightValue: "69",
      rightLabel: "Liderazgo y Cultura",
      text: "La dimensión que genera ingresos tiene el promedio más bajo. La que los líderes evalúan sobre sí mismos, el más alto.",
    },
    sourceLabels: { cgi: "Caldeira Growth Index", relay: "Caldeira Relay" },
    ctaTitle: "¿Cuáles de estos aparecen en su empresa?",
    ctaLabel: "Hacer el diagnóstico",
    footnote:
      "Hallazgos exploratorios de 29 diagnósticos del Caldeira Growth Index completados entre julio y octubre de 2026, una respuesta por persona. No representan al mercado en su conjunto.",
  },
};

export type DiagnosticCard = {
  name: string;
  badge?: string;
  title: string;
  body: string;
  facts: string[];
  cta: string;
  route: "cgi" | "relay";
};

export const homeDiagnostics: Localized<{ title: string; intro: string; cards: DiagnosticCard[] }> = {
  pt: {
    title: "Dois diagnósticos para começar pela causa, não pelo sintoma",
    intro:
      "Todo projeto começa com uma leitura objetiva. Desenvolvemos dois instrumentos próprios para isso: um olha para a capacidade de crescer da empresa; o outro, para o espaço entre as áreas.",
    cards: [
      {
        name: "Caldeira Growth Index",
        title: "A capacidade de crescer da empresa",
        body: "40 questões em cinco dimensões: Estratégia, Mercado e Cliente, Máquina de Crescimento, Execução e Gestão, e Liderança e Cultura. Ao final, uma leitura executiva com o índice, os gargalos e as prioridades.",
        facts: ["Respondido pela liderança", "Online, sem custo", "Relatório executivo"],
        cta: "Fazer o diagnóstico",
        route: "cgi",
      },
      {
        name: "Caldeira Relay",
        badge: "Novo",
        title: "Onde o trabalho quebra entre as áreas",
        body: "Toda a organização responde em cerca de 5 minutos, de forma anônima. O painel mostra as passagens críticas entre áreas antes que o cliente sinta, e mede de novo para provar que mudou.",
        facts: ["Respondido por toda a organização", "Painel por área e por passagem", "Ciclos de 90 dias"],
        cta: "Conhecer o Relay",
        route: "relay",
      },
    ],
  },
  en: {
    title: "Two diagnostics to start with the cause, not the symptom",
    intro:
      "Every engagement starts with an objective reading. We built two proprietary instruments for it: one looks at the company's capacity to grow; the other, at the space between departments.",
    cards: [
      {
        name: "Caldeira Growth Index",
        title: "The company's capacity to grow",
        body: "40 questions across five dimensions: Strategy, Market and Customer, Growth Machine, Execution and Management, and Leadership and Culture. You get an executive reading with the index, the bottlenecks and the priorities.",
        facts: ["Answered by leadership", "Online, free of charge", "Executive report"],
        cta: "Take the diagnostic",
        route: "cgi",
      },
      {
        name: "Caldeira Relay",
        badge: "New",
        title: "Where work breaks between departments",
        body: "The whole organization answers in about 5 minutes, anonymously. The dashboard shows the critical handoffs between departments before the client feels them, and measures again to prove it changed.",
        facts: ["Answered by the whole organization", "Dashboard by department and handoff", "90-day cycles"],
        cta: "Discover Relay",
        route: "relay",
      },
    ],
  },
  es: {
    title: "Dos diagnósticos para empezar por la causa, no por el síntoma",
    intro:
      "Todo proyecto empieza con una lectura objetiva. Desarrollamos dos instrumentos propios para ello: uno mira la capacidad de crecer de la empresa; el otro, el espacio entre las áreas.",
    cards: [
      {
        name: "Caldeira Growth Index",
        title: "La capacidad de crecer de la empresa",
        body: "40 preguntas en cinco dimensiones: Estrategia, Mercado y Cliente, Máquina de Crecimiento, Ejecución y Gestión, y Liderazgo y Cultura. Al final, una lectura ejecutiva con el índice, los cuellos de botella y las prioridades.",
        facts: ["Respondido por el liderazgo", "En línea, sin costo", "Informe ejecutivo"],
        cta: "Hacer el diagnóstico",
        route: "cgi",
      },
      {
        name: "Caldeira Relay",
        badge: "Nuevo",
        title: "Dónde se rompe el trabajo entre las áreas",
        body: "Toda la organización responde en unos 5 minutos, de forma anónima. El panel muestra los traspasos críticos entre áreas antes de que el cliente los sienta, y vuelve a medir para demostrar que cambió.",
        facts: ["Respondido por toda la organización", "Panel por área y por traspaso", "Ciclos de 90 días"],
        cta: "Conocer Relay",
        route: "relay",
      },
    ],
  },
};

export const homeFounder: Localized<{
  title: string;
  intro: string;
  rolesTitle: string;
  roles: Array<{ company: string; role: string; mark?: CompanyMarkId; logo?: "quintoandar" | "addi" }>;
  credentials: string[];
  bookTitle: string;
  bookBody: string;
  bookCta?: string;
  photoAlt: string;
  bookAlt: string;
}> = {
  pt: {
    title: "Estratégia vista por quem já esteve do outro lado da mesa",
    intro:
      "A Caldeira Growth é liderada por Denis Caldeira, com mais de 26 anos em tecnologia e negócios. Antes de aconselhar empresas, ele liderou crescimento dentro delas.",
    rolesTitle: "Trajetória executiva",
    roles: [
      { company: "Meta", mark: "meta", role: "Diretor de negócios para PMEs na América Latina, com cerca de R$ 10 bilhões em receita" },
      { company: "Google", mark: "google", role: "Sete anos em posições de liderança" },
      { company: "QuintoAndar", logo: "quintoandar", role: "VP de Vendas e Clientes" },
      { company: "Addi", logo: "addi", role: "VP de Vendas e Operações para a América Latina" },
      { company: "Telefónica Vivo", mark: "telefonica", role: "Início de carreira, em diversas posições" },
    ],
    credentials: [
      "Conselhos: CIMED, Seguros Sura, Cruzeiro SAF, MASP e Generation Brasil",
      "Mentor Endeavor",
      "Aulas para startups do programa de aceleração do Google",
    ],
    bookTitle: "Cresça ou Desapareça",
    bookBody: "Estratégias e práticas para gestores e empreendedores crescerem seus negócios. Alta Books, 2025.",
    bookCta: "Conhecer o livro",
    photoAlt: "Denis Caldeira",
    bookAlt: "Capa do livro Cresça ou Desapareça",
  },
  en: {
    title: "Strategy from someone who has sat on the other side of the table",
    intro:
      "Caldeira Growth is led by Denis Caldeira, with 26+ years in technology and business. Before advising companies, he led growth inside them.",
    rolesTitle: "Executive track record",
    roles: [
      { company: "Meta", mark: "meta", role: "Director of SMBs for Latin America, with roughly R$10 billion in revenue" },
      { company: "Google", mark: "google", role: "Seven years in leadership roles" },
      { company: "QuintoAndar", logo: "quintoandar", role: "VP of Sales and Customers" },
      { company: "Addi", logo: "addi", role: "VP of Sales and Operations for Latin America" },
      { company: "Telefónica Vivo", mark: "telefonica", role: "Early career, across several roles" },
    ],
    credentials: [
      "Boards: CIMED, Seguros Sura, Cruzeiro SAF, MASP and Generation Brazil",
      "Endeavor mentor",
      "Classes for startups in Google's accelerator program",
    ],
    bookTitle: "Cresça ou Desapareça",
    bookBody: "Strategies and practices for managers and entrepreneurs to grow their businesses (Grow or Disappear). Alta Books, 2025. Portuguese edition.",
    photoAlt: "Denis Caldeira",
    bookAlt: "Cover of the book Cresça ou Desapareça",
  },
  es: {
    title: "Estrategia vista por quien ya estuvo del otro lado de la mesa",
    intro:
      "Caldeira Growth está liderada por Denis Caldeira, con más de 26 años en tecnología y negocios. Antes de asesorar empresas, lideró el crecimiento dentro de ellas.",
    rolesTitle: "Trayectoria ejecutiva",
    roles: [
      { company: "Meta", mark: "meta", role: "Director de negocios para pymes en América Latina, con cerca de R$ 10 mil millones en ingresos" },
      { company: "Google", mark: "google", role: "Siete años en posiciones de liderazgo" },
      { company: "QuintoAndar", logo: "quintoandar", role: "VP de Ventas y Clientes" },
      { company: "Addi", logo: "addi", role: "VP de Ventas y Operaciones para América Latina" },
      { company: "Telefónica Vivo", mark: "telefonica", role: "Inicio de carrera, en diversas posiciones" },
    ],
    credentials: [
      "Consejos: CIMED, Seguros Sura, Cruzeiro SAF, MASP y Generation Brasil",
      "Mentor Endeavor",
      "Clases para startups del programa de aceleración de Google",
    ],
    bookTitle: "Cresça ou Desapareça",
    bookBody: "Estrategias y prácticas para que gestores y emprendedores hagan crecer sus negocios (Crece o Desaparece). Alta Books, 2025. Edición en portugués.",
    photoAlt: "Denis Caldeira",
    bookAlt: "Portada del libro Cresça ou Desapareça",
  },
};

export const homeCase: Localized<{
  eyebrow: string;
  title: string;
  paragraphs: string[];
  facts: string[];
  quote: string;
  quoteBy: string;
  cta: string;
  videoLabel: string;
  duration: string;
}> = {
  pt: {
    eyebrow: "Caso · Maschinenfabrik Reinhausen",
    title: "Lideranças de várias subsidiárias, um mesmo jeito de decidir",
    paragraphs: [
      "Na MR, grupo alemão de tecnologia em energia, desenhamos e conduzimos o Programa de Desenvolvimento Executivo para lideranças de diferentes subsidiárias.",
      "Estratégia, finanças, growth, riscos, cultura e alocação de capital trabalhados como um só sistema, com casos aplicados ao negócio de cada participante.",
    ],
    facts: ["Três módulos", "Lideranças de várias subsidiárias", "Casos aplicados ao negócio de cada um"],
    quote: "O programa desenvolveu uma visão muito mais estratégica sobre o meu trabalho. As ferramentas financeiras, a análise de riscos e a governança passaram a apoiar decisões mais conscientes.",
    quoteBy: "E. Ruben Maldonado B., Area Sales Manager",
    cta: "Conhecer o Desenvolvimento Executivo",
    videoLabel: "Assistir aos depoimentos dos participantes do programa da MR",
    duration: "Depoimentos · 1 min 26 s",
  },
  en: {
    eyebrow: "Case · Maschinenfabrik Reinhausen",
    title: "Leaders from several subsidiaries, one way of making decisions",
    paragraphs: [
      "At MR, the German energy-technology group, we designed and ran the Executive Development Program for leaders from different subsidiaries.",
      "Strategy, finance, growth, risk, culture and capital allocation treated as one system, with cases applied to each participant's business.",
    ],
    facts: ["Three modules", "Leaders from several subsidiaries", "Cases applied to each participant's business"],
    quote: "The program gave me a much more strategic view of my work. Financial tools, risk analysis and governance now support more informed decisions.",
    quoteBy: "E. Ruben Maldonado B., Area Sales Manager",
    cta: "Explore Executive Development",
    videoLabel: "Watch testimonials from participants in the MR program",
    duration: "Testimonials · 1 min 26 s",
  },
  es: {
    eyebrow: "Caso · Maschinenfabrik Reinhausen",
    title: "Líderes de varias subsidiarias, una misma forma de decidir",
    paragraphs: [
      "En MR, grupo alemán de tecnología en energía, diseñamos y condujimos el Programa de Desarrollo Ejecutivo para líderes de distintas subsidiarias.",
      "Estrategia, finanzas, growth, riesgos, cultura y asignación de capital trabajados como un solo sistema, con casos aplicados al negocio de cada participante.",
    ],
    facts: ["Tres módulos", "Líderes de varias subsidiarias", "Casos aplicados al negocio de cada uno"],
    quote: "El programa me dio una visión mucho más estratégica de mi trabajo. Las herramientas financieras, el análisis de riesgos y la gobernanza ahora apoyan decisiones más conscientes.",
    quoteBy: "E. Ruben Maldonado B., Area Sales Manager",
    cta: "Conocer el Desarrollo Ejecutivo",
    videoLabel: "Ver los testimonios de los participantes del programa de MR",
    duration: "Testimonios · 1 min 26 s",
  },
};
