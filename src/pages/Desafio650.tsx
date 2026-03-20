import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import bookCover3D from "@/assets/3D__.png";
import authorPhoto from "@/assets/author-photo.jpg";
import { Instagram, Linkedin, Play } from "lucide-react";

// ========== CENTRAL CAMPAIGN CONFIG ==========
const CAMPAIGN_CONFIG = {
  goal: 650,
  result: 530,
  duration: 7,
  amazonUrl: "https://a.co/d/11Q3Kio?utm_source=landing650&utm_campaign=desafio650",
  corporateEmail: "mailto:contato@caldeiragrowth.com?subject=Interesse em pacotes corporativos - Cresça ou Desapareça",
  reelUrl: "https://www.instagram.com/deniscaldeira.growth/",
};

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

const TIMELINE_PHASES = [
  {
    title: "Fase 1 — Posicionamento",
    items: ["Construção de audiência qualificada", "Conteúdo em Instagram e LinkedIn"],
  },
  {
    title: "Fase 2 — Estrutura do experimento",
    items: ["Meta pública: 650 livros em 7 dias", "Framing do lançamento como experimento"],
  },
  {
    title: "Fase 3 — Infraestrutura digital",
    items: ["Landing page dedicada (/650)", "Meta Pixel", "Google Tag / GA4", "Evento click_amazon"],
  },
  {
    title: "Fase 4 — Aquisição",
    items: ["Conteúdo orgânico", "Carrosséis", "Anúncios Meta", "Kits para influenciadores"],
  },
  {
    title: "Fase 5 — Conversão e distribuição",
    items: ["Funil medido até o clique no botão Amazon", "Vendas corporativas", "Negociações em andamento"],
  },
  {
    title: "Fase 6 — Amplificação",
    items: ["Ranking Amazon", "Assessoria de imprensa", "Prova social do lançamento"],
  },
  {
    title: "Fase 7 — Resultado",
    items: ["530 livros em 7 dias", "Método validado na prática"],
  },
];

const Desafio650 = () => {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view_650",
      page_path: "/650",
      page_title: "Resultados do experimento 650",
    });

    const prevTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const prevContent = metaDescription?.getAttribute("content") || "";

    document.title = "Resultados do experimento 650 | Cresça ou Desapareça";
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Documentação do experimento público: 530 livros vendidos em 7 dias. Método, timeline e prova de execução."
      );
    }

    return () => {
      document.title = prevTitle;
      if (metaDescription) metaDescription.setAttribute("content", prevContent);
    };
  }, []);

  const scrollToTimeline = () => {
    document.getElementById("metodo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen">
      {/* 1. Hero — Results framing */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-primary-foreground space-y-6">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                O experimento terminou. O método ficou claro.
              </h1>
              <p className="text-xl md:text-2xl text-primary-foreground/90 font-light leading-relaxed">
                Meta pública: {CAMPAIGN_CONFIG.goal} livros em 7 dias.
                <br />
                Resultado: {CAMPAIGN_CONFIG.result} livros vendidos em uma semana.
                <br />
                <br />
                Mais do que um lançamento, isso foi um teste real de crescimento aplicado.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <AmazonCTA buttonLocation="hero" className="text-lg px-8 py-6">
                  Comprar o livro na Amazon
                </AmazonCTA>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={scrollToTimeline}
                  className="border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-lg px-8 py-6"
                >
                  Ver como o experimento foi construído
                </Button>
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-xl mx-auto">
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

      {/* 2. Results Highlight Block */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-3xl md:text-4xl font-bold text-foreground">{CAMPAIGN_CONFIG.goal}</p>
                <p className="text-sm text-muted-foreground mt-1">Meta pública</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-3xl md:text-4xl font-bold text-accent">{CAMPAIGN_CONFIG.result}</p>
                <p className="text-sm text-muted-foreground mt-1">Resultado final</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-3xl md:text-4xl font-bold text-foreground">{CAMPAIGN_CONFIG.duration}</p>
                <p className="text-sm text-muted-foreground mt-1">Duração (dias)</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center col-span-2 lg:col-span-1">
                <p className="text-lg font-bold text-foreground">Audiência + funil + mídia + B2B</p>
                <p className="text-sm text-muted-foreground mt-1">Estrutura</p>
              </div>
            </div>
            <p className="text-muted-foreground text-center mt-6 text-sm">
              Não foi barulho. Foi sistema.
            </p>
            <div className="flex justify-center mt-8">
              <AmazonCTA buttonLocation="results_block">Comprar o livro na Amazon</AmazonCTA>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why This Matters */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
              Por que {CAMPAIGN_CONFIG.result} livros importa
            </h2>
            <p className="text-foreground leading-relaxed text-center">
              530 livros vendidos em uma semana no Brasil é um resultado relevante, especialmente para um livro de negócios e estratégia. Muitos rankings semanais do mercado operam nessa ordem de grandeza. Uma meta agressiva não atingida integralmente ainda pode revelar um sistema muito bem executado.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Timeline / Method Section */}
      <section id="metodo" className="py-16 md:py-20 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-12 text-center">
              Como o experimento foi construído
            </h2>
            <div className="space-y-8">
              {TIMELINE_PHASES.map((phase, i) => (
                <div
                  key={i}
                  className="border-l-2 border-accent pl-6 py-2"
                >
                  <h3 className="font-bold text-foreground text-lg mb-3">{phase.title}</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    {phase.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. What Was Measured */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
              O que foi medido
            </h2>
            <p className="text-foreground leading-relaxed text-center mb-6">
              O experimento foi medido tecnicamente: visitas ao site, tráfego na landing page, eventos click_amazon, CTR e CPC da mídia. O último passo controlável antes da Amazon — o clique no botão — foi rastreado em cada ponto do funil.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Corporate Sales */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Além do varejo: tração corporativa
            </h2>
            <p className="text-foreground leading-relaxed mb-8">
              O experimento também gerou compras corporativas e conversas com empresas como Nasdaq + 3Dots, Bom Sabor, Roda Conveniência, MR, entre outras. Negociações seguem em andamento.
            </p>
            <a
              href={CAMPAIGN_CONFIG.corporateEmail}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Levar o livro para a sua empresa
            </a>
          </div>
        </div>
      </section>

      {/* 7. Optional Video / Reel Block */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <a
              href={CAMPAIGN_CONFIG.reelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-card border border-border rounded-xl p-8 shadow-lg hover:shadow-xl transition-all overflow-hidden group"
            >
              <div className="aspect-video bg-primary/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <Play className="h-16 w-16 text-accent" fill="currentColor" />
              </div>
              <p className="font-semibold text-foreground text-center">
                Assistir resumo do experimento
              </p>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Instagram
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* 8. Final Closing Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
              Crescimento não foi prometido. Foi testado.
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-10 leading-relaxed">
              Esta página documenta o que aconteceu quando um livro sobre crescimento foi lançado usando os mesmos princípios que defende: foco, funil, medição, iteração e execução sob pressão.
            </p>
            <AmazonCTA buttonLocation="cta_final" className="text-xl px-12 py-6">
              Comprar agora na Amazon
            </AmazonCTA>
          </div>
        </div>
      </section>

      {/* 9. Minimal Author Block */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-card border border-border rounded-xl shadow-sm">
              <img
                src={authorPhoto}
                alt="Denis Caldeira de Almeida"
                className="w-20 h-20 rounded-full object-cover flex-shrink-0"
              />
              <div className="text-center sm:text-left flex-1">
                <h3 className="font-bold text-foreground text-lg">
                  Denis Caldeira de Almeida
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Estrategista de crescimento. Ex-executivo Meta & Google. Conselheiro de empresas. Autor de Cresça ou Desapareça.
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                  <a
                    href="https://www.instagram.com/deniscaldeira.growth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-md"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                  <a
                    href="https://www.linkedin.com/in/caldeiradenis/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0077b5] hover:bg-[#006399] text-white rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-md"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
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
