import { useEffect, useRef, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sectionLayout } from "@/lib/sectionLayout";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import type { CgiUiText } from "../config";
import type { CgiConsentState, LeadForm } from "../types";

type CgiLeadStepProps = {
  t: CgiUiText;
  lead: LeadForm;
  website: string;
  devAnswersJson: string;
  isSubmitting: boolean;
  isLeadSubmitting: boolean;
  hasSavedAssessment: boolean;
  consent: CgiConsentState;
  submitIdentification: (event: FormEvent<HTMLFormElement>) => void;
  updateLead: (key: keyof LeadForm, value: string) => void;
  setConsent: Dispatch<SetStateAction<CgiConsentState>>;
  setWebsite: (value: string) => void;
  setDevAnswersJson: (value: string) => void;
  generateFromAnswersJson: () => void;
  regenerateSavedAssessment: () => void;
  onLeadFormView: () => void;
};

export function CgiLeadStep({
  t,
  lead,
  website,
  devAnswersJson,
  isSubmitting,
  isLeadSubmitting,
  hasSavedAssessment,
  consent,
  submitIdentification,
  updateLead,
  setConsent,
  setWebsite,
  setDevAnswersJson,
  generateFromAnswersJson,
  regenerateSavedAssessment,
  onLeadFormView,
}: CgiLeadStepProps) {
  const formCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = formCardRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLeadFormView();
      },
      { threshold: 0.35 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [onLeadFormView]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
      <div className={sectionLayout.prose}>
        <Badge variant="outline">{t.step1}</Badge>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
          {t.contextTitle}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground md:text-lg">
          {t.contextBody}
        </p>
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <Clock className="h-4 w-4" />
          {t.leadTimeEstimate}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {t.leadDeliverables.map((item) => (
            <li
              key={item}
              className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
            >
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-6 hidden rounded-lg border border-primary/15 bg-primary/5 p-5 lg:block">
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

      <Card ref={formCardRef}>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={submitIdentification} className="space-y-6">
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
                <Label htmlFor="company">{t.labels.company} *</Label>
                <Input
                  id="company"
                  autoComplete="organization"
                  value={lead.company}
                  onChange={(event) => updateLead("company", event.target.value)}
                  required
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

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consentPrivacy"
                  checked={consent.privacy}
                  onCheckedChange={(checked) =>
                    setConsent((current) => ({ ...current, privacy: checked === true }))
                  }
                />
                <Label
                  htmlFor="consentPrivacy"
                  className="text-sm font-normal leading-relaxed"
                >
                  {t.privacyConsentLabel}{" "}
                  <a
                    href={t.privacyPolicyHref}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t.privacyPolicyLinkLabel}
                  </a>
                  . *
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consentMarketing"
                  checked={consent.marketing}
                  onCheckedChange={(checked) =>
                    setConsent((current) => ({ ...current, marketing: checked === true }))
                  }
                />
                <Label
                  htmlFor="consentMarketing"
                  className="text-sm font-normal leading-relaxed"
                >
                  {t.marketingConsentLabel}
                </Label>
              </div>
              {import.meta.env.DEV && (
                <p className="text-xs text-muted-foreground">
                  {t.privacyReviewNote}
                </p>
              )}
            </div>

            {import.meta.env.DEV && (
              <div className="space-y-3 rounded-lg border border-dashed border-primary/35 bg-primary/5 p-4">
                <div>
                  <p className="text-sm font-semibold">Ferramenta local de teste</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Cole o valor da coluna respostas_json da planilha para gerar o
                    relatório sem responder as 40 perguntas. Se os campos obrigatórios
                    acima estiverem vazios, serão usados dados de teste locais.
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

            <Button
              type="submit"
              size="lg"
              className="w-full md:w-auto"
              disabled={isLeadSubmitting}
            >
              {t.continue}
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
