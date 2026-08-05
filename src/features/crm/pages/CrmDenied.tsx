import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { crmSupabase } from "../lib/supabaseClient";

export function CrmDenied({ email }: { email?: string | null }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <ShieldAlert className="h-10 w-10 text-muted-foreground" />
      <div>
        <h1 className="text-lg font-semibold">Acesso negado</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {email ? <>A conta <strong>{email}</strong> não</> : "Sua conta não"} tem permissão
          para acessar o CGI Pipeline.
        </p>
      </div>
      <Button variant="outline" onClick={() => void crmSupabase.auth.signOut()}>
        Sair
      </Button>
    </div>
  );
}
