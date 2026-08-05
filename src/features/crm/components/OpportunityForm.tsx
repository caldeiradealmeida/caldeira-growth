import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS, STATUS_ORDER } from "../constants";
import { useSaveOpportunity } from "../hooks/useLeadDetail";
import type { CrmOpportunity, CrmOpportunityStatus } from "../types";

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function OpportunityForm({ leadId, opportunity }: { leadId: string; opportunity: CrmOpportunity | null }) {
  const [status, setStatus] = useState<CrmOpportunityStatus>(opportunity?.status ?? "novo");
  const [notes, setNotes] = useState(opportunity?.notes ?? "");
  const [nextActionAt, setNextActionAt] = useState(toDateInputValue(opportunity?.next_action_at));
  const [lastContactAt, setLastContactAt] = useState(toDateInputValue(opportunity?.last_contact_at));
  const [estimatedValue, setEstimatedValue] = useState(
    opportunity?.estimated_value !== null && opportunity?.estimated_value !== undefined
      ? String(opportunity.estimated_value)
      : ""
  );
  const [lostReason, setLostReason] = useState(opportunity?.lost_reason ?? "");

  useEffect(() => {
    setStatus(opportunity?.status ?? "novo");
    setNotes(opportunity?.notes ?? "");
    setNextActionAt(toDateInputValue(opportunity?.next_action_at));
    setLastContactAt(toDateInputValue(opportunity?.last_contact_at));
    setEstimatedValue(
      opportunity?.estimated_value !== null && opportunity?.estimated_value !== undefined
        ? String(opportunity.estimated_value)
        : ""
    );
    setLostReason(opportunity?.lost_reason ?? "");
  }, [opportunity]);

  const save = useSaveOpportunity(leadId);

  async function handleSave() {
    try {
      await save.mutateAsync({
        status,
        notes,
        nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : null,
        lastContactAt: lastContactAt ? new Date(lastContactAt).toISOString() : null,
        estimatedValue: estimatedValue.trim() === "" ? null : Number(estimatedValue),
        lostReason,
      });
      toast.success("Oportunidade atualizada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status comercial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CrmOpportunityStatus)}>
              <SelectTrigger data-testid="opportunity-status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor estimado (R$)</Label>
            <Input
              type="number"
              min={0}
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Próxima ação</Label>
            <Input type="date" value={nextActionAt} onChange={(e) => setNextActionAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Último contato</Label>
            <Input type="date" value={lastContactAt} onChange={(e) => setLastContactAt(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Notas</Label>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas..." />
        </div>

        {(status === "sem_interesse" || status === "descartado") && (
          <div className="space-y-1.5">
            <Label>Motivo de perda</Label>
            <Input value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="Ex.: preço, timing, sem fit" />
          </div>
        )}

        <Button onClick={() => void handleSave()} disabled={save.isPending} data-testid="opportunity-save">
          {save.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </CardContent>
    </Card>
  );
}
