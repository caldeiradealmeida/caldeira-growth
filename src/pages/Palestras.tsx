import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import denisSpeaking from "@/assets/denis/speaking-denis.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { sectionLayout } from "@/lib/sectionLayout";

export default function Palestras() {
  const { lang } = useLanguage();
  const p = content[lang].speakingPage;

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-24 md:pb-32">
        <div className={sectionLayout.container}>
          <div className="mb-14 md:mb-16">
            <div className="aspect-[16/9] md:aspect-[21/9] max-w-4xl overflow-hidden">
              <img
                src={denisSpeaking}
                alt={
                  lang === "pt"
                    ? "Denis Caldeira palestrando"
                    : "Denis Caldeira speaking"
                }
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
          <div className={sectionLayout.prose}>
            <h1 className={sectionLayout.title}>{p.headline}</h1>
            <p className={sectionLayout.subtitle}>{p.subtitle}</p>
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
