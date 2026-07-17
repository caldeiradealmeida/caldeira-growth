import {
  CGI_DIMENSIONS,
  CGI_LEVELS,
  CGI_QUESTIONS,
  getCgiConfig,
  type CgiDimensionId,
} from "../data/cgiConfig";
import type { Language } from "./routing";

export type CgiAnswers = Record<string, number>;

export type CgiDimensionScore = {
  dimensionId: CgiDimensionId;
  title: string;
  score: number;
  average: number;
  answered: number;
  total: number;
};

export type CgiScoreResult = {
  finalScore: number;
  level: {
    id: string;
    title: string;
    summary: string;
    recommendation: string;
  };
  dimensionScores: CgiDimensionScore[];
  attentionPoints: CgiDimensionScore[];
  diagnostic: string;
};

function clampAnswer(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (numeric < 1 || numeric > 5) return null;
  return Math.round(numeric);
}

export function normalizeCgiAnswers(input: Record<string, unknown>): CgiAnswers {
  return CGI_QUESTIONS.reduce<CgiAnswers>((acc, question) => {
    const value = clampAnswer(input[question.id]);
    if (value !== null) acc[question.id] = value;
    return acc;
  }, {});
}

export function areCgiAnswersComplete(answers: CgiAnswers): boolean {
  return CGI_QUESTIONS.every((question) => clampAnswer(answers[question.id]) !== null);
}

export function calculateCgiScore(
  input: Record<string, unknown>,
  lang: Language = "pt"
): CgiScoreResult {
  const answers = normalizeCgiAnswers(input);
  const config = getCgiConfig(lang);

  const dimensionScores = config.dimensions.map<CgiDimensionScore>((dimension) => {
    const questions = CGI_QUESTIONS.filter(
      (question) => question.dimensionId === dimension.id
    );
    const values = questions
      .map((question) => answers[question.id])
      .filter((value): value is number => clampAnswer(value) !== null);
    const average =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;
    const score = Math.round(((average - 1) / 4) * 100);

    return {
      dimensionId: dimension.id,
      title: dimension.title,
      score: Math.max(0, Math.min(100, score)),
      average: Number(average.toFixed(2)),
      answered: values.length,
      total: questions.length,
    };
  });

  const finalScore = Math.round(
    dimensionScores.reduce((sum, item) => sum + item.score, 0) /
      dimensionScores.length
  );
  const level =
    config.levels.find((item) => finalScore >= item.min && finalScore <= item.max) ||
    CGI_LEVELS[0];
  const attentionPoints = [...dimensionScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return {
    finalScore,
    level,
    dimensionScores,
    attentionPoints,
    diagnostic: `${level.summary} ${level.recommendation}`,
  };
}
