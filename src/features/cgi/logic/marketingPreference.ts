import type { ConsentCallResult } from "@/features/cgi/services/marketingConsent";

// Copy e decisão da tela de preferência de marketing, fora do componente para
// que sejam testáveis sem render e para não quebrar o fast refresh.

export type ModoPreferencia = "optout" | "optin";

export type EstadoPreferencia = "pronto" | "enviando" | "concluido" | "sem_link" | "indisponivel";

export const MARKETING_PREFERENCE_COPY: Record<
  ModoPreferencia,
  { titulo: string; corpo: string; acao: string; feito: string }
> = {
  optout: {
    titulo: "Cancelar recebimento de insights",
    corpo:
      "Você não receberá mais conteúdos e insights da Caldeira Growth.",
    acao: "Cancelar recebimento de insights",
    feito:
      "Pronto. Você não receberá mais conteúdos e insights da Caldeira Growth. Comunicações sobre diagnósticos que você mesmo solicitar continuam funcionando normalmente.",
  },
  optin: {
    titulo: "Receber insights sobre o seu CGI",
    corpo:
      "Leituras curtas sobre os pontos que apareceram como mais frágeis no seu diagnóstico. Poucos e-mails, e você pode cancelar a qualquer momento.",
    acao: "Quero receber insights personalizados",
    feito:
      "Pronto. Você vai receber leituras ligadas ao que o seu CGI apontou. Em qualquer e-mail há um link para cancelar.",
  },
};

/** O que a tela mostra depois da chamada.
 *
 * Só "ok" confirma. A tentação era tratar falha de rede como sucesso -- afinal
 * pedir para clicar de novo é chato --, mas dizer "você não receberá mais
 * nada" quando nada foi gravado é uma promessa falsa, e a promessa aqui é
 * justamente a coisa que não pode ser falsa. Melhor pedir outra tentativa do
 * que mentir sobre um descadastro.
 *
 * Este caso deixa de ser hipotético antes da migration: sem as RPCs no banco,
 * TODA chamada falha. */
export function estadoAposChamada(resultado: ConsentCallResult): EstadoPreferencia {
  if (resultado === "ok") return "concluido";
  if (resultado === "invalid_link") return "sem_link";
  return "indisponivel";
}

