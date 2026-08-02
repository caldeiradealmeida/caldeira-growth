import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computeScrollDestination, prefersReducedMotion } from "./report";

const currentDir = dirname(fileURLToPath(import.meta.url));

function stubDocumentAndWindow({
  headerHeight,
  scrollY,
  matches = false,
}: {
  headerHeight: number;
  scrollY: number;
  matches?: boolean;
}) {
  vi.stubGlobal("document", {
    querySelector: (selector: string) =>
      selector === "header"
        ? { getBoundingClientRect: () => ({ height: headerHeight }) }
        : null,
  });
  vi.stubGlobal("window", {
    scrollY,
    matchMedia: (query: string) => ({ query, matches }),
  });
}

function makeTarget(top: number) {
  return { getBoundingClientRect: () => ({ top }) } as unknown as HTMLElement;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("computeScrollDestination", () => {
  it("subtracts the fixed header height and a visual margin from the target's absolute top", () => {
    stubDocumentAndWindow({ headerHeight: 80, scrollY: 0 });
    const target = makeTarget(1000);

    // 1000 (rect.top) + 0 (scrollY) - 80 (header) - 16 (margin) = 904
    expect(computeScrollDestination(target)).toBe(904);
  });

  it("accounts for how much the page has already scrolled (absolute, not viewport-relative)", () => {
    stubDocumentAndWindow({ headerHeight: 64, scrollY: 500 });
    const target = makeTarget(300);

    // 300 + 500 - 64 - 16 = 720
    expect(computeScrollDestination(target)).toBe(720);
  });

  it("never returns a negative destination when the target is already near the top", () => {
    stubDocumentAndWindow({ headerHeight: 96, scrollY: 0 });
    const target = makeTarget(10);

    expect(computeScrollDestination(target)).toBe(0);
  });

  it("treats a missing header as zero offset instead of throwing", () => {
    vi.stubGlobal("document", { querySelector: () => null });
    vi.stubGlobal("window", { scrollY: 0, matchMedia: () => ({ matches: false }) });
    const target = makeTarget(200);

    expect(computeScrollDestination(target)).toBe(184);
  });
});

describe("prefersReducedMotion", () => {
  it("reflects the prefers-reduced-motion media query", () => {
    stubDocumentAndWindow({ headerHeight: 0, scrollY: 0, matches: true });
    expect(prefersReducedMotion()).toBe(true);

    stubDocumentAndWindow({ headerHeight: 0, scrollY: 0, matches: false });
    expect(prefersReducedMotion()).toBe(false);
  });

  it("defaults to false when matchMedia is unavailable", () => {
    vi.stubGlobal("window", {});
    expect(prefersReducedMotion()).toBe(false);
  });
});

// The scroll/focus orchestration (retry-if-it-didn't-move, poll-until-settled
// before focusing) involves nested setTimeouts reacting to live window.scrollY
// changes - reproducing that faithfully needs a full DOM + fake-timer harness
// disproportionate to what it buys here. Following this file's own established
// pattern (CGI.emailRemoval.test.ts, CGI.leadAnalyticsOrder.test.ts) of
// reading the actual source for properties a type checker can't catch.
const reportSource = readFileSync(join(currentDir, "report.ts"), "utf-8");

// `scrollToAssessment` is a plain `export function name(...) {` - there is
// no "=>" in its own signature, and its body defines nested arrow functions
// later (focusField, pollUntilSettled), so searching for the next "=>"
// would overshoot into those. Instead, the body's brace is the first "{"
// reached while parenthesis depth is back to 0, i.e. past the parameter
// list (which correctly skips the `options?: { focusId?: string }` type
// annotation's own brace, since only "(" / ")" affect the depth count).
function extractFunctionBody(source: string, signature: string): string {
  const start = source.indexOf(signature);
  if (start === -1) throw new Error(`Could not find "${signature}" in report.ts`);

  let parenDepth = 0;
  let bodyStart = -1;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (char === "(") parenDepth += 1;
    else if (char === ")") parenDepth -= 1;
    else if (char === "{" && parenDepth === 0) {
      bodyStart = i;
      break;
    }
  }
  if (bodyStart === -1) {
    throw new Error(`Could not find body start for "${signature}" in report.ts`);
  }

  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(bodyStart, i + 1);
    }
  }
  throw new Error(`Could not find end of "${signature}" in report.ts`);
}

describe("scrollToAssessment - orchestration shape", () => {
  const scrollToAssessmentBody = extractFunctionBody(
    reportSource,
    "export function scrollToAssessment"
  );

  it("scrolls with window.scrollTo, not element.scrollIntoView", () => {
    expect(scrollToAssessmentBody).toContain("window.scrollTo(");
    expect(scrollToAssessmentBody).not.toContain("scrollIntoView");
  });

  it("targets the requested field id when given, falling back to the section", () => {
    expect(scrollToAssessmentBody).toContain('document.getElementById(options.focusId)');
    expect(scrollToAssessmentBody).toContain('document.getElementById("cgi-assessment")');
  });

  it("retries with an instant jump if the smooth scroll hasn't started moving", () => {
    expect(scrollToAssessmentBody).toMatch(
      /barelyMoved[\s\S]*shouldHaveMoved[\s\S]*window\.scrollTo\(\{ top: destination, behavior: "auto" \}\)/
    );
  });

  it("focuses only after polling for the scroll to settle, not on a fixed guessed delay", () => {
    expect(scrollToAssessmentBody).toContain("pollUntilSettled");
    expect(scrollToAssessmentBody).toContain("preventScroll: true");
    expect(scrollToAssessmentBody).not.toMatch(/focus\(\{ preventScroll: true \}\).*,\s*500\s*\)/);
  });

  it("never reloads or navigates the page", () => {
    expect(scrollToAssessmentBody).not.toContain("location.");
    expect(scrollToAssessmentBody).not.toContain("history.");
    expect(scrollToAssessmentBody).not.toContain("window.open");
  });
});
