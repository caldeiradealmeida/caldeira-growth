import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { mentoringContent, MENTORING_WHATSAPP } from "@/data/mentoringContent";
import { testimonials } from "@/data/strategicContent";
import { pushDataLayerEvent } from "@/lib/analytics";
import { localizedPath } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";
import denisPortrait from "@/assets/denis/about.jpeg";

/**
 * Página da mentoria executiva. Sem preço: o valor entra na proposta individual,
 * depois da conversa inicial.
 *
 * Eventos enviados ao dataLayer do GTM (sem dados pessoais):
 *   mentoring_cta_click  { location, channel }  channel: "whatsapp" | "form"
 */
export default function Mentoria() {
  const { lang } = useLanguage();
  const m = mentoringContent[lang];
  const whatsappHref = `https://wa.me/${MENTORING_WHATSAPP}?text=${encodeURIComponent(m.whatsappMessage)}`;
  const formHref = `${localizedPath("contact", lang)}?tema=mentoria`;
  const track = (location: string, channel: "whatsapp" | "form") => {
    pushDataLayerEvent("mentoring_cta_click", { location, channel });
  };
  const testimonial = testimonials[0];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <SEO routeKey="mentoring" title={m.meta.title} description={m.meta.description} />

      {/* Hero */}
      <section className="bg-[#0b141e] pt-32 pb-20 text-white md:pt-40 md:pb-28">
        <div className={sectionLayout.container}>
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{m.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">{m.heroTitle}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">{m.heroText}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-accent px-7 py-5 text-base font-semibold text-accent-foreground hover:bg-accent/85"
              >
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => track("hero", "whatsapp")}>
                  {m.primaryCta}
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-fit border border-white/60 bg-transparent px-7 py-5 text-base font-medium text-white hover:bg-white/10"
              >
                <a href="#como-funciona">{m.secondaryCta}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Para quem */}
      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h2 className={sectionLayout.title}>{m.whoTitle}</h2>
            <p className={sectionLayout.subtitle}>{m.whoIntro}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {m.who.map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-7 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Temas */}
      <section className={`${sectionLayout.sectionY} border-y border-border/60 bg-muted/[0.28]`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h2 className={sectionLayout.title}>{m.themesTitle}</h2>
            <p className={sectionLayout.subtitle}>{m.themesIntro}</p>
          </div>
          <div className="grid gap-10 md:grid-cols-2 md:gap-14">
            {m.themeGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {group.title}
                </p>
                <ul className="divide-y divide-border border-y border-border">
                  {group.items.map((item) => (
                    <li key={item.name} className="py-4">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className={`${sectionLayout.sectionY} scroll-mt-20 bg-background`}>
        <div className={sectionLayout.container}>
          <h2 className={`${sectionLayout.title} ${sectionLayout.headerToContent}`}>{m.howTitle}</h2>
          <ol className="grid gap-6 md:grid-cols-4 md:gap-8">
            {m.steps.map((step, i) => (
              <li key={step.title} className="border-t border-border pt-5">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mb-3 font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>

          <h3 className="mb-8 mt-20 text-2xl font-semibold tracking-tight text-foreground">{m.formatsTitle}</h3>
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            {m.formats.map((format) => (
              <div key={format.name} className="flex flex-col rounded-xl border border-border bg-card p-7 shadow-sm">
                <h4 className="text-lg font-semibold text-foreground">{format.name}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{format.summary}</p>
                <ul className="mt-6 space-y-3 border-t border-border pt-6 text-sm text-foreground/85">
                  {format.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limites */}
      <section className={`${sectionLayout.sectionY} bg-[#0b141e] text-white`}>
        <div className={sectionLayout.container}>
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{m.limitsTitle}</h2>
              <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">{m.limitsIntro}</p>
            </div>
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {m.limits.map((item) => (
                <li key={item} className="py-4 text-base text-white/85">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className="grid items-start gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <div className="mx-auto max-w-md overflow-hidden rounded-lg border border-border/60 bg-muted/40 shadow-sm md:mx-0">
                <img src={denisPortrait} alt="Denis Caldeira" className="block h-auto w-full object-contain" />
              </div>
            </div>
            <div className="md:col-span-7 md:py-2">
              <h2 className={`${sectionLayout.title} mb-6`}>{m.aboutTitle}</h2>
              <div className="max-w-2xl space-y-5">
                {m.aboutParagraphs.map((p) => (
                  <p key={p} className="text-base leading-[1.75] text-foreground/90 md:text-lg">
                    {p}
                  </p>
                ))}
              </div>
              <ul className="mt-8 flex max-w-2xl flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6 text-sm font-medium text-foreground/80">
                {m.aboutFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimento */}
      {testimonial ? (
        <section className={`${sectionLayout.sectionY} border-y border-border/60 bg-muted/[0.28]`}>
          <div className={sectionLayout.container}>
            <h2 className={`${sectionLayout.title} ${sectionLayout.headerToContent}`}>{m.testimonialTitle}</h2>
            <figure className="max-w-3xl border-l border-primary/20 pl-6 md:pl-8">
              <blockquote className="text-xl italic leading-relaxed text-foreground/90 md:text-2xl">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-5 text-sm text-muted-foreground">{testimonial.attribution}</figcaption>
            </figure>
          </div>
        </section>
      ) : null}

      {/* CTA final */}
      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className={`${sectionLayout.prose} mx-auto text-center`}>
            <h2 className="text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-3xl">
              {m.finalTitle}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">{m.finalText}</p>
            <Button
              size="lg"
              asChild
              className="mt-10 bg-accent px-8 py-6 font-semibold text-accent-foreground hover:bg-accent/90"
            >
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => track("final", "whatsapp")}>
                {m.primaryCta}
              </a>
            </Button>
            <p className="mt-5 text-sm">
              <Link
                to={formHref}
                onClick={() => track("final", "form")}
                className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {m.formCta}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
