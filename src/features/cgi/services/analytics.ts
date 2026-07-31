import { CGI_EVENT_ENDPOINT, CGI_PROGRESS_ENDPOINT } from "../config";
import {
  markEventSent,
  markProgressSent,
  readAssessmentState,
} from "./assessmentStorage";

type DataLayerPayload = Record<string, string | number | boolean | null | undefined>;

export type CgiDataLayerEvent =
  | "cgi_landing_view"
  | "cgi_start_click"
  | "cgi_lead_form_view"
  | "cgi_lead_submitted"
  | "cgi_company_context_submitted"
  | "cgi_phone_submitted"
  | "cgi_assessment_started"
  | "cgi_progress"
  | "cgi_assessment_completed"
  | "cgi_result_viewed"
  | "cgi_report_requested"
  | "cgi_cta_clicked"
  | "cgi_assessment_resumed";

export type CgiInternalEvent = "cgi_validation_error" | "cgi_system_error";

const PII_KEYS = new Set(["name", "email", "phone", "company", "company_website", "comments"]);

function createEventId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safePayload(payload: DataLayerPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => !PII_KEYS.has(key) && value !== undefined)
  );
}

export function pushCgiDataLayerEvent(
  event: CgiDataLayerEvent,
  payload: DataLayerPayload = {}
) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...safePayload(payload),
  });
}

export function getOrCreateEventId(eventKey: string) {
  const state = readAssessmentState();
  return state?.sent_events[eventKey] || createEventId();
}

export async function sendCgiClientEvent({
  eventName,
  anonymousSessionId,
  publicAssessmentId,
  metadata,
  pushToDataLayer = true,
  dataLayerPayload,
  eventKey = eventName,
}: {
  eventName: CgiDataLayerEvent | CgiInternalEvent;
  anonymousSessionId: string;
  publicAssessmentId?: string | null;
  metadata?: DataLayerPayload;
  pushToDataLayer?: boolean;
  dataLayerPayload?: DataLayerPayload;
  eventKey?: string;
}) {
  const eventId = getOrCreateEventId(eventKey);
  const isInternal = eventName === "cgi_validation_error" || eventName === "cgi_system_error";

  if (pushToDataLayer && !isInternal) {
    pushCgiDataLayerEvent(eventName as CgiDataLayerEvent, {
      event_id: eventId,
      anonymous_session_id: anonymousSessionId,
      public_assessment_id: publicAssessmentId || null,
      ...(dataLayerPayload || metadata || {}),
    });
  }

  try {
    await fetch(CGI_EVENT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        anonymous_session_id: anonymousSessionId,
        public_assessment_id: publicAssessmentId || null,
        event_name: eventName,
        source: "client",
        page_path: window.location.pathname,
        metadata: metadata || {},
      }),
    });
    markEventSent(eventKey, eventId);
  } catch {
    // Analytics persistence is best-effort and must never block the CGI flow.
  }

  return eventId;
}

export async function sendCgiProgressEvent({
  anonymousSessionId,
  publicAssessmentId,
  progressPercent,
  currentQuestion,
}: {
  anonymousSessionId: string;
  publicAssessmentId: string;
  progressPercent: 25 | 50 | 75;
  currentQuestion: number;
}) {
  const eventKey = `cgi_progress:${progressPercent}`;
  const eventId = getOrCreateEventId(eventKey);
  pushCgiDataLayerEvent("cgi_progress", {
    event_id: eventId,
    anonymous_session_id: anonymousSessionId,
    public_assessment_id: publicAssessmentId,
    progress_percent: progressPercent,
  });

  try {
    await fetch(CGI_PROGRESS_ENDPOINT, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        anonymous_session_id: anonymousSessionId,
        public_assessment_id: publicAssessmentId,
        progress_percent: progressPercent,
        current_question: currentQuestion,
        status: "in_progress",
      }),
    });
    markEventSent(eventKey, eventId);
    markProgressSent(progressPercent);
  } catch {
    // Best-effort.
  }
  return eventId;
}
