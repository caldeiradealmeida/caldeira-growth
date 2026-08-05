import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import logo from "@/assets/brand/Black logo - no background.svg";
import { Button } from "@/components/ui/button";
import { crmSupabase } from "../lib/supabaseClient";

export function CrmShell({
  adminEmail,
  children,
}: {
  adminEmail?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Caldeira Growth" className="h-8 w-auto" />
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-medium tracking-wide text-muted-foreground">
              CGI Pipeline
            </span>
          </div>
          {adminEmail && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{adminEmail}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void crmSupabase.auth.signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
