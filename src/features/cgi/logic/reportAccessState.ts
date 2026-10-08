import type { CgiScoreResult } from "@/lib/cgiScore";
import type { Language } from "@/lib/routing";
import type { CgiResumeHandoff, LeadForm } from "../types";
import type { parseAiReport } from "../services/report";

export type ReportViewState =
  | { kind: "link_unavailable" }
  | { kind: "report_unavailable" }
  | { kind: "report_generating" }
  | { kind: "report_failed" }
  | { kind: "error" }
  | { kind: "resume"; handoff: CgiResumeHandoff }
  | {
      kind: "ready";
      score: CgiScoreResult;
      language: Language;
      lead: LeadForm;
      reportJson: ReturnType<typeof parseAiReport>;
    };

const VALID_LANGUAGES: Language[] = ["pt", "en", "es"];
const RESUMABLE_STATUSES: CgiResumeHandoff["status"][] = [
  "created",
  "lead_captured",
  "started",
  "in_progress",
  "abandoned",
];

function parseResumeState(json: Record<string, unknown>): ReportViewState {
  const data = json.data;
  if (!data || typeof data !== "object") return { kind: "error" };
  const record = data as Record<string, unknown>;

  const publicAssessmentId = record.publicAssessmentId;
  const status = record.status;
  const answers = record.answers;
  if (typeof publicAssessmentId !== "string" || !publicAssessmentId) return { kind: "error" };
  if (
    typeof status !== "string" ||
    !(RESUMABLE_STATUSES as string[]).includes(status)
  ) {
    return { kind: "error" };
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return { kind: "error" };

  const lead = record.lead;
  return {
    kind: "resume",
    handoff: {
      publicAssessmentId,
      status: status as CgiResumeHandoff["status"],
      answers: answers as Record<string, number>,
      lead: lead && typeof lead === "object" ? (lead as CgiResumeHandoff["lead"]) : null,
    },
  };
}

/** Defensive parsing of the /api/cgi-report-access JSON response -- any
 * shape that isn't recognizably one of the known states degrades to a
 * generic error state rather than risking a render crash on malformed/
 * unexpected data. */
export function parseReportAccessResponse(json: unknown): ReportViewState {
  if (!json || typeof json !== "object") return { kind: "error" };
  const state = (json as Record<string, unknown>).state;

  if (state === "link_unavailable") return { kind: "link_unavailable" };
  if (state === "report_unavailable") return { kind: "report_unavailable" };
  if (state === "report_generating") return { kind: "report_generating" };
  if (state === "report_failed") return { kind: "report_failed" };
  if (state === "resume") return parseResumeState(json as Record<string, unknown>);
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
