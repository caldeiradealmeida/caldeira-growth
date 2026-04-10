import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";

import denisAbout from "@/assets/denis/about.jpeg";

export default function AboutSection() {
  const { lang } = useLanguage();
  const c = content[lang].about;

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-start">
            {/* Foto inteira — object-contain, sem corte de pés */}
            <div className="md:col-span-5 order-1">
              <div className="rounded-lg overflow-hidden bg-muted/40 border border-border/60 shadow-sm max-w-md mx-auto md:mx-0">
                <img
                  src={denisAbout}
                  alt="Denis Caldeira"
                  className="w-full h-auto object-contain object-center block"
                />
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col justify-start md:py-2 space-y-8 order-2">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-6">
                  {c.title}
                </h2>
                <p className="text-base md:text-lg text-foreground/90 leading-relaxed max-w-2xl">
                  {c.body}
                </p>
              </div>

              <div className="space-y-5 pt-2 border-t border-border max-w-2xl">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {c.experienceLine}
                  </p>
                  <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                    {c.companiesLine}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {c.councilsIntro}
                  </p>
                  <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                    {c.councilsLine}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
