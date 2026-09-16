import type { OpportunityRow } from "../types";

/**
 * A última vez que alguma coisa aconteceu entre nós e esta pessoa.
 *
 * "Interação" aqui é deliberadamente larga: inclui o que NÓS fizemos (uma
 * pessoa registrando contato, uma automação enviando e-mail) e o que ELA fez
 * (abrir o relatório, responder o CGI). A coluna existe para responder "faz
 * quanto tempo que este lead está parado", e para essa pergunta não importa de
 * que lado veio o movimento -- importa que houve movimento.
 *
 * Por isso ela NÃO substitui a coluna "Contato", que responde outra coisa:
 * alguém de verdade já falou com essa pessoa? Um lead que recebeu três e-mails
 * automáticos e abriu o relatório ontem tem interação recente e continua
 * "Nunca contatado". As duas colunas discordarem é o sinal útil.
 */
export type InteractionKind = "humano" | "automatico" | "relatorio" | "cgi" | "nenhuma";

export type LastInteraction = {
  atIso: string | null;
  kind: InteractionKind;
  /** Uma palavra sobre a natureza do movimento, para a legenda da célula. */
  label: string;
  /** Dias completos desde a interação. Null quando não houve nenhuma. */
  daysAgo: number | null;
};

const LABELS: Record<InteractionKind, string> = {
  humano: "contato humano",
  automatico: "e-mail automático",
  relatorio: "abriu o relatório",
  cgi: "atividade no CGI",
  nenhuma: "",
};

function ms(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

export function deriveLastInteraction(
  row: OpportunityRow,
  now: number = Date.now()
): LastInteraction {
  const candidatos: Array<{ at: number | null; kind: InteractionKind }> = [
    { at: ms(row.opportunity?.last_contact_at), kind: "humano" },
    // Só envio de fato concluído. Uma linha `sending` ou `failed` não é
    // interação: ninguém do outro lado viu nada.
    {
      at: row.communications
        .filter((c) => c.status === "sent")
        .map((c) => ms(c.sent_at))
        .filter((t): t is number => t !== null)
        .reduce<number | null>((maior, t) => (maior === null || t > maior ? t : maior), null),
      kind: "automatico",
    },
    { at: ms(row.reportOpenedAt), kind: "relatorio" },
    { at: ms(row.latestAssessment?.last_activity_at), kind: "cgi" },
  ];

  let melhor: { at: number; kind: InteractionKind } | null = null;
  for (const c of candidatos) {
    if (c.at === null) continue;
    if (melhor === null || c.at > melhor.at) melhor = { at: c.at, kind: c.kind };
  }

  if (!melhor) {
    return { atIso: null, kind: "nenhuma", label: LABELS.nenhuma, daysAgo: null };
  }

  return {
    atIso: new Date(melhor.at).toISOString(),
    kind: melhor.kind,
    label: LABELS[melhor.kind],
    daysAgo: Math.max(0, Math.floor((now - melhor.at) / 86_400_000)),
  };
}
