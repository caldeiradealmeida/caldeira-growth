import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guards the funnel invariant from the CGI conversion audit: a lead-facing
// dataLayer event (which GTM maps to GA4 generate_lead / Meta Pixel Lead)
// must only ever be pushed after the backend has confirmed the lead was
// persisted - never on the hero CTA click, and never before the
// submitCgiLead() response resolves successfully. Reading the actual
// source (like CGI.emailRemoval.test.ts does) is deliberate: this is a
// call-ordering property that a type checker won't catch.
const currentDir = dirname(fileURLToPath(import.meta.url));
const cgiPageSource = readFileSync(join(currentDir, "CGI.tsx"), "utf-8");

// Two signature shapes appear in this file, and each needs its own way to
// locate the function's own opening brace:
//  - `const name = async (...) => {`, possibly wrapped in a call like
//    useCallback(...) - here the first "=>" reachable from `start` always
//    belongs to this function (nothing in its own param list uses "=>" in
//    this codebase), so the brace right after that arrow is the body start.
//  - `function name(...) {` (or `export function name(...) {`) - there is
//    no "=>" in the signature itself, and the body may define its own arrow
//    functions later, so searching for "=>" would overshoot into unrelated
//    code. Instead, the body's brace is the first "{" reached while
//    parenthesis depth is back to 0, i.e. past the parameter list (which
//    correctly skips any type-annotation braces inside it, since only
//    "(" / ")" affect the depth count).
function extractFunctionBody(source: string, signature: string): string {
  const start = source.indexOf(signature);
  if (start === -1) throw new Error(`Could not find "${signature}" in CGI.tsx`);

  const isPlainFunctionDeclaration = /(^|\s)function\s/.test(signature);
  let bodyStart: number;
  if (isPlainFunctionDeclaration) {
    let parenDepth = 0;
    bodyStart = -1;
    for (let i = start; i < source.length; i += 1) {
      const char = source[i];
      if (char === "(") parenDepth += 1;
      else if (char === ")") parenDepth -= 1;
      else if (char === "{" && parenDepth === 0) {
        bodyStart = i;
        break;
      }
    }
  } else {
    const arrowIndex = source.indexOf("=>", start);
    bodyStart = arrowIndex === -1 ? -1 : source.indexOf("{", arrowIndex);
  }
  if (bodyStart === -1) {
    throw new Error(`Could not find body start for "${signature}" in CGI.tsx`);
  }

  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === "{") {
      depth += 1;
    } else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(bodyStart, i + 1);
    }
  }
  throw new Error(`Could not find end of "${signature}" in CGI.tsx`);
}

describe("CGI.tsx - lead dataLayer event fires only after persistence", () => {
  it("pushes the lead dataLayer event after awaiting submitCgiLead, not before", () => {
    const persistLead = extractFunctionBody(cgiPageSource, "const persistLead = async");

    const awaitIndex = persistLead.indexOf("await submitCgiLead(");
    const pushIndex = persistLead.indexOf("pushCgiDataLayerEvent(eventName");

    expect(awaitIndex).toBeGreaterThan(-1);
    expect(pushIndex).toBeGreaterThan(-1);
    expect(pushIndex).toBeGreaterThan(awaitIndex);
  });

  it("does not push a lead dataLayer event from the hero CTA click handler", () => {
    const handleStartClick = extractFunctionBody(
      cgiPageSource,
      "const handleStartClick = useCallback"
    );

    expect(handleStartClick).not.toContain("pushCgiDataLayerEvent");
    expect(handleStartClick).not.toContain("cgi_lead_submitted");
    expect(handleStartClick).toContain('eventName: "cgi_start_click"');
  });

  it("never sends the lead-submitted event before submitIdentification's try block resolves", () => {
    const submitIdentification = extractFunctionBody(
      cgiPageSource,
      "const submitIdentification = async"
    );

    // persistLead (which owns the dataLayer push) must be awaited inside the
    // try block, so a thrown/rejected submitCgiLead call skips the push.
    expect(submitIdentification).toMatch(/try\s*{[\s\S]*await persistLead\(/);
  });

  it("shows an error and stops on a generic lead persistence failure, instead of silently advancing", () => {
    const submitIdentification = extractFunctionBody(
      cgiPageSource,
      "const submitIdentification = async"
    );

    // A failed persistLead() call that isn't the two specifically-handled
    // validation errors must surface saveFailureTitle/saveFailureBody and
    // return before reaching setStep("context") - otherwise the UI moves
    // the visitor to step 2 while their lead was never actually saved.
    expect(submitIdentification).toMatch(
      /lead_submit_failed"\);[\s\S]*?saveFailureTitle[\s\S]*?saveFailureBody[\s\S]*?return;/
    );
  });

  it("shows an error and stops on a generic company-context persistence failure", () => {
    const submitCompanyContext = extractFunctionBody(
      cgiPageSource,
      "const submitCompanyContext = async"
    );

    expect(submitCompanyContext).toMatch(
      /context_submit_failed"\);[\s\S]*?saveFailureTitle[\s\S]*?saveFailureBody[\s\S]*?return;/
    );
  });
});
