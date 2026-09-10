import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLASSIFICATION_HELP,
  CLASSIFICATION_LABELS,
  LEAD_CLASSIFICATIONS,
  type LeadClassification,
} from "../api/classifyLead";
import { useClassifyLead } from "../hooks/useLeadDetail";
import type { CgiLead } from "../types";

function formatarData(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
}

/**
 * Card próprio, separado de "Status comercial", e isso é deliberado.
 *
 * Classificação e estágio comercial são eixos diferentes: um diz se a linha
 * merece existir na fila, o outro diz onde ela está na conversa. Misturar os
 * dois num controle só foi exatamente o que produziu `is_test_excluded` — uma
 * flag pendurada na oportunidade, que nem sempre existe, e que ninguém
 * conseguia ligar.
 */
export function LeadClassificationCard({ lead }: { lead: CgiLead }) {
  const atual = (lead.classification ?? "legitimate") as LeadClassification;
  const [classification, setClassification] = useState<LeadClassification>(atual);
  const [note, setNote] = useState(lead.classification_note ?? "");

  useEffect(() => {
    setClassification((lead.classification ?? "legitimate") as LeadClassification);
    setNote(lead.classification_note ?? "");
  }, [lead.classification, lead.classification_note]);

  const classificar = useClassifyLead(lead.id);
  const mudou = classification !== atual || note !== (lead.classification_note ?? "");

  async function salvar() {
    try {
      await classificar.mutateAsync({ classification, note });
      toast.success(
        classification === "legitimate"
          ? "Lead devolvido à fila."
          : `Lead marcado como ${CLASSIFICATION_LABELS[classification].toLowerCase()}.`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao classificar.");
    }
  }

  return (
    <Card data-testid="lead-classification-card">
      <CardHeader>
        <CardTitle className="text-base">Qualidade do registro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Classificação</Label>
          <Select
            value={classification}
            onValueChange={(v) => setClassification(v as LeadClassification)}
          >
            <SelectTrigger data-testid="lead-classification-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_CLASSIFICATIONS.map((valor) => (
                <SelectItem key={valor} value={valor}>
                  {CLASSIFICATION_LABELS[valor]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{CLASSIFICATION_HELP[classification]}</p>
        </div>

        <div className="space-y-1.5">
          <Label>Motivo (opcional)</Label>
          <Input
            value={note}
            maxLength={280}
            placeholder="Por que este registro foi classificado assim"
            onChange={(e) => setNote(e.target.value)}
            data-testid="lead-classification-note"
          />
        </div>

        {classification !== "legitimate" && (
          <p className="text-xs text-muted-foreground">
            Sai da fila operacional e das automações. Nada é apagado — o
            histórico, os eventos e o relatório continuam onde estão.
          </p>
        )}

        {lead.classified_at && (
          <p className="text-xs text-muted-foreground" data-testid="lead-classification-audit">
            Classificado em {formatarData(lead.classified_at)}
            {lead.classified_by ? ` por ${lead.classified_by}` : ""}.
          </p>
        )}

        <Button
          onClick={salvar}
          disabled={!mudou || classificar.isPending}
          data-testid="lead-classification-save"
        >
          {classificar.isPending ? "Salvando…" : "Salvar classificação"}
        </Button>
      </CardContent>
    </Card>
  );
}
