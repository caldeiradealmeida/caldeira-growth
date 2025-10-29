import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import qrCode from "@/assets/qr-code.png";
import { Smartphone } from "lucide-react";

const RegistrationForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf5OCGtYR1C9Dd7lOol9iTJnG6aznUlJIUM5ztcndo6W8Sk6A/viewform?usp=publish-editor";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get('nome'),
      celular: formData.get('celular'),
      email: formData.get('email'),
      empresa: formData.get('empresa'),
      cargo: formData.get('cargo')
    };

    // Validação básica
    if (!data.nome || !data.email || !data.celular || !data.empresa || !data.cargo) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Abre o Google Forms em nova aba
    // Nota: Você precisará configurar o mapeamento correto dos campos do seu Google Forms
    window.open(GOOGLE_FORM_URL, '_blank');

    toast({
      title: "Redirecionando...",
      description: "Você será direcionado para completar seu cadastro.",
    });

    setIsSubmitting(false);
  };

  return (
    <section id="cadastro" className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Garanta seu exemplar
            </h2>
            <p className="text-xl text-muted-foreground">
              Cadastre-se agora e seja um dos primeiros a receber o livro quando for lançado
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Formulário */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl animate-in fade-in slide-in-from-left duration-700">
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="space-y-2">
                  <Label htmlFor="cargo" className="text-base font-semibold">
                    Cargo *
                  </Label>
                  <Input
                    id="cargo"
                    name="cargo"
                    type="text"
                    placeholder="Seu cargo na empresa"
                    required
                    className="h-12 text-base"
                  />
                </div>

                <Button
                  type="submit" 
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {isSubmitting ? "Enviando..." : "Quero receber o livro"}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  * Todos os campos são obrigatórios
                </p>
              </form>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-right duration-700 delay-300">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl text-center">
                <div className="flex items-center justify-center mb-6">
                  <Smartphone className="h-8 w-8 text-accent mr-2" />
                  <h3 className="text-2xl font-bold text-foreground">
                    Acesso Rápido
                  </h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Escaneie o QR Code com seu celular para acessar o formulário
                </p>
                <div className="bg-white p-6 rounded-xl inline-block shadow-lg">
                  <img 
                    src={qrCode} 
                    alt="QR Code para acesso ao formulário de cadastro" 
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  Aponte a câmera do seu celular para o código
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegistrationForm;
