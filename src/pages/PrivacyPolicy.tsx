import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import type { PrivacySection } from "@/data/content";

const CONTACT_EMAIL = "contato@caldeiragrowth.com";

function BodyWithEmail({ body }: { body: string }) {
  if (!body.includes(CONTACT_EMAIL)) {
    return <>{body}</>;
  }
  const parts = body.split(CONTACT_EMAIL);
  return (
    <>
      {parts[0]}
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="text-primary underline-offset-4 hover:underline font-medium"
      >
        {CONTACT_EMAIL}
      </a>
      {parts[1] ?? ""}
    </>
  );
}

function PrivacySectionBlock({ section }: { section: PrivacySection }) {
  if (section.kind === "bullets") {
    return (
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
          {section.title}
        </h2>
        <p className="text-base text-foreground/90 leading-[1.75]">{section.intro}</p>
        <ul className="list-disc pl-6 space-y-2 text-base text-foreground/90 leading-[1.75] marker:text-muted-foreground">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
        {section.title}
      </h2>
      <p className="text-base text-foreground/90 leading-[1.75]">
        <BodyWithEmail body={section.body} />
      </p>
    </section>
  );
}

export default function PrivacyPolicy() {
  const { lang } = useLanguage();
  const p = content[lang].privacyPage;

  useEffect(() => {
    const prevTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? "";

    document.title = p.metaTitle;
    if (meta) {
      meta.setAttribute("content", p.metaDescription);
    }

    return () => {
      document.title = prevTitle;
      if (meta) {
        meta.setAttribute("content", prevDesc);
      }
    };
  }, [p.metaTitle, p.metaDescription]);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <article className="pt-28 md:pt-32 pb-20 md:pb-28 px-4">
        <div className="container mx-auto max-w-3xl">
          <header className="mb-12 md:mb-14">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              {p.title}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {p.updated}
            </p>
          </header>

          <p className="text-base md:text-[17px] text-foreground/90 leading-[1.8] mb-12 md:mb-14">
            {p.intro}
          </p>

          <div className="space-y-12 md:space-y-14">
            {p.sections.map((section) => (
              <PrivacySectionBlock key={section.title} section={section} />
            ))}
          </div>

          <footer className="mt-16 md:mt-20 pt-10 md:pt-12 border-t border-border/60 space-y-3 text-sm md:text-[15px] text-muted-foreground leading-relaxed">
            {p.legalLines.map((line, i) =>
              line === "" ? (
                <div key={`sp-${i}`} className="h-2" aria-hidden />
              ) : (
                <p key={`legal-${i}`}>
                  {line.includes(CONTACT_EMAIL) ? (
                    <>
                      {line.split(CONTACT_EMAIL)[0]}
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-primary underline-offset-4 hover:underline font-medium"
                      >
                        {CONTACT_EMAIL}
                      </a>
                      {line.split(CONTACT_EMAIL)[1] ?? ""}
                    </>
                  ) : (
                    line
                  )}
                </p>
              )
            )}
          </footer>
        </div>
      </article>
      <Footer />
    </main>
  );
}
