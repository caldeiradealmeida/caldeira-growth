import { cn } from "@/lib/utils";
import type { CompanySize } from "../logic/commercialPriority";

// Porte não é "bom vs ruim", então nada de vermelho/amarelo/verde. A leitura é
// de intensidade crescente na mesma cor: quanto maior a empresa, mais forte o
// badge. Um lead sem faixa informada fica visivelmente neutro, sem parecer
// pequeno -- não saber não é o mesmo que ser pequeno.
const TONE: Record<number, string> = {
  0: "border-dashed border-border text-muted-foreground",
  1: "border-primary/20 bg-primary/[0.04] text-muted-foreground",
  2: "border-primary/30 bg-primary/10 text-foreground",
  3: "border-primary/45 bg-primary/20 text-foreground",
  4: "border-primary/65 bg-primary/35 text-foreground font-semibold",
  5: "border-primary bg-primary/55 text-foreground font-semibold",
};

export function CompanySizeBadge({ size }: { size: CompanySize }) {
  return (
    <span
      title={size.known ? `Faturamento anual: ${size.band}` : "Faturamento não informado"}
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs tabular-nums",
        TONE[size.tier] ?? TONE[0]
      )}
    >
      {size.short}
    </span>
  );
}
