import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { crmSupabase } from "../lib/supabaseClient";

/** Calls the already-deployed is_crm_admin() RPC -- never a new SQL object,
 * just invoking what the migration already created. */
export function useIsCrmAdmin(session: Session | null) {
  const query = useQuery({
    queryKey: ["crm", "is-admin", session?.user.id ?? null],
    queryFn: async () => {
      const { data, error } = await crmSupabase.rpc("is_crm_admin");
      if (error) throw error;
      return Boolean(data);
    },
    enabled: Boolean(session),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    isAdmin: session ? query.data ?? null : null,
    loading: Boolean(session) && query.isLoading,
  };
}
