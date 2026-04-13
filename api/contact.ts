/**
 * Proxy do formulário → Google Apps Script (Web App).
 *
 * O fetch no navegador segue o 302 do script.google.com e, por compatibilidade HTTP,
 * pode converter POST em GET — o doPost não roda e a resposta vira HTML/erro.
 * Este handler roda no servidor (Edge), onde o POST é encaminhado corretamente.
 *
 * Env: VITE_CONTACT_FORM_URL (mesma URL /exec do Apps Script).
 */
export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "method_not_allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  const url = process.env.VITE_CONTACT_FORM_URL?.trim();
  if (!url) {
    return new Response(
      JSON.stringify({ ok: false, error: "not_configured" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  const body = await request.text();

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
  });

  const text = await upstream.text();
  const ct =
    upstream.headers.get("Content-Type") ?? "application/json; charset=utf-8";

  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": ct },
  });
}
