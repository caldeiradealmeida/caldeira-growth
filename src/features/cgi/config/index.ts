import { CGI_QUESTIONS, type CgiDimensionId } from "@/data/cgiConfig";
import { localizedPath, type Language } from "@/lib/routing";
import type { LeadForm } from "../types";

// Semantic keys for the AI report's per-section field labels (e.g. the
// "Causa provável" / "Probable cause" line inside a Gargalo item). The
// parser (reportBlocks.ts) recognizes pt/en/es aliases of each field in the
// AI's raw text regardless of report language; the label actually shown to
// the reader always comes from here, keyed by the report's own language -
// see reportFieldLabels below.
export type ReportFieldKey =
  | "observedSignal"
  | "probableCause"
  | "strategicImpact"
  | "priorityAction"
  | "expectedResult"
  | "horizon"
  | "whatToStop"
  | "protectedResource"
  | "strategicRationale"
  | "frequency"
  | "participants"
  | "indicators"
  | "expectedDecision"
  | "priority"
  | "nextStep"
  | "validationCondition";

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
// Must comfortably exceed the backend's worst-case report generation time
// (api/cgi-assessment.ts: one primary OpenAI attempt + one transient retry +
// non-OpenAI overhead, ~170s today) - otherwise the frontend gives up
// polling and hides the progress bar while a legitimate attempt is still
// running server-side.
export const CGI_REPORT_POLL_TIMEOUT_MS = 210000;
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
    step2: string;
    step3: string;
    step4: string;
    contextTitle: string;
    contextBody: string;
    companyContextTitle: string;
    companyContextBody: string;
    assessmentTitle: string;
    assessmentSubtitle: string;
    phoneTitle: string;
    phoneBody: string;
    viewResult: string;
    continue: string;
    continueToDiagnosis: string;
    remaining: (remaining: number) => string;
    estimatedTime: string;
    currentStep: (current: number, total: number) => string;
    progressLabel: string;
    currentStepLabel: string;
    answeredLabel: string;
    methodIntroTitle: string;
    methodIntroBody: string[];
    leadTimeEstimate: string;
    leadDeliverables: string[];
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
    commentsCounter: (current: number, max: number) => string;
    invalidProfessionalFieldBody: string;
    primaryReportFailureTitle: string;
    primaryReportFailureBody: string;
    secondarySyncWarningTitle: string;
    secondarySyncWarningBody: string;
    begin: string;
    answered: (answered: number, total: number) => string;
    back: string;
    nextDimension: string;
    generate: string;
    finalScore: string;
    openReport: string;
    printReport: string;
    reportPending: string;
    retryReport: string;
    reportPollingBody: string;
    reportStillProcessingBody: string;
    reportStages: string[];
    reportAlertTitle: string;
    reportAlertBody: string;
    proprietaryBody: string;
    savedTitle: string;
    savedBody: string;
    savedPendingBody: string;
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
    saveFailureBody: string;
    reportDocTitle: string;
    reportSubtitle: string;
    dimensionReadingTitle: string;
    criticalBottlenecksTitle: string;
    strategicBetsTitle: string;
    renunciationsTitle: string;
    governanceTitle: string;
    methodologyNoteTitle: string;
    evidenceSummaryTitle: string;
    hypothesesTitle: string;
    finalRecommendationsTitle: string;
    itemOrdinalLabels: {
      criticalBottlenecks: string;
      strategicBets: string;
      renunciations: string;
      governanceSystem: string;
      hypotheses: string;
      finalRecommendations: string;
    };
    reportFieldLabels: Record<ReportFieldKey, string>;
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
    executiveSummaryTitle: string;
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
    metaTitle: "CGI - Caldeira Growth Index | Diagnóstico de crescimento",
    metaDescription:
      "Diagnóstico gratuito de maturidade de crescimento empresarial da Caldeira Growth. Descubra gargalos e prioridades em menos de 10 minutos.",
    badge: "CGI - Caldeira Growth Index",
    heroTitle: "Descubra o que está limitando o crescimento da sua empresa.",
    heroText:
      "O Caldeira Growth Index avalia cinco dimensões da sua organização, identifica os principais gargalos de crescimento e aponta as prioridades estratégicas em uma leitura executiva objetiva.",
    start: "Iniciar diagnóstico",
    stats: [["5", "dimensões críticas"], ["40", "perguntas executivas"], ["0-100", "score de maturidade"]],
    trust: [
      { title: "Consultivo", body: "Perguntas orientadas a decisões de crescimento, não um quiz genérico." },
      { title: "Estruturado", body: "Score calculado por dimensão, preservando o modelo proprietário da Caldeira Growth." },
      { title: "Executivo", body: "Relatório com leitura de gargalos, prioridades e hipóteses para decisão." },
    ],
    step1: "Etapa 1 de 4",
    step2: "Etapa 2 de 4",
    step3: "Etapa 3 de 4",
    step4: "Etapa final",
    contextTitle: "Vamos começar seu diagnóstico",
    contextBody:
      "Preencha seus dados para iniciar o diagnóstico e receber uma leitura executiva personalizada sobre os principais gargalos e prioridades de crescimento da sua empresa.",
    companyContextTitle: "Agora, conte-nos sobre a empresa.",
    companyContextBody:
      "Essas informações ajudam a interpretar suas respostas e tornar o diagnóstico mais relevante para o contexto da organização.",
    assessmentTitle: "Avalie as capacidades de crescimento da empresa.",
    assessmentSubtitle:
      "Responda com base na realidade atual da organização, e não na situação ideal.",
    phoneTitle: "Quer aprofundar seu diagnóstico?",
    phoneBody:
      "Deixe seu telefone ou WhatsApp caso queira conversar sobre os resultados e as prioridades identificadas.",
    viewResult: "Ver meu resultado",
    continue: "Continuar",
    continueToDiagnosis: "Continuar para o diagnóstico",
    remaining: (remaining) => `${remaining} restantes`,
    estimatedTime: "Tempo estimado: 8-10 min",
    currentStep: (current, total) => `Etapa ${current} de ${total}`,
    progressLabel: "Progresso",
    currentStepLabel: "Etapa atual",
    answeredLabel: "Respondidas",
    methodIntroTitle: "Um diagnóstico estruturado das capacidades que sustentam o crescimento.",
    methodIntroBody: [
      "O CGI avalia cinco dimensões organizacionais e transforma suas respostas em uma leitura personalizada de forças, gargalos e prioridades estratégicas.",
    ],
    leadTimeEstimate: "Tempo estimado: cerca de 12 minutos",
    leadDeliverables: [
      "Score de 0 a 100",
      "Leitura das 5 dimensões",
      "Principais gargalos",
      "Prioridades estratégicas",
      "Relatório executivo personalizado",
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
      comments: "Há algo mais sobre a empresa ou sobre o momento atual que devemos considerar no diagnóstico?",
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
      "Compartilhe algum contexto, preocupação ou oportunidade que não tenha sido contemplado nas perguntas anteriores.",
    commentsHelp:
      "Campo opcional. Compartilhe algum contexto, preocupação ou oportunidade que não tenha sido contemplado nas perguntas anteriores.",
    commentsCounter: (current, max) => `${current}/${max} caracteres`,
    invalidProfessionalFieldBody: "Revise este campo e informe dados profissionais válidos.",
    primaryReportFailureTitle: "Não foi possível concluir o diagnóstico",
    primaryReportFailureBody: "Tente novamente. A tentativa será feita com segurança, sem duplicar o lead.",
    secondarySyncWarningTitle: "Seu relatório está pronto",
    secondarySyncWarningBody:
      "Tivemos uma dificuldade ao registrar uma informação complementar, mas isso não afeta o resultado.",
    begin: "Começar diagnóstico",
    answered: (answered, total) => `${answered} de ${total}`,
    back: "Voltar",
    nextDimension: "Próxima dimensão",
    generate: "Gerar meu CGI",
    finalScore: "CGI final",
    openReport: "Abrir versão para impressão",
    printReport: "Baixar PDF",
    reportPending: "O parecer completo será liberado quando a aplicação dos critérios do CGI terminar.",
    retryReport: "Tentar novamente",
    reportPollingBody: "Seu relatório está sendo preparado. Isso pode levar alguns instantes.",
    reportStillProcessingBody:
      "Seu relatório ainda está sendo preparado. Você poderá acessar novamente por este dispositivo.",
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
    proprietaryBody: "Método Caldeira Growth.",
    savedTitle: "Resultado registrado",
    savedBody: "O parecer foi preparado.",
    savedPendingBody: "Seus dados foram salvos. O parecer está sendo preparado.",
    scoreByDimension: "Score por dimensão",
    attentionTitle: "3 principais pontos de atenção",
    attentionBody:
      "Essa dimensão aparece entre as menores notas e deve ser priorizada em uma conversa estratégica.",
    invalidRequiredTitle: "Campos obrigatórios",
    invalidRequiredBody: "Preencha todos os dados antes de iniciar o diagnóstico.",
    invalidEmailTitle: "E-mail inválido",
    invalidEmailBody: "Informe um e-mail corporativo válido para continuar.",
    invalidPhoneBody: "Informe um número de telefone válido.",
    incompleteDimensionTitle: "Dimensão incompleta",
    incompleteDimensionBody: "Responda todas as perguntas desta dimensão para continuar.",
    incompleteAssessmentTitle: "Diagnóstico incompleto",
    incompleteAssessmentBody: "Responda as 40 perguntas para gerar seu CGI.",
    saveFailureTitle: "Falha ao salvar",
    saveFailureBody:
      "Não foi possível salvar seus dados agora. Verifique sua conexão e tente novamente.",
    reportDocTitle: "Relatório CGI",
    reportSubtitle: "Diagnóstico executivo de maturidade de crescimento",
    dimensionReadingTitle: "Leitura por dimensão",
    criticalBottlenecksTitle: "Gargalos críticos",
    strategicBetsTitle: "Apostas estratégicas recomendadas",
    renunciationsTitle: "Renúncias estratégicas",
    governanceTitle: "Sistema mínimo de governança",
    methodologyNoteTitle: "Nota metodológica",
    evidenceSummaryTitle: "Resumo de evidências",
    hypothesesTitle: "Hipóteses a validar",
    finalRecommendationsTitle: "Recomendações finais",
    itemOrdinalLabels: {
      criticalBottlenecks: "Gargalo",
      strategicBets: "Aposta",
      renunciations: "Renúncia",
      governanceSystem: "Ritual",
      hypotheses: "Hipótese",
      finalRecommendations: "Recomendação",
    },
    reportFieldLabels: {
      observedSignal: "Sinal observado",
      probableCause: "Causa provável",
      strategicImpact: "Impacto estratégico",
      priorityAction: "Ação prioritária",
      expectedResult: "Resultado esperado",
      horizon: "Horizonte",
      whatToStop: "O que deixar de fazer",
      protectedResource: "Recurso ou capacidade protegida",
      strategicRationale: "Racional estratégico",
      frequency: "Frequência",
      participants: "Participantes",
      indicators: "Indicadores",
      expectedDecision: "Decisão esperada",
      priority: "Prioridade",
      nextStep: "Próximo passo",
      validationCondition: "Condição de validação",
    },
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
    executiveSummaryTitle: "Sumário Executivo",
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
    step1: "Step 1 of 4",
    step2: "Step 2 of 4",
    step3: "Step 3 of 4",
    step4: "Final step",
    contextTitle: "Let's start with the essentials.",
    contextBody:
      "Enter your details to begin the assessment and receive your result at the end.",
    companyContextTitle: "Now, tell us about the company.",
    companyContextBody:
      "These details help interpret your answers and make the diagnosis more relevant to the organization's context.",
    assessmentTitle: "Assess the company's growth capabilities.",
    assessmentSubtitle:
      "Answer based on the organization's current reality, not the ideal situation.",
    phoneTitle: "Want to deepen your diagnosis?",
    phoneBody:
      "Leave your phone or WhatsApp if you want to discuss the results and identified priorities.",
    viewResult: "See my result",
    continue: "Continue",
    continueToDiagnosis: "Continue to the diagnosis",
    remaining: (remaining) => `${remaining} remaining`,
    estimatedTime: "Estimated time: 8-10 min",
    currentStep: (current, total) => `Step ${current} of ${total}`,
    progressLabel: "Progress",
    currentStepLabel: "Current step",
    answeredLabel: "Answered",
    methodIntroTitle: "A structured diagnosis of the capabilities that sustain growth.",
    methodIntroBody: [
      "CGI evaluates five organizational dimensions and turns your answers into a personalized reading of strengths, bottlenecks and strategic priorities.",
    ],
    leadTimeEstimate: "Estimated time: about 12 minutes",
    leadDeliverables: [
      "0-100 score",
      "Reading across 5 dimensions",
      "Key bottlenecks",
      "Strategic priorities",
      "Personalized executive report",
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
      comments: "Is there anything else about the company or its current moment that we should consider in the diagnosis?",
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
      "Share any context, concern or opportunity that was not covered in the previous questions.",
    commentsHelp:
      "Optional field. Share any context, concern or opportunity that was not covered in the previous questions.",
    commentsCounter: (current, max) => `${current}/${max} characters`,
    invalidProfessionalFieldBody: "Review this field and enter valid professional information.",
    primaryReportFailureTitle: "Could not complete the diagnosis",
    primaryReportFailureBody: "Try again. The retry will be handled safely without duplicating the lead.",
    secondarySyncWarningTitle: "Your report is ready",
    secondarySyncWarningBody:
      "We had trouble registering complementary information, but this does not affect your result.",
    begin: "Start assessment",
    answered: (answered, total) => `${answered} of ${total}`,
    back: "Back",
    nextDimension: "Next dimension",
    generate: "Generate my CGI",
    finalScore: "Final CGI",
    openReport: "Open print version",
    printReport: "Download PDF",
    reportPending: "The full report will be released when the CGI criteria have been applied.",
    retryReport: "Try again",
    reportPollingBody: "Your report is being prepared. This may take a few moments.",
    reportStillProcessingBody:
      "Your report is still being prepared. You will be able to access it again from this device.",
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
    proprietaryBody: "Caldeira Growth methodology.",
    savedTitle: "Result registered",
    savedBody: "The report is ready.",
    savedPendingBody: "Your data has been saved. The report is being prepared.",
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
    saveFailureBody:
      "We could not save your data right now. Check your connection and try again.",
    reportDocTitle: "CGI Report",
    reportSubtitle: "Executive diagnosis of growth maturity",
    dimensionReadingTitle: "Reading by dimension",
    criticalBottlenecksTitle: "Critical bottlenecks",
    strategicBetsTitle: "Recommended strategic bets",
    renunciationsTitle: "Strategic renunciations",
    governanceTitle: "Minimum governance system",
    methodologyNoteTitle: "Methodological note",
    evidenceSummaryTitle: "Evidence summary",
    hypothesesTitle: "Hypotheses to validate",
    finalRecommendationsTitle: "Final recommendations",
    itemOrdinalLabels: {
      criticalBottlenecks: "Bottleneck",
      strategicBets: "Bet",
      renunciations: "Renunciation",
      governanceSystem: "Ritual",
      hypotheses: "Hypothesis",
      finalRecommendations: "Recommendation",
    },
    reportFieldLabels: {
      observedSignal: "Observed signal",
      probableCause: "Likely cause",
      strategicImpact: "Strategic impact",
      priorityAction: "Priority action",
      expectedResult: "Expected result",
      horizon: "Horizon",
      whatToStop: "What to stop doing",
      protectedResource: "Resource or capability protected",
      strategicRationale: "Strategic rationale",
      frequency: "Frequency",
      participants: "Participants",
      indicators: "Indicators",
      expectedDecision: "Expected decision",
      priority: "Priority",
      nextStep: "Next step",
      validationCondition: "Validation condition",
    },
    methodEyebrow: "Proprietary Caldeira Growth methodology",
    methodReportTitle: "About this assessment",
    methodReportBody: [
      "This report was produced from the Caldeira Growth Index, a proprietary methodology developed to evaluate the capabilities that sustain an organization's growth.",
      "The CGI combines 40 questions distributed across five dimensions: Strategy, Market and Customer, Growth Machine, Execution and Management, and Leadership and Growth Culture.",
      "The selection of questions, the structure of the dimensions and the interpretation criteria were built from Caldeira Growth's experience in consulting projects, strategic assessments, executive development programs, work with leaders and the principles developed in the book Cresça ou Desapareça.",
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
    executiveSummaryTitle: "Executive Summary",
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
    step1: "Etapa 1 de 4",
    step2: "Etapa 2 de 4",
    step3: "Etapa 3 de 4",
    step4: "Etapa final",
    contextTitle: "Empecemos por lo esencial.",
    contextBody:
      "Informe sus datos para iniciar el diagnóstico y recibir su resultado al final.",
    companyContextTitle: "Ahora, cuéntenos sobre la empresa.",
    companyContextBody:
      "Esta información ayuda a interpretar sus respuestas y hacer el diagnóstico más relevante para el contexto de la organización.",
    assessmentTitle: "Evalúe las capacidades de crecimiento de la empresa.",
    assessmentSubtitle:
      "Responda con base en la realidad actual de la organización, no en la situación ideal.",
    phoneTitle: "¿Quiere profundizar su diagnóstico?",
    phoneBody:
      "Deje su teléfono o WhatsApp si quiere conversar sobre los resultados y las prioridades identificadas.",
    viewResult: "Ver mi resultado",
    continue: "Continuar",
    continueToDiagnosis: "Continuar al diagnóstico",
    remaining: (remaining) => `${remaining} restantes`,
    estimatedTime: "Tiempo estimado: 8-10 min",
    currentStep: (current, total) => `Etapa ${current} de ${total}`,
    progressLabel: "Progreso",
    currentStepLabel: "Etapa actual",
    answeredLabel: "Respondidas",
    methodIntroTitle: "Un diagnóstico estructurado de las capacidades que sostienen el crecimiento.",
    methodIntroBody: [
      "El CGI evalúa cinco dimensiones organizacionales y transforma sus respuestas en una lectura personalizada de fortalezas, cuellos de botella y prioridades estratégicas.",
    ],
    leadTimeEstimate: "Tiempo estimado: unos 12 minutos",
    leadDeliverables: [
      "Score de 0 a 100",
      "Lectura de las 5 dimensiones",
      "Principales cuellos de botella",
      "Prioridades estratégicas",
      "Informe ejecutivo personalizado",
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
      comments: "¿Hay algo más sobre la empresa o sobre el momento actual que debamos considerar en el diagnóstico?",
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
      "Comparta algún contexto, preocupación u oportunidad que no haya sido contemplado en las preguntas anteriores.",
    commentsHelp:
      "Campo opcional. Comparta algún contexto, preocupación u oportunidad que no haya sido contemplado en las preguntas anteriores.",
    commentsCounter: (current, max) => `${current}/${max} caracteres`,
    invalidProfessionalFieldBody: "Revise este campo e informe datos profesionales válidos.",
    primaryReportFailureTitle: "No fue posible concluir el diagnóstico",
    primaryReportFailureBody: "Inténtelo nuevamente. El reintento se hará de forma segura, sin duplicar el lead.",
    secondarySyncWarningTitle: "Su informe está listo",
    secondarySyncWarningBody:
      "Tuvimos una dificultad al registrar información complementaria, pero esto no afecta el resultado.",
    begin: "Comenzar diagnóstico",
    answered: (answered, total) => `${answered} de ${total}`,
    back: "Volver",
    nextDimension: "Próxima dimensión",
    generate: "Generar mi CGI",
    finalScore: "CGI final",
    openReport: "Abrir versión para imprimir",
    printReport: "Descargar PDF",
    reportPending: "El informe completo se liberará cuando termine la aplicación de los criterios del CGI.",
    retryReport: "Intentar nuevamente",
    reportPollingBody: "Su informe se está preparando. Esto puede tardar unos instantes.",
    reportStillProcessingBody:
      "Su informe aún se está preparando. Podrá acceder de nuevo desde este dispositivo.",
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
    proprietaryBody: "Método Caldeira Growth.",
    savedTitle: "Resultado registrado",
    savedBody: "El informe fue preparado.",
    savedPendingBody: "Sus datos fueron guardados. El informe se está preparando.",
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
    saveFailureBody:
      "No pudimos guardar sus datos en este momento. Verifique su conexión e intente de nuevo.",
    reportDocTitle: "Informe CGI",
    reportSubtitle: "Diagnóstico ejecutivo de madurez de crecimiento",
    dimensionReadingTitle: "Lectura por dimensión",
    criticalBottlenecksTitle: "Cuellos de botella críticos",
    strategicBetsTitle: "Apuestas estratégicas recomendadas",
    renunciationsTitle: "Renuncias estratégicas",
    governanceTitle: "Sistema mínimo de gobernanza",
    methodologyNoteTitle: "Nota metodológica",
    evidenceSummaryTitle: "Resumen de evidencias",
    hypothesesTitle: "Hipótesis a validar",
    finalRecommendationsTitle: "Recomendaciones finales",
    itemOrdinalLabels: {
      criticalBottlenecks: "Cuello de botella",
      strategicBets: "Apuesta",
      renunciations: "Renuncia",
      governanceSystem: "Ritual",
      hypotheses: "Hipótesis",
      finalRecommendations: "Recomendación",
    },
    reportFieldLabels: {
      observedSignal: "Señal observada",
      probableCause: "Causa probable",
      strategicImpact: "Impacto estratégico",
      priorityAction: "Acción prioritaria",
      expectedResult: "Resultado esperado",
      horizon: "Horizonte",
      whatToStop: "Qué dejar de hacer",
      protectedResource: "Recurso o capacidad protegida",
      strategicRationale: "Racional estratégico",
      frequency: "Frecuencia",
      participants: "Participantes",
      indicators: "Indicadores",
      expectedDecision: "Decisión esperada",
      priority: "Prioridad",
      nextStep: "Próximo paso",
      validationCondition: "Condición de validación",
    },
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
    executiveSummaryTitle: "Resumen Ejecutivo",
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
