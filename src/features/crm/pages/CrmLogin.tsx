import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import logo from "@/assets/brand/Black logo - no background.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { crmSupabase } from "../lib/supabaseClient";
import { useCrmSession } from "../auth/useCrmSession";
import {
  CRM_BASE_PATH,
  clearAuthFragment,
  describeAuthError,
  parseAuthFragment,
} from "../auth/authRedirect";

type SendState = "idle" | "sending" | "sent" | "error";

export function CrmLogin() {
  const { session, loading } = useCrmSession();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Erro que veio do callback (link expirado, por exemplo). Lido do fragmento
  // uma vez e apagado da barra em seguida -- a pessoa precisa ver a mensagem,
  // não o fragmento.
  const [callbackError, setCallbackError] = useState<string | null>(null);

  useEffect(() => {
    const mensagem = describeAuthError(parseAuthFragment(window.location.hash));
    if (!mensagem) return;
    setCallbackError(mensagem);
    setState("error");
    clearAuthFragment();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMessage(null);

    const { error } = await crmSupabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/admin/crm`,
      },
    });

    if (error) {
      setState("error");
      setErrorMessage(error.message);
      return;
    }
    setState("sent");
  }

  // Quem já está autenticado não tem o que fazer aqui.
  if (!loading && session) return <Navigate to={CRM_BASE_PATH} replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src={logo} alt="Caldeira Growth" className="mb-2 h-10 w-auto" />
          <CardTitle>CGI Pipeline</CardTitle>
          <CardDescription>Acesso restrito à equipe Caldeira Growth</CardDescription>
        </CardHeader>
        <CardContent>
          {state === "sent" ? (
            <p className="text-center text-sm text-muted-foreground" data-testid="crm-login-sent">
              Enviamos um link de acesso para <strong>{email}</strong>. Abra-o para entrar.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crm-email">E-mail</Label>
                <Input
                  id="crm-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@caldeiragrowth.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {state === "error" && (callbackError || errorMessage) && (
                <p className="text-sm text-destructive" role="alert">
                  {callbackError || errorMessage}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={state === "sending"}>
                {state === "sending" ? "Enviando..." : "Enviar link de acesso"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
