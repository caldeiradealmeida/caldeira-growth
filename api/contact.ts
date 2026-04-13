/**
 * Proxy do formulário → Google Apps Script (Web App).
 *
 * Runtime Node.js na Vercel (Edge + ESM às vezes não recebe env ou falha no deploy).
 *
 * Variáveis (defina no painel da Vercel → Environment Variables → Production):
 * - CONTACT_FORM_URL (recomendado no servidor, não exposto ao bundle do Vite)
 * - ou VITE_CONTACT_FORM_URL (mesma URL /exec; também funciona no runtime Node)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

function getAppsScriptUrl(): string {
  return (
    process.env.CONTACT_FORM_URL?.trim() ||
    process.env.VITE_CONTACT_FORM_URL?.trim() ||
    ""
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method === "GET") {
    const configured = getAppsScriptUrl().length > 0;
    res.status(200).json({ ok: true, configured });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const url = getAppsScriptUrl();
  if (!url) {
    res.status(503).json({
      ok: false,
      error: "not_configured",
      hint: "Defina CONTACT_FORM_URL ou VITE_CONTACT_FORM_URL na Vercel e faça redeploy.",
    });
    return;
  }

  const body =
    typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body ?? {});

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
  });

  const text = await upstream.text();
  const ct =
    upstream.headers.get("content-type") ?? "application/json; charset=utf-8";
  res.status(upstream.status).setHeader("Content-Type", ct);
  res.send(text);
}
