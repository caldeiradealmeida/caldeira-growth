import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { contentHub } from "@/data/strategicContent";
import { bookSiteLinkProps } from "@/constants/book";
import { localizedPath } from "@/lib/routing";
import { sectionLayout } from "@/lib/sectionLayout";

export default function Conteudo() {
  const { lang } = useLanguage();
  const p = contentHub[lang];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <SEO routeKey="content" title={p.metaTitle} description={p.metaDescription} />

      <section className={`pt-28 ${sectionLayout.sectionY}`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h1 className={sectionLayout.title}>{p.title}</h1>
            <p className={sectionLayout.subtitle}>{p.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {p.items.map((item) => {
              const inner = (
                <>
                  <h2 className="font-semibold text-lg text-foreground mb-4">
                    {item.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {item.body}
                  </p>
                  <span className="mt-8 text-sm font-medium text-primary">
                    {item.cta}
                  </span>
                </>
              );

              if (item.kind === "book") {
                return (
                  <a
                    key={item.kind}
                    {...bookSiteLinkProps}
                    className="group flex flex-col h-full bg-card border border-border rounded-xl p-7 shadow-sm hover:shadow-md hover:border-primary/15 transition-all"
                  >
                    {inner}
                  </a>
                );
              }

              const href =
                item.kind === "articles"
                  ? localizedPath("articles", lang)
                  : item.kind === "media"
                    ? localizedPath("media", lang)
                    : localizedPath("cgi", lang);

              return (
                <Link
                  key={item.kind}
                  to={href}
                  className="group flex flex-col h-full bg-card border border-border rounded-xl p-7 shadow-sm hover:shadow-md hover:border-primary/15 transition-all"
                >
                  {inner}
                </Link>
              );
            })}
          </div>

          <div className="mt-14">
            <Button variant="outline" asChild>
              <Link to={localizedPath("contact", lang)}>
                {lang === "pt"
                  ? "Conversar sobre conteúdos e palestras"
                  : lang === "en"
                    ? "Discuss content and speaking"
                    : "Conversar sobre contenidos y conferencias"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
