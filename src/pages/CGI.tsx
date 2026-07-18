import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { CgiConsentState } from "@/features/cgi/types";
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
import {
  markEventSent,
  markProgressSent,
  getAttributionForStart,
  getOrCreateAnonymousSessionId,
  patchAssessmentState,
  readAssessmentState,
} from "@/features/cgi/services/assessmentStorage";
import {
  getOrCreateEventId,
  pushCgiDataLayerEvent,
  sendCgiClientEvent,
  sendCgiProgressEvent,
} from "@/features/cgi/services/analytics";
import { startCgiAssessment, submitCgiLead } from "@/features/cgi/services/api";

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
  const [anonymousSessionId] = useState(() => getOrCreateAnonymousSessionId());
  const [publicAssessmentId, setPublicAssessmentId] = useState(
    () => readAssessmentState()?.public_assessment_id || ""
  );
  const [step, setStep] = useState<Step>("lead");
  const [lead, setLead] = useState<LeadForm>(initialLead);
  const [consent, setConsent] = useState<CgiConsentState>({
    privacy: false,
    marketing: false,
  });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [dimensionIndex, setDimensionIndex] = useState(0);
  const [startedAt] = useState(() => String(Date.now()));
  const [website, setWebsite] = useState("");
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [serverAiReport, setServerAiReport] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [result, setResult] = useState<CgiScoreResult | null>(null);
  const [hasSavedAssessment, setHasSavedAssessment] = useState(false);
  const [devAnswersJson, setDevAnswersJson] = useState("");
  const { reportProgress, setReportProgress } = useCgiReportProgress(isSubmitting);
  const landingViewSentRef = useRef(false);
  const startClickSentRef = useRef(false);
  const leadFormViewSentRef = useRef(false);
  const resultViewedSentRef = useRef(false);
  const assessmentStartedSentRef = useRef(
    Boolean(readAssessmentState()?.sent_events.cgi_assessment_started)
  );
  const progressSentRef = useRef(new Set(readAssessmentState()?.sent_progress || []));

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

    if (!landingViewSentRef.current) {
      landingViewSentRef.current = true;
      void sendCgiClientEvent({
        eventName: "cgi_landing_view",
        anonymousSessionId,
        publicAssessmentId: publicAssessmentId || null,
        metadata: {
          language: lang,
          page_path: window.location.pathname,
        },
        dataLayerPayload: {
          language: lang,
          page_path: window.location.pathname,
        },
      });
    }

    return () => {
      document.title = prevTitle;
      metaDescription?.setAttribute("content", prevDescription);
    };
  }, [anonymousSessionId, lang, publicAssessmentId, t.metaDescription, t.metaTitle]);

  useEffect(() => {
    setHasSavedAssessment(Boolean(readSavedCgiAssessment()));
  }, []);

  useEffect(() => {
    const savedState = readAssessmentState();
    if (!savedState || savedState.status === "completed") return;
    if (savedState.public_assessment_id) {
      setPublicAssessmentId(savedState.public_assessment_id);
    }
    if (Object.keys(savedState.answers).length > 0) {
      setAnswers(savedState.answers);
      setDimensionIndex(
        Math.min(
          Math.floor(Object.keys(savedState.answers).length / 8),
          dimensionOrder.length - 1
        )
      );
      if (!savedState.sent_events.cgi_assessment_resumed) {
        void sendCgiClientEvent({
          eventName: "cgi_assessment_resumed",
          anonymousSessionId,
          publicAssessmentId: savedState.public_assessment_id,
          metadata: {
            progress_percent: Math.min(
              99,
              Math.round((Object.keys(savedState.answers).length / CGI_QUESTIONS.length) * 100)
            ),
          },
        });
      }
    }
  }, [anonymousSessionId]);

  useEffect(() => {
    if (step !== "result" || !result || resultViewedSentRef.current) return;
    resultViewedSentRef.current = true;
    void sendCgiClientEvent({
      eventName: "cgi_result_viewed",
      anonymousSessionId,
      publicAssessmentId: publicAssessmentId || null,
      metadata: {
        cgi_score: result.finalScore,
        cgi_level: result.level.id,
      },
    });
  }, [anonymousSessionId, publicAssessmentId, result, step]);

  const trackInternalError = useCallback(
    (eventName: "cgi_validation_error" | "cgi_system_error", errorCode: string) => {
      void sendCgiClientEvent({
        eventName,
        anonymousSessionId,
        publicAssessmentId: publicAssessmentId || null,
        pushToDataLayer: false,
        metadata: {
          error_code: errorCode,
          page_path: window.location.pathname,
        },
        eventKey: `${eventName}:${errorCode}:${Date.now()}`,
      });
    },
    [anonymousSessionId, publicAssessmentId]
  );

  const ensurePublicAssessment = useCallback(async () => {
    if (publicAssessmentId) return publicAssessmentId;
    try {
      const start = await startCgiAssessment({
        anonymousSessionId,
        language: lang,
        attribution: getAttributionForStart(),
      });
      setPublicAssessmentId(start.public_assessment_id);
      patchAssessmentState({
        public_assessment_id: start.public_assessment_id,
        status: "created",
      });
      return start.public_assessment_id;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[CGI] start error", error);
      }
      trackInternalError("cgi_system_error", "start_failed");
      return "";
    }
  }, [anonymousSessionId, lang, publicAssessmentId, trackInternalError]);

  const handleStartClick = useCallback(() => {
    if (startClickSentRef.current) return;
    startClickSentRef.current = true;
    void (async () => {
      const assessmentId = await ensurePublicAssessment();
      await sendCgiClientEvent({
        eventName: "cgi_start_click",
        anonymousSessionId,
        publicAssessmentId: assessmentId || null,
        metadata: {
          cta_location: "hero",
        },
      });
    })();
  }, [anonymousSessionId, ensurePublicAssessment]);

  const handleLeadFormView = useCallback(() => {
    if (leadFormViewSentRef.current) return;
    leadFormViewSentRef.current = true;
    void (async () => {
      const assessmentId = await ensurePublicAssessment();
      await sendCgiClientEvent({
        eventName: "cgi_lead_form_view",
        anonymousSessionId,
        publicAssessmentId: assessmentId || null,
      });
    })();
  }, [anonymousSessionId, ensurePublicAssessment]);

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
      trackInternalError("cgi_validation_error", `missing_${String(missing)}`);
      toast({
        title: t.invalidRequiredTitle,
        description: t.invalidRequiredBody,
        variant: "destructive",
      });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      trackInternalError("cgi_validation_error", "invalid_email");
      toast({
        title: t.invalidEmailTitle,
        description: t.invalidEmailBody,
        variant: "destructive",
      });
      return false;
    }
    if (!isValidPhone(lead.phone)) {
      trackInternalError("cgi_validation_error", "invalid_phone");
      toast({
        title: t.invalidRequiredTitle,
        description: t.invalidPhoneBody,
        variant: "destructive",
      });
      return false;
    }
    if (isOtherOption(lead.sector) && !lead.sectorOther.trim()) {
      trackInternalError("cgi_validation_error", "missing_sector_other");
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
      trackInternalError("cgi_validation_error", "missing_commercial_relationship_other");
      toast({
        title: t.invalidRequiredTitle,
        description: t.invalidRequiredBody,
        variant: "destructive",
      });
      return false;
    }
    if (!consent.privacy) {
      trackInternalError("cgi_validation_error", "privacy_consent_required");
      toast({
        title: t.invalidRequiredTitle,
        description: t.invalidRequiredBody,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const startAssessment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateLead()) return;

    setIsLeadSubmitting(true);
    const normalizedLead = normalizeLeadForSubmit(lead);
    const payloadLead = toLeadPayload(normalizedLead);
    let assessmentId = publicAssessmentId || "";
    try {
      assessmentId = await ensurePublicAssessment();
      if (assessmentId) {
        const leadEventId = getOrCreateEventId("cgi_lead_submitted");
        const response = await submitCgiLead({
          anonymousSessionId,
          publicAssessmentId: assessmentId,
          lead: payloadLead,
          consent,
          eventId: leadEventId,
        });
        pushCgiDataLayerEvent("cgi_lead_submitted", {
          event_id: response.event_id || leadEventId,
          anonymous_session_id: anonymousSessionId,
          public_assessment_id: assessmentId,
          company_size: normalizedLead.employeeCount,
          industry: normalizedLead.sector,
          investment_intent: normalizedLead.investmentIntent,
        });
        markEventSent("cgi_lead_submitted", response.event_id || leadEventId);
        patchAssessmentState({
          public_assessment_id: assessmentId,
          status: "lead_captured",
          current_question: 0,
        });
      }
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "lead_submit_failed";
      if (errorCode.includes("invalid_email_domain")) {
        trackInternalError("cgi_validation_error", "invalid_email_domain");
        toast({
          title: t.invalidEmailTitle,
          description: t.invalidEmailBody,
          variant: "destructive",
        });
        setIsLeadSubmitting(false);
        return;
      }
      if (import.meta.env.DEV) {
        console.error("[CGI] lead submit error", error);
      }
      trackInternalError("cgi_system_error", "lead_submit_failed");
    } finally {
      setIsLeadSubmitting(false);
    }

    setLead(normalizedLead);
    setStep("assessment");
    scrollToAssessment();
  };

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((current) => {
      const next = { ...current, [questionId]: Number(value) };
      const normalized = normalizeCgiAnswers(next);
      const nextAnsweredCount = Object.keys(normalized).length;
      const nextProgress = Math.round((nextAnsweredCount / CGI_QUESTIONS.length) * 100);
      patchAssessmentState({
        public_assessment_id: publicAssessmentId,
        status: nextAnsweredCount > 0 ? "in_progress" : "lead_captured",
        current_question: nextAnsweredCount,
        answers: normalized,
      });

      if (
        publicAssessmentId &&
        nextAnsweredCount > 0 &&
        !assessmentStartedSentRef.current
      ) {
        assessmentStartedSentRef.current = true;
        void sendCgiClientEvent({
          eventName: "cgi_assessment_started",
          anonymousSessionId,
          publicAssessmentId,
        });
      }

      ([25, 50, 75] as const).forEach((milestone) => {
        if (
          publicAssessmentId &&
          nextProgress >= milestone &&
          !progressSentRef.current.has(milestone)
        ) {
          progressSentRef.current.add(milestone);
          void sendCgiProgressEvent({
            anonymousSessionId,
            publicAssessmentId,
            progressPercent: milestone,
            currentQuestion: nextAnsweredCount,
          });
        }
      });

      return next;
    });
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
    setDimensionIndex((current) => Math.min(current + 1, dimensionOrder.length - 1));
    scrollToAssessment();
  };

  const openReport = () => {
    if (!reportReady || !reportText) return;
    void sendCgiClientEvent({
      eventName: "cgi_report_requested",
      anonymousSessionId,
      publicAssessmentId: publicAssessmentId || null,
      metadata: {
        destination_type: "html_preview",
      },
    });
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
      void sendCgiClientEvent({
        eventName: "cgi_report_requested",
        anonymousSessionId,
        publicAssessmentId: publicAssessmentId || null,
        metadata: {
          destination_type: "pdf_download",
        },
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
    void sendCgiClientEvent({
      eventName: "cgi_report_requested",
      anonymousSessionId,
      publicAssessmentId: publicAssessmentId || null,
      metadata: {
        destination_type: "email_draft",
      },
    });
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
    const assessmentId = publicAssessmentId || (await ensurePublicAssessment());
    const completionEventId = getOrCreateEventId("cgi_assessment_completed");

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
    patchAssessmentState({
      public_assessment_id: assessmentId,
      status: "in_progress",
      current_question: CGI_QUESTIONS.length,
      answers: normalizedAnswers,
    });
    scrollToAssessment();

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
          anonymous_session_id: anonymousSessionId,
          public_assessment_id: assessmentId,
          completion_event_id: completionEventId,
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
      pushCgiDataLayerEvent("cgi_assessment_completed", {
        event_id: data.completion_event_id || completionEventId,
        anonymous_session_id: anonymousSessionId,
        public_assessment_id: assessmentId || null,
        cgi_score: localScore.finalScore,
        cgi_level: localScore.level.id,
        strategy_score:
          localScore.dimensionScores.find((item) => item.dimensionId === "strategy")?.score ?? null,
        market_customer_score:
          localScore.dimensionScores.find((item) => item.dimensionId === "market")?.score ?? null,
        growth_engine_score:
          localScore.dimensionScores.find((item) => item.dimensionId === "growthMachine")?.score ?? null,
        execution_management_score:
          localScore.dimensionScores.find((item) => item.dimensionId === "execution")?.score ?? null,
        leadership_culture_score:
          localScore.dimensionScores.find((item) => item.dimensionId === "leadership")?.score ?? null,
        lowest_dimension: localScore.attentionPoints[0]?.dimensionId || null,
        highest_dimension:
          [...localScore.dimensionScores].sort((a, b) => b.score - a.score)[0]?.dimensionId || null,
        completion_time_seconds: Math.max(
          0,
          Math.round((Date.now() - Number(startedAt)) / 1000)
        ),
      });
      markEventSent("cgi_assessment_completed", data.completion_event_id || completionEventId);
      markProgressSent(100);
      patchAssessmentState({
        public_assessment_id: assessmentId,
        status: "completed",
        current_question: CGI_QUESTIONS.length,
        answers: normalizedAnswers,
      });
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
      trackInternalError("cgi_system_error", "assessment_submit_failed");
    } finally {
      window.setTimeout(() => setIsSubmitting(false), 350);
    }
  };

  const trackCtaClick = () => {
    void sendCgiClientEvent({
      eventName: "cgi_cta_clicked",
      anonymousSessionId,
      publicAssessmentId: publicAssessmentId || null,
      metadata: {
        cta_name: "strategic_conversation",
        cta_location: "result",
        destination_type: "calendar",
      },
    });
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

      <CgiLanding t={t} config={config} onStartClick={handleStartClick} />

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
              isLeadSubmitting={isLeadSubmitting}
              consent={consent}
              startAssessment={startAssessment}
              updateLead={updateLead}
              setLead={setLead}
              setConsent={setConsent}
              setWebsite={setWebsite}
              setDevAnswersJson={setDevAnswersJson}
              generateFromAnswersJson={generateFromAnswersJson}
              regenerateSavedAssessment={regenerateSavedAssessment}
              onLeadFormView={handleLeadFormView}
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
              onCtaClick={trackCtaClick}
            />
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
