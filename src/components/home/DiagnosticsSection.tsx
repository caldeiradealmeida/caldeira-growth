import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Language } from "@/lib/routing";
import { localizedPath } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";
import { homeDiagnostics } from "@/data/homeProof";

export default function DiagnosticsSection({ lang }: { lang: Language }) {
  const d = homeDiagnostics[lang];

  return (
    <section className={`${sectionLayout.sectionY} bg-background`}>
      <div className={sectionLayout.container}>
        <div className={sectionLayout.headerToContent}>
          <h2 className={`${sectionLayout.title} max-w-3xl`}>{d.title}</h2>
          <p className={sectionLayout.subtitle}>{d.intro}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {d.cards.map((card) => {
            const dark = card.route === "relay";
            return (
              <article
                key={card.name}
                className={`flex flex-col rounded-2xl border p-7 md:p-9 ${
                  dark ? "border-transparent bg-[#16202b] text-white" : "border-border bg-card text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                      dark ? "text-white/60" : "text-primary"
                    }`}
                  >
                    {card.name}
                  </p>
                  {card.badge && (
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                      {card.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight leading-snug">{card.title}</h3>
                <p className={`mt-4 flex-1 text-[15px] leading-relaxed ${dark ? "text-white/75" : "text-muted-foreground"}`}>
                  {card.body}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {card.facts.map((fact) => (
                    <li
                      key={fact}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        dark ? "border-white/15 text-white/80" : "border-border text-foreground/75"
                      }`}
                    >
                      {fact}
                    </li>
                  ))}
                </ul>
                <Link
                  to={localizedPath(card.route, lang)}
                  className={`group mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold ${
                    dark ? "text-accent" : "text-primary"
                  }`}
                >
                  {card.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
