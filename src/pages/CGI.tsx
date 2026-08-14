import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  CGI_REPORT_POLL_TIMEOUT_MS,
  cgiUi,
  dimensionOrder,
  initialLead,
} from "@/features/cgi/config";
import type { CgiResumeHandoff, LeadForm, Step } from "@/features/cgi/types";
import type { CgiConsentState, CgiReportStatus, CgiSecondarySyncStatus } from "@/features/cgi/types";
import {
  CGI_COMMENTS_MAX_LENGTH,
  decidePhoneStepAction,
  isOtherOption,
  isValidProfessionalField,
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
  getSubmitErrorMessage,
  parseAiReport,
  scrollToAssessment,
  writeReportDocument,
} from "@/features/cgi/services/report";
import { pollCgiReport } from "@/features/cgi/services/reportPolling";
import {
  shouldAutoResumeReportPolling,
  shouldEvaluateAutoResume,
  shouldFinalizePollAttempt,
} from "@/features/cgi/services/reportLifecycle";
import { useCgiReportProgress } from "@/features/cgi/hooks/useCgiReportProgress";
import { CgiAssessmentStep } from "@/features/cgi/components/CgiAssessmentStep";
import { CgiContextStep } from "@/features/cgi/components/CgiContextStep";
import { CgiLanding } from "@/features/cgi/components/CgiLanding";
import { CgiLeadStep } from "@/features/cgi/components/CgiLeadStep";
import { CgiPhoneStep } from "@/features/cgi/components/CgiPhoneStep";
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
import { persistCgiCheckpoint } from "@/features/cgi/services/checkpoint";
import { checkpointsToSend, CGI_CHECKPOINT_QUESTION_COUNTS } from "@/features/cgi/logic/checkpointSchedule";
import { computeResumeHydration } from "@/features/cgi/logic/resumeHydration";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isReportReadyStatus(status: string): status is "report_ready" | "report_ready_with_warnings" {
  return status === "report_ready" || status === "report_ready_with_warnings";
}

function createLocalAttemptId(prefix: string) {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${value}`;
}

export default function CGI() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [secondarySyncMessage, setSecondarySyncMessage] = useState("");
  const [reportStatus, setReportStatus] = useState<CgiReportStatus>("idle");
  const [secondarySyncStatus, setSecondarySyncStatus] =
    useState<CgiSecondarySyncStatus>("idle");
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
  const reportPollAbortRef = useRef<AbortController | null>(null);
  const reportPollAssessmentRef = useRef("");
  const assessmentSubmitStartedRef = useRef(false);
  const autoResumeAttemptedRef = useRef(false);
  const assessmentStartedSentRef = useRef(
    Boolean(readAssessmentState()?.sent_events.cgi_assessment_started)
  );
  const progressSentRef = useRef(new Set(readAssessmentState()?.sent_progress || []));
  // In-memory only, not persisted to assessmentStorage -- a reload may
  // re-send an already-persisted checkpoint, which is harmless (upsertAnswers
  // is idempotent) rather than worth extra state to avoid.
  const checkpointSentRef = useRef(new Set<number>());
  // Guards the cross-device resume handoff (Etapa 3) from being reapplied on
  // a re-render -- router location.state otherwise persists across
  // in-session navigations, and this must run its one-time hydration only
  // once per handoff.
  const resumeHandledRef = useRef(false);

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
  const reportReady =
    isReportReadyStatus(reportStatus) &&
    aiStatus === "generated" &&
    Boolean(aiReport) &&
    Boolean(result) &&
    Boolean(reportText);
  const visibleSecondarySyncMessage =
    secondarySyncStatus === "secondary_sync_failed" ? secondarySyncMessage : "";

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
    const saved = readSavedCgiAssessment();
    setHasSavedAssessment(Boolean(saved));
    if (saved?.reportStatus && isReportReadyStatus(saved.reportStatus) && saved.answers) {
      const normalizedAnswers = normalizeCgiAnswers(saved.answers);
      if (areCgiAnswersComplete(normalizedAnswers)) {
        setLead(saved.lead);
        setAnswers(normalizedAnswers);
        setResult(calculateCgiScore(normalizedAnswers, lang));
        setServerAiReport(saved.aiReport || "");
        setAiStatus(saved.aiStatus || "");
        setReportStatus(saved.reportStatus);
        setStep("result");
      }
    }
  }, [lang]);

  // Cross-device resume (Etapa 3): CgiReportView already resolved the
  // report-access token server-side and handed off the result via router
  // state -- this never reads a token itself, never calls the API. The
  // server is treated as the sole source of truth: local storage is
  // overwritten outright (no merge with whatever, if anything, was already
  // on this browser), matching the same pattern restoreReadyReport already
  // uses for report_ready hydration.
  useEffect(() => {
    const handoff = (location.state as { cgiResumeHandoff?: CgiResumeHandoff } | null)
      ?.cgiResumeHandoff;
    if (!handoff || resumeHandledRef.current) return;
    resumeHandledRef.current = true;

    const hydration = computeResumeHydration(handoff, initialLead, dimensionOrder);

    setPublicAssessmentId(hydration.publicAssessmentId);
    setAnswers(hydration.answers);
    checkpointSentRef.current = new Set(
      CGI_CHECKPOINT_QUESTION_COUNTS.filter((count) => hydration.answeredCount >= count)
    );
    // Already started on the original device -- avoid re-sending the
    // one-time cgi_assessment_started event on this one.
    assessmentStartedSentRef.current = true;

    if (hydration.lead) setLead(hydration.lead);
    setStep(hydration.step);
    if (hydration.dimensionIndex !== null) setDimensionIndex(hydration.dimensionIndex);

    patchAssessmentState({
      public_assessment_id: hydration.publicAssessmentId,
      status: handoff.status,
      current_question: hydration.answeredCount,
      answers: hydration.answers,
      lead: hydration.lead,
      sent_events: {},
      sent_progress: [],
    });

    // Drop the handoff from history so an in-SPA back/forward navigation
    // back to this URL can never reapply it.
    navigate(location.pathname, { replace: true, state: null });

    void sendCgiClientEvent({
      eventName: "cgi_assessment_resumed",
      anonymousSessionId,
      publicAssessmentId: handoff.publicAssessmentId,
      metadata: {
        progress_percent: Math.min(99, Math.round((hydration.answeredCount / CGI_QUESTIONS.length) * 100)),
      },
    });

    scrollToAssessment();
  }, [anonymousSessionId, location, navigate]);

  useEffect(() => {
    if (resumeHandledRef.current) return;
    const savedState = readAssessmentState();
    if (!savedState || savedState.status === "completed") return;
    if (savedState.public_assessment_id) {
      setPublicAssessmentId(savedState.public_assessment_id);
    }
    if (savedState.lead) {
      setLead(savedState.lead);
      if (savedState.status === "lead_captured" && Object.keys(savedState.answers).length === 0) {
        setStep("context");
      }
    }
    if (Object.keys(savedState.answers).length > 0) {
      setAnswers(savedState.answers);
      setDimensionIndex(
        Math.min(
          Math.floor(Object.keys(savedState.answers).length / 8),
          dimensionOrder.length - 1
        )
      );
      setStep("assessment");
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

  const restoreReadyReport = useCallback(
    ({
      data,
      fallbackLead,
      fallbackAnswers,
      fallbackResult,
      assessmentId,
    }: {
      data: Record<string, unknown>;
      fallbackLead: LeadForm;
      fallbackAnswers: Record<string, number>;
      fallbackResult?: CgiScoreResult | null;
      assessmentId: string;
    }) => {
      const dataLead = isRecord(data.lead) ? data.lead : {};
      const nextLead = {
        ...initialLead,
        ...fallbackLead,
        ...dataLead,
      } as LeadForm;
      const dataAnswers = isRecord(data.answers)
        ? normalizeCgiAnswers(data.answers)
        : normalizeCgiAnswers(fallbackAnswers);
      const nextAnswers = Object.keys(dataAnswers).length > 0
        ? dataAnswers
        : normalizeCgiAnswers(fallbackAnswers);
      const dataScore = isRecord(data.score) && "finalScore" in data.score
        ? (data.score as unknown as CgiScoreResult)
        : null;
      const nextResult =
        dataScore ||
        fallbackResult ||
        (areCgiAnswersComplete(nextAnswers)
          ? calculateCgiScore(nextAnswers, lang)
          : null);
      if (!nextResult) return false;

      const nextAiReport = isRecord(data.ai) ? String(data.ai.text || "") : "";
      const nextAiStatus = isRecord(data.ai) ? String(data.ai.status || "") : "";
      setLead(nextLead);
      setAnswers(nextAnswers);
      setResult(nextResult);
      setServerAiReport(nextAiReport);
      setAiStatus(nextAiStatus);
      const restoredReportStatus = isReportReadyStatus(String(data.report_status || ""))
        ? (String(data.report_status) as "report_ready" | "report_ready_with_warnings")
        : "report_ready";
      setReportStatus(restoredReportStatus);
      setReportProgress(100);
      setStep("result");
      setSubmitError("");
      saveCgiAssessment(nextLead, nextAnswers, {
        aiReport: nextAiReport,
        aiStatus: nextAiStatus,
        reportStatus: restoredReportStatus,
      });
      setHasSavedAssessment(true);
      patchAssessmentState({
        public_assessment_id: assessmentId,
        status: "completed",
        current_question: CGI_QUESTIONS.length,
        answers: nextAnswers,
        lead: nextLead,
      });
      if (data.save && isRecord(data.save) && data.save.ok === false) {
        setSecondarySyncStatus("secondary_sync_failed");
        setSecondarySyncMessage(t.secondarySyncWarningBody);
      } else {
        setSecondarySyncStatus("secondary_sync_succeeded");
        setSecondarySyncMessage("");
      }
      scrollToAssessment();
      return true;
    },
    [lang, setReportProgress, t.secondarySyncWarningBody]
  );

  const beginReportPolling = useCallback(
    async ({
      assessmentId,
      fallbackLead,
      fallbackAnswers,
      fallbackResult,
      isResume = false,
    }: {
      assessmentId: string;
      fallbackLead: LeadForm;
      fallbackAnswers: Record<string, number>;
      fallbackResult?: CgiScoreResult | null;
      isResume?: boolean;
    }) => {
      if (!assessmentId) return;
      if (reportPollAssessmentRef.current === assessmentId) return;
      reportPollAbortRef.current?.abort();
      const controller = new AbortController();
      reportPollAbortRef.current = controller;
      reportPollAssessmentRef.current = assessmentId;
      setIsSubmitting(true);
      setReportStatus("report_generating");
      setSecondarySyncStatus("secondary_sync_pending");
      setSubmitError("");
      // Only a genuine resume (page reload/remount while a previous attempt
      // was still generating) shows "Seu índice já foi calculado" - a brand
      // new submission is not "already calculated" and must not show it.
      if (isResume) {
        toast({
          title: t.reportAlertTitle,
          description: t.reportPollingBody,
        });
      }

      const pollResult = await pollCgiReport({
        publicAssessmentId: assessmentId,
        signal: controller.signal,
        // Must comfortably exceed the backend's worst-case processing time
        // (one primary attempt + one transient retry + non-OpenAI overhead,
        // ~170s today) - otherwise the frontend gives up and hides the
        // progress bar while a legitimate, still-running attempt is
        // orphaned server-side.
        timeoutMs: CGI_REPORT_POLL_TIMEOUT_MS,
      });

      if (pollResult.status === "ready") {
        restoreReadyReport({
          data: pollResult.data,
          fallbackLead,
          fallbackAnswers,
          fallbackResult,
          assessmentId,
        });
      } else if (pollResult.status === "failed") {
        setReportStatus("report_failed");
        setSubmitError(t.primaryReportFailureBody);
        assessmentSubmitStartedRef.current = false;
        // Persist the terminal failure immediately so a later reload can
        // never again read a stale "report_generating" snapshot and restart
        // polling (and re-show the resume toast) for an attempt that is
        // already over.
        saveCgiAssessment(fallbackLead, fallbackAnswers, {
          reportStatus: "report_failed",
        });
      } else if (pollResult.status === "timeout") {
        toast({
          title: t.reportAlertTitle,
          description: t.reportStillProcessingBody,
        });
      }

      if (
        shouldFinalizePollAttempt({
          activeAbortController: reportPollAbortRef.current,
          thisAttemptController: controller,
        })
      ) {
        reportPollAbortRef.current = null;
        reportPollAssessmentRef.current = "";
        setIsSubmitting(false);
      }
    },
    [
      restoreReadyReport,
      t.primaryReportFailureBody,
      t.reportAlertTitle,
      t.reportPollingBody,
      t.reportStillProcessingBody,
      toast,
    ]
  );

  useEffect(() => {
    return () => {
      reportPollAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    // Auto-resume must only ever be evaluated once per page mount - it exists
    // to pick a genuinely orphaned report_generating attempt back up after a
    // reload/remount. A brand-new submission moves reportStatus and
    // publicAssessmentId through the exact same values a resumed reload does,
    // so without this guard this effect (which depends on both) would replay
    // on every fresh submission too, racing ahead of that submission's own
    // POST and stealing its step/isSubmitting transitions before the backend
    // even knows the assessment exists.
    if (!shouldEvaluateAutoResume({ alreadyAttempted: autoResumeAttemptedRef.current })) {
      return;
    }
    autoResumeAttemptedRef.current = true;

    const savedState = readAssessmentState();
    const saved = readSavedCgiAssessment();
    const assessmentId = savedState?.public_assessment_id || publicAssessmentId;
    const shouldResume = shouldAutoResumeReportPolling({
      assessmentId,
      isCurrentReportReady: isReportReadyStatus(reportStatus),
      savedReportStatus: saved?.reportStatus,
      hasSavedAnswers: Boolean(saved?.answers),
    });
    if (!shouldResume || !saved) return;
    const normalizedAnswers = normalizeCgiAnswers(saved.answers);
    if (!areCgiAnswersComplete(normalizedAnswers)) return;
    const localScore = calculateCgiScore(normalizedAnswers, lang);
    setLead(saved.lead);
    setAnswers(normalizedAnswers);
    setResult(localScore);
    setStep("result");
    void beginReportPolling({
      assessmentId,
      fallbackLead: saved.lead,
      fallbackAnswers: normalizedAnswers,
      fallbackResult: localScore,
      isResume: true,
    });
  }, [beginReportPolling, lang, publicAssessmentId, reportStatus]);

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

  const validateRequiredFields = (required: Array<keyof LeadForm>): boolean => {
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
    return true;
  };

  const validateProfessionalFields = (fields: Array<keyof LeadForm>): boolean => {
    const invalid = fields.find((key) => {
      const maxLength = key === "comments" ? CGI_COMMENTS_MAX_LENGTH : undefined;
      return !isValidProfessionalField(lead[key], { maxLength });
    });
    if (!invalid) return true;
    trackInternalError("cgi_validation_error", `invalid_professional_${String(invalid)}`);
    toast({
      title: t.invalidRequiredTitle,
      description: t.invalidProfessionalFieldBody,
      variant: "destructive",
    });
    return false;
  };

  const validateIdentification = (): boolean => {
    if (!validateRequiredFields(["name", "email", "company", "role"])) {
      return false;
    }
    if (!validateProfessionalFields(["name", "company", "role"])) {
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

  const validateCompanyContext = (): boolean => {
    if (
      !validateRequiredFields([
        "sector",
        "commercialRelationshipModel",
        "employeeCount",
        "annualRevenue",
        "currentChallenge",
        "growthGoal",
        "investmentIntent",
      ])
    ) {
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
    if (
      !validateProfessionalFields([
        "sectorOther",
        "commercialRelationshipOther",
        "currentChallenge",
        "growthGoal",
        "comments",
      ])
    ) {
      return false;
    }
    return true;
  };

  const validateAssessmentContext = (): boolean => {
    return validateProfessionalFields(["comments"]);
  };

  const persistLead = async ({
    normalizedLead,
    eventName,
    commercialInterest = false,
  }: {
    normalizedLead: LeadForm;
    eventName: "cgi_lead_submitted" | "cgi_company_context_submitted" | "cgi_phone_submitted";
    commercialInterest?: boolean;
  }) => {
    const payloadLead = toLeadPayload(normalizedLead);
    const assessmentId = await ensurePublicAssessment();
    if (!assessmentId) return "";

    const eventId = getOrCreateEventId(eventName);
    const response = await submitCgiLead({
      anonymousSessionId,
      publicAssessmentId: assessmentId,
      lead: payloadLead,
      consent,
      eventId,
      eventName,
      commercialInterest,
    });

    if (eventName === "cgi_phone_submitted") {
      pushCgiDataLayerEvent(eventName, {
        event_id: response.event_id || eventId,
        anonymous_session_id: anonymousSessionId,
        public_assessment_id: assessmentId,
        commercial_interest: true,
      });
    } else {
      pushCgiDataLayerEvent(eventName, {
        event_id: response.event_id || eventId,
        anonymous_session_id: anonymousSessionId,
        public_assessment_id: assessmentId,
        company_size: normalizedLead.employeeCount || null,
        industry: normalizedLead.sector || null,
        investment_intent: normalizedLead.investmentIntent || null,
      });
    }

    markEventSent(eventName, response.event_id || eventId);
    patchAssessmentState({
      public_assessment_id: assessmentId,
      status: "lead_captured",
      current_question: 0,
      lead: normalizedLead,
    });
    return assessmentId;
  };

  const submitIdentification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateIdentification()) return;

    setIsLeadSubmitting(true);
    const normalizedLead = normalizeLeadForSubmit(lead);
    try {
      await persistLead({ normalizedLead, eventName: "cgi_lead_submitted" });
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
      if (errorCode.includes("invalid_professional_content")) {
        trackInternalError("cgi_validation_error", "invalid_professional_content");
        toast({
          title: t.invalidRequiredTitle,
          description: t.invalidProfessionalFieldBody,
          variant: "destructive",
        });
        setIsLeadSubmitting(false);
        return;
      }
      if (import.meta.env.DEV) {
        console.error("[CGI] lead submit error", error);
      }
      trackInternalError("cgi_system_error", "lead_submit_failed");
      toast({
        title: t.saveFailureTitle,
        description: t.saveFailureBody,
        variant: "destructive",
      });
      setIsLeadSubmitting(false);
      return;
    } finally {
      setIsLeadSubmitting(false);
    }

    setLead(normalizedLead);
    setStep("context");
    scrollToAssessment();
  };

  const submitCompanyContext = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCompanyContext()) return;

    setIsLeadSubmitting(true);
    const normalizedLead = normalizeLeadForSubmit(lead);
    try {
      await persistLead({
        normalizedLead,
        eventName: "cgi_company_context_submitted",
      });
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "context_submit_failed";
      if (errorCode.includes("invalid_professional_content")) {
        trackInternalError("cgi_validation_error", "invalid_professional_content");
        toast({
          title: t.invalidRequiredTitle,
          description: t.invalidProfessionalFieldBody,
          variant: "destructive",
        });
        setIsLeadSubmitting(false);
        return;
      }
      if (import.meta.env.DEV) {
        console.error("[CGI] context submit error", error);
      }
      trackInternalError("cgi_system_error", "context_submit_failed");
      toast({
        title: t.saveFailureTitle,
        description: t.saveFailureBody,
        variant: "destructive",
      });
      setIsLeadSubmitting(false);
      return;
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

      // Dimension-boundary checkpoint (Etapa 2): distinct from the 25/50/75%
      // progress milestones above -- fires at the end of each of the 5
      // dimensions (8/16/24/32/40 answered) and persists the full cumulative
      // answer set so far to the server, not just analytics metadata.
      const crossedCheckpoints = checkpointsToSend(nextAnsweredCount, checkpointSentRef.current);
      if (publicAssessmentId && crossedCheckpoints.length > 0) {
        crossedCheckpoints.forEach((count) => checkpointSentRef.current.add(count));
        void persistCgiCheckpoint({
          anonymousSessionId,
          publicAssessmentId,
          answers: normalized,
        });
      }

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
    writeReportDocument(reportWindow, buildReportHtml(aiReport, lead, result, t, lang));
    reportWindow.focus();
  };

  const downloadPdf = async () => {
    if (!reportReady || !reportText) return;
    setIsGeneratingPdf(true);
    try {
      await downloadReportPdf({
        aiReport,
        lead,
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

  const submitAssessmentWithData = async (
    assessmentLead: LeadForm,
    assessmentAnswers: Record<string, number>,
    options?: { isRegeneration?: boolean; forceNewAttempt?: boolean }
  ) => {
    if (!options?.isRegeneration && assessmentSubmitStartedRef.current && isSubmitting) {
      setStep(result ? "phone" : "assessment");
      scrollToAssessment();
      return;
    }
    if (!options?.isRegeneration && isReportReadyStatus(reportStatus)) {
      setStep("result");
      scrollToAssessment();
      return;
    }
    if (!options?.isRegeneration && !validateAssessmentContext()) return;
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
    const assessmentId = options?.forceNewAttempt
      ? createLocalAttemptId("cgi")
      : publicAssessmentId || (await ensurePublicAssessment());
    const completionEventId = options?.forceNewAttempt
      ? createLocalAttemptId("completion")
      : getOrCreateEventId("cgi_assessment_completed");
    if (!options?.isRegeneration) assessmentSubmitStartedRef.current = true;
    if (options?.forceNewAttempt) setPublicAssessmentId(assessmentId);

    setLead(normalizedLead);
    setAnswers(normalizedAnswers);
    setResult(localScore);
    setStep(options?.isRegeneration ? "result" : "phone");
    setIsSubmitting(true);
    setReportStatus("report_generating");
    setSecondarySyncStatus("secondary_sync_pending");
    setReportProgress(8);
    setSubmitError("");
    setSecondarySyncMessage("");
    setServerAiReport("");
    setAiStatus("");
    saveCgiAssessment(normalizedLead, normalizedAnswers, {
      reportStatus: "report_generating",
    });
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
          attribution: getAttributionForStart(),
        }),
      });
      const data = await response.json();

      if (response.status === 202 && data.report_status === "report_generating") {
        setReportStatus("report_generating");
        setSecondarySyncStatus("secondary_sync_pending");
        setReportProgress((current) => Math.max(current, 55));
        void beginReportPolling({
          assessmentId,
          fallbackLead: normalizedLead,
          fallbackAnswers: normalizedAnswers,
          fallbackResult: localScore,
        });
        return;
      }

      if (!response.ok || data.ok !== true) {
        throw new Error(getSubmitErrorMessage(data, t));
      }

      // Keep the client-side score because it carries localized dimension and level labels.
      setResult(localScore);
      const nextAiReport = data.ai?.text ?? "";
      const nextAiStatus = data.ai?.status ?? "";
      setServerAiReport(nextAiReport);
      setAiStatus(nextAiStatus);
      const nextReportStatus = isReportReadyStatus(String(data.report_status || ""))
        ? (String(data.report_status) as "report_ready" | "report_ready_with_warnings")
        : "report_ready";
      setReportStatus(nextReportStatus);
      setReportProgress(100);
      saveCgiAssessment(normalizedLead, normalizedAnswers, {
        aiReport: nextAiReport,
        aiStatus: nextAiStatus,
        reportStatus: nextReportStatus,
      });
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
        setSecondarySyncStatus("secondary_sync_failed");
        setSecondarySyncMessage(t.secondarySyncWarningBody);
      } else {
        setSecondarySyncStatus("secondary_sync_succeeded");
      }
    } catch (error) {
      setReportStatus("report_failed");
      assessmentSubmitStartedRef.current = false;
      setSubmitError(
        error instanceof Error
          ? error.message
          : t.primaryReportFailureBody
      );
      if (import.meta.env.DEV) {
        console.error("[CGI] submit error", error);
      }
      trackInternalError("cgi_system_error", "assessment_submit_failed");
    } finally {
      window.setTimeout(() => {
        if (!reportPollAssessmentRef.current) setIsSubmitting(false);
      }, 350);
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

  // The phone step's single remaining action: save the phone/WhatsApp if the
  // respondent filled it in (still validating its format the same way the
  // old dedicated "quero conversar" CTA did), then always advance to the
  // result - whether or not a phone was provided. Never touches report
  // generation/polling; ensurePublicAssessment (inside persistLead) only
  // reuses/creates the anonymous lead-tracking id, the same one every
  // earlier step already relies on.
  const viewResult = async () => {
    const decision = decidePhoneStepAction(lead.phone);
    if (decision.kind === "block_invalid_phone") {
      trackInternalError("cgi_validation_error", "invalid_phone");
      toast({
        title: t.invalidRequiredTitle,
        description: t.invalidPhoneBody,
        variant: "destructive",
      });
      return;
    }
    if (decision.kind === "save_and_advance") {
      setIsLeadSubmitting(true);
      const normalizedLead = normalizeLeadForSubmit(lead);
      try {
        await persistLead({
          normalizedLead,
          eventName: "cgi_phone_submitted",
          commercialInterest: true,
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[CGI] phone submit error", error);
        }
        trackInternalError("cgi_system_error", "phone_submit_failed");
      } finally {
        setIsLeadSubmitting(false);
        setLead(normalizedLead);
      }
    }
    setStep("result");
    scrollToAssessment();
  };

  const submitAssessment = () => {
    void submitAssessmentWithData(lead, answers);
  };

  const retryReport = () => {
    void submitAssessmentWithData(lead, answers, {
      isRegeneration: true,
      forceNewAttempt: true,
    });
  };

  const regenerateSavedAssessment = () => {
    const saved = readSavedCgiAssessment();
    if (!saved) {
      toast({
        title: "Nenhum diagnóstico salvo",
        description:
          "Gere um CGI uma vez nesta máquina para habilitar a regeneração local.",
        variant: "destructive",
      });
      return;
    }

    void submitAssessmentWithData(saved.lead, saved.answers, {
      isRegeneration: true,
      forceNewAttempt: true,
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
      forceNewAttempt: true,
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <Header />
      <SEO routeKey="cgi" title={t.metaTitle} description={t.metaDescription} noIndex />

      <CgiLanding t={t} config={config} onStartClick={handleStartClick} />

      <section
        id="cgi-assessment"
        className="pt-8 pb-20 scroll-mt-20 md:pt-16 md:pb-28 md:scroll-mt-24 lg:pt-20 lg:pb-32"
      >
        <div className={sectionLayout.container}>
          {step === "lead" && (
            <CgiLeadStep
              t={t}
              lead={lead}
              website={website}
              devAnswersJson={devAnswersJson}
              isSubmitting={isSubmitting}
              hasSavedAssessment={hasSavedAssessment}
              isLeadSubmitting={isLeadSubmitting}
              consent={consent}
              submitIdentification={submitIdentification}
              updateLead={updateLead}
              setConsent={setConsent}
              setWebsite={setWebsite}
              setDevAnswersJson={setDevAnswersJson}
              generateFromAnswersJson={generateFromAnswersJson}
              regenerateSavedAssessment={regenerateSavedAssessment}
              onLeadFormView={handleLeadFormView}
            />
          )}

          {step === "context" && (
            <CgiContextStep
              t={t}
              config={config}
              lead={lead}
              isLeadSubmitting={isLeadSubmitting}
              submitCompanyContext={submitCompanyContext}
              updateLead={updateLead}
              setLead={setLead}
              onBack={() => {
                setStep("lead");
                scrollToAssessment();
              }}
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

          {step === "phone" && result && (
            <CgiPhoneStep
              t={t}
              lead={lead}
              isSubmitting={isSubmitting}
              isLeadSubmitting={isLeadSubmitting}
              updateLead={updateLead}
              viewResult={viewResult}
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
              secondarySyncMessage={visibleSecondarySyncMessage}
              reportReady={reportReady}
              isSubmitting={isSubmitting}
              isGeneratingPdf={isGeneratingPdf}
              hasSavedAssessment={hasSavedAssessment}
              reportProgress={reportProgress}
              openReport={openReport}
              downloadPdf={downloadPdf}
              retryReport={retryReport}
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
