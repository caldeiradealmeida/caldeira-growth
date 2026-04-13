import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { cn } from "@/lib/utils";
import { sectionLayout } from "@/lib/sectionLayout";

function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        sectionLayout.sectionY,
        "border-t border-border/60",
        className
      )}
    >
      {children}
    </section>
  );
}

export default function Consultoria() {
  const { lang } = useLanguage();
  const p = content[lang].consultingPage;

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="pt-28 md:pt-36 pb-24 md:pb-32">
        <div className={sectionLayout.container}>
          <div className={sectionLayout.prose}>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground mb-8 md:mb-10">
              {lang === "pt" ? "Consultoria" : "Consulting"}
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.12] mb-8 md:mb-10">
              {p.hero.title}
            </h1>
            <p className={`${sectionLayout.subtitle} text-foreground/85 mb-12 md:mb-14`}>
              {p.hero.subtitle}
            </p>
            <Button
              size="lg"
              asChild
              variant="outline"
              className="rounded-sm border-foreground/20 bg-transparent px-8 py-6 text-base font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors"
            >
              <Link to="/contato">{p.hero.cta}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Section>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.prose}>
            <div className={sectionLayout.headerToContent}>
              <h2 className={sectionLayout.title}>{p.forWhom.title}</h2>
              <p className="text-base md:text-[17px] leading-[1.75] text-foreground/85">
                {p.forWhom.intro}
              </p>
            </div>
            <ul className="space-y-5">
              {p.forWhom.bullets.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 text-base md:text-[17px] leading-relaxed text-foreground/90"
                >
                  <span
                    className="mt-2.5 h-px w-6 shrink-0 bg-foreground/25"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="bg-muted/[0.35]">
        <div className={sectionLayout.container}>
          <div className={sectionLayout.prose}>
            <div className={sectionLayout.headerToContent}>
              <h2 className={sectionLayout.title}>{p.howIWork.title}</h2>
            </div>
            <p className="text-base md:text-[17px] leading-[1.75] text-foreground/85 mb-8">
              {p.howIWork.lead}
            </p>
            <p className="text-base md:text-[17px] leading-[1.75] text-foreground/85 mb-6">
              {p.howIWork.clarityLead}
            </p>
            <ul className="space-y-3 mb-10 pl-1 border-l border-border/80 pl-6 md:pl-8">
              {p.howIWork.clarityPoints.map((point) => (
                <li
                  key={point}
                  className="text-base md:text-[17px] text-foreground/90 leading-relaxed"
                >
                  {point}
                </li>
              ))}
            </ul>
            <p className="text-base md:text-[17px] leading-[1.75] text-foreground/85 mb-12">
              {p.howIWork.bridge}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">
              {lang === "pt" ? "Formatos" : "Formats"}
            </p>
            <ul className="space-y-4">
              {p.howIWork.formats.map((f) => (
                <li
                  key={f}
                  className="text-sm md:text-base text-foreground/80 leading-relaxed border-b border-border/40 pb-4 last:border-0 last:pb-0"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h2 className={sectionLayout.title}>{p.situations.title}</h2>
            <p className={sectionLayout.subtitle}>{p.situations.subtitle}</p>
          </div>
          <div className="space-y-20 md:space-y-24">
            {p.situations.cases.map((c, i) => (
              <div
                key={c.title}
                className="grid md:grid-cols-12 gap-10 md:gap-12 border-t border-border/60 pt-14 md:pt-16 first:border-t-0 first:pt-0"
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
                      {p.situations.labels.context}
                    </p>
                    <p className="text-base md:text-[17px] leading-[1.75] text-foreground/88">
                      {c.context}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {p.situations.labels.decision}
                    </p>
                    <p className="text-base md:text-[17px] leading-[1.75] text-foreground/88">
                      {c.decision}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {p.situations.labels.impact}
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
      </Section>

      <Section className="bg-muted/[0.35]">
        <div className={sectionLayout.container}>
          <div className={sectionLayout.prose}>
            <div className={sectionLayout.headerToContent}>
              <h2 className={sectionLayout.title}>{p.board.title}</h2>
            </div>
            <div className="space-y-6 mb-10 md:mb-12">
              {p.board.paragraphs.map((para, idx) => (
                <p
                  key={idx}
                  className="text-base md:text-[17px] leading-[1.75] text-foreground/88"
                >
                  {para}
                </p>
              ))}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              {p.board.formatsTitle}
            </p>
            <ul className="space-y-4">
              {p.board.formats.map((line) => (
                <li
                  key={line}
                  className="text-sm md:text-base text-foreground/85 leading-relaxed border-b border-border/40 pb-4 last:border-0 last:pb-0"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.prose}>
            <div className={sectionLayout.headerToContent}>
              <h2 className={sectionLayout.title}>{p.experience.title}</h2>
            </div>
            {p.experience.body.split("\n\n").map((para, idx) => (
              <p
                key={idx}
                className="text-base md:text-[17px] leading-[1.75] text-foreground/85 mb-6 last:mb-0"
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </Section>

      <section className={`${sectionLayout.sectionY} border-t border-border/60`}>
        <div className={sectionLayout.container}>
          <div className={`${sectionLayout.prose} text-center`}>
            <p className="text-xl md:text-2xl font-semibold tracking-tight text-foreground leading-snug mb-10 md:mb-12">
              {p.finalCta.title}
            </p>
            <Button
              size="lg"
              asChild
              className="rounded-sm bg-foreground text-background hover:bg-foreground/90 px-10 py-6 text-base font-medium tracking-wide"
            >
              <Link to="/contato">{p.finalCta.cta}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
