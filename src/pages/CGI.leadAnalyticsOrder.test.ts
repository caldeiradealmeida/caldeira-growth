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

function extractFunctionBody(source: string, signature: string): string {
  const start = source.indexOf(signature);
  if (start === -1) throw new Error(`Could not find "${signature}" in CGI.tsx`);
  // Jump past the arrow first, so a destructured-params brace (e.g.
  // `async ({ ... }) => {`) isn't mistaken for the function body's opening
  // brace - it would close early and truncate the captured body.
  const arrowIndex = source.indexOf("=>", start);
  const bodyStart = source.indexOf("{", arrowIndex);
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
