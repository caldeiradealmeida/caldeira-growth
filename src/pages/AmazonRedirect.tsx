import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const AmazonRedirect = () => {
  const [countdown, setCountdown] = useState(2);
  const AMAZON_URL = "https://a.co/d/11Q3Kio";
  
  // URL do Google Apps Script para tracking
  // Você pode usar o mesmo script ou criar um novo endpoint específico para tracking
  const TRACKING_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby388KV_phCi-6hIWvHd64DCQrAqzDnZuxXqQnZGnsopg9QfoMxmjOq2cTonLpVrGel/exec";

  useEffect(() => {
    // Registra o acesso
    const trackVisit = async () => {
      try {
        const formData = new FormData();
        formData.append('source', 'qr_code_campaign');
        formData.append('timestamp', new Date().toISOString());
        formData.append('user_agent', navigator.userAgent);
        formData.append('referrer', document.referrer || 'direct');
        formData.append('url', window.location.href);
        
        // Envia para o Google Sheets
        // Usando no-cors porque o Google Apps Script não retorna CORS headers apropriados
        fetch(TRACKING_SCRIPT_URL, {
          method: 'POST',
          body: formData,
          mode: 'no-cors'
        }).catch(error => {
          console.error('Erro ao registrar acesso:', error);
        });
      } catch (error) {
        console.error('Erro ao registrar acesso:', error);
      }
    };

    trackVisit();

    // Countdown antes de redirecionar
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = AMAZON_URL;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-primary/90">
      <div className="text-center text-primary-foreground space-y-6 animate-in fade-in duration-500 px-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-accent" />
        <h1 className="text-3xl md:text-4xl font-bold">
          Redirecionando para a Amazon...
        </h1>
        <p className="text-xl text-primary-foreground/80">
          Você será redirecionado em {countdown} segundo{countdown !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-primary-foreground/60 max-w-md mx-auto">
          Se não for redirecionado automaticamente,{" "}
          <a 
            href={AMAZON_URL} 
            className="text-accent hover:underline font-semibold"
            target="_blank"
            rel="noopener noreferrer"
          >
            clique aqui
          </a>
        </p>
      </div>
    </div>
  );
};

export default AmazonRedirect;

