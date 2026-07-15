import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useArticles } from "@/hooks/useArticles";
import { articleLang } from "@/data/articles";
import { ArrowRight } from "lucide-react";
import { sectionLayout } from "@/lib/sectionLayout";
import SEO from "@/components/SEO";
import { localizedPath } from "@/lib/routing";

export default function Artigos() {
  const { lang } = useLanguage();
  const textLang = articleLang(lang);
  const { data: articles } = useArticles();
  const spanishReview = lang === "es";

  return (
    <main className="min-h-screen">
      <Header />
      <SEO
        routeKey="articles"
        title={
          lang === "pt"
            ? "Artigos | Caldeira Growth"
            : lang === "en"
              ? "Articles | Caldeira Growth"
              : "Artículos | Caldeira Growth"
        }
        description={
          lang === "pt"
            ? "Estratégia, execução, crescimento e decisão para quem lidera negócios e carreiras."
            : lang === "en"
              ? "Strategy, execution, growth and decision-making for people leading businesses and careers."
              : "La versión en español de los artículos está en revisión editorial."
        }
      />
      <section className={`pt-28 ${sectionLayout.sectionY}`}>
        <div className={sectionLayout.container}>
          <div className={sectionLayout.headerToContent}>
            <h1 className={sectionLayout.title}>
              {lang === "pt" ? "Artigos" : lang === "en" ? "Articles" : "Artículos"}
            </h1>
            <p className={sectionLayout.subtitle}>
              {lang === "pt"
                ? "Estratégia, execução, crescimento e decisão — texto aplicado para quem lidera negócios e carreiras."
                : lang === "en"
                  ? "Strategy, execution, growth, and decision—applied writing for people leading businesses and careers."
                  : "La versión en español de los artículos está en revisión editorial."}
            </p>
          </div>

          {spanishReview ? (
            <div className="border-t border-border/60 pt-8 max-w-2xl">
              <p className="text-base leading-relaxed text-foreground/85">
                Esta página está preparada para la estructura en español, pero
                los artículos individuales aún no fueron revisados para
                publicación.
              </p>
            </div>
          ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={localizedPath("article", lang, { slug: article.slug })}
                className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="aspect-[16/10] overflow-hidden bg-muted/40">
                  <img
                    src={article.cover}
                    alt={article.title[textLang]}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-xs text-muted-foreground mb-2">{article.date}</p>
                  <h2 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-3 leading-snug">
                    {article.title[textLang]}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1 whitespace-pre-line">
                    {article.excerpt[textLang]}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-auto">
                    {lang === "pt" ? "Ler artigo" : "Read article"}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
