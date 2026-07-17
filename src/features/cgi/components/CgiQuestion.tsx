import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CGI_QUESTIONS, getCgiConfig } from "@/data/cgiConfig";
import { Info } from "lucide-react";

type CgiQuestionProps = {
  question: (typeof CGI_QUESTIONS)[number];
  index: number;
  dimensionIndex: number;
  scale: ReturnType<typeof getCgiConfig>["scale"];
  answer?: number;
  setAnswer: (questionId: string, value: string) => void;
};

export function CgiQuestion({
  question,
  index,
  dimensionIndex,
  scale,
  answer,
  setAnswer,
}: CgiQuestionProps) {
  const questionNumber = dimensionIndex * 8 + index + 1;

  return (
    <div
      key={question.id}
      className="border-b border-border pb-7 last:border-0 last:pb-0"
    >
      <div className="flex gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {questionNumber}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-relaxed">
            {question.text}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="ml-2 inline-flex h-5 w-5 translate-y-0.5 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label={`Mais informações sobre a pergunta ${questionNumber}`}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs leading-relaxed">
                {question.helpText}
              </TooltipContent>
            </Tooltip>
          </p>
          <RadioGroup
            className="mt-4 grid gap-2 md:grid-cols-5"
            value={answer?.toString()}
            onValueChange={(value) => setAnswer(question.id, value)}
          >
            {scale.map((item) => (
              <Label
                key={item.value}
                htmlFor={`${question.id}-${item.value}`}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 ${
                  answer === item.value
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <RadioGroupItem
                  id={`${question.id}-${item.value}`}
                  value={String(item.value)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-semibold">
                    {item.value}
                  </span>
                  <span className="block text-xs leading-snug text-muted-foreground">
                    {item.label}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
