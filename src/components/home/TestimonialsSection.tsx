import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";
import { testimonials } from "@/data/testimonials";

export default function TestimonialsSection() {
  const { lang } = useLanguage();
  const c = content[lang].testimonials;

  return (
    <section className="py-20 md:py-28 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">
          {c.title}
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((t) => (
            <blockquote
              key={t.id}
              className="bg-card border border-border rounded-xl p-8 shadow-sm"
            >
              <p className="text-lg text-foreground leading-relaxed mb-6">
                &ldquo;{t.quote[lang]}&rdquo;
              </p>
              <footer>
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t.role ? `${t.role}, ` : ""}{t.company}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
