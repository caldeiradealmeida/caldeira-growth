import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Linkedin, Mail } from "lucide-react";



const RegistrationForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // URL do Google Apps Script Web App para salvar dados diretamente no Google Sheets
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylBTqQoi05Ki3RovSrdV3tIQBoID-x6DMVoRsNvVHxIByephA5RnqVCVJ249LlBQk_/exec";

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    // Previne o comportamento padrão do formulário (evita redirecionamento)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsSubmitting(true);

    // Pega o formulário pela referência React
    if (!formRef.current) {
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(formRef.current);
    const data = {
      nome: formData.get('nome') as string,
      celular: formData.get('celular') as string,
      email: formData.get('email') as string,
      empresa: formData.get('empresa') as string
    };

    // Validação básica
    if (!data.nome || !data.email || !data.celular || !data.empresa) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Log para debug
      console.log('Enviando dados para Google Sheets:', {
        nome: data.nome,
        email: data.email,
        celular: data.celular,
        empresa: data.empresa
      });

      // Cria FormData com os nomes diretos dos campos (sem mapeamento)
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('nome', data.nome);
      formData.append('celular', data.celular);
      formData.append('empresa', data.empresa);

      // Envia usando fetch POST para o Google Apps Script
      // Agora podemos ler a resposta JSON!
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      console.log('Resposta do Google Apps Script:', result);

      // Verifica se o Apps Script retornou sucesso
      if (result.status === 'success') {
        // DEU CERTO!
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Seus dados foram enviados e salvos. Obrigado pelo interesse!",
        });

        // Limpa o formulário
        if (formRef.current) {
          formRef.current.reset();
        }
      } else {
        // O Apps Script reportou um erro (ex: nome da aba errada)
        console.error('Erro do Apps Script:', result.message);
        toast({
          title: "Erro ao enviar",
          description: result.message || "Ocorreu um erro ao enviar seu cadastro. Por favor, tente novamente.",
          variant: "destructive",
        });
      }

    } catch (error) {
      // Erro de rede (ex: sem internet ou URL errada)
      console.error('Erro de rede:', error);
      toast({
        title: "Erro de conexão",
        description: "Ocorreu um erro de conexão. Verifique sua internet e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="cadastro" className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Saiba sobre pacotes corporativos
            </h2>
            <p className="text-xl text-muted-foreground">
              Receba a nossa proposta de pacotes de livros + palestras, webinars, workshops...
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom duration-700">
              <form ref={formRef} onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); }} className="space-y-6" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-base font-semibold">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    name="nome"
                    type="text"
                    placeholder="Seu nome completo"
                    required
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold">
                    E-mail *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="celular" className="text-base font-semibold">
                    Celular *
                  </Label>
                  <Input
                    id="celular"
                    name="celular"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    required
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa" className="text-base font-semibold">
                    Empresa *
                  </Label>
                  <Input
                    id="empresa"
                    name="empresa"
                    type="text"
                    placeholder="Nome da sua empresa"
                    required
                    className="h-12 text-base"
                  />
                </div>

                <Button
                  type="button" 
                  size="lg"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit();
                  }}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {isSubmitting ? "Enviando..." : "Quero receber o livro"}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  * Todos os campos são obrigatórios
                </p>
              </form>
            </div>
          </div>

          {/* Social Media & Contact Section */}
          <div className="max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
              <div className="text-center space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                  Conecte-se comigo
                </h3>
                <p className="text-muted-foreground">
                  Acompanhe meu conteúdo e entre em contato
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

                <div className="pt-6 border-t border-border">
                  <p className="text-muted-foreground mb-4">
                    Para palestras, consultoria e mentoria:
                  </p>
                  <a
                    href="mailto:contato@caldeiragrowth.com"
                    className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-semibold text-lg transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    contato@caldeiragrowth.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegistrationForm;
