import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolve4, resolve6, resolveMx } from "node:dns/promises";
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
  commercialRelationshipModel?: string;
  employeeCount?: string;
  annualRevenue?: string;
  currentChallenge?: string;
  growthGoal?: string;
  investmentIntent?: string;
  comments?: string;
};

type CgiPayload = {
  action?: string;
  language?: "pt" | "en" | "es";
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

type RequestContext = {
  ip: string;
  country: string;
  region: string;
  city: string;
  latitude: string;
  longitude: string;
  timezone: string;
};

type EmailValidation = {
  status: "ok" | "error";
  domain: string;
  hasMx: boolean;
  hasAddressFallback: boolean;
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

function firstHeaderValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

function getClientIp(req: VercelRequest): string {
  const vercelForwarded = firstHeaderValue(req.headers["x-vercel-forwarded-for"]);
  if (vercelForwarded) return vercelForwarded.split(",")[0].trim();

  const forwarded = firstHeaderValue(req.headers["x-forwarded-for"]);
  if (forwarded) return forwarded.split(",")[0].trim();

  return firstHeaderValue(req.headers["x-real-ip"]);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getRequestContext(req: VercelRequest): RequestContext {
  return {
    ip: getClientIp(req),
    country: firstHeaderValue(req.headers["x-vercel-ip-country"]),
    region: firstHeaderValue(req.headers["x-vercel-ip-country-region"]),
    city: safeDecode(firstHeaderValue(req.headers["x-vercel-ip-city"])),
    latitude: firstHeaderValue(req.headers["x-vercel-ip-latitude"]),
    longitude: firstHeaderValue(req.headers["x-vercel-ip-longitude"]),
    timezone: firstHeaderValue(req.headers["x-vercel-ip-timezone"]),
  };
}

function readPayload(req: VercelRequest): CgiPayload {
  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}") as CgiPayload;
  }
  return (req.body ?? {}) as CgiPayload;
}

function getEmailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] || "";
}

async function validateEmailDomain(email: string): Promise<EmailValidation> {
  const domain = getEmailDomain(email);
  if (!domain || !domain.includes(".")) {
    return {
      status: "error",
      domain,
      hasMx: false,
      hasAddressFallback: false,
      error: "invalid_domain",
    };
  }

  try {
    const mxRecords = await resolveMx(domain);
    if (mxRecords.length > 0) {
      return {
        status: "ok",
        domain,
        hasMx: true,
        hasAddressFallback: false,
      };
    }
  } catch {
    // Some valid domains do not expose MX but can still receive through A/AAAA fallback.
  }

  try {
    const [ipv4, ipv6] = await Promise.allSettled([resolve4(domain), resolve6(domain)]);
    const hasAddressFallback =
      (ipv4.status === "fulfilled" && ipv4.value.length > 0) ||
      (ipv6.status === "fulfilled" && ipv6.value.length > 0);

    return {
      status: hasAddressFallback ? "ok" : "error",
      domain,
      hasMx: false,
      hasAddressFallback,
      ...(hasAddressFallback ? {} : { error: "domain_not_resolvable" }),
    };
  } catch (error) {
    return {
      status: "error",
      domain,
      hasMx: false,
      hasAddressFallback: false,
      error: error instanceof Error ? error.message : "domain_validation_failed",
    };
  }
}

async function validateLead(lead: CgiLead | undefined): Promise<{
  error: string | null;
  emailValidation?: EmailValidation;
}> {
  if (!lead) return { error: "lead_required" };
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
  if (missing) return { error: `missing_${String(missing)}` };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(lead.email))) {
    return { error: "invalid_email" };
  }
  const emailValidation = await validateEmailDomain(String(lead.email));
  if (emailValidation.status !== "ok") {
    return { error: "invalid_email_domain", emailValidation };
  }
  return { error: null, emailValidation };
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

function formatAiReportForEmail(value: string, language: "pt" | "en" | "es" = "pt"): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const lines: string[] = [];
    const labels = {
      pt: {
        executiveSummary: "Sumário Executivo",
        diagnosis: "Contexto e diagnóstico",
        dimensionReading: "Leitura por dimensão",
        bottlenecks: "Gargalos críticos",
        bets: "Apostas estratégicas recomendadas",
        renunciations: "Renúncias estratégicas",
        governance: "Sistema mínimo de governança",
        recommendations: "Recomendações finais",
      },
      en: {
        executiveSummary: "Executive Summary",
        diagnosis: "Context and diagnosis",
        dimensionReading: "Reading by dimension",
        bottlenecks: "Critical bottlenecks",
        bets: "Recommended strategic bets",
        renunciations: "Strategic renunciations",
        governance: "Minimum governance system",
        recommendations: "Final recommendations",
      },
      es: {
        executiveSummary: "Resumen ejecutivo",
        diagnosis: "Contexto y diagnóstico",
        dimensionReading: "Lectura por dimensión",
        bottlenecks: "Cuellos de botella críticos",
        bets: "Apuestas estratégicas recomendadas",
        renunciations: "Renuncias estratégicas",
        governance: "Sistema mínimo de gobernanza",
        recommendations: "Recomendaciones finales",
      },
    }[language];

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

    addText(labels.executiveSummary, "executive_summary");
    addText(labels.diagnosis, "strategic_diagnosis");
    addList(labels.dimensionReading, "dimension_reading");
    addList(labels.bottlenecks, "critical_bottlenecks");
    addList(labels.bets, "strategic_bets");
    addList(labels.renunciations, "renunciations");
    addList(labels.governance, "governance_system");
    addList(labels.recommendations, "final_recommendations");

    return lines.join("\n").trim();
  } catch {
    return value;
  }
}

function hasPortugueseLeak(value: string): boolean {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const markers = [
    "crescimento",
    "estrategia",
    "mercado e cliente",
    "maquina de crescimento",
    "execucao",
    "lideranca",
    "gargalo",
    "recomendacao",
    "empresa parece",
    "proxima fase",
    "decisao",
    "governanca",
    "renuncia",
    "prioridade",
  ];
  return markers.filter((marker) => normalized.includes(marker)).length >= 3;
}

async function rewriteAiReportLanguage({
  apiKey,
  model,
  text,
  language,
}: {
  apiKey: string;
  model: string;
  text: string;
  language: "en" | "es";
}): Promise<string> {
  const instruction =
    language === "es"
      ? "Reescriba TODO el contenido textual de este JSON en español latinoamericano neutro, adecuado para Panamá y América Latina. Mantenga exactamente las mismas claves, estructura, números, marcas, URLs y nombres propios. No deje ninguna frase en portugués. Devuelva solo JSON válido."
      : "Rewrite ALL textual content in this JSON in natural executive English. Keep exactly the same keys, structure, numbers, brands, URLs and proper names. Do not leave any Portuguese or Spanish sentences. Return only valid JSON.";

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
          content: [{ type: "input_text", text: instruction }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text }],
        },
      ],
      text: { format: { type: "json_object" } },
      max_output_tokens: 5200,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[CGI OpenAI] rewrite_failed", response.status, errorText);
    return text;
  }

  const data = await response.json();
  return extractOutputText(data) || text;
}

async function generateAiDiagnostic({
  lead,
  answers,
  score,
  websiteEnrichment,
  requestContext,
  language,
}: {
  lead: CgiLead;
  answers: Record<string, number>;
  score: CgiScoreResult;
  websiteEnrichment: WebsiteEnrichment;
  requestContext: RequestContext;
  language: "pt" | "en" | "es";
}): Promise<AiResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { status: "not_configured", text: "", plainText: "" };

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.5";
  const dimensionTranslations: Record<
    "pt" | "en" | "es",
    Record<string, string>
  > = {
    pt: {
      strategy: "Estratégia",
      market: "Mercado e Cliente",
      growthMachine: "Máquina de Crescimento",
      execution: "Execução e Gestão",
      leadership: "Liderança e Cultura de Crescimento",
    },
    en: {
      strategy: "Strategy",
      market: "Market and Customer",
      growthMachine: "Growth Machine",
      execution: "Execution and Management",
      leadership: "Leadership and Growth Culture",
    },
    es: {
      strategy: "Estrategia",
      market: "Mercado y Cliente",
      growthMachine: "Máquina de Crecimiento",
      execution: "Ejecución y Gestión",
      leadership: "Liderazgo y Cultura de Crecimiento",
    },
  };
  const compactAnswers = CGI_QUESTIONS.map((question) => ({
    id: question.id,
    dimension:
      dimensionTranslations[language][question.dimensionId] || question.dimensionId,
    question:
      language === "pt"
        ? question.text
        : `Assessment question ${question.id} for ${
            dimensionTranslations[language][question.dimensionId] || question.dimensionId
          }`,
    answer: answers[question.id],
  }));
  const localizedDimensions = CGI_DIMENSIONS.map((dimension) => ({
    ...dimension,
    title: dimensionTranslations[language][dimension.id] || dimension.title,
    shortTitle: dimensionTranslations[language][dimension.id] || dimension.title,
  }));
  const localizedScore = {
    ...score,
    dimensionScores: score.dimensionScores.map((item) => ({
      ...item,
      title: dimensionTranslations[language][item.dimensionId] || item.title,
    })),
    attentionPoints: score.attentionPoints.map((item) => ({
      ...item,
      title: dimensionTranslations[language][item.dimensionId] || item.title,
    })),
  };
  const languageInstruction =
    language === "en"
      ? "CRITICAL LANGUAGE RULE: write every title, paragraph, bullet and recommendation in natural executive English. Do not write Portuguese or Spanish words, except proper names, brands, URLs and literal user-provided values."
      : language === "es"
        ? "REGLA CRÍTICA DE IDIOMA: escriba todos los títulos, párrafos, bullets y recomendaciones en español latinoamericano neutro, adecuado para Panamá y América Latina. No escriba palabras en portugués o inglés, excepto nombres propios, marcas, URLs y valores literales informados por el usuario. Use los nombres de dimensión en español."
        : "REGRA CRÍTICA DE IDIOMA: escreva todos os títulos, parágrafos, bullets e recomendações em português executivo do Brasil. Não misture inglês ou espanhol, exceto nomes próprios, marcas, URLs e valores literais informados pelo usuário.";

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
                  `${languageInstruction}\n\nVocê é um consultor sênior da Caldeira Growth. Gere um relatório executivo no formato de parecer estratégico, usando o guia de estilo e conteúdo fornecido. O relatório deve ser discursivo, analítico e útil, mas enxuto para uma versão gratuita: limite o conteúdo total a aproximadamente 10.000 a 13.000 caracteres, incluindo espaços, para resultar em cerca de 6 a 8 páginas quando diagramado com capa, gráficos e rodapé. Não escreva um comentário curto sobre o índice, mas também não produza um relatório longo de consultoria completa. Use o CGI como evidência inicial para construir hipóteses executivas sobre qualidade do crescimento, foco, disciplina de gestão, mercado, máquina comercial, execução, liderança e cultura. Se houver public_website_context com status ok, use título, descrição, headings e texto observado do site como contexto público sobre posicionamento, oferta, linguagem comercial e possíveis segmentos atendidos. O conteúdo do site pode estar em idioma diferente do idioma solicitado; nesse caso, use apenas o significado como contexto e escreva tudo no idioma solicitado. Não copie frases do site em outro idioma. Use lead.comments, quando existir, para calibrar hipóteses, prioridades e linguagem do diagnóstico. Trate esses sinais como observações externas a validar, não como fatos definitivos. Não invente dados financeiros, nomes, fatos ou números fora do assessment, do comentário livre e do site observado. Quando faltar informação, explicite como hipótese qualificada. Retorne apenas JSON válido com as chaves: report_title, report_subtitle, email_subject, executive_summary, strategic_diagnosis, dimension_reading, critical_bottlenecks, strategic_bets, renunciations, governance_system, final_recommendations. executive_summary deve ter 2 parágrafos. strategic_diagnosis deve ter 4 a 5 parágrafos discursivos. dimension_reading deve ser array de objetos com dimension, score, analysis, implication; cada analysis deve ter 1 parágrafo curto e cada implication deve explicar a consequência estratégica em 1 parágrafo curto. critical_bottlenecks, strategic_bets, renunciations, governance_system e final_recommendations devem ser arrays com 2 a 3 itens; cada item deve ser um texto completo de 50 a 85 palavras. Sem markdown decorativo.`,
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
                  request_context: requestContext,
                  public_website_context: websiteEnrichment,
                  language,
                  cgi: localizedScore,
                  dimensions: localizedDimensions,
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
        max_output_tokens: 5200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CGI OpenAI] request_failed", response.status, errorText);
      return { status: "error", text: "", plainText: "" };
    }

    const data = await response.json();
    let text = extractOutputText(data);
    if (language !== "pt") {
      if (hasPortugueseLeak(text)) {
        console.warn("[CGI OpenAI] portuguese_leak_detected", { language });
      }
      text = await rewriteAiReportLanguage({
        apiKey,
        model,
        text,
        language,
      });
    }
    return {
      status: "generated",
      text,
      plainText: formatAiReportForEmail(text, language),
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

  const leadValidation = await validateLead(payload.lead);
  if (leadValidation.error) {
    res.status(400).json({
      ok: false,
      error: leadValidation.error,
      emailValidation: leadValidation.emailValidation,
    });
    return;
  }

  const answers = normalizeCgiAnswers(payload.answers ?? {});
  if (!areCgiAnswersComplete(answers)) {
    res.status(400).json({ ok: false, error: "incomplete_answers" });
    return;
  }

  const language: "pt" | "en" | "es" =
    payload.language === "en" || payload.language === "es" ? payload.language : "pt";
  const score = calculateCgiScore(answers);
  const requestContext = getRequestContext(req);
  const websiteEnrichment = await enrichCompanyWebsite(payload.lead?.companyWebsite);
  const ai = await generateAiDiagnostic({
    lead: payload.lead as CgiLead,
    answers,
    score,
    websiteEnrichment,
    requestContext,
    language,
  });

  const url = getAppsScriptUrl();
  if (!url) {
    res.status(200).json({
      ok: true,
      save: { ok: false, error: "not_configured" },
      score,
      ai,
      websiteEnrichment,
      requestContext,
    });
    return;
  }

  const upstreamPayload = {
    action: "cgi_assessment",
    language,
    lead: payload.lead,
    answers,
    score,
    emailValidation: leadValidation.emailValidation,
    websiteEnrichment,
    requestContext,
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
    res.status(200).json({
      ok: true,
      save: {
        ok: false,
        error: "upstream_request_failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      score,
      ai,
      websiteEnrichment,
      requestContext,
    });
    return;
  }

  if (!upstream.ok || (data as { ok?: boolean }).ok !== true) {
    const upstreamError = String((data as { error?: unknown }).error || "");
    const error =
      upstreamError === "validation"
        ? "apps_script_outdated_or_wrong_deployment"
        : "upstream_failed";

    res.status(200).json({
      ok: true,
      save: {
        ok: false,
        error,
        upstreamStatus: upstream.status,
        upstreamUrl: upstream.url,
        upstream: data,
      },
      score,
      ai,
      websiteEnrichment,
      requestContext,
    });
    return;
  }

  res.status(200).json({
    ok: true,
    save: { ok: true },
    score,
    ai,
    websiteEnrichment,
    requestContext,
  });
}
