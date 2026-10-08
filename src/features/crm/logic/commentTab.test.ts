import { describe, expect, it } from "vitest";
import { hasLeadComment, NO_COMMENT_MESSAGE } from "./commentTab";

describe("hasLeadComment", () => {
  it("is true for a real comment", () => {
    expect(hasLeadComment("Muito bom o diagnóstico.")).toBe(true);
  });

  it("is false for null", () => {
    expect(hasLeadComment(null)).toBe(false);
  });

  it("is false for undefined", () => {
    expect(hasLeadComment(undefined)).toBe(false);
  });

  it("is false for an empty string", () => {
    expect(hasLeadComment("")).toBe(false);
  });

  it("is false for whitespace-only text", () => {
    expect(hasLeadComment("   \n  ")).toBe(false);
  });

  it("preserves line breaks in a real comment", () => {
    const comment = "Linha 1\nLinha 2";
    expect(hasLeadComment(comment)).toBe(true);
  });
});

describe("NO_COMMENT_MESSAGE", () => {
  it("matches the exact copy required by the spec", () => {
    expect(NO_COMMENT_MESSAGE).toBe("O respondente não deixou comentário adicional.");
  });
});
