import type { Language } from "@/contexts/LanguageContext";

export type ContentByLang = Record<"pt" | "en", Content> &
  Partial<Record<Extract<Language, "es">, Content>>;

export type PrivacySection =
  | { kind: "text"; title: string; body: string }
  | { kind: "bullets"; title: string; intro: string; items: string[] };

export type Content = {
  nav: {
    consulting: string;
    speaking: string;
    book: string;
    articles: string;
    media: string;
    contact: string;
  };
  hero: {
    headline: string;
    subhead: string;
    ctaContact: string;
    ctaBook: string;
  };
  about: {
    title: string;
    body: string;
    experienceLine: string;
    companiesLine: string;
    councilsIntro: string;
    councilsLine: string;
  };
  pillars: {
    title: string;
    subtitle: string;
    consulting: { title: string; description: string };
    speaking: { title: string; description: string };
    pathToGrow: {
      title: string;
      shortDescription: string;
      description: string;
      micro: string;
    };
    book: { title: string; description: string };
  };
  growthApproach: {
    title: string;
    intro: string;
    point1: string;
    point2: string;
    point3: string;
  };
  homeDecisions: {
    title: string;
    subtitle: string;
  };
  media: {
    title: string;
    subtitle: string;
  };
  articles: {
    title: string;
    subtitle: string;
    readMore: string;
  };
  contactCTA: {
    title: string;
    subtitle?: string;
    cta: string;
  };
  contactPage: {
    headline: string;
    subtitle: string;
    form: {
      name: string;
      email: string;
      company: string;
      role: string;
      topic: string;
      topicPlaceholder: string;
      message: string;
      submit: string;
      sending: string;
      successTitle: string;
      successDescription: string;
      errorTitle: string;
      errorDescription: string;
      notConfigured: string;
    };
    topicOptions: { value: string; label: string }[];
  };
  speakingPage: {
    headline: string;
    subtitle: string;
    themesTitle: string;
    themes: string[];
  };
  consultingPage: {
    hero: { title: string; subtitle: string; cta: string };
    forWhom: { title: string; intro: string; bullets: string[] };
    howIWork: {
      title: string;
      lead: string;
      clarityLead: string;
      clarityPoints: string[];
      bridge: string;
      formats: string[];
    };
    situations: {
      title: string;
      subtitle: string;
      labels: { context: string; decision: string; impact: string };
      cases: Array<{
        title: string;
        context: string;
        decision: string;
        impact: string;
      }>;
    };
    board: {
      title: string;
      paragraphs: string[];
      formatsTitle: string;
      formats: string[];
    };
    experience: { title: string; body: string };
    finalCta: { title: string; cta: string };
  };
  footer: {
    tagline: string;
    contact: string;
    rights: string;
    connectLabel: string;
    privacyPolicy: string;
  };
  privacyPage: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    updated: string;
    intro: string;
    sections: PrivacySection[];
    legalLines: string[];
  };
};

export const content: ContentByLang = {
  pt: {
    nav: {
      consulting: "Consultoria",
      speaking: "Palestras",
      book: "Livro",
      articles: "Artigos",
      media: "Na mídia",
      contact: "Contato",
    },
    hero: {
      headline: "Crescimento exige decisão — e clareza sobre onde apostar.",
      subhead:
        "Apoio CEOs e lideranças em decisões estratégicas que definem o crescimento — com clareza, foco e execução.",
    ctaContact: "Solicitar conversa",
      ctaBook: "Conhecer o livro",
    },
    about: {
      title: "Denis Caldeira",
      body: "Estrategista e conselheiro. Autor e palestrante. Mais de 26 anos em tecnologia e negócios, com liderança executiva em Telefónica Vivo, Google e Meta — nesta última como diretor de negócios para PMEs na América Latina, com responsabilidade por receita de cerca de R$ 10 bilhões. Atuou em scale-ups como Quinto Andar e Addi. Engenheiro pela FEI, MBA pela USP, mestre em Engenharia Econômica (Grenoble II) e formações executivas em Wharton, Kellogg e Columbia. Fundador da Caldeira Growth — foco em estratégia, decisão e crescimento com método.",
      experienceLine: "Empresas e organizações",
      companiesLine:
        "Telefónica Vivo, Google e Meta (América Latina, ~R$ 10 bi em receita) · Quinto Andar · Addi",
      councilsIntro: "Conselhos de administração e advisory boards",
      councilsLine: "CIMED · MASP · Generation Brasil · Cruzeiro SAF · Seguros Sura",
    },
    pillars: {
      title: "O que ofereço",
      subtitle:
        "Quatro frentes — para quando o que importa é profundidade e direção, não volume de entregas.",
      consulting: {
        title: "Consultoria estratégica",
        description:
          "Clareza sobre prioridades, trade-offs e execução — quando o crescimento deixa de ser linear e passa a exigir escolhas estruturais.",
      },
      speaking: {
        title: "Palestras",
        description:
          "Sessões sob medida para executivos e conselhos — crescimento, decisão e liderança com densidade e foco.",
      },
      pathToGrow: {
        title: "Programa de Desenvolvimento de Executivos — Path to Grow",
        shortDescription:
          "Jornada executiva de 106 horas em cinco módulos — estratégia, cultura, liderança e crescimento. Módulos também disponíveis separadamente.",
        description:
          "Formação executiva para ampliar repertório estratégico, leitura financeira e maturidade para decidir em contextos complexos — com aplicação direta na liderança. 106 horas em cinco módulos, contratáveis em conjunto ou de forma independente.",
        micro: "106 horas · 5 módulos · completo ou modular",
      },
      book: {
        title: "Livro",
        description:
          "Cresça ou Desapareça — método e prática para decidir sob pressão e conduzir crescimento com rigor.",
      },
    },
    growthApproach: {
      title: "Como penso crescimento",
      intro:
        "Crescimento não é acaso nem sorte.\n\nÉ uma escolha contínua sobre onde investir energia e capital — com disciplina e clareza.",
      point1:
        "Priorização rigorosa — nem tudo merece o mesmo esforço. O que move o negócio recebe foco e recurso.",
      point2:
        "Decisão apoiada em evidência — menos intuição solta; mais dados e estrutura para reduzir viés.",
      point3:
        "Execução iterativa — planejamento vivo, ajustes rápidos, aprendizado contínuo.",
    },
    homeDecisions: {
      title: "Decisões reais que acompanhei",
      subtitle:
        "Não são cases nem promessas — são contextos reais onde clareza estratégica foi determinante.",
    },
    media: {
      title: "Caldeira na mídia",
      subtitle:
        "Artigos, entrevistas e reflexões sobre estratégia, crescimento e decisão.",
    },
    articles: {
      title: "Artigos em destaque",
      subtitle: "Estratégia e crescimento em texto direto.",
      readMore: "Ler artigo",
    },
    contactCTA: {
      title: "Toda empresa cresce até onde sua clareza permite.",
      cta: "Solicitar conversa",
    },
    contactPage: {
      headline: "Vamos conversar",
      subtitle:
        "Para discussões estratégicas, decisões críticas ou uma conversa inicial sobre crescimento.",
      form: {
        name: "Nome",
        email: "Email",
        company: "Empresa",
        role: "Cargo",
        topic: "Sobre o que você gostaria de conversar?",
        topicPlaceholder: "Selecione um tema",
        message: "Mensagem",
        submit: "Enviar mensagem",
        sending: "Enviando…",
        successTitle: "Mensagem recebida",
        successDescription:
          "Recebemos as informações sobre o seu contexto. Entraremos em contato pelo e-mail informado.",
        errorTitle: "Não foi possível enviar",
        errorDescription:
          "Tente novamente em instantes ou escreva para contato@caldeiragrowth.com.",
        notConfigured:
          "O envio pelo site não está disponível no momento. Escreva para contato@caldeiragrowth.com.",
      },
      topicOptions: [
        { value: "growth", label: "Crescimento e estratégia" },
        {
          value: "path-to-grow",
          label: "Programa de Desenvolvimento de Executivos - Path to Grow",
        },
        { value: "critical", label: "Decisões críticas" },
        { value: "org", label: "Organização / estrutura" },
        { value: "speaking", label: "Palestras" },
        { value: "other", label: "Outro" },
      ],
    },
    speakingPage: {
      headline: "Palestras sobre crescimento, decisão e liderança",
      subtitle:
        "Sessões sob medida para executivos e times que enfrentam desafios reais de crescimento e precisam de clareza estratégica.",
      themesTitle: "Temas abordados",
      themes: [
        "Crescimento como escolha estratégica",
        "Tomada de decisão em ambientes complexos",
        "Prioridade, foco e alocação de recursos",
        "Liderança em momentos de inflexão",
      ],
    },
    consultingPage: {
      hero: {
        title: "Crescimento exige decisão.",
        subtitle:
          "Apoio líderes e empresas a enfrentarem decisões estratégicas com clareza, profundidade e execução disciplinada.",
        cta: "Solicitar conversa",
      },
      forWhom: {
        title: "Para quem precisa decidir",
        intro:
          "Trabalho com lideranças em momentos em que o crescimento deixa de ser linear e passa a exigir escolhas estruturais.",
        bullets: [
          "CEOs e fundadores em fases de escala",
          "Empresas que precisam reorganizar crescimento",
          "Lideranças diante de decisões estratégicas críticas",
          "Negócios que cresceram rápido, mas perderam clareza",
        ],
      },
      howIWork: {
        title: "Como atuo",
        lead:
          "Minha atuação combina experiência executiva, julgamento estratégico e proximidade com a decisão.",
        clarityLead: "O foco é construir clareza sobre:",
        clarityPoints: [
          "Onde crescer",
          "Onde parar",
          "O que priorizar",
          "Como executar",
        ],
        bridge:
          "Atuo em projetos estruturados e em proximidade com a liderança — muitas vezes como conselheiro — apoiando decisões em momentos críticos.",
        formats: [
          "Conselheiro estratégico próximo à liderança — certificação IBGC",
          "Apoio em decisões críticas (pontuais ou recorrentes)",
          "Estruturação de direção em momentos de inflexão",
        ],
      },
      situations: {
        title: "Decisões reais que acompanhei",
        subtitle:
          "Não são cases nem promessas — são contextos reais onde clareza estratégica foi determinante.",
        labels: {
          context: "CONTEXTO",
          decision: "DECISÃO",
          impact: "IMPACTO",
        },
        cases: [
          {
            title: "Reorganização de crescimento em empresa em escala",
            context:
              "Empresa com crescimento acelerado, mas perda de clareza sobre prioridades e alocação de recursos.",
            decision:
              "Redefinição dos vetores de crescimento, foco em segmentos prioritários e ajuste na estrutura de execução.",
            impact:
              "Retomada de crescimento com maior eficiência e alinhamento estratégico da liderança.",
          },
          {
            title: "Apoio a CEO em decisão estratégica crítica",
            context:
              "Momento de inflexão com múltiplas alternativas de crescimento e alto risco de dispersão.",
            decision:
              "Estruturação do processo decisório, clareza de trade-offs e definição de caminho prioritário.",
            impact:
              "Decisão mais rápida, alinhamento interno e execução mais consistente.",
          },
          {
            title: "Estruturação de operação de vendas em startup",
            context:
              "Empresa com forte produto, mas dificuldade de escalar receita de forma previsível.",
            decision:
              "Redesenho da operação comercial, definição de papéis e criação de rotina de gestão.",
            impact:
              "Maior previsibilidade de receita e ganho de eficiência comercial.",
          },
        ],
      },
      board: {
        title: "Atuação como conselheiro",
        paragraphs: [
          "Parte relevante da minha atuação acontece como conselheiro, apoiando lideranças em decisões que definem o futuro das empresas.",
          "Atuei em conselhos de organizações como CIMED, MASP – Museu de Arte de São Paulo, Generation Brasil e Cruzeiro SAF, além de conselhos consultivos em empresas em diferentes estágios de crescimento.",
          "Mais do que recomendações, trata-se de participar do processo decisório — com clareza, independência e responsabilidade sobre os caminhos escolhidos.",
        ],
        formatsTitle: "Formatos de atuação",
        formats: [
          "Conselheiro estratégico próximo à liderança — certificação IBGC",
          "Apoio em decisões críticas (pontuais ou recorrentes)",
          "Estruturação de direção em momentos de inflexão",
        ],
      },
      experience: {
        title: "Experiência aplicada",
        body:
          "Mais de duas décadas em empresas como Telefônica, Google e Meta, e em posições executivas em negócios de alto crescimento — visão que combina estratégia, execução e escala.\n\nInclui atuação em conselhos, com apoio a decisões de alto impacto em contextos distintos.",
      },
      finalCta: {
        title: "Toda empresa cresce até onde sua clareza permite.",
        cta: "Solicitar conversa",
      },
    },
    footer: {
      tagline: "Caldeira Growth",
      contact: "contato@caldeiragrowth.com",
      rights: "Todos os direitos reservados.",
      connectLabel: "Conecte-se",
      privacyPolicy: "Política de Privacidade",
    },
    privacyPage: {
      metaTitle: "Política de Privacidade | Caldeira Growth",
      metaDescription:
        "Política de privacidade da Caldeira Growth. Saiba como tratamos seus dados.",
      title: "Política de Privacidade",
      updated: "Atualizado em: 29 de Abril de 2025",
      intro:
        "Sua privacidade é importante para nós. É política da Fortes & Caldeira Consultoria Empresarial respeitar a sua privacidade em relação a qualquer informação que possamos coletar em nosso site www.caldeiragrowth.com e outros sites que possuímos e operamos.",
      sections: [
        {
          kind: "text",
          title: "1. Coleta de Informações",
          body:
            "Coletamos informações pessoais como nome, e-mail e telefone apenas quando você nos fornece voluntariamente por meio de formulários de contato, inscrição ou outros canais similares. Também coletamos dados de navegação por meio de cookies e ferramentas de análise, como Google Analytics e Hotjar.",
        },
        {
          kind: "bullets",
          title: "2. Uso das Informações",
          intro: "Utilizamos seus dados para:",
          items: [
            "Responder a contatos e solicitações;",
            "Enviar informações relevantes sobre nossos serviços;",
            "Melhorar a experiência do usuário no site;",
            "Cumprir obrigações legais.",
          ],
        },
        {
          kind: "text",
          title: "3. Compartilhamento de Dados",
          body:
            "Não compartilhamos informações pessoais publicamente ou com terceiros, exceto quando exigido por lei ou com seu consentimento.",
        },
        {
          kind: "text",
          title: "4. Segurança dos Dados",
          body:
            "Adotamos práticas seguras para proteger suas informações pessoais, incluindo criptografia e controle de acesso.",
        },
        {
          kind: "text",
          title: "5. Cookies",
          body:
            "Utilizamos cookies para armazenar informações de navegação e melhorar a experiência de uso. Você pode configurar seu navegador para recusar cookies, mas isso pode limitar algumas funcionalidades do site.",
        },
        {
          kind: "text",
          title: "6. Seus Direitos",
          body:
            "Você tem o direito de acessar, corrigir ou excluir seus dados pessoais armazenados por nós. Para isso, entre em contato pelo e-mail: contato@caldeiragrowth.com",
        },
        {
          kind: "text",
          title: "7. Alterações nesta Política",
          body:
            "Reservamo-nos o direito de modificar esta política de privacidade a qualquer momento. As alterações serão publicadas nesta página.",
        },
      ],
      legalLines: [
        "Responsável pelo tratamento de dados: Denis Caldeira de Almeida",
        "Fortes & Caldeira Consultoria Empresarial",
        "CNPJ: 06.254.268/0001-36",
        "Contato: contato@caldeiragrowth.com",
        "",
        "Caldeira Growth Consultoria",
      ],
    },
  },
  en: {
    nav: {
      consulting: "Consulting",
      speaking: "Speaking",
      book: "Book",
      articles: "Articles",
      media: "In the Media",
      contact: "Contact",
    },
    hero: {
      headline: "Growth demands decision — and clarity on where to commit.",
      subhead:
        "I support CEOs and leadership teams in the strategic choices that define growth — with clarity, focus, and execution.",
    ctaContact: "Request a conversation",
      ctaBook: "Discover the book",
    },
    about: {
      title: "Denis Caldeira",
      body: "Strategist and advisor. Author and speaker. 26+ years in technology and business, with executive leadership at Telefónica Vivo, Google, and Meta — at Meta as Director of SMBs for Latin America with responsibility for roughly R$10 billion in revenue. Experience at scale-ups including Quinto Andar and Addi. Degrees from FEI, USP MBA, master’s in Economic Engineering (Grenoble II), and executive education at Wharton, Kellogg, and Columbia. Founder of Caldeira Growth — focused on strategy, decision-making, and disciplined growth.",
      experienceLine: "Companies and organizations",
      companiesLine:
        "Telefónica Vivo, Google, and Meta (Latin America, ~R$10B revenue) · Quinto Andar · Addi",
      councilsIntro: "Boards of directors and advisory boards",
      councilsLine: "CIMED · MASP · Generation Brazil · Cruzeiro SAF · Seguros Sura",
    },
    pillars: {
      title: "What I offer",
      subtitle:
        "Four pillars — for when depth and direction matter more than a long list of deliverables.",
      consulting: {
        title: "Strategic consulting",
        description:
          "Clarity on priorities, trade-offs, and execution — when growth stops being linear and starts requiring structural choices.",
      },
      speaking: {
        title: "Speaking",
        description:
          "Tailored sessions for executives and boards — growth, decision-making, and leadership with depth and focus.",
      },
      pathToGrow: {
        title: "Executive Development Program — Path to Grow",
        shortDescription:
          "A 106-hour executive journey across five modules — strategy, culture, leadership, and growth. Modules also available separately.",
        description:
          "Executive development to expand strategic range, financial literacy, and judgment in complex settings — with direct application to leadership. 106 hours across five modules, available as a full program or module by module.",
        micro: "106 hours · 5 modules · full program or modular",
      },
      book: {
        title: "Book",
        description:
          "Grow or Disappear — method and practice for deciding under pressure and driving growth with rigor.",
      },
    },
    growthApproach: {
      title: "How I think about growth",
      intro:
        "Growth is neither chance nor luck.\n\nIt is an ongoing choice about where to invest energy and capital — with discipline and clarity.",
      point1:
        "Rigorous prioritization — not everything deserves equal effort. What moves the business gets focus and resources.",
      point2:
        "Evidence-backed decisions — less loose intuition; more data and structure to reduce bias.",
      point3:
        "Iterative execution — living plans, fast adjustments, continuous learning.",
    },
    homeDecisions: {
      title: "Real decisions I’ve supported",
      subtitle:
        "Not case studies or promises — real contexts where strategic clarity was decisive.",
    },
    media: {
      title: "Caldeira in the media",
      subtitle:
        "Articles, interviews, and reflections on strategy, growth, and decision-making.",
    },
    articles: {
      title: "Featured articles",
      subtitle: "Strategy and growth in plain language.",
      readMore: "Read article",
    },
    contactCTA: {
      title: "Every company grows only as far as its clarity allows.",
      cta: "Request a conversation",
    },
    contactPage: {
      headline: "Let’s talk",
      subtitle:
        "For strategic discussions, critical decisions, or an initial conversation about growth.",
      form: {
        name: "Name",
        email: "Email",
        company: "Company",
        role: "Role",
        topic: "What would you like to discuss?",
        topicPlaceholder: "Select a topic",
        message: "Message",
        submit: "Send message",
        sending: "Sending…",
        successTitle: "Message received",
        successDescription:
          "We have received the information about your context and will contact you through the email address provided.",
        errorTitle: "Could not send",
        errorDescription:
          "Please try again shortly or email contato@caldeiragrowth.com.",
        notConfigured:
          "Online submission is temporarily unavailable. Email contato@caldeiragrowth.com.",
      },
      topicOptions: [
        { value: "growth", label: "Growth and strategy" },
        {
          value: "path-to-grow",
          label: "Executive Development Program - Path to Grow",
        },
        { value: "critical", label: "Critical decisions" },
        { value: "org", label: "Organization / structure" },
        { value: "speaking", label: "Speaking" },
        { value: "other", label: "Other" },
      ],
    },
    speakingPage: {
      headline: "Talks on growth, decision-making, and leadership",
      subtitle:
        "Tailored sessions for executives and teams facing real growth challenges who need strategic clarity.",
      themesTitle: "Themes",
      themes: [
        "Growth as a strategic choice",
        "Decision-making in complex environments",
        "Priority, focus, and resource allocation",
        "Leadership at inflection points",
      ],
    },
    consultingPage: {
      hero: {
        title: "Growth demands decision.",
        subtitle:
          "I support leaders and companies facing strategic choices — with clarity, depth, and disciplined execution.",
        cta: "Request a conversation",
      },
      forWhom: {
        title: "For those who must decide",
        intro:
          "I work with leadership teams when growth stops being linear and starts requiring structural choices.",
        bullets: [
          "CEOs and founders in scaling phases",
          "Organizations that need to reorganize how they grow",
          "Leaders facing critical strategic decisions",
          "Businesses that grew fast but lost clarity",
        ],
      },
      howIWork: {
        title: "How I work",
        lead:
          "My work combines executive experience, strategic judgment, and proximity to the decision itself.",
        clarityLead: "The focus is building clarity on:",
        clarityPoints: [
          "Where to grow",
          "Where to stop",
          "What to prioritize",
          "How to execute",
        ],
        bridge:
          "I engage in structured work and in close partnership with leadership — often as an advisor — supporting decisions at critical moments.",
        formats: [
          "Strategic advisor alongside leadership — IBGC certification",
          "Support on critical decisions — episodic or ongoing",
          "Structuring direction at inflection points",
        ],
      },
      situations: {
        title: "Real decisions I’ve supported",
        subtitle:
          "Not case studies or promises — real contexts where strategic clarity was decisive.",
        labels: {
          context: "CONTEXT",
          decision: "DECISION",
          impact: "IMPACT",
        },
        cases: [
          {
            title: "Reorganizing growth at a scaling company",
            context:
              "Rapid growth with fading clarity on priorities and resource allocation.",
            decision:
              "Reset growth vectors, focus on priority segments, and adjust the execution architecture.",
            impact:
              "Growth resumed with higher efficiency and stronger strategic alignment among leadership.",
          },
          {
            title: "Supporting a CEO through a critical strategic choice",
            context:
              "An inflection point with multiple growth paths and high risk of dispersion.",
            decision:
              "Structured the decision process, clarified trade-offs, and defined a priority path.",
            impact:
              "Faster decisions, internal alignment, and more consistent execution.",
          },
          {
            title: "Structuring a sales operation in a startup",
            context:
              "Strong product, but difficulty scaling revenue predictably.",
            decision:
              "Redesigned the commercial operation, defined roles, and built a management cadence.",
            impact:
              "Higher revenue predictability and commercial efficiency.",
          },
        ],
      },
      board: {
        title: "Board and advisory work",
        paragraphs: [
          "A meaningful part of my work happens as an advisor — supporting leaders on decisions that define a company’s future.",
          "I have served on boards at organizations such as CIMED, MASP – São Paulo Museum of Art, Generation Brazil, and Cruzeiro SAF, as well as advisory boards at companies at different stages of growth.",
          "More than recommendations — it is participation in the decision process, with clarity, independence, and accountability for the paths chosen.",
        ],
        formatsTitle: "Formats",
        formats: [
          "Strategic advisor alongside leadership — IBGC certification",
          "Support on critical decisions — episodic or ongoing",
          "Structuring direction at inflection points",
        ],
      },
      experience: {
        title: "Applied experience",
        body:
          "More than two decades at companies such as Telefônica, Google, and Meta — and in executive roles at high-growth businesses — combining strategy, execution, and scale.\n\nThat includes board work supporting high-impact decisions across different contexts.",
      },
      finalCta: {
        title: "Every company grows only as far as its clarity allows.",
        cta: "Request a conversation",
      },
    },
    footer: {
      tagline: "Caldeira Growth",
      contact: "contato@caldeiragrowth.com",
      rights: "All rights reserved.",
      connectLabel: "Connect",
      privacyPolicy: "Privacy Policy",
    },
    privacyPage: {
      metaTitle: "Privacy Policy | Caldeira Growth",
      metaDescription:
        "Caldeira Growth privacy policy. Learn how we handle your data.",
      title: "Privacy Policy",
      updated: "Updated: April 29, 2025",
      intro:
        "Your privacy matters to us. Fortes & Caldeira Consultoria Empresarial is committed to respecting your privacy regarding any information we may collect on our website www.caldeiragrowth.com and other sites we own and operate.",
      sections: [
        {
          kind: "text",
          title: "1. Information we collect",
          body:
            "We collect personal information such as name, email, and phone number only when you voluntarily provide it through contact forms, sign-ups, or similar channels. We also collect browsing data through cookies and analytics tools such as Google Analytics and Hotjar.",
        },
        {
          kind: "bullets",
          title: "2. How we use information",
          intro: "We use your data to:",
          items: [
            "Respond to inquiries and requests;",
            "Send relevant information about our services;",
            "Improve the user experience on the site;",
            "Comply with legal obligations.",
          ],
        },
        {
          kind: "text",
          title: "3. Sharing data",
          body:
            "We do not share personal information publicly or with third parties except when required by law or with your consent.",
        },
        {
          kind: "text",
          title: "4. Data security",
          body:
            "We adopt secure practices to protect your personal information, including encryption and access controls.",
        },
        {
          kind: "text",
          title: "5. Cookies",
          body:
            "We use cookies to store browsing information and improve your experience. You can configure your browser to refuse cookies, but some site features may be limited.",
        },
        {
          kind: "text",
          title: "6. Your rights",
          body:
            "You have the right to access, correct, or delete your personal data stored by us. To do so, contact us at: contato@caldeiragrowth.com",
        },
        {
          kind: "text",
          title: "7. Changes to this policy",
          body:
            "We may update this privacy policy at any time. Changes will be published on this page.",
        },
      ],
      legalLines: [
        "Data controller: Denis Caldeira de Almeida",
        "Fortes & Caldeira Consultoria Empresarial",
        "Tax ID (CNPJ): 06.254.268/0001-36",
        "Contact: contato@caldeiragrowth.com",
        "",
        "Caldeira Growth Consultoria",
      ],
    },
  },
};

content.es = {
  ...content.pt,
  nav: {
    consulting: "Consultoría",
    speaking: "Conferencias",
    book: "Libro",
    articles: "Artículos",
    media: "Medios",
    contact: "Contacto",
  },
  hero: {
    headline: "Arquitectura de Crecimiento para Negocios y Líderes",
    subhead:
      "Diseñamos sistemas de crecimiento que integran estrategia, cultura, liderazgo y ejecución.",
    ctaContact: "Solicitar una conversación",
    ctaBook: "Conocer el libro",
  },
  media: {
    title: "Caldeira en los medios",
    subtitle:
      "Artículos, entrevistas y reflexiones sobre estrategia, crecimiento y toma de decisiones.",
  },
  articles: {
    title: "Artículos destacados",
    subtitle: "Estrategia y crecimiento en lenguaje directo.",
    readMore: "Leer artículo",
  },
  contactCTA: {
    title:
      "¿El próximo ciclo de crecimiento requiere más claridad, alineación y capacidad de ejecución?",
    subtitle:
      "Converse con Caldeira Growth sobre los desafíos actuales de su organización.",
    cta: "Solicitar una conversación",
  },
  contactPage: {
    headline: "Hablemos",
    subtitle:
      "Para conversaciones estratégicas, decisiones críticas o una primera conversación sobre crecimiento.",
    form: {
      name: "Nombre",
      email: "Email",
      company: "Empresa",
      role: "Cargo",
      topic: "¿Sobre qué le gustaría conversar?",
      topicPlaceholder: "Seleccione un tema",
      message: "Mensaje",
      submit: "Enviar mensaje",
      sending: "Enviando...",
      successTitle: "Mensaje recibido",
      successDescription:
        "Hemos recibido la información sobre su contexto y nos pondremos en contacto a través del correo electrónico informado.",
      errorTitle: "No fue posible enviar",
      errorDescription:
        "Intente nuevamente en unos instantes o escriba a contato@caldeiragrowth.com.",
      notConfigured:
        "El envío por el sitio no está disponible en este momento. Escriba a contato@caldeiragrowth.com.",
    },
    topicOptions: [
      { value: "growth", label: "Crecimiento y estrategia" },
      {
        value: "path-to-grow",
        label: "Programa de Desarrollo Ejecutivo",
      },
      { value: "critical", label: "Decisiones críticas" },
      { value: "org", label: "Organización / estructura" },
      { value: "speaking", label: "Conferencias" },
      { value: "other", label: "Otro" },
    ],
  },
  footer: {
    tagline: "Caldeira Growth",
    contact: "contato@caldeiragrowth.com",
    rights: "Todos los derechos reservados.",
    connectLabel: "Conéctese",
    privacyPolicy: "Política de Privacidad",
  },
  privacyPage: {
    metaTitle: "Política de Privacidad | Caldeira Growth",
    metaDescription:
      "Política de privacidad de Caldeira Growth. Conozca cómo tratamos sus datos.",
    title: "Política de Privacidad",
    updated: "Actualizado: 29 de abril de 2025",
    intro:
      "Su privacidad es importante para nosotros. Es política de Fortes & Caldeira Consultoria Empresarial respetar su privacidad con relación a cualquier información que podamos recopilar en nuestro sitio www.caldeiragrowth.com y en otros sitios que poseemos y operamos.",
    sections: [
      {
        kind: "text",
        title: "1. Recopilación de información",
        body:
          "Recopilamos información personal como nombre, email y teléfono únicamente cuando usted nos la proporciona voluntariamente por medio de formularios de contacto, inscripción u otros canales similares. También recopilamos datos de navegación por medio de cookies y herramientas de análisis, como Google Analytics y Hotjar.",
      },
      {
        kind: "bullets",
        title: "2. Uso de la información",
        intro: "Utilizamos sus datos para:",
        items: [
          "Responder contactos y solicitudes;",
          "Enviar información relevante sobre nuestros servicios;",
          "Mejorar la experiencia del usuario en el sitio;",
          "Cumplir obligaciones legales.",
        ],
      },
      {
        kind: "text",
        title: "3. Compartir datos",
        body:
          "No compartimos información personal públicamente ni con terceros, excepto cuando sea exigido por ley o con su consentimiento.",
      },
      {
        kind: "text",
        title: "4. Seguridad de los datos",
        body:
          "Adoptamos prácticas de seguridad para proteger su información personal, incluyendo cifrado y control de acceso.",
      },
      {
        kind: "text",
        title: "5. Cookies",
        body:
          "Utilizamos cookies para almacenar información de navegación y mejorar la experiencia de uso. Usted puede configurar su navegador para rechazar cookies, pero eso puede limitar algunas funcionalidades del sitio.",
      },
      {
        kind: "text",
        title: "6. Sus derechos",
        body:
          "Usted tiene derecho a acceder, corregir o eliminar los datos personales almacenados por nosotros. Para hacerlo, entre en contacto por email: contato@caldeiragrowth.com",
      },
      {
        kind: "text",
        title: "7. Cambios en esta política",
        body:
          "Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Los cambios serán publicados en esta página.",
      },
    ],
    legalLines: [
      "Responsable del tratamiento de datos: Denis Caldeira de Almeida",
      "Fortes & Caldeira Consultoria Empresarial",
      "CNPJ: 06.254.268/0001-36",
      "Contacto: contato@caldeiragrowth.com",
      "",
      "Caldeira Growth Consultoria",
    ],
  },
};
