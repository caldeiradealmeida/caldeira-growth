import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Footer from "@/components/Footer";
import bookCover3D from "@/assets/3D__.png";
import { Instagram, Linkedin, Mail, Globe } from "lucide-react";

const AMAZON_URL = "https://a.co/d/11Q3Kio?utm_source=landing650&utm_campaign=desafio650";

// Progresso estimado — edite aqui para atualizar
const PROGRESSO_ESTIMADO = 227;
const META_PUBLICA = 650;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const Desafio650 = () => {
  useEffect(() => {
    // Tracking: acesso à página /650
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view_650",
      page_path: "/650",
      page_title: "650 leitores em 7 dias",
    });
    console.log("Tracking 650:", "page_view_650");

    const prevTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const prevContent = metaDescription?.getAttribute("content") || "";

    document.title = "650 leitores em 7 dias | Cresça ou Desapareça";
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Estudo de caso público aplicando os princípios de Cresça ou Desapareça para alcançar a lista nacional de mais vendidos."
      );
    }

    return () => {
      document.title = prevTitle;
      if (metaDescription) metaDescription.setAttribute("content", prevContent);
    };
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-primary-foreground space-y-6">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                650 leitores em 7 dias.
              </h1>
              <p className="text-xl md:text-2xl text-primary-foreground/90 font-light leading-relaxed max-w-xl">
                Estamos aplicando os princípios de Cresça ou Desapareça ao próprio lançamento. Meta
                pública. Execução estratégica. Crescimento real.
              </p>
              <div className="pt-4">
                <Button
                  size="lg"
                  asChild
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <a
                    href={AMAZON_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-amazon-new-tab="true"
                    onClick={(e) => {
                      e.preventDefault();

                      window.dataLayer = window.dataLayer || [];
                      window.dataLayer.push({
                        event: "click_amazon_650",
                        button_location: "hero",
                        page_path: "/650",
                      });

                      console.log("Tracking 650:", "click_amazon_650", "hero");

                      setTimeout(() => {
                        window.open(AMAZON_URL, "_blank", "noopener,noreferrer");
                      }, 300);
                    }}
                  >
                    Comprar na Amazon
                  </a>
                </Button>
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md mx-auto">
                <img
                  src={bookCover3D}
                  alt="Capa do livro Cresça ou Desapareça"
                  className="relative w-full h-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Contexto */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl md:text-2xl text-foreground leading-relaxed">
              Este não é apenas um lançamento.
              <br />
              É um estudo de caso público.
            </p>
            <p className="text-xl md:text-2xl text-foreground leading-relaxed mt-8">
              Crescimento não acontece por acaso.
              <br />
              Acontece quando há clareza estratégica e execução coordenada.
            </p>
          </div>
        </div>
      </section>

      {/* Seção Meta */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
              <p className="text-lg text-muted-foreground mb-2">
                Meta pública: {META_PUBLICA} livros até 08/03.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Progresso estimado: {PROGRESSO_ESTIMADO}
              </p>
              <Progress
                value={(PROGRESSO_ESTIMADO / META_PUBLICA) * 100}
                className="h-3"
              />
              <p className="text-muted-foreground mt-6 text-center">
                O ranking é consequência. O crescimento é método.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Por que importa */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl md:text-2xl text-foreground leading-relaxed">
              Não é sobre vaidade.
              <br />
              É sobre demonstrar que conteúdo independente, quando bem posicionado, compete em nível
              nacional.
            </p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Button
              size="lg"
              asChild
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xl px-12 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <a
                href={AMAZON_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-amazon-new-tab="true"
                onClick={(e) => {
                  e.preventDefault();

                  window.dataLayer = window.dataLayer || [];
                  window.dataLayer.push({
                    event: "click_amazon_650",
                    button_location: "cta_final",
                    page_path: "/650",
                  });

                  console.log("Tracking 650:", "click_amazon_650", "cta_final");

                  setTimeout(() => {
                    window.open(AMAZON_URL, "_blank", "noopener,noreferrer");
                  }, 300);
                }}
              >
                Comprar agora na Amazon
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Redes sociais e contato */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
              <div className="text-center space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                  Denis Caldeira de Almeida
                </h3>
                <p className="text-muted-foreground">
                  Estrategista de Negócios e Conselheiro de Empresas
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                  <a
                    href="https://www.instagram.com/deniscaldeira.growth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Instagram className="h-5 w-5" />
                    Instagram
                  </a>
                  <a
                    href="https://www.linkedin.com/in/caldeiradenis/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-3 bg-[#0077b5] hover:bg-[#006399] text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Linkedin className="h-5 w-5" />
                    LinkedIn
                  </a>
                </div>

                <div className="pt-6 border-t border-border space-y-4">
                  <p className="text-muted-foreground">
                    Para palestras, consultoria e mentoria:
                  </p>
                  <a
                    href="mailto:contato@caldeiragrowth.com"
                    className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-semibold text-lg transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    contato@caldeiragrowth.com
                  </a>
                  <a
                    href="https://www.caldeiragrowth.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-semibold text-lg transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                    www.caldeiragrowth.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Desafio650;
