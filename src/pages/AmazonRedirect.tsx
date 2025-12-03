import { useEffect } from "react";

const AmazonRedirect = () => {
  const AMAZON_URL = "https://a.co/d/11Q3Kio";
  
  // URL do Google Apps Script para tracking
  const TRACKING_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby388KV_phCi-6hIWvHd64DCQrAqzDnZuxXqQnZGnsopg9QfoMxmjOq2cTonLpVrGel/exec";

  useEffect(() => {
    // Registra o acesso de forma assíncrona (não espera resposta)
    const formData = new FormData();
    formData.append('source', 'qr_code_campaign');
    formData.append('timestamp', new Date().toISOString());
    formData.append('user_agent', navigator.userAgent);
    formData.append('referrer', document.referrer || 'direct');
    formData.append('url', window.location.href);
    
    // Envia tracking (não espera resposta para não atrasar redirecionamento)
    fetch(TRACKING_SCRIPT_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors',
      keepalive: true // Garante que a requisição continue mesmo após redirecionamento
    }).catch(() => {
      // Ignora erros silenciosamente para não atrasar redirecionamento
    });

    // Redireciona imediatamente usando replace para não deixar histórico
    window.location.replace(AMAZON_URL);
  }, []);

  // Retorna null para não renderizar nada (página vazia durante o redirecionamento)
  return null;
};

export default AmazonRedirect;

