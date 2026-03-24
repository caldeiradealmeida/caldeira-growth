import { Button } from "@/components/ui/button";
import bookCover3D from "@/assets/3D__.png";
import { ArrowDown } from "lucide-react";

const CALDEIRA_GROWTH_URL = "https://www.caldeiragrowth.com";

const Hero = () => {

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90">
      {/* Link discreto — ponte para Caldeira Growth */}
      <div className="relative z-20 w-full border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 py-2.5 flex justify-end">
          <a
            href={CALDEIRA_GROWTH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm text-primary-foreground/60 hover:text-accent transition-colors tracking-wide"
          >
            Caldeira Growth ↗
          </a>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-20 flex-1 flex items-center relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Text Content */}
          <div className="text-primary-foreground space-y-6 animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              Cresça ou
              <span className="block text-accent drop-shadow-glow">Desapareça</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/90 font-light leading-relaxed max-w-xl">
              Estratégias e práticas para gestores e empreendedores crescerem seus negócios
            </p>

            <div className="pt-4">
              <p className="text-lg text-primary-foreground/80 mb-6">
                Por <span className="font-bold text-accent">Denis Caldeira de Almeida</span>
                <br />
                <span className="text-base">Estrategista de Negócios e Conselheiro de Empresas</span>
              </p>
            </div>

            <div className="flex justify-start pt-2">
              <Button 
                size="lg"
                asChild
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <a 
                  href="https://a.co/d/11Q3Kio" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Comprar na Amazon
                </a>
              </Button>
            </div>
          </div>

          {/* Book Cover */}
          <div className="relative flex items-center justify-center animate-in fade-in slide-in-from-right duration-700 delay-300">
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full"></div>
              <img 
                src={bookCover3D} 
                alt="Capa do livro Cresça ou Desapareça" 
                className="relative w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-8 w-8 text-accent" />
      </div>
    </section>
  );
};

export default Hero;
