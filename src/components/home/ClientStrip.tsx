import type { Language } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";
import { homeClients } from "@/data/homeProof";
import { CLIENT_LOGOS } from "./clientLogos";

/** Client logos right below the hero, all rendered in the same gray. */
export default function ClientStrip({ lang }: { lang: Language }) {
  const c = homeClients[lang];
  return (
    <section className="border-b border-border/60 bg-background py-10 md:py-12" aria-labelledby="home-clients-label">
      <div className={sectionLayout.container}>
        <p
          id="home-clients-label"
          className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
        >
          {c.label}
        </p>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-7 md:gap-x-14">
          {CLIENT_LOGOS.map((logo) => (
            <li key={logo.name} className="flex items-center">
              <img
                src={logo.src}
                alt={logo.name}
                title={logo.name}
                loading="lazy"
                decoding="async"
                style={{ height: logo.height }}
                className="w-auto max-w-[9.5rem] object-contain opacity-55 [filter:brightness(0)] transition-opacity hover:opacity-80"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
