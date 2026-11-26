import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { mentoringContent } from "@/data/mentoringContent";
import { localizedPath, type Language } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";

/** Chamada da mentoria executiva na home (produto em foco). */
export default function MentoringSection({ lang }: { lang: Language }) {
  const h = mentoringContent[lang].home;

  return (
    <section className={`${sectionLayout.sectionY} border-b border-border/60 bg-[#f7f4ee]`}>
      <div className={sectionLayout.container}>
        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{h.eyebrow}</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">{h.title}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/85 md:text-lg">{h.text}</p>
            <Button
              size="lg"
              asChild
              className="mt-9 bg-accent px-7 py-5 text-base font-semibold text-accent-foreground hover:bg-accent/85"
            >
              <Link to={localizedPath("mentoring", lang)}>{h.cta}</Link>
            </Button>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {h.bullets.map((item) => (
              <li key={item} className="py-4 text-base font-medium text-foreground/90">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
