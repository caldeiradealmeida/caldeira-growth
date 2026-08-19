import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import MediaAuthorityCarousel from "@/components/home/MediaAuthorityCarousel";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { sectionLayout } from "@/lib/sectionLayout";
import { localizedPath } from "@/lib/routing";
import { homeContent, siteMeta, testimonials } from "@/data/strategicContent";
import denisSpeaking from "@/assets/denis/speaking-denis.png";

function TextSection({
  title,
  children,
  muted = false,
}: {
  title: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <section
      className={`${sectionLayout.sectionY} ${
        muted ? "bg-muted/[0.28] border-y border-border/60" : "bg-background"
      }`}
    >
      <div className={sectionLayout.container}>
        <div className={sectionLayout.headerToContent}>
          <h2 className={sectionLayout.title}>{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

export default function Index() {
  const { lang } = useLanguage();
  const h = homeContent[lang];
  const meta = siteMeta[lang];

  return (
    <main className="min-h-screen">
      <Header />
      <SEO routeKey="home" title={meta.title} description={meta.description} />

      <section className="relative min-h-[88vh] flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[#0a121a]" aria-hidden />
        <div className="absolute top-16 md:top-20 left-0 right-0 bottom-0 lg:left-[32%] overflow-hidden">
          <img
            src={denisSpeaking}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[72%_38%] [filter:brightness(0.8)_contrast(1.15)_saturate(0.9)]"
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(10,18,30,0.9) 0%, rgba(10,18,30,0.55) 28%, rgba(10,18,30,0.18) 58%, transparent 78%)",
            }}
            aria-hidden
          />
        </div>

        <div className={`${sectionLayout.container} w-full py-10 md:py-14 relative z-10`}>
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-white mb-6">
              {h.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-white font-light leading-relaxed mb-7 max-w-xl">
              {h.heroText}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                asChild
                className="bg-accent hover:bg-accent/85 text-accent-foreground font-semibold text-base px-7 py-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Link to={localizedPath("contact", lang)}>{h.primaryCta}</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border border-white/60 bg-transparent text-white hover:bg-white/10 font-medium text-base px-7 py-5 transition-colors duration-300 w-fit"
              >
                <Link to={localizedPath("cgi", lang)}>{h.secondaryCta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <TextSection title={h.painsTitle}>
        <p className={sectionLayout.subtitle}>{h.painsIntro}</p>
        <div className="mt-12 grid sm:grid-cols-2 gap-x-8 md:gap-x-16 gap-y-5">
          {h.pains.map((pain) => (
            <p
              key={pain}
              className="border-t border-border/60 pt-4 text-base md:text-[17px] leading-relaxed text-foreground/88"
            >
              {pain}
            </p>
          ))}
        </div>
        <p
          id="abordagem"
          className="mt-12 scroll-mt-28 border-t border-border/60 pt-8 text-lg md:text-xl font-medium leading-snug tracking-tight text-foreground"
        >
          {h.painsClosing}
        </p>
      </TextSection>

      <MediaAuthorityCarousel />

      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className="grid gap-10 md:grid-cols-[0.95fr_1.05fr] md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Caldeira Growth Index
              </p>
              <h2 className={`${sectionLayout.title} mt-4`}>
                {h.diagnosticTitle}
              </h2>
            </div>
            <div className="space-y-5">
              {h.diagnosticBody.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base md:text-[17px] leading-[1.75] text-foreground/88"
                >
                  {paragraph}
                </p>
              ))}
              <p className="border-l border-primary/30 pl-5 text-sm leading-relaxed text-muted-foreground">
                {h.diagnosticNote}
              </p>
              <Button asChild size="lg" className="mt-2">
                <Link to={localizedPath("cgi", lang)}>{h.diagnosticCta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h2 className={sectionLayout.title}>{h.howTitle}</h2>
          </div>
          <div className="grid md:grid-cols-5 gap-6 md:gap-8">
            {h.howSteps.map((step, index) => (
              <div key={step.title} className="border-t border-border pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="font-semibold text-foreground mb-3 leading-snug">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-muted/30 border-y border-border`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h2 className={sectionLayout.title}>{h.solutionsTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {h.solutions.map((solution) => (
              <Link
                key={solution.title}
                to={localizedPath(solution.route, lang)}
                className="group flex flex-col h-full bg-card border border-border rounded-xl p-7 shadow-sm hover:shadow-md hover:border-primary/15 transition-all"
              >
                <h3 className="font-semibold text-lg text-foreground mb-4">
                  {solution.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {solution.body}
                </p>
                <span className="mt-8 text-sm font-medium text-primary">
                  {solution.cta}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className="grid gap-10 md:grid-cols-[0.95fr_1.05fr] md:items-start">
            <div>
              <h2 className={sectionLayout.title}>{h.differenceTitle}</h2>
            </div>
            <div className="space-y-6">
              {h.differenceParagraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base md:text-[17px] leading-[1.75] text-foreground/88"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-background border-y border-border/50`}>
        <div className={sectionLayout.container}>
          <div className="grid md:grid-cols-12 gap-12 md:gap-16">
            <div className="md:col-span-5">
              <h2 className={sectionLayout.title}>{h.credentialsTitle}</h2>
            </div>
            <div className="md:col-span-7 space-y-5">
              {h.credentials.map((item) => (
                <p key={item} className="border-b border-border/45 pb-5 text-base leading-relaxed text-foreground/88 last:border-0">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h2 className={sectionLayout.title}>
              {lang === "pt"
                ? "O que dizem as lideranças com quem trabalhamos"
                : lang === "en"
                  ? "What leaders say about working with us"
                  : "Lo que dicen los líderes con quienes trabajamos"}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((item) => (
              <figure key={item.attribution} className="border-l border-primary/20 pl-6 md:pl-8">
                <blockquote className="text-lg text-foreground/90 leading-relaxed italic">
                  {item.quote}
                </blockquote>
                <figcaption className="mt-5 text-sm text-muted-foreground">
                  {item.attribution}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-muted/[0.28] border-t border-border/60`}>
        <div className={sectionLayout.container}>
          <div className={`${sectionLayout.prose} text-center mx-auto`}>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-snug">
              {h.finalTitle}
            </h2>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              {h.finalText}
            </p>
            <Button
              size="lg"
              asChild
              className="mt-10 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6"
            >
              <Link to={localizedPath("contact", lang)}>{h.finalCta}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
