import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { executiveContent } from "@/data/strategicContent";
import { localizedPath } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";

export default function DesenvolvimentoExecutivo() {
  const { lang } = useLanguage();
  const p = executiveContent[lang];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <SEO
        routeKey="executiveDevelopment"
        title={p.metaTitle}
        description={p.metaDescription}
      />

      <section className="pt-28 md:pt-36 pb-24 md:pb-32">
        <div className={sectionLayout.container}>
          <div className={sectionLayout.prose}>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground mb-8 md:mb-10">
              {p.eyebrow}
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.12] mb-8 md:mb-10">
              {p.title}
            </h1>
            <p className={`${sectionLayout.subtitle} text-foreground/85 mb-12 md:mb-14`}>
              {p.subtitle}
            </p>
            <Button
              size="lg"
              asChild
              variant="outline"
              className="w-full sm:w-auto h-auto min-h-11 rounded-sm border-foreground/20 bg-transparent px-8 py-4 text-center text-base font-medium tracking-wide whitespace-normal hover:bg-foreground hover:text-background transition-colors"
            >
              <Link to={localizedPath("contact", lang)}>{p.cta}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} border-t border-border/60`}>
        <div className={sectionLayout.container}>
          <div className={`${sectionLayout.prose} space-y-6`}>
            {p.intro.map((paragraph) => (
              <p key={paragraph} className="text-base md:text-[17px] leading-[1.75] text-foreground/88">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-muted/[0.35] border-y border-border/60`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h2 className={sectionLayout.title}>{p.painsTitle}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-5">
            {p.pains.map((pain) => (
              <p key={pain} className="border-t border-border/60 pt-4 text-base leading-relaxed text-foreground/88">
                {pain}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className={sectionLayout.title}>{p.pdeTitle}</h2>
            </div>
            <div className="lg:col-span-7">
              <div className="space-y-6 mb-10">
                {p.pdeParagraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base md:text-[17px] leading-[1.75] text-foreground/88">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {p.topics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="rounded-sm font-normal">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-muted/[0.28] border-y border-border/60`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.prose}>
            <div className={sectionLayout.headerToContent}>
              <h2 className={sectionLayout.title}>{p.caseTitle}</h2>
            </div>
            <div className="space-y-6">
              {p.caseText.map((paragraph) => (
                <p key={paragraph} className="text-base md:text-[17px] leading-[1.75] text-foreground/88">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {p.caseTestimonials.slice(0, 2).map((item) => (
                <figure
                  key={item.name}
                  className="border-l border-primary/25 pl-6"
                >
                  <blockquote className="text-base leading-relaxed text-foreground/90">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-5 text-sm text-muted-foreground">
                    <strong className="text-foreground">{item.name}</strong>
                    <br />
                    {item.role}
                    <br />
                    {item.company}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <div>
              <h2 className={sectionLayout.title}>{p.workshopsTitle}</h2>
              <p className={`${sectionLayout.subtitle} mb-8`}>{p.workshopsText}</p>
              <ul className="space-y-3">
                {p.workshops.map((item) => (
                  <li key={item} className="border-b border-border/45 pb-3 text-sm text-foreground/85">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className={sectionLayout.title}>{p.mentoringTitle}</h2>
              <p className={`${sectionLayout.subtitle} mb-8`}>{p.mentoringText}</p>
              <ul className="space-y-3">
                {p.mentoring.map((item) => (
                  <li key={item} className="border-b border-border/45 pb-3 text-sm text-foreground/85">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-muted/[0.28] border-t border-border/60`}>
        <div className={sectionLayout.container}>
          <div className={`${sectionLayout.prose} text-center mx-auto`}>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-snug">
              {p.finalTitle}
            </h2>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              {p.finalText}
            </p>
            <Button
              size="lg"
              asChild
              className="mt-10 w-full sm:w-auto h-auto min-h-11 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-4 text-center whitespace-normal"
            >
              <Link to={localizedPath("contact", lang)}>{p.cta}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
