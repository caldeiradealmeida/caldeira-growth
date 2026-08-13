import type { CgiScoreResult } from "@/lib/cgiScore";
import type { Language } from "@/lib/routing";
import type { LeadForm } from "../types";
import type { parseAiReport } from "../services/report";

export type ReportViewState =
  | { kind: "link_unavailable" }
  | { kind: "report_unavailable" }
  | { kind: "error" }
  | {
      kind: "ready";
      score: CgiScoreResult;
      language: Language;
      lead: LeadForm;
      reportJson: ReturnType<typeof parseAiReport>;
    };

const VALID_LANGUAGES: Language[] = ["pt", "en", "es"];

/** Defensive parsing of the /api/cgi-report-access JSON response -- any
 * shape that isn't recognizably "ready" degrades to a generic error state
 * rather than risking a render crash on malformed/unexpected data. */
export function parseReportAccessResponse(json: unknown): ReportViewState {
  if (!json || typeof json !== "object") return { kind: "error" };
  const state = (json as Record<string, unknown>).state;

  if (state === "link_unavailable") return { kind: "link_unavailable" };
  if (state === "report_unavailable") return { kind: "report_unavailable" };
  if (state !== "ready") return { kind: "error" };

  const data = (json as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return { kind: "error" };

  const score = (data as Record<string, unknown>).score;
  if (!score || typeof score !== "object") return { kind: "error" };
  if (typeof (score as Record<string, unknown>).finalScore !== "number") return { kind: "error" };
  if (!Array.isArray((score as Record<string, unknown>).dimensionScores)) return { kind: "error" };

  const lead = (data as Record<string, unknown>).lead;
  if (!lead || typeof lead !== "object") return { kind: "error" };

  const reportJson = (data as Record<string, unknown>).reportJson;
  if (!reportJson || typeof reportJson !== "object") return { kind: "error" };

  const rawLanguage = String((data as Record<string, unknown>).language || "pt");
  const language = (VALID_LANGUAGES as string[]).includes(rawLanguage)
    ? (rawLanguage as Language)
    : "pt";

  return {
    kind: "ready",
    score: score as unknown as CgiScoreResult,
    language,
    lead: lead as unknown as LeadForm,
    reportJson: reportJson as ReturnType<typeof parseAiReport>,
  };
}
