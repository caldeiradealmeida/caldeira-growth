import { useEffect, useState } from "react";
import {
  MARKETING_PREFERENCE_COPY,
  estadoAposChamada,
  type EstadoPreferencia,
  type ModoPreferencia,
} from "@/features/cgi/logic/marketingPreference";
import {
  grantMarketingConsentByToken,
  readContactTokenFromHash,
  revokeMarketingConsentByToken,
  type ConsentCallResult,
} from "@/features/cgi/services/marketingConsent";

// Duas páginas, uma tela. Descadastro e reentrada de opt-in são a mesma
// interação com o sinal invertido, e V1 não é um Preference Center: uma frase,
// uma ação, nenhuma pergunta sobre frequência ou categoria.
//
// Nada aqui exige login e nada aqui revela dado nenhum. A página não sabe --
// e não pode saber -- de quem é o link: o banco responde igual para token
// válido e inválido. Por isso a confirmação é sempre a mesma, e clicar duas
// vezes não produz erro.

export function CgiMarketingPreference({ modo }: { modo: ModoPreferencia }) {
  const [token, setToken] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoPreferencia>("pronto");
  const copy = MARKETING_PREFERENCE_COPY[modo];

  useEffect(() => {
    const t = readContactTokenFromHash(window.location.hash);
    setToken(t);
    if (!t) setEstado("sem_link");
  }, []);

  const confirmar = async () => {
    if (!token || estado === "enviando") return;
    setEstado("enviando");
    const resultado: ConsentCallResult =
      modo === "optout"
        ? await revokeMarketingConsentByToken(token)
        : await grantMarketingConsentByToken(token, "report_email");
    setEstado(estadoAposChamada(resultado));
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{copy.titulo}</h1>

      {estado === "sem_link" ? (
        <p className="mt-4 text-muted-foreground">
          Este link não está mais válido. Se você quiser ajustar o que recebe, use o link no rodapé
          de qualquer e-mail que tenhamos enviado.
        </p>
      ) : estado === "concluido" ? (
        <p className="mt-4 text-muted-foreground">{copy.feito}</p>
      ) : (
        <>
          <p className="mt-4 text-muted-foreground">{copy.corpo}</p>
          <button
            type="button"
            onClick={confirmar}
            disabled={estado === "enviando" || !token}
            className="mt-8 self-start rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {estado === "enviando" ? "Confirmando…" : copy.acao}
          </button>
        </>
      )}
    </main>
  );
}

export default function CgiUnsubscribePage() {
  return <CgiMarketingPreference modo="optout" />;
}

export function CgiInsightsOptInPage() {
  return <CgiMarketingPreference modo="optin" />;
}
