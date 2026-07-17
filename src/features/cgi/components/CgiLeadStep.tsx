import type { Dispatch, FormEvent, SetStateAction } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { sectionLayout } from "@/lib/sectionLayout";
import type { getCgiConfig } from "@/data/cgiConfig";
import { ArrowRight, Sparkles } from "lucide-react";
import type { CgiUiText } from "../config";
import type { LeadForm } from "../types";
import {
  isOtherOption,
  normalizeWebsiteInput,
  sanitizePhoneInput,
} from "../utils/form";

type CgiLeadStepProps = {
  t: CgiUiText;
  config: ReturnType<typeof getCgiConfig>;
  lead: LeadForm;
  website: string;
  devAnswersJson: string;
  isSubmitting: boolean;
  hasSavedAssessment: boolean;
  startAssessment: (event: FormEvent<HTMLFormElement>) => void;
  updateLead: (key: keyof LeadForm, value: string) => void;
  setLead: Dispatch<SetStateAction<LeadForm>>;
  setWebsite: (value: string) => void;
  setDevAnswersJson: (value: string) => void;
  generateFromAnswersJson: () => void;
  regenerateSavedAssessment: () => void;
};

export function CgiLeadStep({
  t,
  config,
  lead,
  website,
  devAnswersJson,
  isSubmitting,
  hasSavedAssessment,
  startAssessment,
  updateLead,
  setLead,
  setWebsite,
  setDevAnswersJson,
  generateFromAnswersJson,
  regenerateSavedAssessment,
}: CgiLeadStepProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div className={sectionLayout.prose}>
        <Badge variant="outline">{t.step1}</Badge>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
          {t.contextTitle}
        </h2>
        <p className={sectionLayout.subtitle}>
          {t.contextBody}
        </p>
        <div className="mt-8 rounded-lg border border-primary/15 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t.methodEyebrow}
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight">
            {t.methodIntroTitle}
          </h3>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {t.methodIntroBody.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={startAssessment} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t.labels.name} *</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={lead.name}
                  onChange={(event) => updateLead("name", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t.labels.email} *</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={lead.email}
                  onChange={(event) => updateLead("email", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.labels.phone} *</Label>
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t.labels.company} *</Label>
                <Input
                  id="company"
                  autoComplete="organization"
                  value={lead.company}
                  onChange={(event) =>
                    updateLead("company", event.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">{t.labels.companyWebsite}</Label>
                <Input
                  id="companyWebsite"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="empresa.com.br"
                  value={lead.companyWebsite}
                  onChange={(event) =>
                    updateLead("companyWebsite", event.target.value)
                  }
                  onBlur={(event) =>
                    updateLead(
                      "companyWebsite",
                      normalizeWebsiteInput(event.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t.labels.role} *</Label>
                <Input
                  id="role"
                  autoComplete="organization-title"
                  value={lead.role}
                  onChange={(event) => updateLead("role", event.target.value)}
                  required
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
                      sectorOther: isOtherOption(value)
                        ? current.sectorOther
                        : "",
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
                  <Label htmlFor="sectorOther">
                    {t.sectorOtherLabel} *
                  </Label>
                  <Input
                    id="sectorOther"
                    value={lead.sectorOther}
                    onChange={(event) =>
                      updateLead("sectorOther", event.target.value)
                    }
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
                      updateLead(
                        "commercialRelationshipOther",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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

            <div className="hidden" aria-hidden="true">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>

            {import.meta.env.DEV && (
              <div className="rounded-lg border border-dashed border-primary/35 bg-primary/5 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold">
                    Ferramenta local de teste
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Cole o valor da coluna respostas_json da planilha para
                    gerar o relatório sem responder as 40 perguntas. Se os
                    campos obrigatórios acima estiverem vazios, serão usados
                    dados de teste locais.
                  </p>
                </div>
                <Textarea
                  value={devAnswersJson}
                  onChange={(event) => setDevAnswersJson(event.target.value)}
                  placeholder='{"q1":5,"q2":4,...}'
                  className="min-h-28 font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateFromAnswersJson}
                  disabled={isSubmitting || !devAnswersJson.trim()}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar a partir de respostas_json
                </Button>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full md:w-auto">
              {t.begin}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {import.meta.env.DEV && hasSavedAssessment && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full md:w-auto"
                onClick={regenerateSavedAssessment}
                disabled={isSubmitting}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Regerar último relatório salvo
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
