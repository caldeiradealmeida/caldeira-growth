import { Link } from "react-router-dom";
import type { Language } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";
import { homeFounder } from "@/data/homeProof";
import portrait from "@/assets/denis/denis-portrait.webp";
import bookCover from "@/assets/book/cresca-ou-desapareca-3d.webp";

export default function FounderSection({ lang }: { lang: Language }) {
  const f = homeFounder[lang];

  return (
    <section className={`${sectionLayout.sectionY} bg-muted/[0.28] border-y border-border/60`}>
      <div className={sectionLayout.container}>
        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div className="mx-auto w-full max-w-sm md:max-w-none">
            <img
              src={portrait}
              alt={f.photoAlt}
              loading="lazy"
              decoding="async"
              width={900}
              height={1350}
              className="aspect-[4/5] w-full rounded-2xl object-cover object-top shadow-sm"
            />
          </div>

          <div>
            <h2 className={sectionLayout.title}>{f.title}</h2>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-foreground/80">{f.intro}</p>

            <h3 className="mt-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {f.rolesTitle}
            </h3>
            <dl className="mt-4 divide-y divide-border/60 border-y border-border/60">
              {f.roles.map((item) => (
                <div key={item.company} className="grid gap-1 py-3.5 sm:grid-cols-[9.5rem_1fr] sm:gap-6">
                  <dt className="font-semibold text-foreground">{item.company}</dt>
                  <dd className="text-[15px] leading-relaxed text-foreground/75">{item.role}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-6 flex flex-wrap gap-2">
              {f.credentials.map((item) => (
                <li key={item} className="rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-foreground/80">
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex items-center gap-6 rounded-2xl border border-border bg-background p-5 md:p-6">
              <img
                src={bookCover}
                alt={f.bookAlt}
                loading="lazy"
                decoding="async"
                width={640}
                height={838}
                className="w-20 shrink-0 md:w-24"
              />
              <div>
                <p className="font-semibold text-foreground">{f.bookTitle}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.bookBody}</p>
                {f.bookCta && (
                  <Link to="/livro" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                    {f.bookCta}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
