import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Proves the "Abrir e-mail com relatório" code path was fully removed from
// the page, not just hidden behind a flag - a stale mailto handler left in
// place, even if unreferenced by any button, would still be dead code that
// could resurface. Reading the actual source is deliberate here: TypeScript
// already guarantees no dangling prop reference compiles, but this checks
// the handler and its mailto: call are truly gone from the file, not just
// unreachable.
const currentDir = dirname(fileURLToPath(import.meta.url));
const cgiPageSource = readFileSync(join(currentDir, "CGI.tsx"), "utf-8");

describe("CGI.tsx - email report handler fully removed", () => {
  it("no longer defines openEmailDraft", () => {
    expect(cgiPageSource).not.toContain("openEmailDraft");
  });

  it("no longer builds a mailto: link anywhere in the page", () => {
    expect(cgiPageSource).not.toContain("mailto:");
  });
});
