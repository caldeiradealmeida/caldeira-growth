import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { sectionLayout } from "@/lib/sectionLayout";
import { CGI_QUESTIONS, getCgiConfig } from "@/data/cgiConfig";
import {
  areCgiAnswersComplete,
  calculateCgiScore,
  normalizeCgiAnswers,
  type CgiScoreResult,
} from "@/features/cgi/scoring";
import {
  CGI_ASSESSMENT_ENDPOINT,
  cgiUi,
  dimensionOrder,
  initialLead,
} from "@/features/cgi/config";
import type { LeadForm, Step } from "@/features/cgi/types";
import {
  isOtherOption,
  isValidPhone,
  normalizeLeadForSubmit,
  parseAnswersJsonInput,
  questionsByDimension,
  toLeadPayload,
  withDevLeadFallback,
} from "@/features/cgi/utils/form";
import {
  readSavedCgiAssessment,
  saveCgiAssessment,
} from "@/features/cgi/services/storage";
import {
  buildReportHtml,
  buildReportText,
  downloadReportPdf,
  getSaveErrorMessage,
  getSubmitErrorMessage,
  parseAiReport,
  scrollToAssessment,
  writeReportDocument,
} from "@/features/cgi/services/report";
import { useCgiReportProgress } from "@/features/cgi/hooks/useCgiReportProgress";
import { CgiAssessmentStep } from "@/features/cgi/components/CgiAssessmentStep";
import { CgiLanding } from "@/features/cgi/components/CgiLanding";
import { CgiLeadStep } from "@/features/cgi/components/CgiLeadStep";
import { CgiResultStep } from "@/features/cgi/components/CgiResultStep";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [serverAiReport, setServerAiReport] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [result, setResult] = useState<CgiScoreResult | null>(null);
  const [hasSavedAssessment, setHasSavedAssessment] = useState(false);
  const [devAnswersJson, setDevAnswersJson] = useState("");
  const { reportProgress, setReportProgress } = useCgiReportProgress(isSubmitting);

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
      "commercialRelationshipModel",
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
    if (!isValidPhone(lead.phone)) {
      toast({
        title: t.invalidRequiredTitle,
        description: t.invalidPhoneBody,
        variant: "destructive",
      });
      return false;
    }
    if (isOtherOption(lead.sector) && !lead.sectorOther.trim()) {
      toast({
        title: t.invalidRequiredTitle,
        description: t.invalidRequiredBody,
        variant: "destructive",
      });
      return false;
    }
    if (
      isOtherOption(lead.commercialRelationshipModel) &&
      !lead.commercialRelationshipOther.trim()
    ) {
      toast({
        title: t.invalidRequiredTitle,
        description: t.invalidRequiredBody,
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

  const downloadPdf = async () => {
    if (!reportReady || !reportText) return;
    setIsGeneratingPdf(true);
    try {
      await downloadReportPdf({
        reportText,
        companyName: lead.company,
        result,
        t,
        lang,
      });
      toast({ title: t.pdfGenerated });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[CGI] Falha ao gerar PDF.", error);
      }
      toast({
        title: t.pdfError,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
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
    const normalizedLead = normalizeLeadForSubmit(assessmentLead);
    const payloadLead = toLeadPayload(normalizedLead);

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
          lead: payloadLead,
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

      <CgiLanding t={t} config={config} />

      <section id="cgi-assessment" className={`${sectionLayout.sectionY} scroll-mt-24`}>
        <div className={sectionLayout.container}>
          {step === "lead" && (
            <CgiLeadStep
              t={t}
              config={config}
              lead={lead}
              website={website}
              devAnswersJson={devAnswersJson}
              isSubmitting={isSubmitting}
              hasSavedAssessment={hasSavedAssessment}
              startAssessment={startAssessment}
              updateLead={updateLead}
              setLead={setLead}
              setWebsite={setWebsite}
              setDevAnswersJson={setDevAnswersJson}
              generateFromAnswersJson={generateFromAnswersJson}
              regenerateSavedAssessment={regenerateSavedAssessment}
            />
          )}

          {step === "assessment" && (
            <CgiAssessmentStep
              t={t}
              config={config}
              currentDimension={currentDimension}
              currentQuestions={currentQuestions}
              dimensionIndex={dimensionIndex}
              answeredCount={answeredCount}
              progress={progress}
              answers={answers}
              lead={lead}
              setStep={setStep}
              setDimensionIndex={setDimensionIndex}
              updateLead={updateLead}
              setAnswer={setAnswer}
              goToNextDimension={goToNextDimension}
              submitAssessment={submitAssessment}
            />
          )}

          {step === "result" && result && (
            <CgiResultStep
              t={t}
              config={config}
              result={result}
              aiReport={aiReport}
              aiStatus={aiStatus}
              submitError={submitError}
              reportReady={reportReady}
              isSubmitting={isSubmitting}
              isGeneratingPdf={isGeneratingPdf}
              hasSavedAssessment={hasSavedAssessment}
              reportProgress={reportProgress}
              openReport={openReport}
              downloadPdf={downloadPdf}
              openEmailDraft={openEmailDraft}
              regenerateSavedAssessment={regenerateSavedAssessment}
            />
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
