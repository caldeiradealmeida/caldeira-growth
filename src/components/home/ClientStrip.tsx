import type { Language } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";
import { homeClients } from "@/data/homeProof";

/**
 * Client names right below the hero. Set as typography for now; swap each name
 * for its logo once the client has approved the use of its brand.
 */
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
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:gap-x-12">
          {c.names.map((name) => (
            <li
              key={name}
              className="text-base md:text-lg font-semibold tracking-tight text-foreground/55"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
