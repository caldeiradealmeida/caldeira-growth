import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { cn } from "@/lib/utils";
import { sectionLayout } from "@/lib/sectionLayout";
import SectionHeader from "@/components/layout/SectionHeader";

export default function DecisionsSection() {
  const { lang } = useLanguage();
  const home = content[lang].homeDecisions;
  const s = content[lang].consultingPage.situations;

  return (
    <section className={`${sectionLayout.sectionY} bg-background`}>
      <div className={sectionLayout.container}>
        <div className={sectionLayout.headerToContent}>
          <SectionHeader title={home.title} subtitle={home.subtitle} />
        </div>
        <div className="space-y-20 md:space-y-24">
          {s.cases.map((c, i) => (
            <div
              key={c.title}
              className={cn(
                "grid md:grid-cols-12 gap-10 md:gap-12 border-t border-border/60 pt-14 md:pt-16",
                "first:border-t-0 first:pt-0"
              )}
            >
              <div className="md:col-span-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-4">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="text-lg md:text-xl font-semibold text-foreground leading-snug tracking-tight">
                  {c.title}
                </h3>
              </div>
              <div className="md:col-span-8 space-y-10">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {s.labels.context}
                  </p>
                  <p className="text-base md:text-[17px] leading-[1.75] text-foreground/88">
                    {c.context}
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {s.labels.decision}
                  </p>
                  <p className="text-base md:text-[17px] leading-[1.75] text-foreground/88">
                    {c.decision}
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {s.labels.impact}
                  </p>
                  <p className="text-base md:text-[17px] leading-[1.75] text-foreground/88">
                    {c.impact}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
