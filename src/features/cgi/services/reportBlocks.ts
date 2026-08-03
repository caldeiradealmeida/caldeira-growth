import type { cgiUi, ReportFieldKey } from "../config";
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

// C0/C1 control characters (e.g. a stray U+0011) occasionally leak into
// AI-generated JSON strings. They're invisible but not whitespace, and
// standard PDF fonts have no glyph for them, so they show up as layout
// artifacts. Tab, newline and carriage return are left alone - they're
// meaningful whitespace, not corruption. Iterates by code point (not
// UTF-16 code unit) so this never splits a surrogate pair.
function stripInvisibleControlChars(value: string): string {
  return Array.from(value)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      const isControl = code <= 31 || (code >= 127 && code <= 159);
      const isPreservedWhitespace = code === 9 || code === 10 || code === 13;
      return !isControl || isPreservedWhitespace;
    })
    .join("");
}

// Soft hyphen (U+00AD) is an invisible line-break hint with no purpose in
// this rendering pipeline (no manual hyphenation) - some renderers show it
// as a stray visible hyphen instead of hiding it, so it's dropped outright.
const SOFT_HYPHEN_RE = /­/g;
// Hyphen (U+2010) and non-breaking hyphen (U+2011) are typographically
// identical to a plain ASCII hyphen but fall outside the WinAnsi/Latin-1
// range standard PDF fonts cover, and have been observed producing missing-
// glyph gaps in compound words like "non‑negotiable". Convert both to the
// plain ASCII hyphen every renderer can display correctly.
const HYPHEN_VARIANTS_RE = /[‐‑]/g;

export function normalizeReportText(value: string): string {
  return stripInvisibleControlChars(String(value || ""))
    .replace(SOFT_HYPHEN_RE, "")
    .replace(HYPHEN_VARIANTS_RE, "-")
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

type SectionField = { key: ReportFieldKey; variants: string[] };
export type SectionSpec = { titleMarkers: string[]; fields: SectionField[] };

export const SECTION_SPECS = {
  criticalBottlenecks: {
    titleMarkers: ["Título", "Title"],
    fields: [
      {
        key: "observedSignal",
        // "Observed sign" (missing "al") and the masculine "Señal observado"
        // (grammatically it should agree as "observada", but the model has
        // been observed producing the masculine form) are both real model
        // output confirmed in a live-generated report, not just guesses.
        variants: [
          "Sinal observado",
          "Observed signal",
          "Observed sign",
          "Señal observada",
          "Señal observado",
        ],
      },
      {
        key: "probableCause",
        variants: ["Causa provável", "Probable cause", "Causa probable"],
      },
      {
        key: "strategicImpact",
        variants: ["Impacto estratégico", "Strategic impact"],
      },
    ],
  },
  strategicBets: {
    titleMarkers: ["Título", "Title"],
    fields: [
      {
        key: "priorityAction",
        variants: ["Ação prioritária", "Priority action", "Acción prioritaria"],
      },
      {
        key: "expectedResult",
        variants: ["Resultado esperado", "Expected result", "Expected outcome"],
      },
      { key: "horizon", variants: ["Horizonte", "Horizon"] },
    ],
  },
  renunciations: {
    // "Elección" (Spanish for "Escolha"/"Choice") is a real, confirmed gap -
    // without it, "Elección:" was left un-stripped at the start of the item
    // title in a live-generated Spanish report.
    titleMarkers: ["Escolha", "Choice", "Elección"],
    fields: [
      {
        key: "whatToStop",
        // "Lo que se debe dejar de hacer" is the longer phrasing the model
        // actually used in a live Spanish report, alongside the shorter
        // "Qué dejar de hacer" already covered here.
        variants: [
          "O que deixar de fazer",
          "What to stop doing",
          "What to stop",
          "Qué dejar de hacer",
          "Lo que se debe dejar de hacer",
        ],
      },
      {
        key: "protectedResource",
        variants: [
          "Recurso ou capacidade protegida",
          "Protected resource or capability",
          "Protected resource",
          "Protected capability",
          // Reversed word order the model actually used in a live English
          // report ("Resource or capability protected:"), as opposed to
          // the "Protected resource or capability" phrasing already above.
          "Resource or capability protected",
          "Recurso o capacidad protegida",
        ],
      },
      {
        key: "strategicRationale",
        variants: ["Racional estratégico", "Strategic rationale"],
      },
    ],
  },
  governanceSystem: {
    titleMarkers: ["Ritual"],
    fields: [
      { key: "frequency", variants: ["Frequência", "Frequency", "Frecuencia"] },
      { key: "participants", variants: ["Participantes", "Participants"] },
      { key: "indicators", variants: ["Indicadores", "Indicators", "Metrics"] },
      {
        key: "expectedDecision",
        variants: ["Decisão esperada", "Expected decision", "Decisión esperada"],
      },
    ],
  },
  finalRecommendations: {
    // "Recomendación" (Spanish) added proactively alongside the confirmed
    // renunciations/"Elección" fix above - same missing-Spanish-marker
    // pattern, not yet directly observed failing here, but a zero-risk,
    // purely additive alias.
    titleMarkers: ["Recomendação", "Recommendation", "Recomendación"],
    fields: [
      { key: "priority", variants: ["Prioridade", "Priority", "Prioridad"] },
      {
        key: "nextStep",
        variants: ["Próximo passo", "Next step", "Próximo paso"],
      },
      {
        key: "validationCondition",
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

function fieldKeyFor(matchedVariant: string, fields: SectionField[]): ReportFieldKey {
  const normalized = matchedVariant.trim().toLowerCase();
  const found = fields.find((field) =>
    field.variants.some((variant) => variant.toLowerCase() === normalized)
  );
  // buildFieldRegex only ever matches text drawn from `fields.variants`, so
  // `found` is always defined in practice - this fallback exists purely so
  // the function stays total without a non-null assertion.
  return found ? found.key : fields[0].key;
}

// Splits one raw AI string into its short title plus its section's known
// labeled fields, using only that section's own fixed field contract. The
// parser recognizes a field regardless of which language's variant the raw
// text used (see SECTION_SPECS above); the label actually shown always
// comes from t.reportFieldLabels, keyed by the report's own language - so a
// stored item is rendered identically however its raw label was written.
function splitBySectionSpec(
  raw: string,
  spec: SectionSpec,
  t: (typeof cgiUi)[Language]
): { title: string; fields: LabeledSegment[] } {
  const text = stripTitleMarker(normalizeReportText(raw), spec.titleMarkers);
  const regex = buildFieldRegex(spec.fields);
  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) {
    return { title: text, fields: [] };
  }

  const title = text.slice(0, matches[0].index ?? 0).trim();
  const keyedFields = matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = matches[index + 1]?.index ?? text.length;
      return {
        key: fieldKeyFor(match[1], spec.fields),
        text: text.slice(start, end).trim(),
      };
    })
    .filter((segment) => segment.text);

  // Always render fields in the section's own canonical order, regardless
  // of the order the model happened to write them in.
  const orderIndex = new Map(spec.fields.map((field, index) => [field.key, index]));
  keyedFields.sort((a, b) => (orderIndex.get(a.key) ?? 0) - (orderIndex.get(b.key) ?? 0));

  const fields: LabeledSegment[] = keyedFields.map((field) => ({
    label: t.reportFieldLabels[field.key],
    text: field.text,
  }));

  return { title: title || text, fields };
}

// Used by CgiResultStep's raw (unparsed, single-line-per-item) list
// rendering - the same section field contract buildReportBlocks uses above,
// but applied as an in-place label substitution on the original string
// instead of splitting it into a separate title and bold segments. This
// keeps that screen's exact existing layout (one plain string per bullet)
// while still never showing a field label in the wrong language: the title
// marker ("Título:"/"Title:") is stripped - exactly as it already is,
// invisibly, in the structured renderer - and every recognized field
// variant is swapped for t.reportFieldLabels' current-language text.
export function localizeRawSectionItem(
  raw: string,
  spec: SectionSpec,
  t: (typeof cgiUi)[Language]
): string {
  const withoutTitleMarker = stripTitleMarker(normalizeReportText(raw), spec.titleMarkers);
  const regex = buildFieldRegex(spec.fields);
  return withoutTitleMarker.replace(regex, (_match, variant: string) => {
    const key = fieldKeyFor(variant, spec.fields);
    return `${t.reportFieldLabels[key]}: `;
  });
}

function buildSectionItems(
  rawItems: string[],
  ordinalLabel: string,
  spec: SectionSpec,
  t: (typeof cgiUi)[Language]
): ReportBlockItem[] {
  return rawItems.map((raw, index) => {
    const { title, fields } = splitBySectionSpec(raw, spec, t);
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
// "Hipótese N / Hipótese: <text>". It sometimes also repeats the ordinal
// number itself ("Hypothesis 1: ..."), producing "Hypothesis 1 / Hypothesis
// 1: <text>" - the optional \d* here strips that case too, in pt/en/es.
// Strip only that literal leading prefix; the rest of the sentence is never
// shortened or otherwise touched.
const HYPOTHESIS_PREFIX_RE = /^\s*(?:Hip[oó]tese|Hip[oó]tesis|Hypothesis)\s*\d*\s*:\s*/i;

export function stripHypothesisPrefix(text: string): string {
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
        : buildSectionItems(rawItems, section.ordinal, section.spec, t);
    blocks.push({ kind: "numbered", items });
  });

  return blocks;
}
