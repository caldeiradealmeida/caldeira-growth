/**
 * Proxy de conteúdo editorial → Google Apps Script.
 *
 * Evita CORS/redirect do script.google.com no navegador e permite que o site
 * leia Artigos/Midia da mesma planilha de leads via Apps Script.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

function getContentReadUrl(): string {
  return (
    process.env.CONTENT_READ_URL?.trim() ||
    process.env.CONTACT_FORM_URL?.trim() ||
    process.env.VITE_CONTACT_FORM_URL?.trim() ||
    ""
  );
}

function actionForType(type: string): string | null {
  if (type === "articles") return "articles_csv";
  if (type === "media") return "media_csv";
  return null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const type = String(req.query.type || "").trim();
  const action = actionForType(type);
  if (!action) {
    res.status(400).json({ ok: false, error: "invalid_type" });
    return;
  }

  const baseUrl = getContentReadUrl();
  if (!baseUrl) {
    res.status(503).json({
      ok: false,
      error: "not_configured",
      hint: "Defina CONTENT_READ_URL ou CONTACT_FORM_URL na Vercel.",
    });
    return;
  }

  const url = new URL(baseUrl);
  url.searchParams.set("action", action);

  const upstream = await fetch(url.toString(), { method: "GET" });
  const text = await upstream.text();
  res
    .status(upstream.status)
    .setHeader("Content-Type", "text/csv; charset=utf-8")
    .send(text);
}
