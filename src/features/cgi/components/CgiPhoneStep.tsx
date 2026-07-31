import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import type { CgiUiText } from "../config";
import type { LeadForm } from "../types";
import { sanitizePhoneInput } from "../utils/form";

type CgiPhoneStepProps = {
  t: CgiUiText;
  lead: LeadForm;
  isSubmitting: boolean;
  isLeadSubmitting: boolean;
  updateLead: (key: keyof LeadForm, value: string) => void;
  viewResult: () => void;
};

export function CgiPhoneStep({
  t,
  lead,
  isSubmitting,
  isLeadSubmitting,
  updateLead,
  viewResult,
}: CgiPhoneStepProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-primary/20">
        <CardContent className="p-6 md:p-8">
          <Badge variant="outline">{t.step4}</Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight">
            {t.phoneTitle}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t.phoneBody}
          </p>

          <div className="mt-6 space-y-2">
            <Label htmlFor="phone">{t.labels.phone}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={lead.phone}
              onChange={(event) =>
                updateLead("phone", sanitizePhoneInput(event.target.value))
              }
              onBlur={(event) =>
                updateLead("phone", sanitizePhoneInput(event.target.value))
              }
              placeholder="(11) 99999-9999"
            />
          </div>

          {isSubmitting && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.reportAlertBody}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={viewResult} disabled={isLeadSubmitting}>
              <Search className="mr-2 h-4 w-4" />
              {t.viewResult}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
