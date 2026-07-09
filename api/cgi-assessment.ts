import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CGI_DIMENSIONS, CGI_QUESTIONS } from "../src/data/cgiConfig";
import { buildCgiReportPromptContext } from "./cgi-report-guide";
import {
  areCgiAnswersComplete,
  calculateCgiScore,
  normalizeCgiAnswers,
  type CgiScoreResult,
} from "../src/lib/cgiScore";

type CgiLead = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
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
}: {
  lead: CgiLead;
  answers: Record<string, number>;
  score: CgiScoreResult;
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
                  "Você é um consultor sênior da Caldeira Growth. Gere um relatório executivo no formato de parecer estratégico, usando o guia de estilo e conteúdo fornecido. Não invente dados. Trate o assessment como evidência inicial, não como verdade absoluta. Retorne apenas JSON válido com as chaves: report_title, report_subtitle, email_subject, executive_summary, strategic_diagnosis, dimension_reading, critical_bottlenecks, strategic_bets, renunciations, governance_system, final_recommendations. dimension_reading deve ser array de objetos com dimension, score, analysis, implication. critical_bottlenecks, strategic_bets, renunciations, governance_system e final_recommendations devem ser arrays com 3 a 5 itens.",
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
  const ai = await generateAiDiagnostic({
    lead: payload.lead as CgiLead,
    answers,
    score,
  });

  const url = getAppsScriptUrl();
  if (!url) {
    res.status(503).json({ ok: false, error: "not_configured", score, ai });
    return;
  }

  const upstreamPayload = {
    action: "cgi_assessment",
    lead: payload.lead,
    answers,
    score,
    aiReport: ai.text,
    aiReportText: ai.plainText,
    aiStatus: ai.status,
    userAgent: req.headers["user-agent"] ?? "",
    referrer: req.headers.referer ?? req.headers.referrer ?? "",
  };

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(upstreamPayload),
  });

  const text = await upstream.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!upstream.ok || (data as { ok?: boolean }).ok !== true) {
    res.status(502).json({ ok: false, error: "upstream_failed", upstream: data, score, ai });
    return;
  }

  res.status(200).json({ ok: true, score, ai });
}
