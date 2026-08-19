/**
 * Empurra um evento para o dataLayer do GTM já instalado em index.html.
 *
 * Não é uma camada nova de analytics: é o mesmo canal que o CGI usa em
 * `src/features/cgi/services/analytics.ts`, extraído para uso fora do CGI.
 * O tipo global de `window.dataLayer` é declarado em `src/pages/CGI.tsx`.
 */
export type DataLayerValue = string | number | boolean | null | undefined;

export function pushDataLayerEvent(
  event: string,
  payload: Record<string, DataLayerValue> = {}
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    ),
  });
}
