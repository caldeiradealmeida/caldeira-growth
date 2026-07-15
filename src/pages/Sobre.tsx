import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { aboutContent } from "@/data/strategicContent";
import { localizedPath } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";
import denisAbout from "@/assets/denis/about.jpeg";

export default function Sobre() {
  const { lang } = useLanguage();
  const p = aboutContent[lang];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <SEO routeKey="about" title={p.metaTitle} description={p.metaDescription} />

      <section className="pt-28 md:pt-36 pb-24 md:pb-32">
        <div className={sectionLayout.container}>
          <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-start">
            <div className="md:col-span-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground mb-8 md:mb-10">
                {p.eyebrow}
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.12] mb-8 md:mb-10">
                {p.title}
              </h1>
              <p className={`${sectionLayout.subtitle} text-foreground/85`}>
                {p.subtitle}
              </p>
            </div>
            <div className="md:col-span-5">
              <div className="rounded-lg overflow-hidden bg-muted/40 border border-border/60 shadow-sm max-w-sm md:ml-auto">
                <img
                  src={denisAbout}
                  alt="Denis Caldeira"
                  className="w-full h-auto object-contain object-center block"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} border-y border-border/60 bg-muted/[0.28]`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.prose}>
            <h2 className={`${sectionLayout.title} mb-12`}>
              {p.institutionalTitle}
            </h2>
            <div className="space-y-16">
              {p.manifesto.map((block) => (
                <section key={block.title} className="space-y-5">
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                    {block.title}
                  </h3>
                  {block.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-base md:text-[17px] leading-[1.8] text-foreground/88">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className="grid md:grid-cols-12 gap-12 md:gap-16">
            <div className="md:col-span-5">
              <h2 className={sectionLayout.title}>{p.trajectoryTitle}</h2>
            </div>
            <div className="md:col-span-7 space-y-6">
              {p.trajectory.map((paragraph) => (
                <p key={paragraph} className="text-base md:text-[17px] leading-[1.75] text-foreground/88">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionLayout.sectionY} bg-muted/[0.28] border-y border-border/60`}>
        <div className={sectionLayout.container}>
          <div className="grid md:grid-cols-12 gap-12 md:gap-16">
            <div className="md:col-span-5">
              <h2 className={sectionLayout.title}>{p.credentialsTitle}</h2>
            </div>
            <div className="md:col-span-7 space-y-5">
              {p.credentials.map((item) => (
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
          <div className={`${sectionLayout.prose} text-center mx-auto`}>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-snug">
              {p.ctaTitle}
            </h2>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              {p.ctaText}
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

