/**
 * Endpoint do Google Apps Script (Web App) para gravar o formulário na planilha.
 *
 * O Vite só injeta variáveis que começam com VITE_ e são lidas em build time.
 *
 * 1. Crie `.env` ou `.env.local` na RAIZ do projeto com:
 *    VITE_CONTACT_FORM_URL=https://script.google.com/macros/s/SEU_ID/exec
 *
 * 2. Após criar ou alterar `.env`, PARE e rode de novo: `npm run dev`
 *    (senão import.meta.env não atualiza).
 *
 * 3. No navegador, abra o Console (F12) na página /contato — deve aparecer
 *    [Caldeira contact form] URL carregada: sim/não
 *
 * Docs: docs/google-apps-script-contact-form.md
 *
 * O front envia para esta rota (mesmo domínio); Vite proxy (dev) ou Vercel api/
 * encaminham para VITE_CONTACT_FORM_URL — evita redirect 302 no browser.
 */
export const CONTACT_FORM_SUBMIT_URL = "/api/contact" as const;

const raw = import.meta.env.VITE_CONTACT_FORM_URL;

export const CONTACT_FORM_WEBAPP_URL: string =
  typeof raw === "string" ? raw.trim() : "";

/** Debug: ver Console em /contato — confirma se o Vite leu a env. */
if (import.meta.env.DEV) {
  console.log(
    "[Caldeira contact form] VITE_CONTACT_FORM_URL:",
    CONTACT_FORM_WEBAPP_URL
      ? `definida (${CONTACT_FORM_WEBAPP_URL.slice(0, 48)}…)`
      : "VAZIA — crie .env com VITE_CONTACT_FORM_URL e reinicie npm run dev"
  );
}

export function isContactFormConfigured(): boolean {
  return CONTACT_FORM_WEBAPP_URL.length > 0;
}
