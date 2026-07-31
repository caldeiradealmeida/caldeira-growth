import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CGI_QUESTIONS, type getCgiConfig } from "@/data/cgiConfig";
import { ArrowLeft, ArrowRight, Target } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { CgiUiText } from "../config";
import type { LeadForm, Step } from "../types";
import { CGI_COMMENTS_MAX_LENGTH } from "../utils/form";
import { CgiProgress } from "./CgiProgress";
import { CgiQuestion } from "./CgiQuestion";

type CgiAssessmentStepProps = {
  t: CgiUiText;
  config: ReturnType<typeof getCgiConfig>;
  currentDimension: ReturnType<typeof getCgiConfig>["dimensions"][number];
  currentQuestions: typeof CGI_QUESTIONS;
  dimensionIndex: number;
  answeredCount: number;
  progress: number;
  answers: Record<string, number>;
  lead: LeadForm;
  setStep: Dispatch<SetStateAction<Step>>;
  setDimensionIndex: Dispatch<SetStateAction<number>>;
  updateLead: (key: keyof LeadForm, value: string) => void;
  setAnswer: (questionId: string, value: string) => void;
  goToNextDimension: () => void;
  submitAssessment: () => void;
};

export function CgiAssessmentStep({
  t,
  config,
  currentDimension,
  currentQuestions,
  dimensionIndex,
  answeredCount,
  progress,
  answers,
  lead,
  setStep,
  setDimensionIndex,
  updateLead,
  setAnswer,
  goToNextDimension,
  submitAssessment,
}: CgiAssessmentStepProps) {
  const remainingCount = Math.max(0, CGI_QUESTIONS.length - answeredCount);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="outline">{t.step3}</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              {t.assessmentTitle}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t.assessmentSubtitle}
            </p>
          </div>
          <CgiProgress
            answeredCount={answeredCount}
            totalQuestions={CGI_QUESTIONS.length}
            progress={progress}
            answeredLabel={t.answered}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{t.progressLabel}</p>
            <p className="mt-1 text-lg font-semibold">{progress}%</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{t.currentStepLabel}</p>
            <p className="mt-1 text-lg font-semibold">
              {t.currentStep(dimensionIndex + 1, config.dimensions.length)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{t.answeredLabel}</p>
            <p className="mt-1 text-lg font-semibold">
              {t.answered(answeredCount, CGI_QUESTIONS.length)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{t.estimatedTime}</p>
            <p className="mt-1 text-lg font-semibold">
              {t.remaining(remainingCount)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold tracking-tight">
            {currentDimension.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentDimension.diagnostic}
          </p>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-5">
          {config.dimensions.map((dimension, index) => (
            <button
              key={dimension.id}
              type="button"
              onClick={() => setDimensionIndex(index)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                index === dimensionIndex
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              {dimension.shortTitle}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-8">
            {currentQuestions.map((question, index) => (
              <CgiQuestion
                key={question.id}
                question={question}
                index={index}
                dimensionIndex={dimensionIndex}
                scale={config.scale}
                answer={answers[question.id]}
                setAnswer={setAnswer}
              />
            ))}
          </div>

          {dimensionIndex === config.dimensions.length - 1 && (
            <div className="mt-8 rounded-lg border border-border bg-muted/25 p-5">
              <div className="space-y-2">
                <Label htmlFor="comments">{t.labels.comments}</Label>
                <Textarea
                  id="comments"
                  value={lead.comments}
                  onChange={(event) =>
                    updateLead(
                      "comments",
                      event.target.value.slice(0, CGI_COMMENTS_MAX_LENGTH)
                    )
                  }
                  placeholder={t.commentsPlaceholder}
                  maxLength={CGI_COMMENTS_MAX_LENGTH}
                  rows={4}
                  className="resize-y bg-background"
                />
                <div className="flex flex-col gap-1 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>{t.commentsHelp}</p>
                  <p>{t.commentsCounter(lead.comments.length, CGI_COMMENTS_MAX_LENGTH)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (dimensionIndex === 0) {
                  setStep("context");
                } else {
                  setDimensionIndex((current) => current - 1);
                }
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>
            {dimensionIndex < config.dimensions.length - 1 ? (
              <Button onClick={goToNextDimension}>
                {t.nextDimension}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submitAssessment}>
                {t.generate}
                <Target className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
