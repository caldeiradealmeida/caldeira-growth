import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Language } from "@/lib/routing";
import { localizedPath } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";
import { homeCase } from "@/data/homeProof";
import TestimonialVideo from "@/components/TestimonialVideo";

export default function CaseSection({ lang }: { lang: Language }) {
  const c = homeCase[lang];
  return (
    <section className={`${sectionLayout.sectionY} bg-[#0b141e] text-white`}>
      <div className={sectionLayout.container}>
        <div className="grid items-center gap-12 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{c.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight md:text-4xl">{c.title}</h2>
            <div className="mt-6 space-y-4">
              {c.paragraphs.map((p) => (
                <p key={p} className="text-base leading-relaxed text-white/75 md:text-[17px]">{p}</p>
              ))}
            </div>
            <ul className="mt-6 flex flex-wrap gap-2">
              {c.facts.map((f) => (
                <li key={f} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80">{f}</li>
              ))}
            </ul>
            <figure className="mt-10 border-l-2 border-accent pl-5">
              <blockquote className="text-lg italic leading-relaxed text-white/90">“{c.quote}”</blockquote>
              <figcaption className="mt-3 text-sm text-white/60">{c.quoteBy}</figcaption>
            </figure>
            <Link
              to={localizedPath("executiveDevelopment", lang)}
              className="group mt-10 inline-flex items-center gap-2 text-sm font-semibold text-accent"
            >
              {c.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
          <div className="mx-auto w-full max-w-[20rem]">
            <TestimonialVideo
              lang={lang}
              base="/videos/mr-edp-90s"
              poster="/videos/mr-edp-poster.webp"
              label={c.videoLabel}
              durationLabel={c.duration}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
