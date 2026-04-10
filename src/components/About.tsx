import { BookOpen, Target, TrendingUp } from "lucide-react";
import authorPhoto from "@/assets/denis/about.jpeg";

const CALDEIRA_GROWTH_URL = "https://www.caldeiragrowth.com";

const About = () => {
  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Estratégias Práticas",
      description: "Métodos comprovados para impulsionar o crescimento do seu negócio"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Resultados Reais",
      description: "Cases e exemplos práticos de empresas que cresceram aplicando estas estratégias"
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Conteúdo Aplicável",
      description: "Ferramentas e frameworks prontos para implementar no seu dia a dia"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Um livro essencial para quem quer
              <span className="block text-accent mt-2">crescer de verdade</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              No mundo dos negócios atual, a escolha é simples: ou você cresce constantemente,
              ou corre o risco de desaparecer. Este livro oferece um guia prático e direto
              para gestores e empreendedores que querem garantir o crescimento sustentável
              de suas empresas.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mt-6">
              Este livro nasce da prática em projetos reais de crescimento.{" "}
              <a
                href={CALDEIRA_GROWTH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline-offset-4 hover:underline font-medium"
              >
                Saiba mais sobre esse trabalho
              </a>
              .
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="bg-accent/10 text-accent w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 animate-in fade-in slide-in-from-bottom duration-700 delay-500">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Sobre o Autor
            </h3>
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <img 
                src={authorPhoto} 
                alt="Denis Caldeira de Almeida" 
                className="w-48 h-48 rounded-lg object-cover shadow-lg"
              />
              <p className="text-lg leading-relaxed text-primary-foreground/90">
                <span className="font-bold text-accent">Denis Caldeira de Almeida</span> é especialista em crescimento empresarial. Há quase três décadas, combina prática e estudo para transformar estratégia em resultado. Liderou iniciativas em empresas como Telefônica, Google e Meta — nesta, foi responsável pela operação de Pequenas Empresas na América Latina.
                <br /><br />
                Mestre em Engenharia Econômica pela Universidade Pierre Mendès-France (Grenoble II), formado em Engenharia Elétrica pela FEI e com MBA em Economia pela USP, possui formações executivas em Wharton, Kellogg e Columbia.
                <br /><br />
                Fundador da Caldeira Growth — estratégia, decisão e crescimento para lideranças em momentos de escala. Cofundador da Prompt8.ai, que desenvolve agentes de IA customizados para setores específicos da economia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
