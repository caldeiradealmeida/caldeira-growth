import authorPhoto from "@/assets/author-photo.jpg";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const CALDEIRA_GROWTH_URL = "https://www.caldeiragrowth.com";

const AuthorClosing = () => {
  return (
    <section className="py-16 md:py-20 bg-muted/40 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Sobre o autor
          </h2>
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <img
                src={authorPhoto}
                alt="Denis Caldeira de Almeida"
                className="w-32 h-32 md:w-36 md:h-36 rounded-xl object-cover flex-shrink-0 mx-auto md:mx-0 shadow-md"
              />
              <div className="flex-1 text-center md:text-left">
                <p className="text-foreground leading-relaxed text-base md:text-lg">
                  Denis Caldeira é estrategista de crescimento, conselheiro, autor e palestrante, com mais de 26 anos de experiência em tecnologia e negócios. Atuou em empresas como Telefônica, Google e Meta, além de cargos executivos em empresas de alto crescimento. Hoje acompanha empresas e lideranças em decisões estratégicas e desenvolvimento executivo.
                </p>
                <div className="mt-8">
                  <Button variant="outline" size="lg" asChild className="border-primary/30 text-foreground hover:bg-muted">
                    <a
                      href={CALDEIRA_GROWTH_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      Conheça mais em Caldeira Growth
                      <ExternalLink className="h-4 w-4 opacity-70" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthorClosing;
