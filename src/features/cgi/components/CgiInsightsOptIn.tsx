import { useState } from "react";
import { Button } from "@/components/ui/button";
import { grantMarketingConsentFromReport } from "../services/marketingConsent";

// Reentrada de opt-in na tela de resultado.
//
// Aparece depois de a pessoa já ter recebido o diagnóstico -- nunca antes --
// e só para quem ainda não consentiu. Não é checkbox, não vem pré-marcado, e
// não há nada aqui que possa ser lido como consentimento sem um clique
// deliberado neste botão. Se alguém abrir a tela e não fizer nada, nada é
// gravado.
//
// Deliberadamente fora do fluxo do relatório: não bloqueia, não interrompe e
// não tem relação com abrir ou baixar o parecer.

export type CgiInsightsOptInProps = {
  anonymousSessionId: string;
  publicAssessmentId: string;
  /** Estado atual. Quando true, este componente não renderiza nada. */
  alreadyConsented: boolean;
};

export function CgiInsightsOptIn({
  anonymousSessionId,
  publicAssessmentId,
  alreadyConsented,
}: CgiInsightsOptInProps) {
  const [estado, setEstado] = useState<"pronto" | "enviando" | "pronto_feito">("pronto");

  if (alreadyConsented) return null;
  if (!anonymousSessionId || !publicAssessmentId) return null;

  const confirmar = async () => {
    if (estado !== "pronto") return;
    setEstado("enviando");
    await grantMarketingConsentFromReport({ anonymousSessionId, publicAssessmentId });
    // Clicar de novo não é erro nem grava de novo: o botão sai da tela.
    setEstado("pronto_feito");
  };

  return (
    <div className="mt-10 rounded-lg border border-border/60 bg-muted/30 p-6">
      {estado === "pronto_feito" ? (
        <p className="text-sm text-muted-foreground">
          Pronto. Você vai receber leituras ligadas aos pontos que o seu CGI apontou. Em qualquer
          e-mail há um link para cancelar.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Quer continuar recebendo leituras e insights sobre os desafios identificados no seu CGI?
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={estado === "enviando"}
            onClick={confirmar}
          >
            {estado === "enviando" ? "Confirmando…" : "Quero receber insights personalizados"}
          </Button>
        </>
      )}
    </div>
  );
}
