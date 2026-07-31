import type { cgiUi } from "../config";
import type { Language } from "@/lib/routing";
import type { CgiScoreResult } from "@/lib/cgiScore";
import type { parseAiReport } from "./report";

export type LabeledSegment = { label: string; text: string };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A right-arrow ("→", U+2192) occasionally shows up in AI-generated sequence
// phrases (e.g. "tráfego → diagnóstico → proposta"). Standard PDF fonts have
// no glyph for it and have been observed rendering it as the garbled "!'"/
// "!’" pair instead (see normalizePdfText in report.ts, which further
// substitutes the word "para" for it in PDF output). Canonicalize every
// variant - including that corrupted artifact, in case it already made it
// into stored text - to a plain "→" here, once, so both the web/HTML
// renderer (which displays "→" fine) and the PDF renderer always start from
// the same clean text rather than whatever encoding artifact might already
// be present.
const ARROW_LIKE_RE = /\s*(?:→|➜|⇒|⟶|->|!['’])\s*/g;

export function normalizeReportText(value: string): string {
  return String(value || "")
    .replace(ARROW_LIKE_RE, " → ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function stripTrailingPeriod(value: string) {
  return value.replace(/\.\s*$/, "");
}

// Capitalizes the first letter of AI-generated text so a sentence that
// happened to start lowercase doesn't read as unpolished. Purely a display
// normalization - never changes the words themselves.
function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Glues the last two words of a short heading-like string together with a
// non-breaking space, so a line wrap never strands a single short word
// alone on its own line. Only applied to titles/headings - long body
// paragraphs wrap normally.
function preventOrphanWord(value: string): string {
  const lastSpace = value.lastIndexOf(" ");
  if (lastSpace === -1) return value;
  return `${value.slice(0, lastSpace)}\u00A0${value.slice(lastSpace + 1)}`;
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

// --- Deterministic, per-section field contracts --------------------------
//
// Which part of a raw AI string is the bold item title vs. a labeled field
// is decided entirely by which report section it belongs to - never by text
// length, punctuation, or a generic "any capitalized word before a colon"
// heuristic. Each section knows exactly which field labels to expect - in
// Portuguese, matching the AI prompt's literal contract (api/cgi-assessment.ts
// REPORT_ITEM_CONTRACTS), plus the English/Spanish equivalents the model may
// use when asked to write a translated report - and always renders them in
// this fixed canonical order and casing, regardless of how (or whether) the
// model capitalized, punctuated or ordered them.

type SectionField = { canonical: string; variants: string[] };
type SectionSpec = { titleMarkers: string[]; fields: SectionField[] };

const SECTION_SPECS = {
  criticalBottlenecks: {
    titleMarkers: ["Título", "Title"],
    fields: [
      {
        canonical: "Sinal observado",
        variants: ["Sinal observado", "Observed signal", "Señal observada"],
      },
      {
        canonical: "Causa provável",
        variants: ["Causa provável", "Probable cause", "Causa probable"],
      },
      {
        canonical: "Impacto estratégico",
        variants: ["Impacto estratégico", "Strategic impact"],
      },
    ],
  },
  strategicBets: {
    titleMarkers: ["Título", "Title"],
    fields: [
      {
        canonical: "Ação prioritária",
        variants: ["Ação prioritária", "Priority action", "Acción prioritaria"],
      },
      {
        canonical: "Resultado esperado",
        variants: ["Resultado esperado", "Expected result", "Expected outcome"],
      },
      { canonical: "Horizonte", variants: ["Horizonte", "Horizon"] },
    ],
  },
  renunciations: {
    titleMarkers: ["Escolha", "Choice"],
    fields: [
      {
        canonical: "O que deixar de fazer",
        variants: ["O que deixar de fazer", "What to stop doing", "What to stop", "Qué dejar de hacer"],
      },
      {
        canonical: "Recurso ou capacidade protegida",
        variants: [
          "Recurso ou capacidade protegida",
          "Protected resource or capability",
          "Protected resource",
          "Protected capability",
          "Recurso o capacidad protegida",
        ],
      },
      {
        canonical: "Racional estratégico",
        variants: ["Racional estratégico", "Strategic rationale"],
      },
    ],
  },
  governanceSystem: {
    titleMarkers: ["Ritual"],
    fields: [
      { canonical: "Frequência", variants: ["Frequência", "Frequency", "Frecuencia"] },
      { canonical: "Participantes", variants: ["Participantes", "Participants"] },
      { canonical: "Indicadores", variants: ["Indicadores", "Indicators", "Metrics"] },
      {
        canonical: "Decisão esperada",
        variants: ["Decisão esperada", "Expected decision", "Decisión esperada"],
      },
    ],
  },
  finalRecommendations: {
    titleMarkers: ["Recomendação", "Recommendation"],
    fields: [
      { canonical: "Prioridade", variants: ["Prioridade", "Priority", "Prioridad"] },
      {
        canonical: "Próximo passo",
        variants: ["Próximo passo", "Next step", "Próximo paso"],
      },
      {
        canonical: "Condição de validação",
        variants: ["Condição de validação", "Validation condition", "Condición de validación"],
      },
    ],
  },
} satisfies Record<string, SectionSpec>;

function stripTitleMarker(text: string, titleMarkers: string[]): string {
  if (!titleMarkers.length) return text;
  const alternatives = titleMarkers.map(escapeRegExp).join("|");
  return text.replace(new RegExp(`^\\s*(?:${alternatives})\\s*:\\s*`, "i"), "");
}

function buildFieldRegex(fields: SectionField[]): RegExp {
  const alternatives = fields
    .flatMap((field) => field.variants)
    .map(escapeRegExp)
    // Longest-first so e.g. "Protected resource or capability" is tried
    // before the shorter "Protected resource" it starts with.
    .sort((a, b) => b.length - a.length);
  return new RegExp(`\\b(${alternatives.join("|")})\\s*:\\s*`, "gi");
}

function canonicalFieldFor(matchedVariant: string, fields: SectionField[]): string {
  const normalized = matchedVariant.trim().toLowerCase();
  const found = fields.find((field) =>
    field.variants.some((variant) => variant.toLowerCase() === normalized)
  );
  return found ? found.canonical : matchedVariant.trim();
}

// Splits one raw AI string into its short title plus its section's known
// labeled fields, using only that section's own fixed field contract.
function splitBySectionSpec(
  raw: string,
  spec: SectionSpec
): { title: string; fields: LabeledSegment[] } {
  const text = stripTitleMarker(normalizeReportText(raw), spec.titleMarkers);
  const regex = buildFieldRegex(spec.fields);
  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) {
    return { title: text, fields: [] };
  }

  const title = text.slice(0, matches[0].index ?? 0).trim();
  const fields: LabeledSegment[] = matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = matches[index + 1]?.index ?? text.length;
      return {
        label: canonicalFieldFor(match[1], spec.fields),
        text: text.slice(start, end).trim(),
      };
    })
    .filter((segment) => segment.text);

  // Always render fields in the section's own canonical order, regardless
  // of the order the model happened to write them in.
  const orderIndex = new Map(spec.fields.map((field, index) => [field.canonical, index]));
  fields.sort((a, b) => (orderIndex.get(a.label) ?? 0) - (orderIndex.get(b.label) ?? 0));

  return { title: title || text, fields };
}

function buildSectionItems(
  rawItems: string[],
  ordinalLabel: string,
  spec: SectionSpec
): ReportBlockItem[] {
  return rawItems.map((raw, index) => {
    const { title, fields } = splitBySectionSpec(raw, spec);
    const capitalizedFields = fields.map((field) => ({
      ...field,
      text: capitalizeFirst(field.text),
    }));
    return {
      number: index + 1,
      title: preventOrphanWord(
        `${ordinalLabel} ${index + 1} — ${capitalizeFirst(stripTrailingPeriod(title))}`
      ),
      segments: capitalizedFields,
      emphasis: true,
    };
  });
}

// The model sometimes prefixes its own hypothesis sentence with the literal
// word "Hipótese:" (marking it "clearly as a hypothesis", per the prompt) -
// redundant once we already render "Hipótese N" as the title, producing
// "Hipótese N / Hipótese: <text>". Strip only that literal leading word; the
// rest of the sentence is never shortened or otherwise touched.
const HYPOTHESIS_PREFIX_RE = /^\s*(?:Hip[oó]tese|Hip[oó]tesis|Hypothesis)\s*:\s*/i;

function stripHypothesisPrefix(text: string): string {
  return text.replace(HYPOTHESIS_PREFIX_RE, "");
}

// Hypotheses render only the ordinal ("Hipótese N") in bold - the entire
// sentence is normal-weight body text below it. No title is ever extracted
// from the sentence.
function buildHypothesisItems(rawItems: string[], ordinalLabel: string): ReportBlockItem[] {
  return rawItems.map((raw, index) => ({
    number: index + 1,
    title: `${ordinalLabel} ${index + 1}`,
    segments: [
      { label: "", text: capitalizeFirst(stripHypothesisPrefix(normalizeReportText(raw))) },
    ],
    emphasis: true,
  }));
}

// Evidence bullets have no label contract at all - always a single
// unlabeled, non-emphasis line.
function buildEvidenceItems(rawItems: string[]): ReportBlockItem[] {
  return rawItems.map((raw, index) => ({
    number: index + 1,
    title: preventOrphanWord(
      `${index + 1}. ${capitalizeFirst(stripTrailingPeriod(normalizeReportText(raw)))}`
    ),
    segments: [],
    emphasis: false,
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
    normalizeReportText(value || "")
      .split(/\n\s*\n/)
      .map((paragraph) => capitalizeFirst(paragraph.trim()))
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

  // Dimension names and their order are always the 5 canonical CGI
  // dimensions from result.dimensionScores (computed locally from the
  // respondent's answers, never AI-generated), matched to the AI's
  // dimension_reading entries strictly by position. The AI's own
  // "dimension" field and self-reported "score" are never used as a display
  // label or score, so AI text can never rename or duplicate a dimension.
  if (Array.isArray(aiReport.dimension_reading) && aiReport.dimension_reading.length) {
    blocks.push({ kind: "heading", level: 2, text: t.dimensionReadingTitle });
    result.dimensionScores.forEach((dimensionScore, index) => {
      const item = aiReport.dimension_reading?.[index];
      if (!item) return;
      blocks.push({
        kind: "heading",
        level: 3,
        text: `${dimensionScore.title} (${dimensionScore.score}/100)`,
      });
      // Rendered as two independent paragraphs, never joined with ": " -
      // that join is exactly what produced the "foco.: O risco…" artifact.
      if (item.analysis) {
        blocks.push({
          kind: "paragraph",
          text: capitalizeFirst(normalizeReportText(item.analysis)),
        });
      }
      if (item.implication) {
        blocks.push({
          kind: "paragraph",
          text: capitalizeFirst(normalizeReportText(item.implication)),
        });
      }
    });
  }

  const evidence = toStringArray(aiReport.evidence_summary);
  if (evidence.length) {
    blocks.push({ kind: "heading", level: 2, text: t.evidenceSummaryTitle });
    blocks.push({ kind: "numbered", items: buildEvidenceItems(evidence) });
  }

  type SectionDescriptor =
    | { kind: "fields"; items?: string[]; title: string; ordinal: string; spec: SectionSpec }
    | { kind: "hypothesis"; items?: string[]; title: string; ordinal: string };

  const sections: SectionDescriptor[] = [
    {
      kind: "fields",
      items: aiReport.critical_bottlenecks,
      title: t.criticalBottlenecksTitle,
      ordinal: t.itemOrdinalLabels.criticalBottlenecks,
      spec: SECTION_SPECS.criticalBottlenecks,
    },
    {
      kind: "fields",
      items: aiReport.strategic_bets,
      title: t.strategicBetsTitle,
      ordinal: t.itemOrdinalLabels.strategicBets,
      spec: SECTION_SPECS.strategicBets,
    },
    {
      kind: "fields",
      items: aiReport.renunciations,
      title: t.renunciationsTitle,
      ordinal: t.itemOrdinalLabels.renunciations,
      spec: SECTION_SPECS.renunciations,
    },
    {
      kind: "fields",
      items: aiReport.governance_system,
      title: t.governanceTitle,
      ordinal: t.itemOrdinalLabels.governanceSystem,
      spec: SECTION_SPECS.governanceSystem,
    },
    {
      kind: "hypothesis",
      items: aiReport.hypotheses_to_validate,
      title: t.hypothesesTitle,
      ordinal: t.itemOrdinalLabels.hypotheses,
    },
    {
      kind: "fields",
      items: aiReport.final_recommendations || aiReport.recommended_next_steps,
      title: t.finalRecommendationsTitle,
      ordinal: t.itemOrdinalLabels.finalRecommendations,
      spec: SECTION_SPECS.finalRecommendations,
    },
  ];

  sections.forEach((section) => {
    const rawItems = toStringArray(section.items);
    if (!rawItems.length) return;
    blocks.push({ kind: "heading", level: 2, text: section.title });
    const items =
      section.kind === "hypothesis"
        ? buildHypothesisItems(rawItems, section.ordinal)
        : buildSectionItems(rawItems, section.ordinal, section.spec);
    blocks.push({ kind: "numbered", items });
  });

  return blocks;
}
