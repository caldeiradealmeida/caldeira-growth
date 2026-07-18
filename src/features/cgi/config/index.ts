import { CGI_QUESTIONS, type CgiDimensionId } from "@/data/cgiConfig";
import { localizedPath, type Language } from "@/lib/routing";
import type { LeadForm } from "../types";

export const initialLead: LeadForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  companyWebsite: "",
  role: "",
  sector: "",
  sectorOther: "",
  commercialRelationshipModel: "",
  commercialRelationshipOther: "",
  employeeCount: "",
  annualRevenue: "",
  currentChallenge: "",
  growthGoal: "",
  investmentIntent: "",
  comments: "",
};

export const CGI_ASSESSMENT_ENDPOINT = "/api/cgi-assessment";
export const CGI_START_ENDPOINT = "/api/cgi/start";
export const CGI_LEAD_ENDPOINT = "/api/cgi/lead";
export const CGI_PROGRESS_ENDPOINT = "/api/cgi/progress";
export const CGI_EVENT_ENDPOINT = "/api/cgi/event";
export const CGI_LAST_ASSESSMENT_KEY = "caldeira-growth:cgi:last-assessment";
export const CGI_SESSION_KEY = "caldeira-growth:cgi:tab-session";
export const CGI_ASSESSMENT_STATE_KEY = "caldeira-growth:cgi:assessment-state";
export const CGI_PRIVACY_POLICY_VERSION = "2026-07-17";
export const CGI_METHODOLOGY_VERSION = "1.0.0";
export const CGI_SCORING_VERSION = "1.0.0";

export const cgiUi: Record<
  Language,
  {
    metaTitle: string;
    metaDescription: string;
    badge: string;
    heroTitle: string;
    heroText: string;
    start: string;
    stats: [string, string][];
    trust: Array<{ title: string; body: string }>;
    step1: string;
    contextTitle: string;
    contextBody: string;
    methodIntroTitle: string;
    methodIntroBody: string[];
    labels: Record<keyof LeadForm, string>;
    sectorHelp: string;
    sectorOptions: string[];
    sectorOtherLabel: string;
    commercialRelationshipHelp: string;
    commercialRelationshipOptions: string[];
    commercialRelationshipOtherLabel: string;
    selectPlaceholder: string;
    commentsPlaceholder: string;
    commentsHelp: string;
    begin: string;
    step2: string;
    answered: (answered: number, total: number) => string;
    back: string;
    nextDimension: string;
    generate: string;
    step3: string;
    finalScore: string;
    openReport: string;
    printReport: string;
    emailReport: string;
    reportPending: string;
    reportStages: string[];
    reportAlertTitle: string;
    reportAlertBody: string;
    reportIpBody: string;
    proprietaryBody: string;
    savedTitle: string;
    savedBody: string;
    scoreByDimension: string;
    attentionTitle: string;
    attentionBody: string;
    invalidRequiredTitle: string;
    invalidRequiredBody: string;
    invalidEmailTitle: string;
    invalidEmailBody: string;
    invalidPhoneBody: string;
    incompleteDimensionTitle: string;
    incompleteDimensionBody: string;
    incompleteAssessmentTitle: string;
    incompleteAssessmentBody: string;
    saveFailureTitle: string;
    reportDocTitle: string;
    reportSubtitle: string;
    dimensionReadingTitle: string;
    criticalBottlenecksTitle: string;
    strategicBetsTitle: string;
    renunciationsTitle: string;
    governanceTitle: string;
    finalRecommendationsTitle: string;
    methodEyebrow: string;
    methodReportTitle: string;
    methodReportBody: string[];
    methodSignature: string;
    downloadPdf: string;
    generatingPdf: string;
    pdfGenerated: string;
    pdfError: string;
    printVersion: string;
    printInstruction: string;
    company: string;
    respondent: string;
    role: string;
    diagnosis: string;
    contact: string;
    contactText: string;
    founderLine: string;
    toolbar: string;
    privacyConsentLabel: string;
    marketingConsentLabel: string;
    privacyPolicyHref: string;
    privacyPolicyLinkLabel: string;
    privacyReviewNote: string;
  }
> = {
  pt: {
    metaTitle: "CGI - Caldeira Growth Index | Assessment de crescimento",
    metaDescription:
      "Assessment gratuito de maturidade de crescimento empresarial da Caldeira Growth. Descubra gargalos e prioridades em menos de 10 minutos.",
    badge: "CGI - Caldeira Growth Index",
    heroTitle: "Avalie a capacidade de crescimento da sua organização.",
    heroText:
      "O Caldeira Growth Index analisa cinco dimensões que sustentam o crescimento e produz uma leitura executiva sobre gargalos, prioridades e capacidades organizacionais.",
    start: "Iniciar assessment",
    stats: [["5", "dimensões críticas"], ["40", "perguntas executivas"], ["0-100", "score de maturidade"]],
    trust: [
      { title: "Consultivo", body: "Perguntas orientadas a decisões de crescimento, não um quiz genérico." },
      { title: "Estruturado", body: "Score calculado por dimensão, preservando o modelo proprietário da Caldeira Growth." },
      { title: "Executivo", body: "Relatório com leitura de gargalos, prioridades e hipóteses para decisão." },
    ],
    step1: "Etapa 1 de 3",
    contextTitle: "Antes do assessment, precisamos contextualizar sua empresa.",
    contextBody:
      "Esses dados ajudam a interpretar o resultado com mais precisão e a registrar o diagnóstico na base da Caldeira Growth.",
    methodIntroTitle: "Um método proprietário de diagnóstico de crescimento",
    methodIntroBody: [
      "O Caldeira Growth Index é um diagnóstico proprietário, desenvolvido para avaliar as capacidades que sustentam o crescimento de uma organização.",
      "As 40 perguntas, as cinco dimensões e a lógica de interpretação foram estruturadas a partir da experiência da Caldeira Growth em projetos de consultoria, pareceres estratégicos, programas de desenvolvimento executivo, atuação com lideranças e dos princípios apresentados no livro Cresça ou Desapareça.",
      "A inteligência artificial é utilizada para organizar as informações e personalizar o parecer. O método, os critérios e a lógica do diagnóstico são da Caldeira Growth.",
    ],
    labels: {
      name: "Nome",
      email: "E-mail",
      phone: "Telefone",
      company: "Empresa",
      companyWebsite: "Site da empresa",
      role: "Cargo",
      sector: "Setor de atuação da empresa",
      sectorOther: "Qual é o setor de atuação da empresa?",
      commercialRelationshipModel: "Principal modelo de relacionamento comercial",
      commercialRelationshipOther: "Qual é o modelo de relacionamento comercial?",
      employeeCount: "Número de funcionários",
      annualRevenue: "Faturamento anual aproximado",
      currentChallenge: "Principal desafio atual",
      growthGoal: "Meta de crescimento para os próximos 12 meses",
      investmentIntent: "Pretende investir em crescimento e desenvolvimento da organização nos próximos 12 meses?",
      comments: "Comentários adicionais",
    },
    sectorHelp:
      "Selecione o setor econômico que melhor representa a atividade principal da empresa.",
    sectorOptions: [
      "Agronegócio",
      "Alimentos e bebidas",
      "Automotivo e mobilidade",
      "Construção e mercado imobiliário",
      "Educação",
      "Energia e utilities",
      "Entretenimento, mídia e comunicação",
      "Governo e setor público",
      "Indústria e manufatura",
      "Logística e transportes",
      "Mineração e recursos naturais",
      "Saúde e ciências da vida",
      "Seguros",
      "Serviços financeiros",
      "Serviços profissionais e consultoria",
      "Tecnologia e software",
      "Telecomunicações",
      "Turismo e hospitalidade",
      "Varejo e bens de consumo",
      "Terceiro setor",
      "Outro",
    ],
    sectorOtherLabel: "Qual é o setor de atuação da empresa?",
    commercialRelationshipHelp:
      "Selecione como a empresa se relaciona comercialmente com seus principais clientes.",
    commercialRelationshipOptions: [
      "B2B",
      "B2C",
      "B2B2C",
      "B2G",
      "Marketplace / Plataforma",
      "Modelo misto",
      "Outro",
    ],
    commercialRelationshipOtherLabel: "Qual é o modelo de relacionamento comercial?",
    selectPlaceholder: "Selecione",
    commentsPlaceholder:
      "Adicione mais informações relevantes sobre o negócio ou aprofunde pontos das questões abordadas para enriquecer o diagnóstico.",
    commentsHelp: "Campo opcional. Use apenas se houver contexto adicional que ajude a qualificar a leitura executiva.",
    begin: "Começar assessment",
    step2: "Etapa 2 de 3",
    answered: (answered, total) => `${answered} de ${total}`,
    back: "Voltar",
    nextDimension: "Próxima dimensão",
    generate: "Gerar meu CGI",
    step3: "Etapa 3 de 3",
    finalScore: "CGI final",
    openReport: "Abrir versão para impressão",
    printReport: "Baixar PDF",
    emailReport: "Abrir e-mail com relatório",
    reportPending: "O parecer completo será liberado quando a aplicação dos critérios do CGI terminar.",
    reportStages: [
      "Consolidando as respostas.",
      "Aplicando os critérios do método Caldeira Growth.",
      "Comparando as cinco dimensões.",
      "Identificando padrões e gargalos.",
      "Preparando o parecer executivo.",
    ],
    reportAlertTitle: "Seu índice já foi calculado",
    reportAlertBody:
      "Estamos aplicando a lógica do CGI às respostas da sua organização.",
    reportIpBody:
      "A inteligência artificial apoia a consolidação dos dados e a personalização do parecer.",
    proprietaryBody:
      "Método Caldeira Growth. Inteligência artificial aplicada à personalização do parecer.",
    savedTitle: "Resultado registrado",
    savedBody: "Seus dados foram salvos e o relatório foi preparado.",
    scoreByDimension: "Score por dimensão",
    attentionTitle: "3 principais pontos de atenção",
    attentionBody:
      "Essa dimensão aparece entre as menores notas e deve ser priorizada em uma conversa estratégica.",
    invalidRequiredTitle: "Campos obrigatórios",
    invalidRequiredBody: "Preencha todos os dados antes de iniciar o assessment.",
    invalidEmailTitle: "E-mail inválido",
    invalidEmailBody: "Informe um e-mail corporativo válido para continuar.",
    invalidPhoneBody: "Informe um número de telefone válido.",
    incompleteDimensionTitle: "Dimensão incompleta",
    incompleteDimensionBody: "Responda todas as perguntas desta dimensão para continuar.",
    incompleteAssessmentTitle: "Assessment incompleto",
    incompleteAssessmentBody: "Responda as 40 perguntas para gerar seu CGI.",
    saveFailureTitle: "Falha ao salvar",
    reportDocTitle: "Relatório CGI",
    reportSubtitle: "Diagnóstico executivo de maturidade de crescimento",
    dimensionReadingTitle: "Leitura por dimensão",
    criticalBottlenecksTitle: "Gargalos críticos",
    strategicBetsTitle: "Apostas estratégicas recomendadas",
    renunciationsTitle: "Renúncias estratégicas",
    governanceTitle: "Sistema mínimo de governança",
    finalRecommendationsTitle: "Recomendações finais",
    methodEyebrow: "Método proprietário Caldeira Growth",
    methodReportTitle: "Sobre este diagnóstico",
    methodReportBody: [
      "Este relatório foi produzido a partir do Caldeira Growth Index, método proprietário desenvolvido para avaliar as capacidades que sustentam o crescimento de uma organização.",
      "O CGI combina 40 questões distribuídas em cinco dimensões: Estratégia, Mercado e Cliente, Máquina de Crescimento, Execução e Gestão, e Liderança e Cultura.",
      "A seleção das perguntas, a estrutura das dimensões e os critérios de interpretação foram construídos a partir da experiência da Caldeira Growth em projetos de consultoria, pareceres estratégicos, programas de desenvolvimento executivo, atuação com lideranças e dos princípios desenvolvidos no livro Cresça ou Desapareça.",
      "A inteligência artificial é utilizada como ferramenta de apoio para consolidar as respostas, identificar padrões e personalizar a redação do parecer. Ela não substitui o método nem define de forma independente os critérios do diagnóstico.",
      "O resultado deve ser entendido como uma leitura executiva inicial. Ele não substitui uma análise aprofundada do contexto, das escolhas e das restrições específicas da organização.",
    ],
    methodSignature: "Desenvolvido pela Caldeira Growth",
    downloadPdf: "Baixar PDF",
    generatingPdf: "Gerando PDF...",
    pdfGenerated: "PDF gerado. Verifique os downloads do navegador ou o aplicativo Arquivos.",
    pdfError: "Não foi possível gerar o PDF. O relatório continua disponível para leitura e impressão.",
    printVersion: "Abrir versão para impressão",
    printInstruction:
      "Use a opção de impressão do navegador para imprimir ou salvar esta versão como PDF.",
    company: "Empresa",
    respondent: "Respondente",
    role: "Cargo",
    diagnosis: "Diagnóstico",
    contact: "Contato",
    contactText:
      "Para aprofundar este diagnóstico e traduzir as hipóteses em decisões práticas, o próximo passo recomendado é uma conversa estratégica com a Caldeira Growth.",
    founderLine: "Fundador e Estrategista de Crescimento - Caldeira Growth",
    toolbar:
      "Uma versão preparada para impressão foi aberta. No navegador, selecione “Salvar como PDF”.",
    privacyConsentLabel:
      "Li e concordo com a política de privacidade e autorizo o uso dos dados para gerar e registrar este diagnóstico.",
    marketingConsentLabel:
      "Aceito receber comunicações da Caldeira Growth sobre conteúdos, programas e serviços relacionados a crescimento.",
    privacyPolicyHref: localizedPath("privacy", "pt"),
    privacyPolicyLinkLabel: "Política de privacidade",
    privacyReviewNote: "Texto de consentimento sujeito à revisão final antes do deploy.",
  },
  en: {
    metaTitle: "CGI - Caldeira Growth Index | Growth assessment",
    metaDescription:
      "Free Caldeira Growth assessment to identify growth bottlenecks, priorities and organizational capabilities.",
    badge: "CGI - Caldeira Growth Index",
    heroTitle: "Assess your organization's growth capability.",
    heroText:
      "The Caldeira Growth Index analyzes five dimensions that sustain growth and produces an executive reading of bottlenecks, priorities and organizational capabilities.",
    start: "Start assessment",
    stats: [["5", "critical dimensions"], ["40", "executive questions"], ["0-100", "maturity score"]],
    trust: [
      { title: "Consultative", body: "Questions oriented to growth decisions, not a generic quiz." },
      { title: "Structured", body: "Score calculated by dimension, preserving Caldeira Growth's proprietary model." },
      { title: "Executive", body: "Report with bottlenecks, priorities and decision hypotheses." },
    ],
    step1: "Step 1 of 3",
    contextTitle: "Before the assessment, we need to understand your company context.",
    contextBody:
      "These details help interpret the result more accurately and register the diagnosis in Caldeira Growth's base.",
    methodIntroTitle: "A proprietary growth diagnosis methodology",
    methodIntroBody: [
      "The Caldeira Growth Index is a proprietary assessment developed to evaluate the capabilities that sustain an organization's growth.",
      "The 40 questions, five dimensions and interpretation logic were structured from Caldeira Growth's experience in consulting projects, strategic opinions, executive development programs, work with leaders and the principles presented in the book Cresça ou Desapareça.",
      "Artificial intelligence is used to organize information and personalize the report. The methodology, criteria and diagnostic logic belong to Caldeira Growth.",
    ],
    labels: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      company: "Company",
      companyWebsite: "Company website",
      role: "Role",
      sector: "Company industry",
      sectorOther: "What is the company's industry?",
      commercialRelationshipModel: "Primary commercial relationship model",
      commercialRelationshipOther: "What is the commercial relationship model?",
      employeeCount: "Number of employees",
      annualRevenue: "Approximate annual revenue",
      currentChallenge: "Main current challenge",
      growthGoal: "Growth target for the next 12 months",
      investmentIntent: "Do you intend to invest in organizational growth and development in the next 12 months?",
      comments: "Additional comments",
    },
    sectorHelp:
      "Select the economic sector that best represents your company's primary activity.",
    sectorOptions: [
      "Agribusiness",
      "Food and beverages",
      "Automotive and mobility",
      "Construction and real estate",
      "Education",
      "Energy and utilities",
      "Entertainment, media and communications",
      "Government and public sector",
      "Industry and manufacturing",
      "Logistics and transportation",
      "Mining and natural resources",
      "Healthcare and life sciences",
      "Insurance",
      "Financial services",
      "Professional services and consulting",
      "Technology and software",
      "Telecommunications",
      "Tourism and hospitality",
      "Retail and consumer goods",
      "Nonprofit sector",
      "Other",
    ],
    sectorOtherLabel: "What is the company's industry?",
    commercialRelationshipHelp:
      "Select how the company commercially relates to its main customers.",
    commercialRelationshipOptions: [
      "B2B",
      "B2C",
      "B2B2C",
      "B2G",
      "Marketplace / Platform",
      "Mixed model",
      "Other",
    ],
    commercialRelationshipOtherLabel: "What is the commercial relationship model?",
    selectPlaceholder: "Select",
    commentsPlaceholder:
      "Add relevant information about the business or expand on points covered in the questions to enrich the diagnosis.",
    commentsHelp: "Optional field. Use it only if there is additional context that helps qualify the executive reading.",
    begin: "Start assessment",
    step2: "Step 2 of 3",
    answered: (answered, total) => `${answered} of ${total}`,
    back: "Back",
    nextDimension: "Next dimension",
    generate: "Generate my CGI",
    step3: "Step 3 of 3",
    finalScore: "Final CGI",
    openReport: "Open print version",
    printReport: "Download PDF",
    emailReport: "Open email with report",
    reportPending: "The full report will be released when the CGI criteria have been applied.",
    reportStages: [
      "Consolidating the answers.",
      "Applying the Caldeira Growth methodology criteria.",
      "Comparing the five dimensions.",
      "Identifying patterns and bottlenecks.",
      "Preparing the executive opinion.",
    ],
    reportAlertTitle: "Your index has already been calculated",
    reportAlertBody:
      "We are applying the CGI logic to your organization's answers.",
    reportIpBody:
      "Artificial intelligence supports data consolidation and report personalization.",
    proprietaryBody:
      "Caldeira Growth methodology. Artificial intelligence applied to report personalization.",
    savedTitle: "Result registered",
    savedBody: "Your data has been saved and the report was prepared.",
    scoreByDimension: "Score by dimension",
    attentionTitle: "3 main attention points",
    attentionBody:
      "This dimension appears among the lowest scores and should be prioritized in a strategic conversation.",
    invalidRequiredTitle: "Required fields",
    invalidRequiredBody: "Fill in all data before starting the assessment.",
    invalidEmailTitle: "Invalid email",
    invalidEmailBody: "Enter a valid business email to continue.",
    invalidPhoneBody: "Enter a valid phone number.",
    incompleteDimensionTitle: "Incomplete dimension",
    incompleteDimensionBody: "Answer every question in this dimension to continue.",
    incompleteAssessmentTitle: "Incomplete assessment",
    incompleteAssessmentBody: "Answer all 40 questions to generate your CGI.",
    saveFailureTitle: "Save failure",
    reportDocTitle: "CGI Report",
    reportSubtitle: "Executive diagnosis of growth maturity",
    dimensionReadingTitle: "Reading by dimension",
    criticalBottlenecksTitle: "Critical bottlenecks",
    strategicBetsTitle: "Recommended strategic bets",
    renunciationsTitle: "Strategic renunciations",
    governanceTitle: "Minimum governance system",
    finalRecommendationsTitle: "Final recommendations",
    methodEyebrow: "Proprietary Caldeira Growth methodology",
    methodReportTitle: "About this assessment",
    methodReportBody: [
      "This report was produced from the Caldeira Growth Index, a proprietary methodology developed to evaluate the capabilities that sustain an organization's growth.",
      "The CGI combines 40 questions distributed across five dimensions: Strategy, Market and Customer, Growth Machine, Execution and Management, and Leadership and Growth Culture.",
      "The selection of questions, the structure of the dimensions and the interpretation criteria were built from Caldeira Growth's experience in consulting projects, strategic opinions, executive development programs, work with leaders and the principles developed in the book Cresça ou Desapareça.",
      "Artificial intelligence is used as a support tool to consolidate answers, identify patterns and personalize the report's writing. It does not replace the methodology or independently define the diagnosis criteria.",
      "The result should be understood as an initial executive reading. It does not replace an in-depth analysis of the organization's context, choices and specific constraints.",
    ],
    methodSignature: "Developed by Caldeira Growth",
    downloadPdf: "Download PDF",
    generatingPdf: "Generating PDF...",
    pdfGenerated: "PDF generated. Check your browser downloads or Files app.",
    pdfError: "Could not generate the PDF. The report remains available for reading and printing.",
    printVersion: "Open print version",
    printInstruction:
      "Use your browser’s print option to print or save this version as a PDF.",
    company: "Company",
    respondent: "Respondent",
    role: "Role",
    diagnosis: "Diagnosis",
    contact: "Contact",
    contactText:
      "To deepen this diagnosis and translate the hypotheses into practical decisions, the recommended next step is a strategic conversation with Caldeira Growth.",
    founderLine: "Founder and Growth Strategist - Caldeira Growth",
    toolbar:
      "A print-ready version has opened. In your browser, select “Save as PDF”.",
    privacyConsentLabel:
      "I have read and agree with the privacy policy and authorize the use of the data to generate and record this diagnosis.",
    marketingConsentLabel:
      "I agree to receive Caldeira Growth communications about growth-related content, programs and services.",
    privacyPolicyHref: localizedPath("privacy", "en"),
    privacyPolicyLinkLabel: "Privacy policy",
    privacyReviewNote: "Consent text subject to final review before deployment.",
  },
  es: {
    metaTitle: "CGI - Caldeira Growth Index | Diagnóstico de crecimiento",
    metaDescription:
      "Assessment gratuito de Caldeira Growth para identificar cuellos de botella, prioridades y capacidades organizacionales de crecimiento.",
    badge: "CGI - Caldeira Growth Index",
    heroTitle: "Evalúe la capacidad de crecimiento de su organización.",
    heroText:
      "El Caldeira Growth Index analiza cinco dimensiones que sostienen el crecimiento y produce una lectura ejecutiva sobre cuellos de botella, prioridades y capacidades organizacionales.",
    start: "Iniciar diagnóstico",
    stats: [["5", "dimensiones críticas"], ["40", "preguntas ejecutivas"], ["0-100", "score de madurez"]],
    trust: [
      { title: "Consultivo", body: "Preguntas orientadas a decisiones de crecimiento, no un quiz genérico." },
      { title: "Estructurado", body: "Score calculado por dimensión, preservando el modelo propietario de Caldeira Growth." },
      { title: "Ejecutivo", body: "Informe con cuellos de botella, prioridades e hipótesis para decisión." },
    ],
    step1: "Etapa 1 de 3",
    contextTitle: "Antes del diagnóstico, necesitamos contextualizar su empresa.",
    contextBody:
      "Estos datos ayudan a interpretar el resultado con más precisión y registrar el diagnóstico en la base de Caldeira Growth.",
    methodIntroTitle: "Un método propietario de diagnóstico de crecimiento",
    methodIntroBody: [
      "El Caldeira Growth Index es un diagnóstico propietario, desarrollado para evaluar las capacidades que sostienen el crecimiento de una organización.",
      "Las 40 preguntas, las cinco dimensiones y la lógica de interpretación fueron estructuradas a partir de la experiencia de Caldeira Growth en proyectos de consultoría, pareceres estratégicos, programas de desarrollo ejecutivo, trabajo con liderazgos y los principios presentados en el libro Cresça ou Desapareça.",
      "La inteligencia artificial se utiliza para organizar la información y personalizar el informe. El método, los criterios y la lógica del diagnóstico son de Caldeira Growth.",
    ],
    labels: {
      name: "Nombre",
      email: "Email",
      phone: "Teléfono",
      company: "Empresa",
      companyWebsite: "Sitio de la empresa",
      role: "Cargo",
      sector: "Sector de actividad de la empresa",
      sectorOther: "¿Cuál es el sector de actividad de la empresa?",
      commercialRelationshipModel: "Modelo principal de relación comercial",
      commercialRelationshipOther: "¿Cuál es el modelo de relación comercial?",
      employeeCount: "Número de empleados",
      annualRevenue: "Facturación anual aproximada",
      currentChallenge: "Principal desafío actual",
      growthGoal: "Meta de crecimiento para los próximos 12 meses",
      investmentIntent: "¿Pretende invertir en crecimiento y desarrollo de la organización en los próximos 12 meses?",
      comments: "Comentarios adicionales",
    },
    sectorHelp:
      "Seleccione el sector económico que mejor representa la actividad principal de su empresa.",
    sectorOptions: [
      "Agronegocio",
      "Alimentos y bebidas",
      "Automotriz y movilidad",
      "Construcción y mercado inmobiliario",
      "Educación",
      "Energía y utilities",
      "Entretenimiento, medios y comunicación",
      "Gobierno y sector público",
      "Industria y manufactura",
      "Logística y transportes",
      "Minería y recursos naturales",
      "Salud y ciencias de la vida",
      "Seguros",
      "Servicios financieros",
      "Servicios profesionales y consultoría",
      "Tecnología y software",
      "Telecomunicaciones",
      "Turismo y hospitalidad",
      "Retail y bienes de consumo",
      "Tercer sector",
      "Otro",
    ],
    sectorOtherLabel: "¿Cuál es el sector de actividad de la empresa?",
    commercialRelationshipHelp:
      "Seleccione cómo la empresa se relaciona comercialmente con sus principales clientes.",
    commercialRelationshipOptions: [
      "B2B",
      "B2C",
      "B2B2C",
      "B2G",
      "Marketplace / Plataforma",
      "Modelo mixto",
      "Otro",
    ],
    commercialRelationshipOtherLabel: "¿Cuál es el modelo de relación comercial?",
    selectPlaceholder: "Seleccione",
    commentsPlaceholder:
      "Agregue información relevante sobre el negocio o profundice puntos abordados en las preguntas para enriquecer el diagnóstico.",
    commentsHelp: "Campo opcional. Úselo solo si hay contexto adicional que ayude a cualificar la lectura ejecutiva.",
    begin: "Comenzar diagnóstico",
    step2: "Etapa 2 de 3",
    answered: (answered, total) => `${answered} de ${total}`,
    back: "Volver",
    nextDimension: "Próxima dimensión",
    generate: "Generar mi CGI",
    step3: "Etapa 3 de 3",
    finalScore: "CGI final",
    openReport: "Abrir versión para imprimir",
    printReport: "Descargar PDF",
    emailReport: "Abrir email con informe",
    reportPending: "El informe completo se liberará cuando termine la aplicación de los criterios del CGI.",
    reportStages: [
      "Consolidando las respuestas.",
      "Aplicando los criterios del método Caldeira Growth.",
      "Comparando las cinco dimensiones.",
      "Identificando patrones y cuellos de botella.",
      "Preparando el parecer ejecutivo.",
    ],
    reportAlertTitle: "Su índice ya fue calculado",
    reportAlertBody:
      "Estamos aplicando la lógica del CGI a las respuestas de su organización.",
    reportIpBody:
      "La inteligencia artificial apoya la consolidación de los datos y la personalización del informe.",
    proprietaryBody:
      "Método Caldeira Growth. Inteligencia artificial aplicada a la personalización del informe.",
    savedTitle: "Resultado registrado",
    savedBody: "Sus datos fueron guardados y el informe fue preparado.",
    scoreByDimension: "Score por dimensión",
    attentionTitle: "3 principales puntos de atención",
    attentionBody:
      "Esta dimensión aparece entre las menores notas y debe priorizarse en una conversación estratégica.",
    invalidRequiredTitle: "Campos obligatorios",
    invalidRequiredBody: "Complete todos los datos antes de iniciar el diagnóstico.",
    invalidEmailTitle: "Email inválido",
    invalidEmailBody: "Informe un email corporativo válido para continuar.",
    invalidPhoneBody: "Ingrese un número de teléfono válido.",
    incompleteDimensionTitle: "Dimensión incompleta",
    incompleteDimensionBody: "Responda todas las preguntas de esta dimensión para continuar.",
    incompleteAssessmentTitle: "Diagnóstico incompleto",
    incompleteAssessmentBody: "Responda las 40 preguntas para generar su CGI.",
    saveFailureTitle: "Error al guardar",
    reportDocTitle: "Informe CGI",
    reportSubtitle: "Diagnóstico ejecutivo de madurez de crecimiento",
    dimensionReadingTitle: "Lectura por dimensión",
    criticalBottlenecksTitle: "Cuellos de botella críticos",
    strategicBetsTitle: "Apuestas estratégicas recomendadas",
    renunciationsTitle: "Renuncias estratégicas",
    governanceTitle: "Sistema mínimo de gobernanza",
    finalRecommendationsTitle: "Recomendaciones finales",
    methodEyebrow: "Método propietario de Caldeira Growth",
    methodReportTitle: "Sobre este diagnóstico",
    methodReportBody: [
      "Este informe fue producido a partir del Caldeira Growth Index, método propietario desarrollado para evaluar las capacidades que sostienen el crecimiento de una organización.",
      "El CGI combina 40 preguntas distribuidas en cinco dimensiones: Estrategia, Mercado y Cliente, Máquina de Crecimiento, Ejecución y Gestión, y Liderazgo y Cultura de Crecimiento.",
      "La selección de las preguntas, la estructura de las dimensiones y los criterios de interpretación fueron construidos a partir de la experiencia de Caldeira Growth en proyectos de consultoría, pareceres estratégicos, programas de desarrollo ejecutivo, trabajo con liderazgos y los principios desarrollados en el libro Cresça ou Desapareça.",
      "La inteligencia artificial se utiliza como herramienta de apoyo para consolidar las respuestas, identificar patrones y personalizar la redacción del informe. No sustituye el método ni define de forma independiente los criterios del diagnóstico.",
      "El resultado debe entenderse como una lectura ejecutiva inicial. No sustituye un análisis profundo del contexto, las elecciones y las restricciones específicas de la organización.",
    ],
    methodSignature: "Desarrollado por Caldeira Growth",
    downloadPdf: "Descargar PDF",
    generatingPdf: "Generando PDF...",
    pdfGenerated: "PDF generado. Revise las descargas del navegador o la aplicación Archivos.",
    pdfError: "No fue posible generar el PDF. El informe continúa disponible para lectura e impresión.",
    printVersion: "Abrir versión para imprimir",
    printInstruction:
      "Use la opción de impresión del navegador para imprimir o guardar esta versión como PDF.",
    company: "Empresa",
    respondent: "Respondente",
    role: "Cargo",
    diagnosis: "Diagnóstico",
    contact: "Contacto",
    contactText:
      "Para profundizar este diagnóstico y traducir las hipótesis en decisiones prácticas, el próximo paso recomendado es una conversación estratégica con Caldeira Growth.",
    founderLine: "Fundador y Estrategista de Crecimiento - Caldeira Growth",
    toolbar:
      "Se abrió una versión preparada para impresión. En el navegador, seleccione “Guardar como PDF”.",
    privacyConsentLabel:
      "He leído y acepto la política de privacidad y autorizo el uso de los datos para generar y registrar este diagnóstico.",
    marketingConsentLabel:
      "Acepto recibir comunicaciones de Caldeira Growth sobre contenidos, programas y servicios relacionados con crecimiento.",
    privacyPolicyHref: localizedPath("privacy", "es"),
    privacyPolicyLinkLabel: "Política de privacidad",
    privacyReviewNote: "Texto de consentimiento sujeto a revisión final antes del deploy.",
  },
};

export const devLeadFallback: LeadForm = {
  name: "Denis Caldeira de Almeida",
  email: "deniscaldeiradealmeida@gmail.com",
  phone: "+5511934347844",
  company: "Teste CGI",
  companyWebsite: "https://caldeiragrowth.com",
  role: "CEO",
  sector: "Serviços profissionais e consultoria",
  sectorOther: "",
  commercialRelationshipModel: "B2B",
  commercialRelationshipOther: "",
  employeeCount: "1-10",
  annualRevenue: "Prefiro não informar",
  currentChallenge: "Crescer receita",
  growthGoal: "11-25%",
  investmentIntent: "Ainda avaliando",
  comments: "Regeneração local a partir do respostas_json da planilha.",
};

export const dimensionOrder = CGI_QUESTIONS.reduce<CgiDimensionId[]>((acc, question) => {
  if (!acc.includes(question.dimensionId)) acc.push(question.dimensionId);
  return acc;
}, []);

export type CgiUiText = (typeof cgiUi)[Language];
