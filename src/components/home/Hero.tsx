import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { content } from "@/data/content";

import denisSpeaking from "@/assets/denis/speaking-denis.png";
import { bookSiteLinkProps } from "@/constants/book";

export default function Hero() {
  const { lang } = useLanguage();
  const c = content[lang].hero;

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden pt-20">
      {/* Dark background — graphite/slate tone */}
      <div className="absolute inset-0 bg-[#0a121a]" aria-hidden />

      {/* Imagem começa abaixo do header (evita que a banda branca corte a cabeça) */}
      <div className="absolute top-16 md:top-20 left-0 right-0 bottom-0 lg:left-[32%] overflow-hidden">
        <img
          src={denisSpeaking}
          alt="Denis Caldeira palestrando"
          className="absolute inset-0 w-full h-full object-cover object-[72%_38%] [filter:brightness(0.8)_contrast(1.15)_saturate(0.9)]"
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(10,18,30,0.88) 0%, rgba(10,18,30,0.5) 25%, rgba(10,18,30,0.15) 50%, transparent 75%)",
          }}
          aria-hidden
        />
      </div>

      <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
        <div className="max-w-6xl">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-white mb-5">
              {c.headline}
            </h1>
            <p className="text-lg md:text-xl text-white font-light leading-relaxed mb-6">
              {c.subhead}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                asChild
                className="bg-accent hover:bg-accent/85 text-accent-foreground font-semibold text-base px-7 py-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Link to="/contato">{c.ctaContact}</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border border-white/60 bg-transparent text-white hover:bg-white/10 font-medium text-base px-7 py-5 transition-colors duration-300 w-fit"
              >
                <a {...bookSiteLinkProps}>{c.ctaBook}</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
