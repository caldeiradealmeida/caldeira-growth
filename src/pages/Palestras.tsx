import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import denisSpeaking from "@/assets/denis/speaking-denis.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";

export default function Palestras() {
  const { lang } = useLanguage();
  const p = content[lang].speakingPage;

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-24 md:pb-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16 md:mb-24">
            <div className="aspect-[16/9] md:aspect-[21/9] max-w-4xl mx-auto overflow-hidden">
              <img
                src={denisSpeaking}
                alt={lang === "pt" ? "Denis Caldeira palestrando" : "Denis Caldeira speaking"}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {p.headline}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {p.subtitle}
            </p>
            <div className="mt-14 pt-10 border-t border-border/60">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6">
                {p.themesTitle}
              </p>
              <ul className="space-y-4">
                {p.themes.map((t) => (
                  <li
                    key={t}
                    className="text-base text-foreground/90 leading-relaxed border-b border-border/45 pb-4 last:border-0 last:pb-0"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
