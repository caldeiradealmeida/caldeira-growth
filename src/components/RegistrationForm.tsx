import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";



const RegistrationForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // URL do endpoint do Google Forms para receber dados
  const GOOGLE_FORM_SUBMIT_URL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSf5OCGtYR1C9Dd7lOol9iTJnG6aznUlJIUM5ztcndo6W8Sk6A/formResponse";

  // Mapeamento dos campos do formulário para os IDs do Google Forms
  // IDs obtidos do código-fonte do formulário Google Forms
  const FIELD_MAPPING: Record<string, string> = {
    email: "emailAddress", // Campo especial de e-mail (não usa entry.xxxxx)
    endereco: "entry.1444556828", // ID do campo Endereço
    nome: "entry.1437745654", // ID do campo Nome Completo
    celular: "entry.862728894", // ID do campo Celular
    empresa: "entry.1220837344", // ID do campo Empresa
    cargo: "entry.1410942633", // ID do campo Cargo
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Previne o comportamento padrão do formulário (evita redirecionamento)
    e.preventDefault();
    e.stopPropagation();
    
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get('nome') as string,
      celular: formData.get('celular') as string,
      email: formData.get('email') as string,
      endereco: formData.get('endereco') as string,
      empresa: formData.get('empresa') as string,
      cargo: formData.get('cargo') as string
    };

    // Validação básica
    if (!data.nome || !data.email || !data.celular || !data.endereco || !data.empresa || !data.cargo) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Cria FormData para enviar ao Google Forms
      const googleFormData = new URLSearchParams();
      
      // Mapeia os dados para os campos do Google Forms
      // IMPORTANTE: A ordem importa! Verifique a ordem dos campos no seu Google Forms
      googleFormData.append(FIELD_MAPPING.email, data.email);
      googleFormData.append(FIELD_MAPPING.endereco, data.endereco);
      googleFormData.append(FIELD_MAPPING.nome, data.nome);
      googleFormData.append(FIELD_MAPPING.celular, data.celular);
      googleFormData.append(FIELD_MAPPING.empresa, data.empresa);
      googleFormData.append(FIELD_MAPPING.cargo, data.cargo);
      
      // Adiciona campos obrigatórios do Google Forms
      googleFormData.append("fvv", "1");
      googleFormData.append("partialResponse", "[null,null,\"\"]");
      googleFormData.append("pageHistory", "0");
      googleFormData.append("fbzx", "-785259899754531839");

      // Envia os dados para o Google Forms usando fetch com no-cors
      // Nota: Usamos 'no-cors' porque o Google Forms não permite CORS
      // Isso significa que não podemos verificar a resposta, mas o envio funciona
      await fetch(GOOGLE_FORM_SUBMIT_URL, {
        method: 'POST',
        mode: 'no-cors', // Google Forms não retorna CORS, então usamos no-cors
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: googleFormData.toString(),
      });

      // Mostra mensagem de sucesso
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu cadastro foi enviado. Obrigado pelo interesse!",
      });

      // Limpa o formulário após um pequeno delay para garantir que o toast apareça
      setTimeout(() => {
        e.currentTarget.reset();
      }, 100);

    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar seu cadastro. Por favor, tente novamente.",
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
              Garanta seu exemplar
            </h2>
            <p className="text-xl text-muted-foreground">
              Cadastre-se agora e seja um dos primeiros a receber o livro quando for lançado
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom duration-700">
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                  <Label htmlFor="endereco" className="text-base font-semibold">
                    Endereço Completo *
                  </Label>
                  <Input
                    id="endereco"
                    name="endereco"
                    type="text"
                    placeholder="Rua, número, bairro, cidade, estado, CEP"
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegistrationForm;
