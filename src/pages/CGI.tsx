import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { sectionLayout } from "@/lib/sectionLayout";
import {
  CGI_DIMENSIONS,
  CGI_PRIMARY_CTA,
  CGI_QUALIFICATION_FIELDS,
  CGI_QUESTIONS,
  CGI_SCALE,
  type CgiDimensionId,
} from "@/data/cgiConfig";
import {
  areCgiAnswersComplete,
  calculateCgiScore,
  normalizeCgiAnswers,
  type CgiScoreResult,
} from "@/lib/cgiScore";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
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
};

const dimensionOrder = CGI_DIMENSIONS.map((dimension) => dimension.id);

function questionsByDimension(dimensionId: CgiDimensionId) {
  return CGI_QUESTIONS.filter((question) => question.dimensionId === dimensionId);
}

function getScoreTone(score: number): string {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-amber-700";
  return "text-destructive";
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

function getSubmitErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Seu resultado foi calculado, mas houve uma falha ao salvar os dados. Tente enviar novamente ou entre em contato pela página de contato.";
  }

  const error = String((data as { error?: unknown }).error || "");
  const upstream = (data as { upstream?: { error?: unknown; raw?: unknown } }).upstream;

  if (error === "apps_script_outdated_or_wrong_deployment") {
    return "Seu resultado foi calculado, mas o Google Apps Script publicado ainda parece estar na versão antiga ou a URL configurada aponta para outra implantação. Atualize a implantação do Web App no Apps Script e confirme que ela está publicada para 'Qualquer pessoa'.";
  }

  if (error === "not_configured") {
    return "Seu resultado foi calculado, mas a URL do Google Apps Script não está configurada no servidor.";
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

  return "Seu resultado foi calculado, mas houve uma falha ao salvar os dados. Tente enviar novamente ou entre em contato pela página de contato.";
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
  fallback: CgiScoreResult
) {
  if (!aiReport) return "";

  const list = (items?: string[]) =>
    Array.isArray(items) ? items.map((item) => `- ${item}`).join("\n") : "";
  const dimensionReading = Array.isArray(aiReport.dimension_reading)
    ? aiReport.dimension_reading
        .map((item) =>
          [
            `- ${item.dimension || "Dimensão"}${item.score ? ` (${item.score}/100)` : ""}`,
            item.analysis,
            item.implication,
          ]
            .filter(Boolean)
            .join(": ")
        )
        .join("\n")
    : "";

  return [
    aiReport.report_title,
    aiReport.report_subtitle,
    aiReport.executive_summary,
    aiReport.strategic_diagnosis || aiReport.priority_diagnosis,
    dimensionReading ? `Leitura por dimensão:\n${dimensionReading}` : "",
    list(aiReport.critical_bottlenecks)
      ? `Gargalos críticos:\n${list(aiReport.critical_bottlenecks)}`
      : "",
    list(aiReport.strategic_bets)
      ? `Apostas estratégicas recomendadas:\n${list(aiReport.strategic_bets)}`
      : "",
    list(aiReport.renunciations)
      ? `Renúncias estratégicas:\n${list(aiReport.renunciations)}`
      : "",
    list(aiReport.governance_system)
      ? `Sistema mínimo de governança:\n${list(aiReport.governance_system)}`
      : "",
    list(aiReport.final_recommendations || aiReport.recommended_next_steps)
      ? `Recomendações finais:\n${list(
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
}: {
  lead: LeadForm;
  result: CgiScoreResult;
  aiReport: ReturnType<typeof parseAiReport>;
}) {
  const aiText = formatAiReportText(aiReport, result);
  const dimensions = result.dimensionScores
    .map((item) => `${item.title}: ${item.score}/100`)
    .join("\n");
  const attention = result.attentionPoints
    .map((item) => `- ${item.title}: ${item.score}/100`)
    .join("\n");

  return [
    "CGI - Caldeira Growth Index",
    "",
    `Empresa: ${lead.company}`,
    `Respondente: ${lead.name}`,
    `Cargo: ${lead.role}`,
    "",
    `CGI final: ${result.finalScore}`,
    `Nível: ${result.level.title}`,
    "",
    "Diagnóstico",
    aiText || result.diagnostic,
    "",
    "Score por dimensão",
    dimensions,
    "",
    "3 principais pontos de atenção",
    attention,
    "",
    "CTA",
    "Agendar uma conversa estratégica com a Caldeira Growth.",
  ].join("\n");
}

function buildReportHtml(reportText: string) {
  const escaped = reportText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>CGI - Caldeira Growth Index</title>
    <style>
      @page { size: A4; margin: 24mm 22mm; }
      body { font-family: Arial, sans-serif; color: #252b35; line-height: 1.58; margin: 0; background: #f7f4ef; }
      .cover { min-height: 100vh; box-sizing: border-box; padding: 72px 64px; background: #334257; color: #f5f7f8; display: flex; flex-direction: column; justify-content: space-between; }
      .brand { font-size: 20px; font-weight: 800; letter-spacing: .01em; }
      .cover h1 { font-family: Georgia, serif; font-size: 64px; line-height: .95; font-weight: 400; margin: 120px 0 20px; max-width: 620px; }
      .cover .meta { font-family: Georgia, serif; font-size: 30px; }
      .page { background: #f7f4ef; padding: 60px 70px; }
      h2 { font-family: Georgia, serif; font-size: 40px; font-weight: 400; margin: 0 0 14px; color: #2e3340; }
      .rule { height: 2px; background: #344763; margin: 0 0 28px; }
      pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; margin: 0; }
      footer { margin-top: 44px; display: flex; justify-content: center; color: #1e2530; font-weight: 700; }
      @media print { .cover { page-break-after: always; } body { background: #f7f4ef; } }
    </style>
  </head>
  <body>
    <section class="cover">
      <div class="brand">Caldeira</div>
      <div>
        <h1>Relatório CGI</h1>
        <div class="meta">Caldeira Growth Index</div>
      </div>
      <div>Diagnóstico executivo de maturidade de crescimento</div>
    </section>
    <section class="page">
      <h2>Sumário Executivo</h2>
      <div class="rule"></div>
      <pre>${escaped}</pre>
      <footer>Caldeira Growth</footer>
    </section>
  </body>
</html>`;
}

export default function CGI() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("lead");
  const [lead, setLead] = useState<LeadForm>(initialLead);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [dimensionIndex, setDimensionIndex] = useState(0);
  const [startedAt] = useState(() => String(Date.now()));
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [serverAiReport, setServerAiReport] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [result, setResult] = useState<CgiScoreResult | null>(null);

  const currentDimension = CGI_DIMENSIONS[dimensionIndex];
  const currentQuestions = useMemo(
    () => questionsByDimension(currentDimension.id),
    [currentDimension.id]
  );
  const answeredCount = Object.keys(normalizeCgiAnswers(answers)).length;
  const progress = Math.round((answeredCount / CGI_QUESTIONS.length) * 100);
  const currentDimensionComplete = currentQuestions.every(
    (question) => answers[question.id] >= 1 && answers[question.id] <= 5
  );
  const aiReport = parseAiReport(serverAiReport);
  const reportText = result
    ? buildReportText({ lead, result, aiReport })
    : "";

  useEffect(() => {
    const prevTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const prevDescription = metaDescription?.getAttribute("content") || "";

    document.title = "CGI - Caldeira Growth Index | Assessment de crescimento";
    metaDescription?.setAttribute(
      "content",
      "Assessment gratuito de maturidade de crescimento empresarial da Caldeira Growth. Descubra gargalos e prioridades em menos de 10 minutos."
    );

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view_cgi",
      page_path: "/cgi",
      page_title: "CGI - Caldeira Growth Index",
    });

    return () => {
      document.title = prevTitle;
      metaDescription?.setAttribute("content", prevDescription);
    };
  }, []);

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
        title: "Campos obrigatorios",
        description: "Preencha todos os dados antes de iniciar o assessment.",
        variant: "destructive",
      });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      toast({
        title: "E-mail invalido",
        description: "Informe um e-mail corporativo valido para continuar.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const startAssessment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateLead()) return;
    setStep("assessment");
    scrollToAssessment();
  };

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: Number(value) }));
  };

  const goToNextDimension = () => {
    if (!currentDimensionComplete) {
      toast({
        title: "Dimensão incompleta",
        description: "Responda todas as perguntas desta dimensão para continuar.",
        variant: "destructive",
      });
      return;
    }
    setDimensionIndex((current) => Math.min(current + 1, dimensionOrder.length - 1));
    scrollToAssessment();
  };

  const downloadReport = () => {
    if (!reportText) return;
    const html = buildReportHtml(reportText);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filenameBase = `cgi-${lead.company || "caldeira-growth"}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    a.download = `${filenameBase}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    if (!reportText) return;
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return;
    reportWindow.document.write(buildReportHtml(reportText));
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const openEmailDraft = () => {
    if (!result) return;
    const subject = encodeURIComponent("CGI - Caldeira Growth Index");
    const body = encodeURIComponent(reportText || result.diagnostic);
    window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
  };

  const submitAssessment = async () => {
    const normalizedAnswers = normalizeCgiAnswers(answers);
    if (!areCgiAnswersComplete(normalizedAnswers)) {
      toast({
        title: "Assessment incompleto",
        description: "Responda as 40 perguntas para gerar seu CGI.",
        variant: "destructive",
      });
      return;
    }

    const localScore = calculateCgiScore(normalizedAnswers);
    setResult(localScore);
    setStep("result");
    setIsSubmitting(true);
    setSubmitError("");
    scrollToAssessment();

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "cgi_completed",
      cgi_score: localScore.finalScore,
      cgi_level: localScore.level.title,
      company_size: lead.employeeCount,
      current_challenge: lead.currentChallenge,
      investment_intent: lead.investmentIntent,
    });

    try {
      const response = await fetch("/api/cgi-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cgi_assessment",
          lead,
          answers: normalizedAnswers,
          score: localScore,
          aiStatus: "not_configured",
          aiReport: "",
          startedAt,
          website,
        }),
      });
      const data = await response.json();

      if (!response.ok || data.ok !== true) {
        throw new Error(getSubmitErrorMessage(data));
      }

      setResult(data.score ?? localScore);
      setServerAiReport(data.ai?.text ?? "");
      setAiStatus(data.ai?.status ?? "");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Seu resultado foi calculado, mas houve uma falha ao salvar os dados. Tente enviar novamente ou entre em contato pela página de contato."
      );
      if (import.meta.env.DEV) {
        console.error("[CGI] submit error", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        <div className={sectionLayout.container}>
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-3xl">
              <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                CGI - Caldeira Growth Index
              </Badge>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
                Descubra o nível de maturidade de crescimento da sua empresa.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/85 md:text-xl">
                Em menos de 10 minutos, identifique os principais gargalos que
                podem limitar sua próxima fase de crescimento.
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
                  Iniciar assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <a href={CGI_PRIMARY_CTA.href}>
                    {CGI_PRIMARY_CTA.label}
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["5", "dimensões críticas"],
                ["40", "perguntas executivas"],
                ["0-100", "score de maturidade"],
              ].map(([value, label]) => (
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
                <p className="font-medium">Consultivo</p>
                <p className="text-sm text-muted-foreground">
                  Perguntas orientadas a decisões de crescimento, não um quiz
                  genérico.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <BarChart3 className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Determinístico</p>
                <p className="text-sm text-muted-foreground">
                  Score calculado por dimensão, com peso igual de 20%.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Preparado para IA</p>
                <p className="text-sm text-muted-foreground">
                  A arquitetura já separa dados, score e diagnóstico para
                  relatórios futuros.
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
                <Badge variant="outline">Etapa 1 de 3</Badge>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
                  Antes do assessment, precisamos contextualizar sua empresa.
                </h2>
                <p className={sectionLayout.subtitle}>
                  Esses dados ajudam a interpretar o resultado com mais precisao
                  e a registrar o diagnóstico na base da Caldeira Growth.
                </p>
              </div>

              <Card>
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={startAssessment} className="space-y-6">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          autoComplete="name"
                          value={lead.name}
                          onChange={(event) => updateLead("name", event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
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
                        <Label htmlFor="phone">Telefone *</Label>
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
                        <Label htmlFor="company">Empresa *</Label>
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
                        <Label htmlFor="companyWebsite">Site da empresa</Label>
                        <Input
                          id="companyWebsite"
                          type="url"
                          inputMode="url"
                          autoComplete="url"
                          placeholder="https://www.empresa.com.br"
                          value={lead.companyWebsite}
                          onChange={(event) =>
                            updateLead("companyWebsite", event.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Cargo *</Label>
                        <Input
                          id="role"
                          autoComplete="organization-title"
                          value={lead.role}
                          onChange={(event) => updateLead("role", event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sector">Setor *</Label>
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
                      {CGI_QUALIFICATION_FIELDS.map((field) => (
                        <div className="space-y-2" key={field.id}>
                          <Label>{field.label} *</Label>
                          <Select
                            value={lead[field.id]}
                            onValueChange={(value) => updateLead(field.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
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

                    <Button type="submit" size="lg" className="w-full md:w-auto">
                      Começar assessment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
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
                    <Badge variant="outline">Etapa 2 de 3</Badge>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                      {currentDimension.title}
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      {currentDimension.diagnostic}
                    </p>
                  </div>
                  <div className="min-w-[220px]">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>{answeredCount} de {CGI_QUESTIONS.length}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-5">
                  {CGI_DIMENSIONS.map((dimension, index) => (
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
                              {CGI_SCALE.map((item) => (
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
                      Voltar
                    </Button>
                    {dimensionIndex < CGI_DIMENSIONS.length - 1 ? (
                      <Button onClick={goToNextDimension}>
                        Próxima dimensão
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={submitAssessment}>
                        Gerar meu CGI
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
                      Etapa 3 de 3
                    </Badge>
                    <p className="mt-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      CGI final
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
                        <a href={CGI_PRIMARY_CTA.href}>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {CGI_PRIMARY_CTA.label}
                        </a>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={downloadReport}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Baixar relatório
                      </Button>
                      <Button size="lg" variant="outline" onClick={printReport}>
                        <Printer className="mr-2 h-4 w-4" />
                        Salvar em PDF
                      </Button>
                      <Button size="lg" variant="outline" onClick={openEmailDraft}>
                        <Mail className="mr-2 h-4 w-4" />
                        Abrir e-mail com relatório
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {submitError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Falha ao salvar</AlertTitle>
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}

                  {isSubmitting && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertTitle>Registrando resultado</AlertTitle>
                      <AlertDescription>
                        Salvando respostas, scores e diagnóstico na base da
                        Caldeira Growth.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!isSubmitting && !submitError && (
                    <Alert className="border-primary/20">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertTitle>Resultado registrado</AlertTitle>
                      <AlertDescription>
                        Seus dados foram salvos e o relatório foi enviado para o
                        e-mail informado.{" "}
                        {aiStatus === "generated"
                          ? "Um diagnóstico executivo com IA também foi gerado."
                          : "O diagnóstico principal foi calculado pelas regras do CGI."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Card>
                    <CardContent className="p-6 md:p-8">
                      <h3 className="text-xl font-semibold">Score por dimensão</h3>
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
                        3 principais pontos de atenção
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
                              Essa dimensão aparece entre as menores notas e deve
                              ser priorizada em uma conversa estratégica.
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
