import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import denisSpeaking from "@/assets/denis/speaking-denis.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { speakingContent } from "@/data/strategicContent";
import { localizedPath } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";

export default function Palestras() {
  const { lang } = useLanguage();
  const p = speakingContent[lang];

  return (
    <main className="min-h-screen">
      <Header />
      <SEO routeKey="speaking" title={p.metaTitle} description={p.metaDescription} />

      <section className="pt-28 pb-24 md:pb-32">
        <div className={sectionLayout.container}>
          <div className="mb-14 md:mb-16">
            <div className="aspect-[16/9] md:aspect-[21/9] max-w-4xl overflow-hidden">
              <img
                src={denisSpeaking}
                alt={
                  lang === "pt"
                    ? "Denis Caldeira palestrando"
                    : lang === "en"
                      ? "Denis Caldeira speaking"
                      : "Denis Caldeira dando una conferencia"
                }
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
          <div className={sectionLayout.prose}>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground mb-8 md:mb-10">
              {p.eyebrow}
            </p>
            <h1 className={sectionLayout.title}>{p.title}</h1>
            <p className={sectionLayout.subtitle}>{p.subtitle}</p>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} border-y border-border/60 bg-muted/[0.28]`}>
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

      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h2 className={sectionLayout.title}>{p.themesTitle}</h2>
          </div>
          <div className="space-y-10 max-w-4xl">
            {p.themes.map((theme) => (
              <div key={theme.title} className="grid md:grid-cols-12 gap-5 md:gap-8 border-t border-border/60 pt-8">
                <h3 className="md:col-span-4 font-semibold text-foreground leading-snug">
                  {theme.title}
                </h3>
                <p className="md:col-span-8 text-base leading-relaxed text-foreground/85">
                  {theme.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-muted/[0.28] border-y border-border/60`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.prose}>
            <h2 className={`${sectionLayout.title} mb-10`}>{p.experienceTitle}</h2>
            <div className="space-y-5">
              {p.experience.map((item) => (
                <p key={item} className="text-base md:text-[17px] leading-[1.75] text-foreground/88">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-background`}>
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
              className="mt-10 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6"
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
