import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { cn } from "@/lib/utils";

export default function ContactCTA() {
  const { lang } = useLanguage();
  const c = content[lang].contactCTA;

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className={cn(
              "text-3xl md:text-4xl font-bold text-foreground",
              c.subtitle ? "mb-4" : "mb-8"
            )}
          >
            {c.title}
          </h2>
          {c.subtitle ? (
            <p className="text-lg text-muted-foreground mb-8">{c.subtitle}</p>
          ) : null}
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
