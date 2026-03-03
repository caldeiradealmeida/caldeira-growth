import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import bookCover3D from "@/assets/3D__.png";
import { Instagram, Linkedin, Mail, Globe } from "lucide-react";

// ========== CENTRAL CAMPAIGN CONFIG ==========
// Edite aqui para atualizar todos os números da campanha
const CAMPAIGN_CONFIG = {
  goal: 650,
  sold: 327,
  deadline: "2026-03-08",
  ranking: 13,
  category: "Negócios",
  amazonUrl: "https://a.co/d/11Q3Kio?utm_source=landing650&utm_campaign=desafio650",
};

// ========== CALCULATED VALUES ==========
const remaining = CAMPAIGN_CONFIG.goal - CAMPAIGN_CONFIG.sold;

const today = new Date();
const deadlineDate = new Date(CAMPAIGN_CONFIG.deadline);
const diffTime = deadlineDate.getTime() - today.getTime();
const daysRemaining = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);

const progressPercent = (CAMPAIGN_CONFIG.sold / CAMPAIGN_CONFIG.goal) * 100;

// Formata deadline para exibição (08/03)
const deadlineDisplay = (() => {
  const d = new Date(CAMPAIGN_CONFIG.deadline);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
})();

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const trackAmazonClick = (buttonLocation: string) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "click_amazon_650",
    button_location: buttonLocation,
    page_path: "/650",
  });
};

const AmazonCTA = ({
  children,
  buttonLocation,
  className = "",
}: {
  children: React.ReactNode;
  buttonLocation: string;
  className?: string;
}) => (
  <Button
    size="lg"
    asChild
    className={`bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
  >
    <a
      href={CAMPAIGN_CONFIG.amazonUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-amazon-new-tab="true"
      onClick={(e) => {
        e.preventDefault();
        trackAmazonClick(buttonLocation);
        setTimeout(() => {
          window.open(CAMPAIGN_CONFIG.amazonUrl, "_blank", "noopener,noreferrer");
        }, 300);
      }}
    >
      {children}
    </a>
  </Button>
);

const Desafio650 = () => {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view_650",
      page_path: "/650",
      page_title: "650 leitores em 7 dias",
    });

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

  const scrollToComprar = () => {
    document.getElementById("comprar")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen">
      {/* 1. Hero Section - Two columns with book image */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-primary-foreground space-y-6">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                650 leitores. 7 dias. Mercado como auditor.
              </h1>
              <p className="text-xl md:text-2xl text-primary-foreground/90 font-light leading-relaxed">
                Já somos {CAMPAIGN_CONFIG.sold}. Faltam {remaining}.
                <br />
                O experimento está em andamento.
              </p>
              <div className="pt-4">
                <Button
                  size="lg"
                  onClick={scrollToComprar}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  👉 Garantir meu exemplar agora
                </Button>
              </div>
              <p className="text-sm text-primary-foreground/70">
                Meta pública. Execução estratégica. Crescimento real.
              </p>
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

      {/* 2. Progress Block - Dynamic */}
      <section id="comprar" className="py-16 md:py-20 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-xl">
              <p className="text-muted-foreground mb-1">
                Meta pública: {CAMPAIGN_CONFIG.goal} livros até {deadlineDisplay}
              </p>
              <div className="grid grid-cols-3 gap-4 my-6">
                <div>
                  <h2 id="soldLarge" className="text-3xl font-bold text-foreground">
                    {CAMPAIGN_CONFIG.sold}
                  </h2>
                  <p className="text-sm text-muted-foreground">Vendidos</p>
                </div>
                <div>
                  <h2 id="remainingLarge" className="text-3xl font-bold text-foreground">
                    {remaining}
                  </h2>
                  <p className="text-sm text-muted-foreground">Restantes</p>
                </div>
                <div>
                  <h2 id="daysRemaining" className="text-3xl font-bold text-foreground">
                    {daysRemaining}
                  </h2>
                  <p className="text-sm text-muted-foreground">Dias restantes</p>
                </div>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary mb-6">
                <div
                  id="progressBar"
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-muted-foreground text-sm text-center mb-8">
                O ranking é consequência. O crescimento é método.
              </p>
              <div className="flex justify-center">
                <AmazonCTA buttonLocation="progress">👉 Garantir meu exemplar agora</AmazonCTA>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Ranking Block - Dynamic */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-10 text-center">
              <p className="text-2xl md:text-3xl font-bold text-accent mb-4">
                📈 <span id="rankingNumber">#{CAMPAIGN_CONFIG.ranking}</span> na Amazon (
                <span id="categoryName">{CAMPAIGN_CONFIG.category}</span>)
              </p>
              <p className="text-primary-foreground/90 mb-8">
                Movimento real nas últimas 24 horas.
              </p>
              <AmazonCTA buttonLocation="social_proof" className="text-lg px-10 py-6">
                Comprar agora na Amazon
              </AmazonCTA>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Strategic Message Block */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xl md:text-2xl text-foreground leading-relaxed">
              Isso não é apenas um lançamento.
              <br />
              É um estudo de caso público.
            </p>
            <p className="text-xl md:text-2xl text-foreground leading-relaxed mt-8">
              Se o livro defende foco absoluto, engenharia reversa e disciplina,
              então a única forma coerente é aplicar esses princípios sob observação real.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Final Conversion Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Faltam {remaining} livros.
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-10">
              Participe do movimento.
            </p>
            <AmazonCTA buttonLocation="cta_final" className="text-xl px-12 py-6">
              Comprar agora na Amazon
            </AmazonCTA>
          </div>
        </div>
      </section>

      {/* Redes sociais e contato */}
      <section className="py-16 md:py-20 bg-background">
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
