import type { cgiUi } from "../config";
import type { Language } from "@/lib/routing";
import type { CgiScoreResult } from "@/lib/cgiScore";
import type { parseAiReport } from "./report";

export type LabeledSegment = { label: string; text: string };

// Splits a single labeled-contract string (e.g. "Título: X. Sinal observado:
// Y. Causa provável: Z.") into its individual label/text segments. Generic
// and language-agnostic - it looks for short capitalized "Label: " runs that
// start either at the beginning of the string or right after a sentence
// boundary, rather than hardcoding the Portuguese label vocabulary (which
// would break for en/es translated reports).
const LABEL_BOUNDARY_RE = /(^|\.\s+)([A-ZÀ-Ý][\w À-ÿ/'’-]{1,44}):\s+/g;

export function parseLabeledSegments(raw: string): LabeledSegment[] {
  const text = String(raw || "").trim();
  if (!text) return [];

  const matches = [...text.matchAll(LABEL_BOUNDARY_RE)];
  if (matches.length === 0) return [{ label: "", text }];

  const segments: LabeledSegment[] = [];
  matches.forEach((match, index) => {
    const label = match[2].trim();
    const start = (match.index ?? 0) + match[0].length;
    const nextMatch = matches[index + 1];
    // The next match's boundary group (". ") belongs to the end of *this*
    // segment's sentence, not to the next label - keep the period here so
    // segments end cleanly instead of losing their terminal punctuation.
    const nextBoundary = nextMatch?.[1] || "";
    const end = nextMatch
      ? (nextMatch.index ?? text.length) + (nextBoundary.startsWith(".") ? 1 : 0)
      : text.length;
    const value = text.slice(start, end).trim();
    if (value) segments.push({ label, text: value });
  });
  return segments.length ? segments : [{ label: "", text }];
}

function stripTrailingPeriod(value: string) {
  return value.replace(/\.\s*$/, "");
}

function toStringArray(value?: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

export type ReportBlockItem = {
  number: number;
  title: string;
  segments: LabeledSegment[];
  // Titled items (Gargalo/Aposta/Renúncia/Ritual/Hipótese/Recomendação) get
  // heading-weight styling. Plain factual bullets (evidence_summary) don't
  // carry a word ordinal and render as a lighter numbered line instead of a
  // full heading, so a short one-sentence bullet doesn't look like a
  // section title.
  emphasis: boolean;
};

// Covers only the AI-generated content sections. The cover, score bars,
// methodology box, signature and contact sections remain deterministic and
// are rendered separately in report.ts, outside this block list.
export type ReportBlock =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "numbered"; items: ReportBlockItem[] };

function buildLabeledItems(rawItems: string[], ordinalLabel: string): ReportBlockItem[] {
  return rawItems.map((raw, index) => {
    const segments = parseLabeledSegments(raw);
    const [first, ...rest] = segments;
    if (first?.label) {
      return {
        number: index + 1,
        title: `${ordinalLabel} ${index + 1} — ${stripTrailingPeriod(first.text)}`,
        segments: rest,
        emphasis: true,
      };
    }
    return {
      number: index + 1,
      title: `${ordinalLabel} ${index + 1} — ${stripTrailingPeriod(raw.trim())}`,
      segments: [],
      emphasis: true,
    };
  });
}

function buildPlainItems(rawItems: string[], ordinalLabel: string): ReportBlockItem[] {
  return rawItems.map((raw, index) => ({
    number: index + 1,
    title: ordinalLabel
      ? `${ordinalLabel} ${index + 1} — ${stripTrailingPeriod(raw.trim())}`
      : `${index + 1}. ${stripTrailingPeriod(raw.trim())}`,
    segments: [],
    emphasis: Boolean(ordinalLabel),
  }));
}

export function buildReportBlocks({
  aiReport,
  result,
  t,
}: {
  aiReport: ReturnType<typeof parseAiReport>;
  result: CgiScoreResult;
  t: (typeof cgiUi)[Language];
}): ReportBlock[] {
  if (!aiReport) return [];
  const blocks: ReportBlock[] = [];
  const paragraphs = (value?: string) =>
    String(value || "")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

  if (aiReport.executive_summary) {
    blocks.push({ kind: "heading", level: 2, text: t.executiveSummaryTitle });
    paragraphs(aiReport.executive_summary).forEach((text) =>
      blocks.push({ kind: "paragraph", text })
    );
  }

  const diagnosis = aiReport.strategic_diagnosis || aiReport.priority_diagnosis;
  if (diagnosis) {
    blocks.push({ kind: "heading", level: 2, text: t.diagnosis });
    paragraphs(diagnosis).forEach((text) => blocks.push({ kind: "paragraph", text }));
  }

  if (Array.isArray(aiReport.dimension_reading) && aiReport.dimension_reading.length) {
    blocks.push({ kind: "heading", level: 2, text: t.dimensionReadingTitle });
    aiReport.dimension_reading.forEach((item, index) => {
      const matchingDimension =
        typeof item.score === "number"
          ? result.dimensionScores.find((score) => score.score === item.score)
          : undefined;
      const dimensionLabel =
        matchingDimension?.title ||
        result.dimensionScores[index]?.title ||
        item.dimension ||
        t.dimensionReadingTitle;
      const scoreValue = item.score ?? matchingDimension?.score;
      blocks.push({
        kind: "heading",
        level: 3,
        text: `${dimensionLabel}${scoreValue ? ` (${scoreValue}/100)` : ""}`,
      });
      // Rendered as two independent paragraphs, never joined with ": " -
      // that join is exactly what produced the "foco.: O risco…" artifact.
      if (item.analysis) blocks.push({ kind: "paragraph", text: item.analysis });
      if (item.implication) blocks.push({ kind: "paragraph", text: item.implication });
    });
  }

  const evidence = toStringArray(aiReport.evidence_summary);
  if (evidence.length) {
    blocks.push({ kind: "heading", level: 2, text: t.evidenceSummaryTitle });
    blocks.push({ kind: "numbered", items: buildPlainItems(evidence, "") });
  }

  const sections: Array<{
    items?: string[];
    title: string;
    ordinal: string;
    labeled: boolean;
  }> = [
    {
      items: aiReport.critical_bottlenecks,
      title: t.criticalBottlenecksTitle,
      ordinal: t.itemOrdinalLabels.criticalBottlenecks,
      labeled: true,
    },
    {
      items: aiReport.strategic_bets,
      title: t.strategicBetsTitle,
      ordinal: t.itemOrdinalLabels.strategicBets,
      labeled: true,
    },
    {
      items: aiReport.renunciations,
      title: t.renunciationsTitle,
      ordinal: t.itemOrdinalLabels.renunciations,
      labeled: true,
    },
    {
      items: aiReport.governance_system,
      title: t.governanceTitle,
      ordinal: t.itemOrdinalLabels.governanceSystem,
      labeled: true,
    },
    {
      items: aiReport.hypotheses_to_validate,
      title: t.hypothesesTitle,
      ordinal: t.itemOrdinalLabels.hypotheses,
      labeled: false,
    },
    {
      items: aiReport.final_recommendations || aiReport.recommended_next_steps,
      title: t.finalRecommendationsTitle,
      ordinal: t.itemOrdinalLabels.finalRecommendations,
      labeled: true,
    },
  ];

  sections.forEach(({ items, title, ordinal, labeled }) => {
    const rawItems = toStringArray(items);
    if (!rawItems.length) return;
    blocks.push({ kind: "heading", level: 2, text: title });
    blocks.push({
      kind: "numbered",
      items: labeled ? buildLabeledItems(rawItems, ordinal) : buildPlainItems(rawItems, ordinal),
    });
  });

  return blocks;
}
