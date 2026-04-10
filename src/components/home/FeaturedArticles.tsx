import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { articles } from "@/data/articles";

const FEATURED_COUNT = 6;

export default function FeaturedArticles() {
  const { lang } = useLanguage();
  const c = content[lang].articles;
  const featured = articles.slice(0, FEATURED_COUNT);

  return (
    <section className="py-24 md:py-32 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mb-14 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {c.title}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {c.subtitle}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-6xl">
          {featured.map((article) => (
            <Link
              key={article.id}
              to={`/artigos/${article.slug}`}
              className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
            >
              <div className="aspect-[16/10] overflow-hidden bg-muted/40">
                <img
                  src={article.cover}
                  alt={article.title[lang]}
                  className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="p-6 md:p-7 flex flex-col flex-1">
                <p className="text-xs text-muted-foreground mb-2.5">{article.date}</p>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-3 leading-snug text-[15px] md:text-base">
                  {article.title[lang]}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1 whitespace-pre-line">
                  {article.excerpt[lang]}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-auto">
                  {c.readMore}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            to="/artigos"
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
