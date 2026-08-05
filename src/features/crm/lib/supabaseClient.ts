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
    storageKey: "caldeira-crm-auth",
  },
});
