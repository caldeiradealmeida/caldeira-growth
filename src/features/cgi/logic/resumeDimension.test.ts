import { describe, expect, it } from "vitest";
import { resolveResumeDimensionIndex } from "./resumeDimension";
import { CGI_QUESTIONS } from "@/data/cgiConfig";
import { dimensionOrder } from "../config";

const DIMENSIONS = ["strategy", "market", "growthMachine", "execution", "leadership"] as const;
const QUESTIONS = DIMENSIONS.flatMap((dimensionId, dimensionIndex) =>
  Array.from({ length: 8 }, (_, i) => ({
    id: `q${dimensionIndex * 8 + i + 1}`,
    dimensionId,
    text: "",
    helpText: "",
  }))
);

function answersUpTo(count: number): Record<string, number> {
  const answers: Record<string, number> = {};
  for (let i = 1; i <= count; i += 1) answers[`q${i}`] = 4;
  return answers;
}

describe("resolveResumeDimensionIndex", () => {
  it("opens dimension 1 (index 0) with no answers", () => {
    expect(resolveResumeDimensionIndex({}, DIMENSIONS, QUESTIONS)).toBe(0);
  });

  it("opens dimension 1 (index 0) with a partial first dimension (<8)", () => {
    expect(resolveResumeDimensionIndex(answersUpTo(5), DIMENSIONS, QUESTIONS)).toBe(0);
  });

  it("opens dimension 2 (index 1) at exactly 8 answers", () => {
    expect(resolveResumeDimensionIndex(answersUpTo(8), DIMENSIONS, QUESTIONS)).toBe(1);
  });

  it("opens dimension 3 (index 2) at exactly 16 answers", () => {
    expect(resolveResumeDimensionIndex(answersUpTo(16), DIMENSIONS, QUESTIONS)).toBe(2);
  });

  it("opens dimension 4 (index 3) at exactly 24 answers", () => {
    expect(resolveResumeDimensionIndex(answersUpTo(24), DIMENSIONS, QUESTIONS)).toBe(3);
  });

  it("opens dimension 5 (index 4) at exactly 32 answers", () => {
    expect(resolveResumeDimensionIndex(answersUpTo(32), DIMENSIONS, QUESTIONS)).toBe(4);
  });

  it("defensively opens the last dimension (index 4) at 40 answers instead of implying completion", () => {
    expect(resolveResumeDimensionIndex(answersUpTo(40), DIMENSIONS, QUESTIONS)).toBe(4);
  });

  it("uses real per-question completeness, not just the count -- a gap inside an earlier dimension is still the resume point", () => {
    const answers = answersUpTo(24);
    delete answers.q3; // hole inside dimension 1, even though 24 total answers exist
    expect(resolveResumeDimensionIndex(answers, DIMENSIONS, QUESTIONS)).toBe(0);
  });

  it("ignores out-of-range values when deciding completeness", () => {
    const answers = answersUpTo(8);
    answers.q4 = 99; // invalid value -- dimension 1 is not actually complete
    expect(resolveResumeDimensionIndex(answers, DIMENSIONS, QUESTIONS)).toBe(0);
  });

  it("integrates with the real CGI_QUESTIONS/dimensionOrder config", () => {
    const firstEightIds = CGI_QUESTIONS.filter((q) => q.dimensionId === dimensionOrder[0]).map(
      (q) => q.id
    );
    const answers = Object.fromEntries(firstEightIds.map((id) => [id, 4]));
    expect(resolveResumeDimensionIndex(answers, dimensionOrder)).toBe(1);
  });
});
