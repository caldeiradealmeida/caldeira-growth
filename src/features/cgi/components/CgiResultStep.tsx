import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { getCgiConfig } from "@/data/cgiConfig";
import type { CgiScoreResult } from "@/features/cgi/scoring";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { CgiUiText } from "../config";
import type { parseAiReport } from "../services/report";
import { getScoreTone } from "../utils/form";
import { CgiResultActions } from "./CgiResultActions";

type CgiResultStepProps = {
  t: CgiUiText;
  config: ReturnType<typeof getCgiConfig>;
  result: CgiScoreResult;
  aiReport: ReturnType<typeof parseAiReport>;
  aiStatus: string;
  submitError: string;
  secondarySyncMessage: string;
  reportReady: boolean;
  isSubmitting: boolean;
  isGeneratingPdf: boolean;
  hasSavedAssessment: boolean;
  reportProgress: number;
  openReport: () => void;
  downloadPdf: () => void;
  openEmailDraft: () => void;
  retryReport: () => void;
  regenerateSavedAssessment: () => void;
  onCtaClick: () => void;
};

export function CgiResultStep({
  t,
  config,
  result,
  aiReport,
  aiStatus,
  submitError,
  secondarySyncMessage,
  reportReady,
  isSubmitting,
  isGeneratingPdf,
  hasSavedAssessment,
  reportProgress,
  openReport,
  downloadPdf,
  openEmailDraft,
  retryReport,
  regenerateSavedAssessment,
  onCtaClick,
}: CgiResultStepProps) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Card className="border-primary/20">
          <CardContent className="p-6 md:p-8">
            <Badge className="bg-accent text-accent-foreground hover:bg-accent">
              {t.step3}
            </Badge>
            <p className="mt-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t.finalScore}
            </p>
            <p
              className={`mt-2 text-7xl font-semibold tracking-tight ${getScoreTone(
                result.finalScore
              )}`}
            >
              {result.finalScore}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              {result.level.title}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {result.diagnostic}
            </p>

            <CgiResultActions
              t={t}
              config={config}
              reportReady={reportReady}
              isGeneratingPdf={isGeneratingPdf}
              isSubmitting={isSubmitting}
              submitError={submitError}
              hasSavedAssessment={hasSavedAssessment}
              reportProgress={reportProgress}
              openReport={openReport}
              downloadPdf={downloadPdf}
              openEmailDraft={openEmailDraft}
              retryReport={retryReport}
              regenerateSavedAssessment={regenerateSavedAssessment}
              onCtaClick={onCtaClick}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t.primaryReportFailureTitle}</AlertTitle>
              <AlertDescription>
                {submitError || t.primaryReportFailureBody}
              </AlertDescription>
            </Alert>
          )}

          {secondarySyncMessage && reportReady && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-950">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t.secondarySyncWarningTitle}</AlertTitle>
              <AlertDescription>{secondarySyncMessage}</AlertDescription>
            </Alert>
          )}

          {isSubmitting && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>{t.reportAlertTitle}</AlertTitle>
              <AlertDescription>
                <span className="block">
                  {t.reportAlertBody}
                </span>
                <span className="mt-3 block">
                  {t.reportIpBody}
                </span>
                <span className="mt-3 block">
                  {t.proprietaryBody}
                </span>
                <span className="mt-4 block">
                  <Progress value={reportProgress} />
                </span>
                <span className="mt-2 block text-xs text-muted-foreground">
                  {t.reportStages[
                    Math.min(
                      t.reportStages.length - 1,
                      Math.floor((reportProgress / 100) * t.reportStages.length)
                    )
                  ]}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {!isSubmitting && !submitError && (
            <Alert className="border-primary/20">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>{t.savedTitle}</AlertTitle>
              <AlertDescription>
                {t.savedBody}{" "}
                {aiStatus === "generated"
                  ? t.proprietaryBody
                  : result.diagnostic}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl font-semibold">{t.scoreByDimension}</h3>
              <div className="mt-6 space-y-5">
                {result.dimensionScores.map((item) => (
                  <div key={item.dimensionId}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="font-medium">{item.title}</span>
                      <span
                        className={`font-semibold ${getScoreTone(
                          item.score
                        )}`}
                      >
                        {item.score}
                      </span>
                    </div>
                    <Progress value={item.score} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {t.methodEyebrow}
              </p>
              <h3 className="mt-3 text-xl font-semibold">
                {t.methodReportTitle}
              </h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {t.methodReportBody.slice(0, 3).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold text-primary">
                {t.methodSignature}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl font-semibold">
                {t.attentionTitle}
              </h3>
              <div className="mt-5 grid gap-3">
                {result.attentionPoints.map((item) => (
                  <div
                    key={item.dimensionId}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">{item.title}</p>
                      <Badge variant="outline">{item.score}/100</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t.attentionBody}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {aiReport && (
            <Card className="border-primary/20">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">
                    {aiReport.report_title || t.diagnosis}
                  </h3>
                </div>
                {aiReport.report_subtitle && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {aiReport.report_subtitle}
                  </p>
                )}
                {aiReport.methodology_note && (
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <h4 className="font-semibold">{t.methodologyNoteTitle}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {aiReport.methodology_note}
                    </p>
                  </div>
                )}
                {aiReport.evidence_summary &&
                  (Array.isArray(aiReport.evidence_summary) ? (
                    <div className="mt-6">
                      <h4 className="font-semibold">{t.evidenceSummaryTitle}</h4>
                      <ul className="mt-3 space-y-2">
                        {aiReport.evidence_summary.map((item) => (
                          <li key={item} className="flex gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      {aiReport.evidence_summary}
                    </p>
                  ))}
                {aiReport.executive_summary && (
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {aiReport.executive_summary}
                  </p>
                )}
                {(aiReport.strategic_diagnosis ||
                  aiReport.priority_diagnosis) && (
                  <p className="mt-4 leading-relaxed">
                    {aiReport.strategic_diagnosis ||
                      aiReport.priority_diagnosis}
                  </p>
                )}
                {Array.isArray(aiReport.dimension_reading) &&
                  aiReport.dimension_reading.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold">
                        {t.dimensionReadingTitle}
                      </h4>
                      {aiReport.dimension_reading.map((item) => (
                        <div
                          key={`${item.dimension}-${item.score}`}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-medium">{item.dimension}</p>
                            {item.score !== undefined && (
                              <Badge variant="outline">
                                {item.score}/100
                              </Badge>
                            )}
                          </div>
                          {item.analysis && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {item.analysis}
                            </p>
                          )}
                          {item.implication && (
                            <p className="mt-2 text-sm">
                              {item.implication}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                {[
                  [t.criticalBottlenecksTitle, aiReport.critical_bottlenecks],
                  [t.strategicBetsTitle, aiReport.strategic_bets],
                  [t.renunciationsTitle, aiReport.renunciations],
                  [
                    t.governanceTitle,
                    aiReport.governance_system,
                  ],
                  [t.hypothesesTitle, aiReport.hypotheses_to_validate],
                  [
                    t.finalRecommendationsTitle,
                    aiReport.final_recommendations ||
                      aiReport.recommended_next_steps,
                  ],
                ].map(([title, items]) =>
                  Array.isArray(items) && items.length > 0 ? (
                    <div key={title as string} className="mt-6">
                      <h4 className="font-semibold">{title as string}</h4>
                      <ul className="mt-3 space-y-2">
                        {(items as string[]).map((item) => (
                          <li key={item} className="flex gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
