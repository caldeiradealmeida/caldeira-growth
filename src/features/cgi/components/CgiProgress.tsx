import { Progress } from "@/components/ui/progress";

type CgiProgressProps = {
  answeredCount: number;
  totalQuestions: number;
  progress: number;
  answeredLabel: (answered: number, total: number) => string;
};

export function CgiProgress({
  answeredCount,
  totalQuestions,
  progress,
  answeredLabel,
}: CgiProgressProps) {
  return (
    <div className="min-w-[220px]">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{answeredLabel(answeredCount, totalQuestions)}</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}
