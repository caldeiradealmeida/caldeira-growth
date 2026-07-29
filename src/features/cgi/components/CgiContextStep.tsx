import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sectionLayout } from "@/lib/sectionLayout";
import type { getCgiConfig } from "@/data/cgiConfig";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CgiUiText } from "../config";
import type { LeadForm } from "../types";
import { isOtherOption, normalizeWebsiteInput } from "../utils/form";

type CgiContextStepProps = {
  t: CgiUiText;
  config: ReturnType<typeof getCgiConfig>;
  lead: LeadForm;
  isLeadSubmitting: boolean;
  submitCompanyContext: (event: FormEvent<HTMLFormElement>) => void;
  updateLead: (key: keyof LeadForm, value: string) => void;
  setLead: Dispatch<SetStateAction<LeadForm>>;
  onBack: () => void;
};

export function CgiContextStep({
  t,
  config,
  lead,
  isLeadSubmitting,
  submitCompanyContext,
  updateLead,
  setLead,
  onBack,
}: CgiContextStepProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div className={sectionLayout.prose}>
        <Badge variant="outline">{t.step2}</Badge>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
          {t.companyContextTitle}
        </h2>
        <p className={sectionLayout.subtitle}>{t.companyContextBody}</p>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={submitCompanyContext} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">{t.labels.companyWebsite}</Label>
                <Input
                  id="companyWebsite"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="empresa.com.br"
                  value={lead.companyWebsite}
                  onChange={(event) => updateLead("companyWebsite", event.target.value)}
                  onBlur={(event) =>
                    updateLead("companyWebsite", normalizeWebsiteInput(event.target.value))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>{t.labels.sector} *</Label>
                <Select
                  value={lead.sector}
                  onValueChange={(value) => {
                    setLead((current) => ({
                      ...current,
                      sector: value,
                      sectorOther: isOtherOption(value) ? current.sectorOther : "",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {t.sectorOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t.sectorHelp}
                </p>
              </div>

              {isOtherOption(lead.sector) && (
                <div className="space-y-2">
                  <Label htmlFor="sectorOther">{t.sectorOtherLabel} *</Label>
                  <Input
                    id="sectorOther"
                    value={lead.sectorOther}
                    onChange={(event) => updateLead("sectorOther", event.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{t.labels.commercialRelationshipModel} *</Label>
                <Select
                  value={lead.commercialRelationshipModel}
                  onValueChange={(value) => {
                    setLead((current) => ({
                      ...current,
                      commercialRelationshipModel: value,
                      commercialRelationshipOther: isOtherOption(value)
                        ? current.commercialRelationshipOther
                        : "",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {t.commercialRelationshipOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t.commercialRelationshipHelp}
                </p>
              </div>

              {isOtherOption(lead.commercialRelationshipModel) && (
                <div className="space-y-2">
                  <Label htmlFor="commercialRelationshipOther">
                    {t.commercialRelationshipOtherLabel} *
                  </Label>
                  <Input
                    id="commercialRelationshipOther"
                    value={lead.commercialRelationshipOther}
                    onChange={(event) =>
                      updateLead("commercialRelationshipOther", event.target.value)
                    }
                    required
                  />
                </div>
              )}

              {config.qualificationFields.map((field) => (
                <div className="space-y-2" key={field.id}>
                  <Label>{field.label} *</Label>
                  <Select
                    value={lead[field.id]}
                    onValueChange={(value) => updateLead(field.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.back}
              </Button>
              <Button type="submit" disabled={isLeadSubmitting}>
                {t.continueToDiagnosis}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
