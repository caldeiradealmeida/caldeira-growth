import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "CRM: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar configuradas. " +
      "Nunca use SUPABASE_SERVICE_ROLE_KEY no frontend -- essa chave fica só em api/."
  );
}

export const crmSupabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Explícito de propósito: é este flag que faz o cliente consumir o
    // fragmento do magic link e limpar a URL. É o padrão da biblioteca, mas
    // depender de um padrão para uma garantia de autenticação é frágil.
    detectSessionInUrl: true,
    storageKey: "caldeira-crm-auth",
  },
});
