import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  CGI_DIMENSIONS,
  CGI_QUESTIONS,
  areCgiAnswersComplete,
  calculateCgiScore,
  normalizeCgiAnswers,
  type CgiScoreResult,
} from "./cgi-core.js";
import { buildCgiReportPromptContext } from "./cgi-report-guide.js";

type CgiLead = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  companyWebsite?: string;
  role?: string;
  sector?: string;
  employeeCount?: string;
  annualRevenue?: string;
  currentChallenge?: string;
  growthGoal?: string;
  investmentIntent?: string;
};

type CgiPayload = {
  action?: string;
  lead?: CgiLead;
  answers?: Record<string, unknown>;
  score?: unknown;
  aiReport?: string;
  aiStatus?: string;
  startedAt?: string;
  website?: string;
};

type AiResult = {
  status: "generated" | "not_configured" | "error";
  text: string;
  plainText: string;
};

type WebsiteEnrichment = {
  status: "not_provided" | "ok" | "error";
  requestedUrl: string;
  finalUrl: string;
  title: string;
  description: string;
  headings: string[];
  observedText: string;
  error?: string;
};

function snippet(value: string, maxLength = 700): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function getAppsScriptUrl(): string {
  return (
    process.env.CONTACT_FORM_URL?.trim() ||
    process.env.VITE_CONTACT_FORM_URL?.trim() ||
    ""
  );
}

function readPayload(req: VercelRequest): CgiPayload {
  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}") as CgiPayload;
  }
  return (req.body ?? {}) as CgiPayload;
}

function validateLead(lead: CgiLead | undefined): string | null {
  if (!lead) return "lead_required";
  const required: Array<keyof CgiLead> = [
    "name",
    "email",
    "phone",
    "company",
    "role",
    "sector",
    "employeeCount",
    "annualRevenue",
    "currentChallenge",
    "growthGoal",
    "investmentIntent",
  ];
  const missing = required.find((key) => !String(lead[key] ?? "").trim());
  if (missing) return `missing_${String(missing)}`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(lead.email))) {
    return "invalid_email";
  }
  return null;
}

function validateSpam(payload: CgiPayload): string | null {
  if (String(payload.website ?? "").trim()) return "spam_honeypot";

  const startedAt = Number(payload.startedAt);
  if (!Number.isFinite(startedAt)) return "missing_started_at";

  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs < 5000) return "spam_too_fast";
  if (elapsedMs > 1000 * 60 * 60 * 4) return "expired";
  return null;
}

function normalizePublicWebsiteUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("invalid_protocol");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
    hostname === "::1" ||
    hostname.includes("[")
  ) {
    throw new Error("private_or_local_host");
  }

  url.hash = "";
  return url.toString();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(value: string, maxLength = 1200): string {
  return decodeHtmlEntities(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function getFirstMatch(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match ? cleanText(match[1] || "") : "";
}

function getMetaContent(html: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:name|property)=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escapedName}["'][^>]*>`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const value = getFirstMatch(html, pattern);
    if (value) return value;
  }
  return "";
}

function extractWebsiteContent(html: string): Pick<
  WebsiteEnrichment,
  "title" | "description" | "headings" | "observedText"
> {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const title = getFirstMatch(withoutNoise, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    getMetaContent(withoutNoise, "description") ||
    getMetaContent(withoutNoise, "og:description");
  const headings = Array.from(
    withoutNoise.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)
  )
    .map((match) => cleanText(match[1] || "", 180))
    .filter(Boolean)
    .slice(0, 8);
  const observedText = cleanText(withoutNoise.replace(/<[^>]+>/g, " "), 5000);

  return { title, description, headings, observedText };
}

async function enrichCompanyWebsite(rawUrl: string | undefined): Promise<WebsiteEnrichment> {
  const requestedUrl = String(rawUrl || "").trim();
  if (!requestedUrl) {
    return {
      status: "not_provided",
      requestedUrl: "",
      finalUrl: "",
      title: "",
      description: "",
      headings: [],
      observedText: "",
    };
  }

  let url = "";
  try {
    url = normalizePublicWebsiteUrl(requestedUrl);
  } catch (error) {
    return {
      status: "error",
      requestedUrl,
      finalUrl: "",
      title: "",
      description: "",
      headings: [],
      observedText: "",
      error: error instanceof Error ? error.message : "invalid_url",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "CaldeiraGrowth-CGI/1.0 (+https://www.caldeiragrowth.com/cgi)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) throw new Error(`http_${response.status}`);
    if (!contentType.includes("text/html")) throw new Error("not_html");

    const html = await response.text();
    return {
      status: "ok",
      requestedUrl,
      finalUrl: response.url,
      ...extractWebsiteContent(html.slice(0, 500000)),
    };
  } catch (error) {
    return {
      status: "error",
      requestedUrl,
      finalUrl: url,
      title: "",
      description: "",
      headings: [],
      observedText: "",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractOutputText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const direct = (response as { output_text?: unknown }).output_text;
  if (typeof direct === "string") return direct.trim();

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => {
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const text = (item as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .join("\n")
    .trim();
}

function formatAiReportForEmail(value: string): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const lines: string[] = [];

    const addText = (title: string, field: string) => {
      const text = parsed[field];
      if (typeof text === "string" && text.trim()) {
        lines.push(title, text.trim(), "");
      }
    };
    const addList = (title: string, field: string) => {
      const list = parsed[field];
      if (Array.isArray(list) && list.length > 0) {
        lines.push(title);
        list.forEach((item) => {
          if (typeof item === "string") {
            lines.push("- " + item);
          } else if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            const label =
              String(record.title || record.dimension || record.name || "").trim();
            const body = String(
              record.analysis || record.rationale || record.recommendation || record.action || ""
            ).trim();
            lines.push("- " + [label, body].filter(Boolean).join(": "));
          }
        });
        lines.push("");
      }
    };

    addText("Sumário Executivo", "executive_summary");
    addText("Contexto e diagnóstico", "strategic_diagnosis");
    addList("Leitura por dimensão", "dimension_reading");
    addList("Gargalos críticos", "critical_bottlenecks");
    addList("Apostas estratégicas recomendadas", "strategic_bets");
    addList("Renúncias estratégicas", "renunciations");
    addList("Sistema mínimo de governança", "governance_system");
    addList("Recomendações finais", "final_recommendations");

    return lines.join("\n").trim();
  } catch {
    return value;
  }
}

async function generateAiDiagnostic({
  lead,
  answers,
  score,
  websiteEnrichment,
}: {
  lead: CgiLead;
  answers: Record<string, number>;
  score: CgiScoreResult;
  websiteEnrichment: WebsiteEnrichment;
}): Promise<AiResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { status: "not_configured", text: "", plainText: "" };

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.5";
  const compactAnswers = CGI_QUESTIONS.map((question) => ({
    id: question.id,
    dimension: question.dimensionId,
    question: question.text,
    answer: answers[question.id],
  }));

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "Você é um consultor sênior da Caldeira Growth. Gere um relatório executivo no formato de parecer estratégico, usando o guia de estilo e conteúdo fornecido. O relatório deve ser discursivo, analítico e útil, mas enxuto para uma versão gratuita: limite o conteúdo total a aproximadamente 14.000 a 18.000 caracteres, incluindo espaços. Não escreva um comentário curto sobre o índice, mas também não produza um relatório longo de consultoria completa. Use o CGI como evidência inicial para construir hipóteses executivas sobre qualidade do crescimento, foco, disciplina de gestão, mercado, máquina comercial, execução, liderança e cultura. Se houver public_website_context com status ok, use título, descrição, headings e texto observado do site como contexto público sobre posicionamento, oferta, linguagem comercial e possíveis segmentos atendidos. Trate esses sinais como observações externas a validar, não como fatos definitivos. Não invente dados financeiros, nomes, fatos ou números fora do assessment e do site observado. Quando faltar informação, explicite como hipótese qualificada. Retorne apenas JSON válido com as chaves: report_title, report_subtitle, email_subject, executive_summary, strategic_diagnosis, dimension_reading, critical_bottlenecks, strategic_bets, renunciations, governance_system, final_recommendations. executive_summary deve ter 2 a 3 parágrafos. strategic_diagnosis deve ter 5 a 7 parágrafos discursivos. dimension_reading deve ser array de objetos com dimension, score, analysis, implication; cada analysis deve ter 1 parágrafo e cada implication deve explicar a consequência estratégica em 1 parágrafo curto. critical_bottlenecks, strategic_bets, renunciations, governance_system e final_recommendations devem ser arrays com 3 a 4 itens; cada item deve ser um texto completo de 60 a 110 palavras. Escreva em português do Brasil, com linguagem de parecer estratégico, sem markdown decorativo.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  report_guide: buildCgiReportPromptContext(),
                  lead,
                  public_website_context: websiteEnrichment,
                  cgi: score,
                  dimensions: CGI_DIMENSIONS,
                  answers: compactAnswers,
                }),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_object",
          },
        },
        max_output_tokens: 6500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CGI OpenAI] request_failed", response.status, errorText);
      return { status: "error", text: "", plainText: "" };
    }

    const data = await response.json();
    const text = extractOutputText(data);
    return {
      status: "generated",
      text,
      plainText: formatAiReportForEmail(text),
    };
  } catch (error) {
    console.error("[CGI OpenAI] error", error);
    return { status: "error", text: "", plainText: "" };
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      configured: getAppsScriptUrl().length > 0,
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  let payload: CgiPayload;
  try {
    payload = readPayload(req);
  } catch {
    res.status(400).json({ ok: false, error: "invalid_json" });
    return;
  }

  const spamError = validateSpam(payload);
  if (spamError) {
    res.status(400).json({ ok: false, error: spamError });
    return;
  }

  const leadError = validateLead(payload.lead);
  if (leadError) {
    res.status(400).json({ ok: false, error: leadError });
    return;
  }

  const answers = normalizeCgiAnswers(payload.answers ?? {});
  if (!areCgiAnswersComplete(answers)) {
    res.status(400).json({ ok: false, error: "incomplete_answers" });
    return;
  }

  const score = calculateCgiScore(answers);
  const websiteEnrichment = await enrichCompanyWebsite(payload.lead?.companyWebsite);
  const ai = await generateAiDiagnostic({
    lead: payload.lead as CgiLead,
    answers,
    score,
    websiteEnrichment,
  });

  const url = getAppsScriptUrl();
  if (!url) {
    res
      .status(503)
      .json({ ok: false, error: "not_configured", score, ai, websiteEnrichment });
    return;
  }

  const upstreamPayload = {
    action: "cgi_assessment",
    lead: payload.lead,
    answers,
    score,
    websiteEnrichment,
    aiReport: ai.text,
    aiReportText: ai.plainText,
    aiStatus: ai.status,
    userAgent: req.headers["user-agent"] ?? "",
    referrer: req.headers.referer ?? req.headers.referrer ?? "",
  };

  let upstream: Response;
  let text = "";
  let data: unknown = {};
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(upstreamPayload),
    });
    text = await upstream.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: snippet(text), contentType: upstream.headers.get("content-type") };
    }
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: "upstream_request_failed",
      detail: error instanceof Error ? error.message : String(error),
      score,
      ai,
      websiteEnrichment,
    });
    return;
  }

  if (!upstream.ok || (data as { ok?: boolean }).ok !== true) {
    const upstreamError = String((data as { error?: unknown }).error || "");
    const error =
      upstreamError === "validation"
        ? "apps_script_outdated_or_wrong_deployment"
        : "upstream_failed";

    res.status(502).json({
      ok: false,
      error,
      upstreamStatus: upstream.status,
      upstreamUrl: upstream.url,
      upstream: data,
      score,
      ai,
      websiteEnrichment,
    });
    return;
  }

  res.status(200).json({ ok: true, score, ai, websiteEnrichment });
}
