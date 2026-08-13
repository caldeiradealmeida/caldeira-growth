import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  upsertReportAccessToken: vi.fn(),
  getReportAccessTokenByHash: vi.fn(),
  touchReportAccessToken: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import {
  buildReportAccessUrl,
  generateReportAccessToken,
  issueReportAccessToken,
  resolveReportAccessToken,
  sha256Hex,
} from "../../api/_cgi-report-token";

describe("sha256Hex / generateReportAccessToken", () => {
  it("produces a hash matching sha256 of the plaintext", async () => {
    const { createHash } = await import("node:crypto");
    const expected = createHash("sha256").update("hello", "utf8").digest("hex");
    expect(sha256Hex("hello")).toBe(expected);
  });

  it("generates a different plaintext on every call", () => {
    const a = generateReportAccessToken();
    const b = generateReportAccessToken();
    expect(a.plaintext).not.toBe(b.plaintext);
    expect(a.hash).not.toBe(b.hash);
  });

  it("the hash is always the sha256 of the returned plaintext", () => {
    const { plaintext, hash } = generateReportAccessToken();
    expect(sha256Hex(plaintext)).toBe(hash);
  });
});

describe("issueReportAccessToken", () => {
  beforeEach(() => {
    supabaseMocks.upsertReportAccessToken.mockReset();
  });

  it("returns null for an empty publicAssessmentId without touching the database", async () => {
    const result = await issueReportAccessToken("");
    expect(result).toBeNull();
    expect(supabaseMocks.upsertReportAccessToken).not.toHaveBeenCalled();
  });

  it("issues a token, upserting its hash (never the plaintext)", async () => {
    supabaseMocks.upsertReportAccessToken.mockResolvedValue(true);

    const result = await issueReportAccessToken("pub_1");

    expect(result).not.toBeNull();
    expect(result?.token).toMatch(/^[A-Za-z0-9_-]+$/);
    const call = supabaseMocks.upsertReportAccessToken.mock.calls[0][0];
    expect(call.publicAssessmentId).toBe("pub_1");
    expect(call.tokenHash).toBe(sha256Hex(result!.token));
    expect(call.tokenHash).not.toBe(result?.token);
  });

  it("returns null when the upsert fails", async () => {
    supabaseMocks.upsertReportAccessToken.mockResolvedValue(false);
    const result = await issueReportAccessToken("pub_1");
    expect(result).toBeNull();
  });
});

describe("buildReportAccessUrl", () => {
  it("puts the token in a fragment, never a query string", () => {
    const url = buildReportAccessUrl("thetoken");
    expect(url).toBe("https://www.caldeiragrowth.com/cgi/relatorio#t=thetoken");
    expect(url).not.toContain("?");
  });
});

describe("resolveReportAccessToken", () => {
  beforeEach(() => {
    supabaseMocks.getReportAccessTokenByHash.mockReset();
    supabaseMocks.touchReportAccessToken.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns link_unavailable when no row matches the hash", async () => {
    supabaseMocks.getReportAccessTokenByHash.mockResolvedValue(null);
    const result = await resolveReportAccessToken("sometoken");
    expect(result).toEqual({ state: "link_unavailable" });
  });

  it("returns link_unavailable for a revoked token", async () => {
    supabaseMocks.getReportAccessTokenByHash.mockResolvedValue({
      id: "row_1",
      public_assessment_id: "pub_1",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      revoked_at: new Date().toISOString(),
    });
    const result = await resolveReportAccessToken("sometoken");
    expect(result).toEqual({ state: "link_unavailable" });
  });

  it("returns link_unavailable for an expired token", async () => {
    supabaseMocks.getReportAccessTokenByHash.mockResolvedValue({
      id: "row_1",
      public_assessment_id: "pub_1",
      expires_at: new Date(Date.now() - 60_000).toISOString(),
      revoked_at: null,
    });
    const result = await resolveReportAccessToken("sometoken");
    expect(result).toEqual({ state: "link_unavailable" });
  });

  it("returns valid + public_assessment_id for a live token, and touches last_accessed_at", async () => {
    supabaseMocks.getReportAccessTokenByHash.mockResolvedValue({
      id: "row_1",
      public_assessment_id: "pub_1",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      revoked_at: null,
    });
    const result = await resolveReportAccessToken("sometoken");
    expect(result).toEqual({ state: "valid", publicAssessmentId: "pub_1" });
    expect(supabaseMocks.touchReportAccessToken).toHaveBeenCalledWith("row_1");
  });

  it("never includes the raw token in any logged output", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    supabaseMocks.getReportAccessTokenByHash.mockResolvedValue(null);

    await resolveReportAccessToken("super-secret-token-value");

    for (const call of errorSpy.mock.calls) {
      expect(JSON.stringify(call)).not.toContain("super-secret-token-value");
    }
  });
});
