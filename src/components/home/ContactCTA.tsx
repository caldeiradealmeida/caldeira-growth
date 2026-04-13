import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { sectionLayout } from "@/lib/sectionLayout";
import SectionHeader from "@/components/layout/SectionHeader";

export default function ContactCTA() {
  const { lang } = useLanguage();
  const c = content[lang].contactCTA;

  return (
    <section className={`${sectionLayout.sectionY} bg-background`}>
      <div className={sectionLayout.container}>
        <div className={sectionLayout.prose}>
          <div className={sectionLayout.headerToContent}>
            <SectionHeader title={c.title} subtitle={c.subtitle} />
          </div>
          <Button
            size="lg"
            asChild
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <Link to="/contato">{c.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
