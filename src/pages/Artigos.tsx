import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { articles } from "@/data/articles";
import { ArrowRight } from "lucide-react";

export default function Artigos() {
  const { lang } = useLanguage();

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-20 md:pb-28 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-2xl mb-14 md:mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {lang === "pt" ? "Artigos" : "Articles"}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {lang === "pt"
                ? "Estratégia, execução, crescimento e decisão — texto aplicado para quem lidera negócios e carreiras."
                : "Strategy, execution, growth, and decision—applied writing for people leading businesses and careers."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/artigos/${article.slug}`}
                className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="aspect-[16/10] overflow-hidden bg-muted/40">
                  <img
                    src={article.cover}
                    alt={article.title[lang]}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-xs text-muted-foreground mb-2">{article.date}</p>
                  <h2 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-3 leading-snug">
                    {article.title[lang]}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1 whitespace-pre-line">
                    {article.excerpt[lang]}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-auto">
                    {lang === "pt" ? "Ler artigo" : "Read article"}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
