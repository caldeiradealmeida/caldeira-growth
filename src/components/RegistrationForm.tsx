import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";



const RegistrationForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // URL do Google Apps Script Web App para receber dados
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwF-MkCl3gdf-YSvpnbGwwdryb242pCmcZj5bfPx0R46UqiH-ka9nwhZiKwDFJNPirk/exec";

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
      console.log('Enviando dados para Google Sheets:', {
        nome: data.nome,
        email: data.email,
        celular: data.celular,
        endereco: data.endereco,
        empresa: data.empresa,
        cargo: data.cargo
      });

      // Cria um iframe oculto para enviar o formulário ao Google Apps Script
      const iframeId = 'hidden_iframe_' + Date.now();
      const iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.name = iframeId;
      
      // Adiciona listener para capturar a resposta
      iframe.onload = () => {
        console.log('Iframe carregado - requisição enviada');
        
        // Tenta ler a resposta do iframe (pode não funcionar devido a CORS)
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const responseText = iframeDoc.body?.innerText || '';
            console.log('Resposta do Google Apps Script:', responseText);
            
            if (responseText.includes('Success')) {
              toast({
                title: "Cadastro realizado com sucesso!",
                description: "Seu cadastro foi enviado. Obrigado pelo interesse!",
              });
              
              setTimeout(() => {
                if (formRef.current) {
                  formRef.current.reset();
                }
              }, 100);
            } else {
              console.error('Erro na resposta:', responseText);
            }
          }
        } catch (e) {
          // CORS pode bloquear, mas isso é esperado
          console.log('Não foi possível ler resposta devido a CORS (isso é normal)');
          // Assume sucesso se não houver erro visível
          toast({
            title: "Cadastro realizado com sucesso!",
            description: "Seu cadastro foi enviado. Obrigado pelo interesse!",
          });
          
          setTimeout(() => {
            if (formRef.current) {
              formRef.current.reset();
            }
          }, 100);
        }
        
        // Remove o iframe após um delay
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      };
      
      iframe.onerror = () => {
        console.error('Erro ao carregar iframe');
        toast({
          title: "Erro ao enviar",
          description: "Ocorreu um erro ao enviar seu cadastro. Por favor, tente novamente.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      };

      document.body.appendChild(iframe);

      // Cria um formulário temporário para enviar os dados
      const tempForm = document.createElement('form');
      tempForm.method = 'POST';
      tempForm.action = GOOGLE_SCRIPT_URL;
      tempForm.target = iframeId;
      tempForm.style.display = 'none';
      tempForm.enctype = 'application/x-www-form-urlencoded';

      // Adiciona os campos ao formulário
      const fields = [
        { name: 'nome', value: data.nome },
        { name: 'email', value: data.email },
        { name: 'celular', value: data.celular },
        { name: 'endereco', value: data.endereco },
        { name: 'empresa', value: data.empresa },
        { name: 'cargo', value: data.cargo }
      ];

      fields.forEach(field => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = field.name;
        input.value = field.value || '';
        tempForm.appendChild(input);
        console.log(`Campo adicionado: ${field.name} = ${field.value}`);
      });

      document.body.appendChild(tempForm);
      
      console.log('Submetendo formulário para:', GOOGLE_SCRIPT_URL);
      
      // Submete o formulário
      tempForm.submit();

      // Remove o formulário após um delay
      setTimeout(() => {
        if (document.body.contains(tempForm)) {
          document.body.removeChild(tempForm);
        }
      }, 3000);

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
