import type { ConsentCallResult } from "@/features/cgi/services/marketingConsent";

// Copy e decisão da tela de preferência de marketing, fora do componente para
// que sejam testáveis sem render e para não quebrar o fast refresh.

export type ModoPreferencia = "optout" | "optin";

export type EstadoPreferencia = "pronto" | "enviando" | "concluido" | "sem_link";

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

/** O que a tela mostra depois da chamada. "unavailable" também conclui: o que a
 * pessoa precisa saber é o resultado pretendido, e um erro de rede num link
 * clicado uma vez não deve virar um pedido para tentar de novo. O registro real
 * está no banco, e reclicar é idempotente. */
export function estadoAposChamada(resultado: ConsentCallResult): EstadoPreferencia {
  return resultado === "invalid_link" ? "sem_link" : "concluido";
}

