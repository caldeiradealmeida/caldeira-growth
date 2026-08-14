import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/brand/Black logo - no background.svg";
import { cgiUi } from "@/features/cgi/config";
import { extractReportAccessToken } from "@/features/cgi/logic/reportAccessFragment";
import { parseReportAccessResponse, type ReportViewState } from "@/features/cgi/logic/reportAccessState";
import {
  buildReportHtml,
  downloadReportPdf,
  writeReportDocument,
} from "@/features/cgi/services/report";

// This page never calls POST /api/cgi-assessment, never triggers AI
// generation, and never writes to cgi_reports/cgi_assessments -- it only
// resolves a bearer token (POST /api/cgi-report-access) and renders the
// already-persisted report through the exact same functions the original
// result screen uses (buildReportHtml / downloadReportPdf), so what opens
// here is visually identical to what the respondent saw originally.

declare global {
  interface Window {
    __cgiReportAccessToken?: string;
  }
}

/** Reads the bearer token exactly once. Prefers the value already extracted
 * and stripped from the URL by the early inline script in index.html;
 * falls back to stripping the fragment itself if that script didn't run for
 * some reason. Either way, the token never touches localStorage/
 * sessionStorage and the in-memory bootstrap value is deleted immediately
 * after being read. */
function takeReportAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  if (typeof window.__cgiReportAccessToken === "string") {
    const token = window.__cgiReportAccessToken;
    delete window.__cgiReportAccessToken;
    return token;
  }

  const fromHash = extractReportAccessToken(window.location.hash);
  if (fromHash) {
    window.history.replaceState(null, "", window.location.pathname);
  }
  return fromHash;
}

export default function CgiReportView() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ReportViewState | { kind: "loading" }>({
    kind: "loading",
  });
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    const token = takeReportAccessToken();
    if (!token) {
      setViewState({ kind: "link_unavailable" });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/cgi-report-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ t: token }),
        });
        const json = await response.json().catch(() => null);
        if (cancelled) return;
        const parsed = parseReportAccessResponse(json);
        // Cross-device resume (Etapa 3): the token identified an incomplete
        // assessment, not a finished report. Hand the already-resolved data
        // off to /cgi via router state -- in-memory only, never written to
        // any Storage API -- and let CGI.tsx (the actual form/state machine)
        // take over. This page never renders the assessment UI itself.
        if (parsed.kind === "resume") {
          navigate("/cgi", { replace: true, state: { cgiResumeHandoff: parsed.handoff } });
          return;
        }
        setViewState(parsed);
      } catch {
        if (!cancelled) setViewState({ kind: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <img src={logo} alt="Caldeira Growth" className="mb-8 h-9 w-auto" />
        {viewState.kind === "loading" && <LoadingState />}
        {viewState.kind === "link_unavailable" && (
          <MessageState title="Este link não está mais disponível." />
        )}
        {viewState.kind === "report_unavailable" && (
          <MessageState title="Seu relatório ainda está sendo processado. Tente novamente em alguns instantes." />
        )}
        {viewState.kind === "report_generating" && (
          <MessageState title="Seu relatório está sendo gerado. Tente novamente em alguns instantes." />
        )}
        {viewState.kind === "report_failed" && (
          <MessageState title="Não foi possível concluir a geração do relatório. Tente novamente mais tarde." />
        )}
        {viewState.kind === "error" && (
          <MessageState title="Não foi possível carregar o relatório agora. Tente novamente em alguns instantes." />
        )}
        {viewState.kind === "ready" && (
          <ReadyReport
            state={viewState}
            isDownloadingPdf={isDownloadingPdf}
            pdfError={pdfError}
            onOpenReport={() => {
              const reportWindow = window.open("", "_blank");
              if (!reportWindow) return;
              writeReportDocument(
                reportWindow,
                buildReportHtml(
                  viewState.reportJson,
                  viewState.lead,
                  viewState.score,
                  cgiUi[viewState.language],
                  viewState.language
                )
              );
              reportWindow.focus();
            }}
            onDownloadPdf={async () => {
              setIsDownloadingPdf(true);
              setPdfError(false);
              try {
                await downloadReportPdf({
                  aiReport: viewState.reportJson,
                  lead: viewState.lead,
                  result: viewState.score,
                  t: cgiUi[viewState.language],
                  lang: viewState.language,
                });
              } catch {
                setPdfError(true);
              } finally {
                setIsDownloadingPdf(false);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-40 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

function MessageState({ title }: { title: string }) {
  return (
    <div className="rounded-lg border p-8 text-center">
      <p className="text-base text-foreground">{title}</p>
    </div>
  );
}

function ReadyReport({
  state,
  isDownloadingPdf,
  pdfError,
  onOpenReport,
  onDownloadPdf,
}: {
  state: Extract<ReportViewState, { kind: "ready" }>;
  isDownloadingPdf: boolean;
  pdfError: boolean;
  onOpenReport: () => void;
  onDownloadPdf: () => void;
}) {
  const { score } = state;
  const t = cgiUi[state.language];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seu diagnóstico CGI</h1>
        <p className="mt-1 text-sm text-muted-foreground">Caldeira Growth Index</p>
      </div>

      <div className="rounded-lg border p-6">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-semibold tabular-nums">{score.finalScore}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        {score.level?.title && <p className="mt-1 font-medium">{score.level.title}</p>}
        {score.level?.summary && (
          <p className="mt-2 text-sm text-muted-foreground">{score.level.summary}</p>
        )}
      </div>

      {Array.isArray(score.dimensionScores) && score.dimensionScores.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {score.dimensionScores.map((dimension) => (
            <div key={dimension.dimensionId} className="rounded-md border p-3 text-center">
              <p className="text-xs text-muted-foreground">{dimension.title}</p>
              <p className="text-lg font-semibold">{dimension.score}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onOpenReport}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Abrir relatório completo
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {isDownloadingPdf ? t.generatingPdf : t.downloadPdf}
        </button>
      </div>
      {pdfError && <p className="text-sm text-destructive">{t.pdfError}</p>}
    </div>
  );
}
