import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sectionLayout } from "@/lib/sectionLayout";
import { ArrowRight, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import type { getCgiConfig } from "@/data/cgiConfig";
import type { CgiUiText } from "../config";
import { scrollToAssessment } from "../services/report";

type CgiLandingProps = {
  t: CgiUiText;
  config: ReturnType<typeof getCgiConfig>;
  onStartClick: () => void;
};

export function CgiLanding({ t, config, onStartClick }: CgiLandingProps) {
  return (
    <>
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        <div className={sectionLayout.container}>
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-3xl">
              <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                {t.badge}
              </Badge>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
                {t.heroTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/85 md:text-xl">
                {t.heroText}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    onStartClick();
                    scrollToAssessment({ focusId: "name" });
                  }}
                >
                  {t.start}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <a href={config.primaryCta.href}>
                    {config.primaryCta.label}
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {t.stats.map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/8 p-5"
                >
                  <p className="text-3xl font-semibold text-accent">{value}</p>
                  <p className="mt-1 text-sm text-primary-foreground/75">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className={`${sectionLayout.container} py-8`}>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="flex gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t.trust[0].title}</p>
                <p className="text-sm text-muted-foreground">
                  {t.trust[0].body}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <BarChart3 className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t.trust[1].title}</p>
                <p className="text-sm text-muted-foreground">
                  {t.trust[1].body}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t.trust[2].title}</p>
                <p className="text-sm text-muted-foreground">
                  {t.trust[2].body}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
