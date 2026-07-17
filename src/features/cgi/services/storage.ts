import { CGI_LAST_ASSESSMENT_KEY } from "../config";
import type { LeadForm, SavedCgiAssessment } from "../types";

export function readSavedCgiAssessment(): SavedCgiAssessment | null {
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

export function saveCgiAssessment(lead: LeadForm, answers: Record<string, number>) {
  if (typeof window === "undefined") return;

  const payload: SavedCgiAssessment = {
    lead,
    answers,
    savedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(CGI_LAST_ASSESSMENT_KEY, JSON.stringify(payload));
}
