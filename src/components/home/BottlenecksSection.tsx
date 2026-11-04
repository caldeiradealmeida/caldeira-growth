import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Language } from "@/lib/routing";
import { localizedPath } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";
import { homeBottlenecks } from "@/data/homeProof";

export default function BottlenecksSection({ lang }: { lang: Language }) {
  const b = homeBottlenecks[lang];
  const left = Number(b.highlight.leftValue);
  const right = Number(b.highlight.rightValue);

  return (
    <section id="abordagem" className={`${sectionLayout.sectionY} scroll-mt-20 bg-[#0b141e] text-white`}>
      <div className={sectionLayout.container}>
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{b.eyebrow}</p>
            <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.08]">{b.title}</h2>
            <p className="mt-5 max-w-xl text-base md:text-lg leading-relaxed text-white/75">{b.intro}</p>
          </div>

          <figure className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
            <div className="space-y-4" aria-hidden>
              {[
                { value: left, label: b.highlight.leftLabel, tone: "bg-accent" },
                { value: right, label: b.highlight.rightLabel, tone: "bg-white/40" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-white/75">{row.label}</span>
                    <span className="text-3xl font-semibold tabular-nums">{row.value}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <figcaption className="mt-5 text-sm leading-relaxed text-white/80">
              <span className="sr-only">
                {b.highlight.leftLabel}: {b.highlight.leftValue}. {b.highlight.rightLabel}: {b.highlight.rightValue}.{" "}
              </span>
              {b.highlight.text}
            </figcaption>
          </figure>
        </div>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {b.items.map((item) => (
            <li key={item.title} className="flex flex-col bg-[#0b141e] p-6 md:p-7">
              <h3 className="text-lg font-semibold leading-snug">{item.title}</h3>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-white/70">{item.body}</p>
              {item.evidence && (
                <p className="mt-5 border-t border-white/10 pt-4 text-sm font-medium leading-snug text-accent">
                  {item.evidence}
                </p>
              )}
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {b.sourceLabels[item.source]}
              </p>
            </li>
          ))}
          <li className="flex flex-col justify-between gap-6 bg-[#121d29] p-6 md:p-7">
            <p className="text-xl font-semibold leading-snug">{b.ctaTitle}</p>
            <Link
              to={localizedPath("cgi", lang)}
              className="group inline-flex w-fit items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/85"
            >
              {b.ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        </ul>

        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-white/50">{b.footnote}</p>
      </div>
    </section>
  );
}
