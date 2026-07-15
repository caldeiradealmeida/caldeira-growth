import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { articleLang } from "@/data/articles";
import { useArticles } from "@/hooks/useArticles";
import { sectionLayout } from "@/lib/sectionLayout";
import SectionHeader from "@/components/layout/SectionHeader";
import { localizedPath } from "@/lib/routing";

const FEATURED_COUNT = 6;

export default function FeaturedArticles() {
  const { lang } = useLanguage();
  const textLang = articleLang(lang);
  const c = content[lang].articles;
  const { data: articles } = useArticles();
  const featured = articles.slice(0, FEATURED_COUNT);

  return (
    <section
      className={`${sectionLayout.sectionY} bg-muted/30 border-y border-border`}
    >
      <div className={sectionLayout.container}>
        <div className={sectionLayout.headerToContent}>
          <SectionHeader title={c.title} subtitle={c.subtitle} />
        </div>
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${sectionLayout.cardsGap}`}>
          {featured.map((article) => (
            <Link
              key={article.id}
              to={localizedPath("article", lang, { slug: article.slug })}
              className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 h-full"
            >
              <div className="aspect-[16/10] overflow-hidden bg-muted/40">
                <img
                  src={article.cover}
                  alt={article.title[textLang]}
                  className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="p-6 md:p-7 flex flex-col flex-1">
                <p className="text-xs text-muted-foreground mb-2.5">{article.date}</p>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-3 leading-snug text-[15px] md:text-base">
                  {article.title[textLang]}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1 whitespace-pre-line">
                  {article.excerpt[textLang]}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-auto">
                  {c.readMore}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 md:mt-14 text-center">
          <Link
            to={localizedPath("articles", lang)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {lang === "pt" ? "Ver todos os artigos" : "View all articles"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
