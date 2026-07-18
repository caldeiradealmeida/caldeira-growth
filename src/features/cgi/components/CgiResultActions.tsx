import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { getCgiConfig } from "@/data/cgiConfig";
import {
  CalendarDays,
  FileText,
  Loader2,
  Mail,
  Printer,
  Sparkles,
} from "lucide-react";
import type { CgiUiText } from "../config";

type CgiResultActionsProps = {
  t: CgiUiText;
  config: ReturnType<typeof getCgiConfig>;
  reportReady: boolean;
  isGeneratingPdf: boolean;
  isSubmitting: boolean;
  hasSavedAssessment: boolean;
  reportProgress: number;
  openReport: () => void;
  downloadPdf: () => void;
  openEmailDraft: () => void;
  regenerateSavedAssessment: () => void;
  onCtaClick: () => void;
};

export function CgiResultActions({
  t,
  config,
  reportReady,
  isGeneratingPdf,
  isSubmitting,
  hasSavedAssessment,
  reportProgress,
  openReport,
  downloadPdf,
  openEmailDraft,
  regenerateSavedAssessment,
  onCtaClick,
}: CgiResultActionsProps) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <Button size="lg" asChild>
        <a href={config.primaryCta.href} onClick={onCtaClick}>
          <CalendarDays className="mr-2 h-4 w-4" />
          {config.primaryCta.label}
        </a>
      </Button>
      <Button
        size="lg"
        variant="outline"
        onClick={openReport}
        disabled={!reportReady}
      >
        <Printer className="mr-2 h-4 w-4" />
        {t.printVersion}
      </Button>
      <Button
        size="lg"
        variant="outline"
        onClick={downloadPdf}
        disabled={!reportReady || isGeneratingPdf}
      >
        {isGeneratingPdf ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        {isGeneratingPdf ? t.generatingPdf : t.downloadPdf}
      </Button>
      <Button
        size="lg"
        variant="outline"
        onClick={openEmailDraft}
        disabled={!reportReady}
      >
        <Mail className="mr-2 h-4 w-4" />
        {t.emailReport}
      </Button>
      {import.meta.env.DEV && hasSavedAssessment && (
        <Button
          size="lg"
          variant="outline"
          onClick={regenerateSavedAssessment}
          disabled={isSubmitting}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Regerar último relatório salvo
        </Button>
      )}
      {!reportReady && (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            {t.reportPending}
          </p>
          {isSubmitting && (
            <>
              <Progress value={reportProgress} />
              <p className="text-xs">
                {t.reportStages[
                  Math.min(
                    t.reportStages.length - 1,
                    Math.floor((reportProgress / 100) * t.reportStages.length)
                  )
                ]}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
