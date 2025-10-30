import { BookOpen, Target, TrendingUp } from "lucide-react";

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
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Sobre o Autor
            </h3>
            <p className="text-lg leading-relaxed text-primary-foreground/90">
              <span className="font-bold text-accent">Denis Caldeira de Almeida</span> Ao longo de quase três décadas, Denis Caldeira de Almeida acumula a prática e o amor aos estudos para entregar caminhos de sucesso aos empreendedores. Liderou organizações de peso dentro de empresas como Telefônica, Google e Meta. Nesta última, foi o responsável pela organização de pequenas empresas para América Latina e receita na ordem de R$10 bilhões. 
Mestre em engenharia econômica pela universidade de Pierre Mendes de Grenoble, França, estudou engenharia elétrica na FEI, MBA em economia na USP, além de treinamentos de estratégia e negócios em Wharton, Kellogg e Columbia.
Fundador da Caldeira Growth, consultoria estratégica especializada em crescimento empresarial, gestão e transformação cultural, ajuda empresas a escalarem suas operações e aumentarem sua competitividade.
Co-fundador da Prompt8.ai, empresa de agentes de inteligência artificial que customiza soluções em setores específicos da economia.

            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
