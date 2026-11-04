import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { relayContent } from "@/data/relayContent";
import { localizedPath } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";
import type { RelayPanelImage } from "@/data/relayContent";
import placar from "@/assets/relay/placar.webp";
import mapa from "@/assets/relay/mapa.webp";
import cadeia from "@/assets/relay/cadeia.webp";
import matriz from "@/assets/relay/matriz.webp";
import organizacao from "@/assets/relay/organizacao.webp";
import dimensoesPorArea from "@/assets/relay/dimensoes-por-area.webp";
import evolucao from "@/assets/relay/evolucao.webp";
import acordos from "@/assets/relay/acordos.webp";

/** Dashboard screens from the Relay prospectus (fictitious demo data). */
const PANEL_IMAGES: Record<RelayPanelImage, { src: string; width: number; height: number; wide?: boolean }> = {
  placar: { src: placar, width: 1600, height: 170, wide: true },
  mapa: { src: mapa, width: 1126, height: 1316 },
  cadeia: { src: cadeia, width: 1600, height: 285, wide: true },
  matriz: { src: matriz, width: 1600, height: 618, wide: true },
  organizacao: { src: organizacao, width: 1126, height: 894 },
  "dimensoes-por-area": { src: dimensoesPorArea, width: 1126, height: 894 },
  evolucao: { src: evolucao, width: 1126, height: 620 },
  acordos: { src: acordos, width: 1600, height: 668, wide: true },
};

export default function Relay() {
  const { lang } = useLanguage();
  const r = relayContent[lang];
  const demoHref = `${localizedPath("contact", lang)}?tema=relay`;

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <SEO routeKey="relay" title={r.meta.title} description={r.meta.description} />

      {/* Hero */}
      <section className="bg-[#0b141e] pt-32 pb-20 text-white md:pt-40 md:pb-28">
        <div className={sectionLayout.container}>
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{r.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">{r.heroTitle}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">{r.heroText}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-accent px-7 py-5 text-base font-semibold text-accent-foreground hover:bg-accent/85"
              >
                <Link to={demoHref}>{r.primaryCta}</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-fit border border-white/60 bg-transparent px-7 py-5 text-base font-medium text-white hover:bg-white/10"
              >
                <a href="#como-funciona">{r.secondaryCta}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* The gap */}
      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <h2 className={sectionLayout.title}>{r.gapTitle}</h2>
            <div className="space-y-5">
              {r.gapParagraphs.map((p) => (
                <p key={p} className="text-base leading-[1.75] text-foreground/85 md:text-[17px]">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className={`${sectionLayout.sectionY} scroll-mt-20 border-y border-border/60 bg-muted/[0.28]`}>
        <div className={sectionLayout.container}>
          <h2 className={`${sectionLayout.title} ${sectionLayout.headerToContent}`}>{r.stepsTitle}</h2>
          <ol className="grid gap-6 md:grid-cols-4 md:gap-8">
            {r.steps.map((step, i) => (
              <li key={step.title} className="border-t border-border pt-5">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mb-3 font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Dimensions */}
      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h2 className={sectionLayout.title}>{r.dimensionsTitle}</h2>
            <p className={sectionLayout.subtitle}>{r.dimensionsIntro}</p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {r.dimensions.map((d) => (
              <li key={d.letter} className="flex gap-4 bg-card p-6">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                  aria-hidden
                >
                  {d.letter}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{d.name}</h3>
                  <p className="mt-1.5 text-sm italic leading-relaxed text-muted-foreground">“{d.statement}”</p>
                </div>
              </li>
            ))}
          </ul>
          <ul className="mt-6 flex flex-wrap gap-3 text-sm text-foreground/80">
            {r.scale.map((s, i) => (
              <li key={s.range} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    i === 0 ? "bg-red-500/70" : i === 1 ? "bg-amber-400" : "bg-emerald-500/80"
                  }`}
                  aria-hidden
                />
                <span>
                  <strong className="font-semibold">{s.range}</strong>: {s.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Dashboard */}
      <section className={`${sectionLayout.sectionY} bg-[#0b141e] text-white`}>
        <div className={sectionLayout.container}>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{r.panelTitle}</h2>
            <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">{r.panelIntro}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-accent">{r.panelNote}</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
            {r.panelItems.map((item) => {
              const image = PANEL_IMAGES[item.image];
              return (
                <figure
                  key={item.image}
                  className={`flex flex-col overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10 ${
                    image.wide ? "md:col-span-2" : ""
                  }`}
                >
                  <div className="bg-[#f7f4ee] p-3 md:p-4">
                    <img
                      src={image.src}
                      alt={item.title}
                      width={image.width}
                      height={image.height}
                      loading="lazy"
                      decoding="async"
                      className="h-auto w-full rounded-md"
                    />
                  </div>
                  <figcaption className="p-5 md:p-6">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{item.body}</p>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* White label, rigor, formats */}
      <section className={`${sectionLayout.sectionY} bg-background`}>
        <div className={`${sectionLayout.container} grid gap-14 md:grid-cols-2 md:gap-16`}>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{r.whiteLabelTitle}</h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/80">{r.whiteLabelBody}</p>

            <h2 className="mt-12 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{r.rigorTitle}</h2>
            <ul className="mt-5 space-y-3">
              {r.rigor.map((item) => (
                <li key={item} className="border-l-2 border-primary/30 pl-4 text-[15px] leading-relaxed text-foreground/80">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{r.formatsTitle}</h2>
            <ul className="mt-5 divide-y divide-border/70 border-y border-border/70">
              {r.formats.map((f) => (
                <li key={f.name} className="py-4">
                  <p className="font-semibold text-foreground">{f.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${sectionLayout.sectionY} border-t border-border/60 bg-muted/[0.28]`}>
        <div className={`${sectionLayout.container} ${sectionLayout.prose} mx-auto text-center`}>
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-3xl">{r.finalTitle}</h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">{r.finalText}</p>
          <Button
            size="lg"
            asChild
            className="mt-10 bg-accent px-8 py-6 font-semibold text-accent-foreground hover:bg-accent/90"
          >
            <Link to={demoHref}>{r.finalCta}</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
