import {
  CGI_ASSESSMENT_STATE_KEY,
  CGI_SESSION_KEY,
} from "../config";
import type { CgiAssessmentState, CgiAttribution } from "../types";
import { captureCurrentAttribution, hasAttributionSignal } from "./attribution";

const ASSESSMENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function createId(prefix: string) {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${value}`;
}

function isExpired(timestamp: string | undefined, ttlMs: number, now = Date.now()) {
  const time = timestamp ? Date.parse(timestamp) : NaN;
  return !Number.isFinite(time) || now - time > ttlMs;
}

function readStoredTouches(now = Date.now()): {
  first_touch: CgiAttribution | null;
  last_touch: CgiAttribution | null;
} {
  if (typeof window === "undefined") return { first_touch: null, last_touch: null };
  try {
    const raw = window.localStorage.getItem(CGI_ASSESSMENT_STATE_KEY);
    if (!raw) return { first_touch: null, last_touch: null };
    const parsed = JSON.parse(raw) as Partial<CgiAssessmentState>;
    return {
      first_touch: isExpired(parsed.first_touch?.touched_at, ATTRIBUTION_TTL_MS, now)
        ? null
        : parsed.first_touch ?? null,
      last_touch: isExpired(parsed.last_touch?.touched_at, ATTRIBUTION_TTL_MS, now)
        ? null
        : parsed.last_touch ?? null,
    };
  } catch {
    return { first_touch: null, last_touch: null };
  }
}

export function getOrCreateAnonymousSessionId() {
  if (typeof window === "undefined") return createId("cgi_session");
  const existing = window.sessionStorage.getItem(CGI_SESSION_KEY);
  if (existing) return existing;
  const next = createId("cgi_session");
  window.sessionStorage.setItem(CGI_SESSION_KEY, next);
  return next;
}

export function readAssessmentState(now = Date.now()): CgiAssessmentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CGI_ASSESSMENT_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CgiAssessmentState>;
    if (!parsed.public_assessment_id || !parsed.last_activity_at) return null;

    const assessmentExpired =
      parsed.status !== "completed" &&
      isExpired(parsed.last_activity_at, ASSESSMENT_TTL_MS, now);
    const firstTouchExpired = isExpired(parsed.first_touch?.touched_at, ATTRIBUTION_TTL_MS, now);
    const lastTouchExpired = isExpired(parsed.last_touch?.touched_at, ATTRIBUTION_TTL_MS, now);

    if (assessmentExpired) {
      const remaining = {
        first_touch: firstTouchExpired ? null : parsed.first_touch ?? null,
        last_touch: lastTouchExpired ? null : parsed.last_touch ?? null,
        last_activity_at: new Date(now).toISOString(),
      };
      window.localStorage.setItem(CGI_ASSESSMENT_STATE_KEY, JSON.stringify(remaining));
      return null;
    }

    return {
      public_assessment_id: parsed.public_assessment_id,
      status: parsed.status || "created",
      current_question: parsed.current_question || 0,
      answers: parsed.answers || {},
      lead: parsed.lead || null,
      first_touch: firstTouchExpired ? null : parsed.first_touch ?? null,
      last_touch: lastTouchExpired ? null : parsed.last_touch ?? null,
      last_activity_at: parsed.last_activity_at,
      sent_events: parsed.sent_events || {},
      sent_progress: parsed.sent_progress || [],
    };
  } catch {
    return null;
  }
}

export function writeAssessmentState(next: CgiAssessmentState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CGI_ASSESSMENT_STATE_KEY, JSON.stringify(next));
}

export function patchAssessmentState(
  patch: Partial<CgiAssessmentState>,
  now = new Date()
): CgiAssessmentState {
  const current = readAssessmentState(now.getTime());
  const storedTouches = current ? null : readStoredTouches(now.getTime());
  const attribution = captureCurrentAttribution(now);
  const firstTouch =
    current?.first_touch ||
    storedTouches?.first_touch ||
    (hasAttributionSignal(attribution) ? attribution : null);
  const lastTouch = hasAttributionSignal(attribution)
    ? attribution
    : current?.last_touch || storedTouches?.last_touch || firstTouch;

  const next: CgiAssessmentState = {
    public_assessment_id: patch.public_assessment_id || current?.public_assessment_id || "",
    status: patch.status || current?.status || "created",
    current_question: patch.current_question ?? current?.current_question ?? 0,
    answers: patch.answers || current?.answers || {},
    lead: patch.lead === undefined ? current?.lead || null : patch.lead,
    first_touch: patch.first_touch === undefined ? firstTouch : patch.first_touch,
    last_touch: patch.last_touch === undefined ? lastTouch : patch.last_touch,
    last_activity_at: now.toISOString(),
    sent_events: patch.sent_events || current?.sent_events || {},
    sent_progress: patch.sent_progress || current?.sent_progress || [],
  };
  writeAssessmentState(next);
  return next;
}

export function markEventSent(eventKey: string, eventId: string) {
  const current = readAssessmentState();
  if (!current) return;
  writeAssessmentState({
    ...current,
    sent_events: {
      ...current.sent_events,
      [eventKey]: eventId,
    },
    last_activity_at: new Date().toISOString(),
  });
}

export function markProgressSent(progressPercent: number) {
  const current = readAssessmentState();
  if (!current || current.sent_progress.includes(progressPercent)) return;
  writeAssessmentState({
    ...current,
    sent_progress: [...current.sent_progress, progressPercent],
    last_activity_at: new Date().toISOString(),
  });
}

export function getAttributionForStart(): CgiAttribution | null {
  return patchAssessmentState({}).last_touch;
}
