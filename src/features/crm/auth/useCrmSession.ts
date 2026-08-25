import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { crmSupabase } from "../lib/supabaseClient";
import { clearAuthFragment } from "./authRedirect";

export function useCrmSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    crmSupabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      // O supabase-js normalmente já limpou a barra ao processar o fragmento.
      // Esta chamada é a rede de segurança para quando ele não rodou naquela
      // página -- e é inofensiva quando não há nada a limpar.
      if (data.session) clearAuthFragment();
    });

    const { data: subscription } = crmSupabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) clearAuthFragment();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
