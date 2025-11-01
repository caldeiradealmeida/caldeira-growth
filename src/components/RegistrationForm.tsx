import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";



const RegistrationForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // URL do endpoint do Google Forms para receber dados (sem /u/0/ para permitir envios públicos)
  const GOOGLE_FORM_SUBMIT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf5OCGtYR1C9Dd7lOol9iTJnG6aznUlJIUM5ztcndo6W8Sk6A/formResponse";

  // Mapeamento dos campos do formulário para os IDs do Google Forms
  const FIELD_MAPPING: Record<string, string> = {
    email: "emailAddress", // Campo especial de e-mail (não usa entry.xxxxx)
    endereco: "entry.1444556828", // ID do campo Endereço
    nome: "entry.1437745654", // ID do campo Nome Completo
    celular: "entry.862728894", // ID do campo Celular
    empresa: "entry.1220837344", // ID do campo Empresa
    cargo: "entry.1410942633", // ID do campo Cargo
  };

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
      // Log para debug
      console.log('Enviando dados para Google Forms:', {
        nome: data.nome,
        email: data.email,
        celular: data.celular,
        endereco: data.endereco,
        empresa: data.empresa,
        cargo: data.cargo
      });

      // Cria URLSearchParams (formato application/x-www-form-urlencoded)
      // O Google Forms espera este formato, não multipart/form-data
      const formParams = new URLSearchParams();
      
      // Mapeia os campos para os nomes do Google Forms
      formParams.append(FIELD_MAPPING.email, data.email);
      formParams.append(FIELD_MAPPING.endereco, data.endereco);
      formParams.append(FIELD_MAPPING.nome, data.nome);
      formParams.append(FIELD_MAPPING.celular, data.celular);
      formParams.append(FIELD_MAPPING.empresa, data.empresa);
      formParams.append(FIELD_MAPPING.cargo, data.cargo);

      // Adiciona campos obrigatórios do Google Forms (necessários para processamento)
      formParams.append('fvv', '1');
      formParams.append('partialResponse', '[null,null,""]');
      formParams.append('pageHistory', '0');
      formParams.append('fbzx', '-785259899754531839');

      // Log dos dados que serão enviados
      console.log('Parâmetros preparados para envio:');
      for (const [key, value] of formParams.entries()) {
        console.log(`${key}: ${value}`);
      }

      // Envia usando fetch com mode: 'no-cors'
      // URLSearchParams automaticamente usa application/x-www-form-urlencoded
      await fetch(GOOGLE_FORM_SUBMIT_URL, {
        method: 'POST',
        body: formParams.toString(),
        mode: 'no-cors' // Modo importante para evitar erros de CORS
      });

      // Com mode: 'no-cors', não conseguimos ler a resposta do Google Forms
      // O .then() dispara assim que o navegador envia, sem confirmar sucesso
      // Então, assumimos o sucesso e atualizamos a interface
      console.log('Requisição enviada para o Google Forms. Verifique sua planilha para confirmar.');

      // Mostra mensagem de sucesso
      toast({
        title: "Cadastro enviado!",
        description: "Sua solicitação foi enviada. Verifique sua planilha do Google Forms.",
      });

      // Limpa o formulário
      if (formRef.current) {
        formRef.current.reset();
      }

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
        </div>
      </div>
    </section>
  );
};

export default RegistrationForm;
