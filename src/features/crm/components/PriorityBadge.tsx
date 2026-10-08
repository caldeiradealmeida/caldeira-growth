import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PriorityLevel } from "../logic/commercialPriority";

// P1..P4 nunca aparecem sozinhos: o `title` carrega a frase que justifica o
// nível. Prioridade que não se explica é score mágico.
const TONE: Record<PriorityLevel, string> = {
  P1: "bg-primary text-primary-foreground",
  P2: "bg-sky-100 text-sky-900",
  P3: "bg-muted text-muted-foreground",
  P4: "bg-muted/60 text-muted-foreground",
};

export function PriorityBadge({ level, reason }: { level: PriorityLevel; reason: string }) {
  return (
    <Badge
      variant="outline"
      title={reason}
      className={cn("border-transparent font-semibold tabular-nums", TONE[level])}
    >
      {level}
    </Badge>
  );
}
