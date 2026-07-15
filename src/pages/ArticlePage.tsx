import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useArticles } from "@/hooks/useArticles";
import { getArticleFromList } from "@/data/sheetArticles";
import { articleLang } from "@/data/articles";
import { localizedPath } from "@/lib/routing";
import { ArrowLeft } from "lucide-react";
import NotFound from "./NotFound";
import SEO from "@/components/SEO";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const textLang = articleLang(lang);
  const { data: articles, isFetching } = useArticles();
  const article = slug ? getArticleFromList(slug, articles) : undefined;

  if (!article && !isFetching) {
    return <NotFound />;
  }

  if (lang === "es") {
    return (
      <main className="min-h-screen">
        <Header />
        <SEO
          routeKey="article"
          title="Artículo en revisión | Caldeira Growth"
          description="La versión en español de este artículo está en revisión editorial."
        />
        <div className="pt-28 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <Link
              to={localizedPath("articles", lang)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Artículos
            </Link>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Artículo en revisión editorial
            </h1>
            <p className="mt-6 text-base leading-relaxed text-foreground/85">
              La estructura de esta URL ya está preparada, pero el contenido en
              español no está publicado.
            </p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-28 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">
              {lang === "pt" ? "Carregando artigo..." : "Loading article..."}
            </p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const text = article.content[textLang];
  const paragraphs = text.split(/\n\n+/).filter(Boolean);

  return (
    <main className="min-h-screen">
      <Header />
      <SEO
        routeKey="article"
        title={`${article.title[textLang]} | Caldeira Growth`}
        description={article.excerpt[textLang]}
      />
      <article className="pt-24 md:pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to={localizedPath("articles", lang)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "pt" ? "Artigos" : "Articles"}
          </Link>

          <div className="rounded-xl overflow-hidden border border-border bg-muted/20 mb-10 shadow-sm">
            <img
              src={article.cover}
              alt={article.title[textLang]}
              className="w-full h-auto object-cover max-h-[420px] object-center"
            />
          </div>

          <p className="text-sm text-muted-foreground mb-3">{article.date}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-10 leading-tight">
            {article.title[textLang]}
          </h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-base md:text-[17px] leading-relaxed text-foreground/90">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {p}
              </p>
            ))}
          </div>
        </div>
      </article>
      <Footer />
    </main>
  );
}
