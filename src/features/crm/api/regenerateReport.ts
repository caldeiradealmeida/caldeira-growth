import { crmSupabase } from "../lib/supabaseClient";
import type { CgiReport } from "../types";
import { regenerateReportErrorMessage } from "../logic/regenerateReportError";

export type RegenerateReportResult = Pick<
  CgiReport,
  "id" | "version" | "ai_report_text" | "report_json" | "model" | "language"
> & { generation_completed_at: string };

export async function regenerateCgiReport(assessmentId: string): Promise<RegenerateReportResult> {
  const { data } = await crmSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");

  const res = await fetch("/api/crm/regenerate-cgi-report", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ assessment_id: assessmentId }),
  });
  const responseBody = await res.json().catch(() => null);
  if (!res.ok || !responseBody?.ok) {
    throw new Error(regenerateReportErrorMessage(responseBody?.error));
  }
  return responseBody.report as RegenerateReportResult;
}
