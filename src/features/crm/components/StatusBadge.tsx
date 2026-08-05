import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "../constants";
import type { CrmOpportunityStatus } from "../types";

const TONE: Record<CrmOpportunityStatus, string> = {
  novo: "bg-muted text-muted-foreground",
  revisado: "bg-secondary text-secondary-foreground",
  contato_pendente: "bg-amber-100 text-amber-900",
  contato_realizado: "bg-sky-100 text-sky-900",
  reuniao_agendada: "bg-sky-100 text-sky-900",
  proposta_enviada: "bg-violet-100 text-violet-900",
  convertido: "bg-emerald-100 text-emerald-900",
  sem_interesse: "bg-muted text-muted-foreground",
  descartado: "bg-muted text-muted-foreground line-through",
};

export function StatusBadge({ status }: { status: CrmOpportunityStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent font-normal", TONE[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
