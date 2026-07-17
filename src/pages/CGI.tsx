import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { sectionLayout } from "@/lib/sectionLayout";
import {
  CGI_QUESTIONS,
  getCgiConfig,
  type CgiDimensionId,
} from "@/data/cgiConfig";
import type { Language } from "@/lib/routing";
import {
  areCgiAnswersComplete,
  calculateCgiScore,
  normalizeCgiAnswers,
  type CgiScoreResult,
} from "@/lib/cgiScore";
import footerLogo from "@/assets/brand/Black logo - no background.svg";
import reportSignature from "@/assets/report/assinatura-denis.png";
import reportCover from "@/assets/report/cgi-report-cover.png";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Mail,
  Printer,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

type Step = "lead" | "assessment" | "result";

type LeadForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  companyWebsite: string;
  role: string;
  sector: string;
  employeeCount: string;
  annualRevenue: string;
  currentChallenge: string;
  growthGoal: string;
  investmentIntent: string;
  comments: string;
};

const initialLead: LeadForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  companyWebsite: "",
  role: "",
  sector: "",
  employeeCount: "",
  annualRevenue: "",
  currentChallenge: "",
  growthGoal: "",
  investmentIntent: "",
  comments: "",
};

const CGI_ASSESSMENT_ENDPOINT = "/api/cgi-assessment";
const CGI_LAST_ASSESSMENT_KEY = "caldeira-growth:cgi:last-assessment";

const cgiUi: Record<
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
    labels: Record<keyof LeadForm, string>;
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
    company: string;
    respondent: string;
    role: string;
    diagnosis: string;
    contact: string;
    contactText: string;
    founderLine: string;
    toolbar: string;
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
    labels: {
      name: "Nome",
      email: "E-mail",
      phone: "Telefone",
      company: "Empresa",
      companyWebsite: "Site da empresa",
      role: "Cargo",
      sector: "Setor",
      employeeCount: "Número de funcionários",
      annualRevenue: "Faturamento anual aproximado",
      currentChallenge: "Principal desafio atual",
      growthGoal: "Meta de crescimento para os próximos 12 meses",
      investmentIntent: "Pretende investir em crescimento e desenvolvimento da organização nos próximos 12 meses?",
      comments: "Comentários adicionais",
    },
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
    openReport: "Abrir relatório",
    printReport: "Imprimir ou salvar em PDF",
    emailReport: "Abrir e-mail com relatório",
    reportPending: "O relatório completo será liberado quando o diagnóstico com IA terminar.",
    reportStages: [
      "Consolidando as respostas.",
      "Comparando as cinco dimensões.",
      "Identificando os principais gargalos.",
      "Estruturando prioridades.",
      "Preparando o parecer executivo.",
    ],
    reportAlertTitle: "Seu índice já foi calculado",
    reportAlertBody:
      "Estamos preparando a leitura executiva, os principais gargalos e as recomendações iniciais. Essa etapa pode levar alguns segundos.",
    reportIpBody:
      "Estamos analisando suas respostas, o contexto público observado da empresa e as relações entre as cinco dimensões do crescimento.",
    proprietaryBody:
      "A IA é usada como motor de redação e análise, mas o parecer segue o modelo proprietário de maturidade de crescimento da Caldeira Growth.",
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
    labels: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      company: "Company",
      companyWebsite: "Company website",
      role: "Role",
      sector: "Sector",
      employeeCount: "Number of employees",
      annualRevenue: "Approximate annual revenue",
      currentChallenge: "Main current challenge",
      growthGoal: "Growth target for the next 12 months",
      investmentIntent: "Do you intend to invest in organizational growth and development in the next 12 months?",
      comments: "Additional comments",
    },
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
    openReport: "Open report",
    printReport: "Print or save as PDF",
    emailReport: "Open email with report",
    reportPending: "The full report will be released when the AI diagnosis is complete.",
    reportStages: [
      "Consolidating the answers.",
      "Comparing the five dimensions.",
      "Identifying the main bottlenecks.",
      "Structuring priorities.",
      "Preparing the executive opinion.",
    ],
    reportAlertTitle: "Your index has already been calculated",
    reportAlertBody:
      "We are preparing the executive reading, the main bottlenecks and the initial recommendations. This step may take a few seconds.",
    reportIpBody:
      "We are analyzing your answers, the company's observed public context and the relationships among the five growth dimensions.",
    proprietaryBody:
      "AI is used as a writing and analysis engine, but the opinion follows Caldeira Growth's proprietary growth maturity model.",
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
    labels: {
      name: "Nombre",
      email: "Email",
      phone: "Teléfono",
      company: "Empresa",
      companyWebsite: "Sitio de la empresa",
      role: "Cargo",
      sector: "Sector",
      employeeCount: "Número de empleados",
      annualRevenue: "Facturación anual aproximada",
      currentChallenge: "Principal desafío actual",
      growthGoal: "Meta de crecimiento para los próximos 12 meses",
      investmentIntent: "¿Pretende invertir en crecimiento y desarrollo de la organización en los próximos 12 meses?",
      comments: "Comentarios adicionales",
    },
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
    openReport: "Abrir informe",
    printReport: "Imprimir o guardar como PDF",
    emailReport: "Abrir email con informe",
    reportPending: "El informe completo se liberará cuando el diagnóstico con IA termine.",
    reportStages: [
      "Consolidando las respuestas.",
      "Comparando las cinco dimensiones.",
      "Identificando los principales cuellos de botella.",
      "Estructurando prioridades.",
      "Preparando el parecer ejecutivo.",
    ],
    reportAlertTitle: "Su índice ya fue calculado",
    reportAlertBody:
      "Estamos preparando la lectura ejecutiva, los principales cuellos de botella y las recomendaciones iniciales. Esta etapa puede llevar algunos segundos.",
    reportIpBody:
      "Estamos analizando sus respuestas, el contexto público observado de la empresa y las relaciones entre las cinco dimensiones de crecimiento.",
    proprietaryBody:
      "La IA se usa como motor de redacción y análisis, pero el parecer sigue el modelo propietario de madurez de crecimiento de Caldeira Growth.",
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
  },
};

const devLeadFallback: LeadForm = {
  name: "Denis Caldeira de Almeida",
  email: "deniscaldeiradealmeida@gmail.com",
  phone: "+5511934347844",
  company: "Teste CGI",
  companyWebsite: "https://caldeiragrowth.com",
  role: "CEO",
  sector: "Consultoria",
  employeeCount: "1-10",
  annualRevenue: "Prefiro não informar",
  currentChallenge: "Crescer receita",
  growthGoal: "11-25%",
  investmentIntent: "Ainda avaliando",
  comments: "Regeneração local a partir do respostas_json da planilha.",
};

const dimensionOrder = CGI_QUESTIONS.reduce<CgiDimensionId[]>((acc, question) => {
  if (!acc.includes(question.dimensionId)) acc.push(question.dimensionId);
  return acc;
}, []);

type SavedCgiAssessment = {
  lead: LeadForm;
  answers: Record<string, number>;
  savedAt: string;
};

function questionsByDimension(
  questions: typeof CGI_QUESTIONS,
  dimensionId: CgiDimensionId
) {
  return questions.filter((question) => question.dimensionId === dimensionId);
}

function getScoreTone(score: number): string {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-amber-700";
  return "text-destructive";
}

function normalizeWebsiteInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function readSavedCgiAssessment(): SavedCgiAssessment | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CGI_LAST_ASSESSMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedCgiAssessment>;
    if (!parsed.lead || !parsed.answers) return null;
    return parsed as SavedCgiAssessment;
  } catch {
    return null;
  }
}

function saveCgiAssessment(lead: LeadForm, answers: Record<string, number>) {
  if (typeof window === "undefined") return;

  const payload: SavedCgiAssessment = {
    lead,
    answers,
    savedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(CGI_LAST_ASSESSMENT_KEY, JSON.stringify(payload));
}

function parseAnswersJsonInput(value: string): Record<string, number> | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const candidate =
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      ("respostas_json" in parsed || "answers" in parsed)
        ? (parsed as { respostas_json?: unknown; answers?: unknown }).respostas_json ??
          (parsed as { answers?: unknown }).answers
        : parsed;

    const answers =
      typeof candidate === "string"
        ? (JSON.parse(candidate) as Record<string, unknown>)
        : (candidate as Record<string, unknown>);

    const normalized = normalizeCgiAnswers(answers);
    return areCgiAnswersComplete(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

function withDevLeadFallback(lead: LeadForm): LeadForm {
  return {
    ...devLeadFallback,
    ...Object.fromEntries(
      Object.entries(lead).map(([key, value]) => [
        key,
        String(value || "").trim() || devLeadFallback[key as keyof LeadForm],
      ])
    ),
  } as LeadForm;
}

function parseAiReport(value: string): {
  report_title?: string;
  report_subtitle?: string;
  executive_summary?: string;
  strategic_diagnosis?: string;
  priority_diagnosis?: string;
  dimension_reading?: Array<{
    dimension?: string;
    score?: number;
    analysis?: string;
    implication?: string;
  }>;
  critical_bottlenecks?: string[];
  strategic_bets?: string[];
  renunciations?: string[];
  governance_system?: string[];
  final_recommendations?: string[];
  attention_points?: string[];
  recommended_next_steps?: string[];
} | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getSubmitErrorMessage(data: unknown, t = cgiUi.pt): string {
  if (!data || typeof data !== "object") {
    return t.savedBody;
  }

  const error = String((data as { error?: unknown }).error || "");
  const upstream = (data as { upstream?: { error?: unknown; raw?: unknown } }).upstream;

  if (error === "apps_script_outdated_or_wrong_deployment") {
    return "Seu resultado foi calculado, mas o Google Apps Script publicado ainda parece estar na versão antiga ou a URL configurada aponta para outra implantação. Atualize a implantação do Web App no Apps Script e confirme que ela está publicada para 'Qualquer pessoa'.";
  }

  if (error === "not_configured") {
    return "Seu resultado foi calculado, mas a URL do Google Apps Script não está configurada no servidor.";
  }

  if (error === "invalid_email_domain") {
    return t.invalidEmailBody;
  }

  if (error === "upstream_request_failed") {
    return "Seu resultado foi calculado, mas o servidor não conseguiu se comunicar com o Google Apps Script.";
  }

  if (String(upstream?.error || "") === "validation") {
    return "Seu resultado foi calculado, mas o Google Apps Script recusou o payload. Isso costuma indicar que a implantação publicada ainda é a versão antiga do script.";
  }

  if (typeof upstream?.raw === "string" && upstream.raw.includes("Função de script não encontrada")) {
    return "Seu resultado foi calculado, mas a implantação publicada do Google Apps Script não contém as funções novas. Publique uma nova versão do Web App com o script atualizado.";
  }

  return t.savedBody;
}

function getSaveErrorMessage(save: unknown, t = cgiUi.pt): string {
  if (!save || typeof save !== "object") {
    return t.savedBody;
  }

  const error = String((save as { error?: unknown }).error || "");
  if (error === "not_configured") {
    return "Seu relatório foi gerado, mas a URL do Google Apps Script não está configurada no servidor.";
  }
  if (error === "apps_script_outdated_or_wrong_deployment") {
    return "Seu relatório foi gerado, mas o Google Apps Script publicado parece estar em uma versão antiga.";
  }
  if (error === "upstream_request_failed") {
    return "Seu relatório foi gerado, mas o servidor não conseguiu se comunicar com o Google Apps Script.";
  }
  return t.savedBody;
}

function scrollToAssessment() {
  window.setTimeout(() => {
    document
      .getElementById("cgi-assessment")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

function formatAiReportText(
  aiReport: ReturnType<typeof parseAiReport>,
  fallback: CgiScoreResult,
  t: (typeof cgiUi)[Language]
) {
  if (!aiReport) return "";

  const list = (items?: string[]) =>
    Array.isArray(items) ? items.map((item) => `- ${item}`).join("\n") : "";
  const dimensionReading = Array.isArray(aiReport.dimension_reading)
    ? aiReport.dimension_reading
        .map((item, index) => {
          const matchingDimension =
            typeof item.score === "number"
              ? fallback.dimensionScores.find(
                  (score) => score.score === item.score
                )
              : undefined;
          const dimensionLabel =
            matchingDimension?.title ||
            fallback.dimensionScores[index]?.title ||
            item.dimension ||
            t.dimensionReadingTitle;
          const scoreValue = item.score ?? matchingDimension?.score;
          return [
            `- ${dimensionLabel}${scoreValue ? ` (${scoreValue}/100)` : ""}`,
            item.analysis,
            item.implication,
          ]
            .filter(Boolean)
            .join(": ");
        })
        .join("\n")
    : "";

  return [
    aiReport.report_title,
    aiReport.report_subtitle,
    aiReport.executive_summary,
    aiReport.strategic_diagnosis || aiReport.priority_diagnosis,
    dimensionReading ? `${t.dimensionReadingTitle}:\n${dimensionReading}` : "",
    list(aiReport.critical_bottlenecks)
      ? `${t.criticalBottlenecksTitle}:\n${list(aiReport.critical_bottlenecks)}`
      : "",
    list(aiReport.strategic_bets)
      ? `${t.strategicBetsTitle}:\n${list(aiReport.strategic_bets)}`
      : "",
    list(aiReport.renunciations)
      ? `${t.renunciationsTitle}:\n${list(aiReport.renunciations)}`
      : "",
    list(aiReport.governance_system)
      ? `${t.governanceTitle}:\n${list(aiReport.governance_system)}`
      : "",
    list(aiReport.final_recommendations || aiReport.recommended_next_steps)
      ? `${t.finalRecommendationsTitle}:\n${list(
          aiReport.final_recommendations || aiReport.recommended_next_steps
        )}`
      : "",
    !aiReport.executive_summary && fallback.diagnostic ? fallback.diagnostic : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildReportText({
  lead,
  result,
  aiReport,
  t,
}: {
  lead: LeadForm;
  result: CgiScoreResult;
  aiReport: ReturnType<typeof parseAiReport>;
  t: (typeof cgiUi)[Language];
}) {
  const aiText = formatAiReportText(aiReport, result, t);
  const attention = result.attentionPoints
    .map((item) => `- ${item.title}: ${item.score}/100`)
    .join("\n");

  return [
    `${t.reportDocTitle} - ${lead.company || "Caldeira Growth"}`,
    "Caldeira Growth Index",
    "",
    `${t.company}: ${lead.company}`,
    `${t.respondent}: ${lead.name}`,
    `${t.role}: ${lead.role}`,
    "",
    t.diagnosis,
    aiText || result.diagnostic,
    "",
    t.attentionTitle,
    attention,
    "",
    t.contact,
    t.contactText,
    "",
    "Denis Caldeira de Almeida",
    t.founderLine,
    "contato@caldeiragrowth.com",
    "www.caldeiragrowth.com",
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function formatReportListItem(line: string) {
  const text = line.replace(/^- /, "");
  const labelMatch = text.match(/^([^:]{1,90}):\s*(.*)$/);
  if (!labelMatch) return escapeHtml(text);

  return `<strong>${escapeHtml(labelMatch[1])}:</strong> ${escapeHtml(
    labelMatch[2]
  )}`;
}

function formatReportBodyHtml(reportText: string) {
  const escapedSignature = escapeAttr(reportSignature);
  const sectionTitles = new Set([
    "Diagnóstico",
    "Diagnosis",
    "Diagnóstico",
    "3 principais pontos de atenção",
    "3 main attention points",
    "3 principales puntos de atención",
    "Sumário Executivo",
    "Contexto e diagnóstico",
    "Leitura por dimensão",
    "Gargalos críticos",
    "Apostas estratégicas recomendadas",
    "Renúncias estratégicas",
    "Sistema mínimo de governança",
    "Recomendações finais",
    "Contato",
  ]);

  return reportText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length === 1 && sectionTitles.has(lines[0])) {
        return `<h2>${escapeHtml(lines[0])}</h2>`;
      }
      if (lines.length === 1 && /:$/.test(lines[0])) {
        return `<h3>${escapeHtml(lines[0])}</h3>`;
      }
      if (lines.length > 1 && /:$/.test(lines[0])) {
        const rest = lines.slice(1);
        const content = rest.every((line) => line.startsWith("- "))
          ? `<ul>${rest
              .map((line) => `<li>${formatReportListItem(line)}</li>`)
              .join("")}</ul>`
          : `<p>${escapeHtml(rest.join("\n")).replace(/\n/g, "<br />")}</p>`;
        return `<h3>${escapeHtml(lines[0])}</h3>${content}`;
      }
      if (lines[0] === "Denis Caldeira de Almeida") {
        return `
          <div class="signature-block">
            <img src="${escapedSignature}" alt="Assinatura Denis Caldeira" />
            <p>
              <strong>Denis Caldeira de Almeida</strong><br />
              ${escapeHtml(lines.slice(1).join("\n")).replace(/\n/g, "<br />")}
            </p>
          </div>
        `;
      }
      if (
        block.startsWith("Para aprofundar este diagnóstico") ||
        block.startsWith("To deepen this diagnosis") ||
        block.startsWith("Para profundizar este diagnóstico")
      ) {
        return `<p class="contact-callout">${escapeHtml(block)}</p>`;
      }
      if (lines.every((line) => line.startsWith("- "))) {
        return `<ul>${lines
          .map((line) => `<li>${formatReportListItem(line)}</li>`)
          .join("")}</ul>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

function buildFinalScoreHtml(result: CgiScoreResult, finalScoreLabel: string) {
  return `
    <section class="final-score">
      <div>
        <p class="final-score-label">${escapeHtml(finalScoreLabel)}</p>
        <p class="final-score-number">${result.finalScore}</p>
      </div>
      <div class="final-score-copy">
        <p class="final-score-level">${escapeHtml(result.level.title)}</p>
        <p>${escapeHtml(result.level.summary)}</p>
      </div>
    </section>
  `;
}

function buildScoreBarsHtml(result: CgiScoreResult, title: string) {
  return `
    <section class="score-bars">
      <h2>${escapeHtml(title)}</h2>
      ${result.dimensionScores
        .map(
          (item) => `
            <div class="score-row">
              <div class="score-label">
                <span>${escapeHtml(item.title)}</span>
                <strong>${item.score}/100</strong>
              </div>
              <div class="score-track">
                <div class="score-fill" style="width: ${Math.max(
                  0,
                  Math.min(100, item.score)
                )}%"></div>
              </div>
            </div>
          `
        )
        .join("")}
    </section>
  `;
}

function buildReportHtml(
  reportText: string,
  companyName: string,
  result: CgiScoreResult,
  t: (typeof cgiUi)[Language],
  lang: Language
) {
  const bodyHtml = formatReportBodyHtml(reportText);
  const finalScoreHtml = buildFinalScoreHtml(result, t.finalScore);
  const scoreBarsHtml = buildScoreBarsHtml(result, t.scoreByDimension);
  const escapedCompany = escapeHtml(companyName || "Caldeira Growth");
  const escapedTitle = `${escapeHtml(t.reportDocTitle)} - ${escapedCompany}`;
  const escapedLogo = escapeAttr(footerLogo);
  const escapedCover = escapeAttr(reportCover);
  const reportDate = escapeHtml(
    new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : lang === "es" ? "es-419" : "en", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date())
  );

  return `<!doctype html>
<html lang="${lang === "pt" ? "pt-BR" : lang === "es" ? "es-419" : "en"}">
  <head>
    <meta charset="utf-8" />
    <title>${escapedTitle}</title>
    <style>
      @page { size: A4; margin: 24mm 22mm 34mm; }
      @page:first { margin: 0; }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { font-family: Arial, sans-serif; color: #252b35; line-height: 1.58; margin: 0; background: #e7e2d9; }
      .screen-toolbar { background: #ffffff; border-bottom: 1px solid #d8d1c5; color: #344763; font: 600 13px Arial, sans-serif; padding: 12px 18px; position: sticky; top: 0; z-index: 10; text-align: center; }
      .report { margin: 28px auto 56px; width: 210mm; max-width: calc(100vw - 32px); box-shadow: 0 18px 45px rgba(30, 37, 48, .16); }
      .cover { width: 210mm; min-height: 297mm; box-sizing: border-box; color: #f5f7f8; position: relative; overflow: hidden; background: #334257; }
      .cover-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .cover-content { position: relative; z-index: 1; min-height: 297mm; box-sizing: border-box; padding: 270px 70px 92px; display: flex; flex-direction: column; justify-content: space-between; }
      .cover-kicker { font-size: 15px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.82); }
      .cover h1 { font-family: Georgia, serif; font-size: 54px; line-height: 1.03; font-weight: 700; margin: 18px 0 20px; max-width: 720px; }
      .cover .meta { font-family: Georgia, serif; font-size: 24px; color: rgba(255,255,255,.9); }
      .cover-details { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,.86); }
      .page { background: #f7f4ef; min-height: 297mm; padding: 60px 70px 132px; }
      h2 { font-family: Georgia, serif; font-size: 30px; font-weight: 700; margin: 34px 0 14px; color: #2e3340; }
      h2:first-child { margin-top: 0; }
      h3 { font-family: Georgia, serif; font-size: 20px; font-weight: 700; margin: 24px 0 10px; color: #2e3340; }
      .rule { height: 2px; background: #344763; margin: 0 0 28px; }
      p { font-size: 14px; margin: 0 0 16px; text-align: justify; }
      ul { margin: 0 0 18px 20px; padding: 0; }
      li { font-size: 14px; margin: 0 0 8px; text-align: justify; }
      h2, h3, .score-row, p, li { break-inside: avoid; }
      .final-score { align-items: center; background: #344763; color: #f7f4ef; display: grid; gap: 28px; grid-template-columns: 180px 1fr; margin: 0 0 34px; padding: 28px 32px; break-inside: avoid; }
      .final-score-label { font-size: 13px; font-weight: 800; letter-spacing: .16em; margin: 0 0 2px; text-align: left; text-transform: uppercase; }
      .final-score-number { font-family: Georgia, serif; font-size: 88px; font-weight: 700; line-height: .95; margin: 0; text-align: left; }
      .final-score-copy p { color: rgba(247,244,239,.86); font-size: 14px; margin: 0; text-align: left; }
      .final-score-copy .final-score-level { color: #ffffff; font-family: Georgia, serif; font-size: 27px; font-weight: 700; line-height: 1.12; margin: 0 0 8px; }
      .score-bars { margin: 26px 0 34px; }
      .score-row { margin: 0 0 18px; }
      .score-label { display: flex; justify-content: space-between; gap: 20px; font-size: 14px; font-weight: 700; margin-bottom: 7px; }
      .score-track { height: 13px; border-radius: 999px; background: #d4dbe2; overflow: hidden; }
      .score-fill { height: 100%; border-radius: 999px; background: #344763; }
      .contact-callout { border-left: 4px solid #344763; color: #1f2935; font-size: 15px; font-weight: 700; line-height: 1.62; padding: 4px 0 4px 16px; text-align: left; }
      .signature-block { margin: 34px 0 8px; break-inside: avoid; }
      .signature-block img { display: block; width: 475px; max-width: 90%; height: auto; margin: -10px 0 -58px -48px; }
      .signature-block p { margin-top: 0; text-align: left; }
      footer { border-top: 1px solid #c8cdd4; padding-top: 8px; text-align: center; background: #f7f4ef; }
      footer img { width: 112px; height: auto; }
      @media screen { footer { margin: 44px 70px 0; } }
      @media print {
        .screen-toolbar { display: none; }
        body { background: #f7f4ef; }
        .report { box-shadow: none; margin: 0; max-width: none; width: auto; }
        .cover { min-height: 297mm; page-break-after: always; width: 210mm; }
        .page { min-height: auto; padding: 0; }
        footer { margin: 18mm 22mm 0; }
      }
    </style>
  </head>
  <body>
    <div class="screen-toolbar">${escapeHtml(t.toolbar)}</div>
    <main class="report">
      <section class="cover">
        <img class="cover-bg" src="${escapedCover}" alt="" />
        <div class="cover-content">
          <div>
            <div class="cover-kicker">Caldeira Growth Index</div>
            <h1>${escapedTitle}</h1>
            <div class="meta">${escapeHtml(t.reportSubtitle)}</div>
          </div>
          <div class="cover-details">
            <div>${escapeHtml(t.company)}: ${escapedCompany}</div>
            <div>${lang === "en" ? "Date" : lang === "es" ? "Fecha" : "Data"}: ${reportDate}</div>
          </div>
        </div>
      </section>
      <section class="page">
        <div class="rule"></div>
        ${finalScoreHtml}
        ${scoreBarsHtml}
        ${bodyHtml}
      </section>
      <footer><img src="${escapedLogo}" alt="Caldeira Growth" /></footer>
    </main>
  </body>
</html>`;
}

function writeReportDocument(reportWindow: Window, html: string) {
  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
}

async function waitForReportAssets(reportWindow: Window, timeoutMs = 5000) {
  const documentReady = new Promise<void>((resolve) => {
    if (reportWindow.document.readyState === "complete") {
      resolve();
      return;
    }
    reportWindow.addEventListener("load", () => resolve(), { once: true });
  });

  const fontsReady =
    "fonts" in reportWindow.document
      ? reportWindow.document.fonts.ready.then(() => undefined)
      : Promise.resolve();

  const imagesReady = Promise.all(
    Array.from(reportWindow.document.images).map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
          }
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        })
    )
  ).then(() => undefined);

  let timeoutId = 0;
  const timeout = new Promise<void>((resolve) => {
    timeoutId = window.setTimeout(() => {
      if (import.meta.env.DEV) {
        console.warn("[CGI] Tempo limite ao aguardar assets do relatório.");
      }
      resolve();
    }, timeoutMs);
  });

  await Promise.race([
    Promise.all([documentReady, fontsReady, imagesReady]).then(() => undefined),
    timeout,
  ]);
  window.clearTimeout(timeoutId);
}

export default function CGI() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const config = getCgiConfig(lang);
  const t = cgiUi[lang];
  const [step, setStep] = useState<Step>("lead");
  const [lead, setLead] = useState<LeadForm>(initialLead);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [dimensionIndex, setDimensionIndex] = useState(0);
  const [startedAt] = useState(() => String(Date.now()));
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [serverAiReport, setServerAiReport] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [result, setResult] = useState<CgiScoreResult | null>(null);
  const [hasSavedAssessment, setHasSavedAssessment] = useState(false);
  const [devAnswersJson, setDevAnswersJson] = useState("");

  const currentDimension = config.dimensions[dimensionIndex];
  const currentQuestions = useMemo(
    () => questionsByDimension(config.questions, currentDimension.id),
    [config.questions, currentDimension.id]
  );
  const answeredCount = Object.keys(normalizeCgiAnswers(answers)).length;
  const progress = Math.round((answeredCount / CGI_QUESTIONS.length) * 100);
  const currentDimensionComplete = currentQuestions.every(
    (question) => answers[question.id] >= 1 && answers[question.id] <= 5
  );
  const aiReport = parseAiReport(serverAiReport);
  const reportText = result
    ? buildReportText({ lead, result, aiReport, t })
    : "";
  const reportReady = aiStatus === "generated" && Boolean(serverAiReport) && Boolean(aiReport);

  useEffect(() => {
    const prevTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const prevDescription = metaDescription?.getAttribute("content") || "";

    document.title = t.metaTitle;
    metaDescription?.setAttribute("content", t.metaDescription);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view_cgi",
      page_path: window.location.pathname,
      page_title: t.metaTitle,
      language: lang,
    });

    return () => {
      document.title = prevTitle;
      metaDescription?.setAttribute("content", prevDescription);
    };
  }, [lang, t.metaDescription, t.metaTitle]);

  useEffect(() => {
    setHasSavedAssessment(Boolean(readSavedCgiAssessment()));
  }, []);

  useEffect(() => {
    if (!isSubmitting) return;

    setReportProgress(12);
    const interval = window.setInterval(() => {
      setReportProgress((current) => {
        if (current < 45) return current + 7;
        if (current < 72) return current + 4;
        if (current < 90) return current + 2;
        return current;
      });
    }, 1800);

    return () => window.clearInterval(interval);
  }, [isSubmitting]);

  useEffect(() => {
    if (!reportReady || !result) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "cgi_report_ready",
      cgi_score: result.finalScore,
      cgi_level: result.level.title,
      language: lang,
      company_size: lead.employeeCount,
      current_challenge: lead.currentChallenge,
      investment_intent: lead.investmentIntent,
    });
  }, [lang, lead.currentChallenge, lead.employeeCount, lead.investmentIntent, reportReady, result]);

  const updateLead = (key: keyof LeadForm, value: string) => {
    setLead((current) => ({ ...current, [key]: value }));
  };

  const validateLead = (): boolean => {
    const required: Array<keyof LeadForm> = [
      "name",
      "email",
      "phone",
      "company",
      "role",
      "sector",
      "employeeCount",
      "annualRevenue",
      "currentChallenge",
      "growthGoal",
      "investmentIntent",
    ];
    const missing = required.find((key) => !lead[key].trim());
    if (missing) {
      toast({
        title: t.invalidRequiredTitle,
        description: t.invalidRequiredBody,
        variant: "destructive",
      });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      toast({
        title: t.invalidEmailTitle,
        description: t.invalidEmailBody,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const startAssessment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateLead()) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "cgi_lead_submitted",
      company_size: lead.employeeCount,
      current_challenge: lead.currentChallenge,
      investment_intent: lead.investmentIntent,
    });
    setStep("assessment");
    scrollToAssessment();
  };

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: Number(value) }));
  };

  const goToNextDimension = () => {
    if (!currentDimensionComplete) {
      toast({
        title: t.incompleteDimensionTitle,
        description: t.incompleteDimensionBody,
        variant: "destructive",
      });
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "cgi_dimension_completed",
      cgi_dimension: currentDimension.id,
      cgi_dimension_title: currentDimension.title,
      cgi_dimension_index: dimensionIndex + 1,
    });
    setDimensionIndex((current) => Math.min(current + 1, dimensionOrder.length - 1));
    scrollToAssessment();
  };

  const openReport = () => {
    if (!reportReady || !reportText) return;
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return;
    writeReportDocument(reportWindow, buildReportHtml(reportText, lead.company, result, t, lang));
    reportWindow.focus();
  };

  const printReport = async () => {
    if (!reportReady || !reportText) return;
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return;
    writeReportDocument(reportWindow, buildReportHtml(reportText, lead.company, result, t, lang));
    await waitForReportAssets(reportWindow);
    reportWindow.focus();
    reportWindow.print();
  };

  const openEmailDraft = () => {
    if (!reportReady || !result) return;
    const subject = encodeURIComponent(
      `CGI - Caldeira Growth Index - ${lead.company || "Caldeira Growth"}`
    );
    const body = encodeURIComponent(reportText);
    window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
  };

  const submitAssessmentWithData = async (
    assessmentLead: LeadForm,
    assessmentAnswers: Record<string, number>,
    options?: { isRegeneration?: boolean }
  ) => {
    const normalizedAnswers = normalizeCgiAnswers(assessmentAnswers);
    if (!areCgiAnswersComplete(normalizedAnswers)) {
      toast({
        title: t.incompleteAssessmentTitle,
        description: t.incompleteAssessmentBody,
        variant: "destructive",
      });
      return;
    }

    const localScore = calculateCgiScore(normalizedAnswers, lang);
    const normalizedLead = {
      ...assessmentLead,
      companyWebsite: normalizeWebsiteInput(assessmentLead.companyWebsite),
    };

    setLead(normalizedLead);
    setAnswers(normalizedAnswers);
    setResult(localScore);
    setStep("result");
    setIsSubmitting(true);
    setReportProgress(8);
    setSubmitError("");
    setServerAiReport("");
    setAiStatus("");
    saveCgiAssessment(normalizedLead, normalizedAnswers);
    setHasSavedAssessment(true);
    scrollToAssessment();

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "cgi_completed",
      cgi_score: localScore.finalScore,
      cgi_level: localScore.level.title,
      language: lang,
      company_size: normalizedLead.employeeCount,
      current_challenge: normalizedLead.currentChallenge,
      investment_intent: normalizedLead.investmentIntent,
      cgi_regenerated: Boolean(options?.isRegeneration),
    });

    try {
      const response = await fetch(CGI_ASSESSMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cgi_assessment",
          language: lang,
          lead: normalizedLead,
          answers: normalizedAnswers,
          score: localScore,
          aiStatus: "not_configured",
          aiReport: "",
          startedAt: options?.isRegeneration
            ? String(Date.now() - 10000)
            : startedAt,
          website,
        }),
      });
      const data = await response.json();

      if (!response.ok || data.ok !== true) {
        throw new Error(getSubmitErrorMessage(data, t));
      }

      // Keep the client-side score because it carries localized dimension and level labels.
      setResult(localScore);
      setServerAiReport(data.ai?.text ?? "");
      setAiStatus(data.ai?.status ?? "");
      setReportProgress(100);
      if (data.save?.ok === false) {
        setSubmitError(getSaveErrorMessage(data.save, t));
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t.savedBody
      );
      if (import.meta.env.DEV) {
        console.error("[CGI] submit error", error);
      }
    } finally {
      window.setTimeout(() => setIsSubmitting(false), 350);
    }
  };

  const submitAssessment = () => {
    void submitAssessmentWithData(lead, answers);
  };

  const regenerateSavedAssessment = () => {
    const saved = readSavedCgiAssessment();
    if (!saved) {
      toast({
        title: "Nenhum assessment salvo",
        description:
          "Gere um CGI uma vez nesta máquina para habilitar a regeneração local.",
        variant: "destructive",
      });
      return;
    }

    void submitAssessmentWithData(saved.lead, saved.answers, {
      isRegeneration: true,
    });
  };

  const generateFromAnswersJson = () => {
    const parsedAnswers = parseAnswersJsonInput(devAnswersJson);
    if (!parsedAnswers) {
      toast({
        title: "respostas_json inválido",
        description:
          "Cole o JSON completo das respostas, ou um objeto com respostas_json/answers.",
        variant: "destructive",
      });
      return;
    }

    void submitAssessmentWithData(withDevLeadFallback(lead), parsedAnswers, {
      isRegeneration: true,
    });
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <SEO routeKey="cgi" title={t.metaTitle} description={t.metaDescription} noIndex />

      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        <div className={sectionLayout.container}>
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-3xl">
              <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                {t.badge}
              </Badge>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
                {t.heroTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/85 md:text-xl">
                {t.heroText}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() =>
                    document
                      .getElementById("cgi-assessment")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {t.start}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <a href={config.primaryCta.href}>
                    {config.primaryCta.label}
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {t.stats.map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/8 p-5"
                >
                  <p className="text-3xl font-semibold text-accent">{value}</p>
                  <p className="mt-1 text-sm text-primary-foreground/75">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className={`${sectionLayout.container} py-8`}>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="flex gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t.trust[0].title}</p>
                <p className="text-sm text-muted-foreground">
                  {t.trust[0].body}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <BarChart3 className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t.trust[1].title}</p>
                <p className="text-sm text-muted-foreground">
                  {t.trust[1].body}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t.trust[2].title}</p>
                <p className="text-sm text-muted-foreground">
                  {t.trust[2].body}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cgi-assessment" className={`${sectionLayout.sectionY} scroll-mt-24`}>
        <div className={sectionLayout.container}>
          {step === "lead" && (
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div className={sectionLayout.prose}>
                <Badge variant="outline">{t.step1}</Badge>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
                  {t.contextTitle}
                </h2>
                <p className={sectionLayout.subtitle}>
                  {t.contextBody}
                </p>
              </div>

              <Card>
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={startAssessment} className="space-y-6">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t.labels.name} *</Label>
                        <Input
                          id="name"
                          autoComplete="name"
                          value={lead.name}
                          onChange={(event) => updateLead("name", event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t.labels.email} *</Label>
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          value={lead.email}
                          onChange={(event) => updateLead("email", event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t.labels.phone} *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          autoComplete="tel"
                          value={lead.phone}
                          onChange={(event) => updateLead("phone", event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">{t.labels.company} *</Label>
                        <Input
                          id="company"
                          autoComplete="organization"
                          value={lead.company}
                          onChange={(event) =>
                            updateLead("company", event.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyWebsite">{t.labels.companyWebsite}</Label>
                        <Input
                          id="companyWebsite"
                          type="text"
                          inputMode="url"
                          autoComplete="url"
                          placeholder="empresa.com.br"
                          value={lead.companyWebsite}
                          onChange={(event) =>
                            updateLead("companyWebsite", event.target.value)
                          }
                          onBlur={(event) =>
                            updateLead(
                              "companyWebsite",
                              normalizeWebsiteInput(event.target.value)
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">{t.labels.role} *</Label>
                        <Input
                          id="role"
                          autoComplete="organization-title"
                          value={lead.role}
                          onChange={(event) => updateLead("role", event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sector">{t.labels.sector} *</Label>
                        <Input
                          id="sector"
                          value={lead.sector}
                          onChange={(event) =>
                            updateLead("sector", event.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {config.qualificationFields.map((field) => (
                        <div className="space-y-2" key={field.id}>
                          <Label>{field.label} *</Label>
                          <Select
                            value={lead[field.id]}
                            onValueChange={(value) => updateLead(field.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t.selectPlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    <div className="hidden" aria-hidden="true">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                      />
                    </div>

                    {import.meta.env.DEV && (
                      <div className="rounded-lg border border-dashed border-primary/35 bg-primary/5 p-4 space-y-3">
                        <div>
                          <p className="text-sm font-semibold">
                            Ferramenta local de teste
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            Cole o valor da coluna respostas_json da planilha para
                            gerar o relatório sem responder as 40 perguntas. Se os
                            campos obrigatórios acima estiverem vazios, serão usados
                            dados de teste locais.
                          </p>
                        </div>
                        <Textarea
                          value={devAnswersJson}
                          onChange={(event) => setDevAnswersJson(event.target.value)}
                          placeholder='{"q1":5,"q2":4,...}'
                          className="min-h-28 font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateFromAnswersJson}
                          disabled={isSubmitting || !devAnswersJson.trim()}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Gerar a partir de respostas_json
                        </Button>
                      </div>
                    )}

                    <Button type="submit" size="lg" className="w-full md:w-auto">
                      {t.begin}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    {import.meta.env.DEV && hasSavedAssessment && (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full md:w-auto"
                        onClick={regenerateSavedAssessment}
                        disabled={isSubmitting}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Regerar último relatório salvo
                      </Button>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {step === "assessment" && (
            <div className="mx-auto max-w-4xl">
              <div className="mb-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <Badge variant="outline">{t.step2}</Badge>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                      {currentDimension.title}
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      {currentDimension.diagnostic}
                    </p>
                  </div>
                  <div className="min-w-[220px]">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>{t.answered(answeredCount, CGI_QUESTIONS.length)}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-5">
                  {config.dimensions.map((dimension, index) => (
                    <button
                      key={dimension.id}
                      type="button"
                      onClick={() => setDimensionIndex(index)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        index === dimensionIndex
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      {dimension.shortTitle}
                    </button>
                  ))}
                </div>
              </div>

              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="space-y-8">
                    {currentQuestions.map((question, index) => (
                      <div
                        key={question.id}
                        className="border-b border-border pb-7 last:border-0 last:pb-0"
                      >
                        <div className="flex gap-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                            {dimensionIndex * 8 + index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium leading-relaxed">
                              {question.text}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="ml-2 inline-flex h-5 w-5 translate-y-0.5 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                    aria-label={`Mais informações sobre a pergunta ${dimensionIndex * 8 + index + 1}`}
                                  >
                                    <Info className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs leading-relaxed">
                                  {question.helpText}
                                </TooltipContent>
                              </Tooltip>
                            </p>
                            <RadioGroup
                              className="mt-4 grid gap-2 md:grid-cols-5"
                              value={answers[question.id]?.toString()}
                              onValueChange={(value) => setAnswer(question.id, value)}
                            >
                              {config.scale.map((item) => (
                                <Label
                                  key={item.value}
                                  htmlFor={`${question.id}-${item.value}`}
                                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 ${
                                    answers[question.id] === item.value
                                      ? "border-primary bg-primary/5"
                                      : "border-border"
                                  }`}
                                >
                                  <RadioGroupItem
                                    id={`${question.id}-${item.value}`}
                                    value={String(item.value)}
                                    className="mt-0.5"
                                  />
                                  <span>
                                    <span className="block font-semibold">
                                      {item.value}
                                    </span>
                                    <span className="block text-xs leading-snug text-muted-foreground">
                                      {item.label}
                                    </span>
                                  </span>
                                </Label>
                              ))}
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {dimensionIndex === config.dimensions.length - 1 && (
                    <div className="mt-8 rounded-lg border border-border bg-muted/25 p-5">
                      <div className="space-y-2">
                        <Label htmlFor="comments">{t.labels.comments}</Label>
                        <Textarea
                          id="comments"
                          value={lead.comments}
                          onChange={(event) =>
                            updateLead("comments", event.target.value)
                          }
                          placeholder={t.commentsPlaceholder}
                          rows={4}
                          className="resize-y bg-background"
                        />
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t.commentsHelp}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (dimensionIndex === 0) {
                          setStep("lead");
                        } else {
                          setDimensionIndex((current) => current - 1);
                        }
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t.back}
                    </Button>
                    {dimensionIndex < config.dimensions.length - 1 ? (
                      <Button onClick={goToNextDimension}>
                        {t.nextDimension}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={submitAssessment}>
                        {t.generate}
                        <Target className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === "result" && result && (
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <Card className="border-primary/20">
                  <CardContent className="p-6 md:p-8">
                    <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                      {t.step3}
                    </Badge>
                    <p className="mt-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {t.finalScore}
                    </p>
                    <p
                      className={`mt-2 text-7xl font-semibold tracking-tight ${getScoreTone(
                        result.finalScore
                      )}`}
                    >
                      {result.finalScore}
                    </p>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                      {result.level.title}
                    </h2>
                    <p className="mt-4 leading-relaxed text-muted-foreground">
                      {result.diagnostic}
                    </p>

                    <div className="mt-8 flex flex-col gap-3">
                      <Button size="lg" asChild>
                        <a href={config.primaryCta.href}>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {config.primaryCta.label}
                        </a>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={openReport}
                        disabled={!reportReady}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {t.openReport}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={printReport}
                        disabled={!reportReady}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        {t.printReport}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={openEmailDraft}
                        disabled={!reportReady}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {t.emailReport}
                      </Button>
                      {import.meta.env.DEV && hasSavedAssessment && (
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={regenerateSavedAssessment}
                          disabled={isSubmitting}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Regerar último relatório salvo
                        </Button>
                      )}
                      {!reportReady && (
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            {t.reportPending}
                          </p>
                          {isSubmitting && (
                            <>
                              <Progress value={reportProgress} />
                              <p className="text-xs">
                                {t.reportStages[
                                  Math.min(
                                    t.reportStages.length - 1,
                                    Math.floor((reportProgress / 100) * t.reportStages.length)
                                  )
                                ]}
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {submitError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{t.saveFailureTitle}</AlertTitle>
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}

                  {isSubmitting && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertTitle>{t.reportAlertTitle}</AlertTitle>
                      <AlertDescription>
                        <span className="block">
                          {t.reportAlertBody}
                        </span>
                        <span className="mt-3 block">
                          {t.reportIpBody}
                        </span>
                        <span className="mt-3 block">
                          {t.proprietaryBody}
                        </span>
                        <span className="mt-4 block">
                          <Progress value={reportProgress} />
                        </span>
                        <span className="mt-2 block text-xs text-muted-foreground">
                          {t.reportStages[
                            Math.min(
                              t.reportStages.length - 1,
                              Math.floor((reportProgress / 100) * t.reportStages.length)
                            )
                          ]}
                        </span>
                      </AlertDescription>
                    </Alert>
                  )}

                  {!isSubmitting && !submitError && (
                    <Alert className="border-primary/20">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertTitle>{t.savedTitle}</AlertTitle>
                      <AlertDescription>
                        {t.savedBody}{" "}
                        {aiStatus === "generated"
                          ? t.proprietaryBody
                          : result.diagnostic}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Card>
                    <CardContent className="p-6 md:p-8">
                      <h3 className="text-xl font-semibold">{t.scoreByDimension}</h3>
                      <div className="mt-6 space-y-5">
                        {result.dimensionScores.map((item) => (
                          <div key={item.dimensionId}>
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <span className="font-medium">{item.title}</span>
                              <span
                                className={`font-semibold ${getScoreTone(
                                  item.score
                                )}`}
                              >
                                {item.score}
                              </span>
                            </div>
                            <Progress value={item.score} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 md:p-8">
                      <h3 className="text-xl font-semibold">
                        {t.attentionTitle}
                      </h3>
                      <div className="mt-5 grid gap-3">
                        {result.attentionPoints.map((item) => (
                          <div
                            key={item.dimensionId}
                            className="rounded-lg border border-border p-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <p className="font-medium">{item.title}</p>
                              <Badge variant="outline">{item.score}/100</Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {t.attentionBody}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {aiReport && (
                    <Card className="border-primary/20">
                      <CardContent className="p-6 md:p-8">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <h3 className="text-xl font-semibold">
                            {aiReport.report_title || "Diagnóstico executivo com IA"}
                          </h3>
                        </div>
                        {aiReport.report_subtitle && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {aiReport.report_subtitle}
                          </p>
                        )}
                        {aiReport.executive_summary && (
                          <p className="mt-4 leading-relaxed text-muted-foreground">
                            {aiReport.executive_summary}
                          </p>
                        )}
                        {(aiReport.strategic_diagnosis ||
                          aiReport.priority_diagnosis) && (
                          <p className="mt-4 leading-relaxed">
                            {aiReport.strategic_diagnosis ||
                              aiReport.priority_diagnosis}
                          </p>
                        )}
                        {Array.isArray(aiReport.dimension_reading) &&
                          aiReport.dimension_reading.length > 0 && (
                            <div className="mt-6 space-y-3">
                              <h4 className="font-semibold">
                                Leitura por dimensão
                              </h4>
                              {aiReport.dimension_reading.map((item) => (
                                <div
                                  key={`${item.dimension}-${item.score}`}
                                  className="rounded-lg border border-border p-4"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <p className="font-medium">{item.dimension}</p>
                                    {item.score !== undefined && (
                                      <Badge variant="outline">
                                        {item.score}/100
                                      </Badge>
                                    )}
                                  </div>
                                  {item.analysis && (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                      {item.analysis}
                                    </p>
                                  )}
                                  {item.implication && (
                                    <p className="mt-2 text-sm">
                                      {item.implication}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        {[
                          ["Gargalos críticos", aiReport.critical_bottlenecks],
                          ["Apostas estratégicas", aiReport.strategic_bets],
                          ["Renúncias estratégicas", aiReport.renunciations],
                          [
                            "Sistema mínimo de governança",
                            aiReport.governance_system,
                          ],
                          [
                            "Recomendações finais",
                            aiReport.final_recommendations ||
                              aiReport.recommended_next_steps,
                          ],
                        ].map(([title, items]) =>
                          Array.isArray(items) && items.length > 0 ? (
                            <div key={title as string} className="mt-6">
                              <h4 className="font-semibold">{title as string}</h4>
                              <ul className="mt-3 space-y-2">
                                {(items as string[]).map((item) => (
                                  <li key={item} className="flex gap-2 text-sm">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
