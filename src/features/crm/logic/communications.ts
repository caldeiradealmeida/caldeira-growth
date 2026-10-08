import type { CgiCommunication, CommunicationStatus } from "../types";

// Leitura do ledger de comunicações no Pipe.
//
// O ledger (cgi_communications) é aditivo e chega vazio: enquanto a migration
// não estiver aplicada e CGI_COMMUNICATIONS_LEDGER_ENABLED não estiver ligada
// em Production, toda oportunidade tem zero linhas. Tudo aqui precisa,
// portanto, tratar "nenhuma comunicação" como o estado normal -- e não como
// erro ou ausência de dado.

/** Só o que efetivamente saiu conta como "mensagem enviada". Uma linha
 * cancelada/suprimida é histórico de decisão, não de envio. */
const SENT_STATUSES: ReadonlySet<CommunicationStatus> = new Set<CommunicationStatus>(["sent"]);

export type CommunicationsSummary = {
  /** Quantas mensagens realmente saíram. */
  sentCount: number;
  /** Quantas falharam e nunca foram substituídas por um envio. */
  failedCount: number;
  /** Quantas estão agendadas para o futuro. */
  scheduledCount: number;
  /** A última que saiu (mais recente por sent_at). */
  lastSent: CgiCommunication | null;
  /** A próxima agendada (mais cedo por scheduled_at). */
  nextScheduled: CgiCommunication | null;
};

function timestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function summarizeCommunications(
  communications: CgiCommunication[] | null | undefined
): CommunicationsSummary {
  const list = Array.isArray(communications) ? communications : [];

  const sent = list.filter((c) => SENT_STATUSES.has(c.status));
  const failed = list.filter((c) => c.status === "failed");
  const scheduled = list.filter((c) => c.status === "scheduled");

  const lastSent = sent.reduce<CgiCommunication | null>((best, c) => {
    if (!best) return c;
    return timestamp(c.sent_at) > timestamp(best.sent_at) ? c : best;
  }, null);

  const nextScheduled = scheduled.reduce<CgiCommunication | null>((best, c) => {
    if (!best) return c;
    return timestamp(c.scheduled_at) < timestamp(best.scheduled_at) ? c : best;
  }, null);

  return {
    sentCount: sent.length,
    failedCount: failed.length,
    scheduledCount: scheduled.length,
    lastSent,
    nextScheduled,
  };
}

/** Agrupa as comunicações por lead_id. Linhas sem lead_id (o vínculo é
 * ON DELETE SET NULL) simplesmente não aparecem em nenhuma oportunidade -- não
 * são erro e não podem derrubar a montagem da lista. */
export function groupCommunicationsByLead(
  communications: CgiCommunication[] | null | undefined
): Map<string, CgiCommunication[]> {
  const byLead = new Map<string, CgiCommunication[]>();
  for (const c of Array.isArray(communications) ? communications : []) {
    if (!c?.lead_id) continue;
    const list = byLead.get(c.lead_id) ?? [];
    list.push(c);
    byLead.set(c.lead_id, list);
  }
  return byLead;
}
