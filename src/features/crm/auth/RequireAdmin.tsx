import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCrmSession } from "./useCrmSession";
import { useIsCrmAdmin } from "./useIsCrmAdmin";
import { decideAccess } from "../logic/accessDecision";
import { CrmDenied } from "../pages/CrmDenied";
import { CrmShell } from "../components/CrmShell";

function CrmLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useCrmSession();
  const { isAdmin, loading: adminCheckLoading } = useIsCrmAdmin(session);

  const decision = decideAccess({
    sessionLoading,
    hasSession: Boolean(session),
    adminCheckLoading,
    isAdmin,
  });

  if (decision === "loading") return <CrmLoading />;
  if (decision === "login") return <Navigate to="/admin/crm/login" replace />;
  if (decision === "denied") return <CrmDenied email={session?.user.email} />;

  return <CrmShell adminEmail={session?.user.email}>{children}</CrmShell>;
}
