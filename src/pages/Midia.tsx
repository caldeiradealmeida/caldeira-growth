import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MediaSection from "@/components/home/MediaSection";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";

export default function Midia() {
  const { lang } = useLanguage();
  const c = content[lang].media;

  return (
    <main className="min-h-screen">
      <Header />
      <SEO
        routeKey="media"
        title={`${c.title} | Caldeira Growth`}
        description={c.subtitle}
      />
      <MediaSection variant="page" />
      <Footer />
    </main>
  );
}
