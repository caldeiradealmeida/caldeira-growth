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
import { getLanguageFromPath, type Language } from "@/lib/routing";

const LOCALIZED_COPY: Record<Language, Record<ModoPreferencia, { titulo: string; corpo: string; acao: string; feito: string; unavailable: string; invalid: string; confirming: string }>> = {
  pt: {
    optout: { ...MARKETING_PREFERENCE_COPY.optout, unavailable: "Não conseguimos confirmar agora. Tente novamente em alguns minutos — o link continua válido.", invalid: "Este link não está mais válido. Se você quiser ajustar o que recebe, use o link no rodapé de qualquer e-mail que tenhamos enviado.", confirming: "Confirmando…" },
    optin: { ...MARKETING_PREFERENCE_COPY.optin, unavailable: "Não conseguimos confirmar agora. Tente novamente em alguns minutos — o link continua válido.", invalid: "Este link não está mais válido. Se você quiser ajustar o que recebe, use o link no rodapé de qualquer e-mail que tenhamos enviado.", confirming: "Confirmando…" },
  },
  en: {
    optout: { titulo: "Unsubscribe from insights", corpo: "You will no longer receive content and insights from Caldeira Growth.", acao: "Unsubscribe from insights", feito: "You are all set. You will no longer receive content and insights from Caldeira Growth. Communications about assessments you request will continue to work normally.", unavailable: "We could not confirm this right now. Please try again in a few minutes — the link will remain valid.", invalid: "This link is no longer valid. To adjust what you receive, use the link in the footer of any email we have sent you.", confirming: "Confirming…" },
    optin: { titulo: "Receive insights about your CGI", corpo: "Short reads on the areas that appeared most fragile in your assessment. Few emails, and you can unsubscribe at any time.", acao: "Receive personalised insights", feito: "You are all set. You will receive insights related to what your CGI identified. Every email includes an unsubscribe link.", unavailable: "We could not confirm this right now. Please try again in a few minutes — the link will remain valid.", invalid: "This link is no longer valid. To adjust what you receive, use the link in the footer of any email we have sent you.", confirming: "Confirming…" },
  },
  es: {
    optout: { titulo: "Cancelar la recepción de insights", corpo: "Ya no recibirás contenido e insights de Caldeira Growth.", acao: "Cancelar la recepción de insights", feito: "Listo. Ya no recibirás contenido e insights de Caldeira Growth.", unavailable: "No pudimos confirmarlo ahora. Inténtalo de nuevo en unos minutos.", invalid: "Este enlace ya no es válido.", confirming: "Confirmando…" },
    optin: { titulo: "Recibir insights sobre tu CGI", corpo: "Lecturas breves sobre los puntos más frágiles de tu diagnóstico.", acao: "Recibir insights personalizados", feito: "Listo. Recibirás insights relacionados con tu CGI.", unavailable: "No pudimos confirmarlo ahora. Inténtalo de nuevo en unos minutos.", invalid: "Este enlace ya no es válido.", confirming: "Confirmando…" },
  },
};

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
  const language = getLanguageFromPath(typeof window === "undefined" ? "/" : window.location.pathname);
  const copy = LOCALIZED_COPY[language][modo];

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

      {estado === "indisponivel" ? (
        <p className="mt-4 text-muted-foreground">
          {copy.unavailable}
        </p>
      ) : estado === "sem_link" ? (
        <p className="mt-4 text-muted-foreground">
          {copy.invalid}
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
            {estado === "enviando" ? copy.confirming : copy.acao}
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
