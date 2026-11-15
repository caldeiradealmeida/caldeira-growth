/** Public configuration only. The Apps Script URL must stay on the server. */
export const CONTACT_FORM_SUBMIT_URL = "/api/contact" as const;
export function isContactFormConfigured(): boolean {
  return Boolean(import.meta.env.VITE_CONTACT_TURNSTILE_SITE_KEY?.trim());
}
