import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tokenMocks = vi.hoisted(() => ({
  resolveReportAccessToken: vi.fn(),
}));
vi.mock("../../api/_cgi-report-token.js", () => tokenMocks);

const supabaseMocks = vi.hoisted(() => ({
  getReadyCgiReport: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import handler from "../../api/cgi-report-access";

function createResponse() {
  const headers: Record<string, string> = {};
  return {
    statusCode: 0,
    body: undefined as unknown,
    headers,
    setHeader(key: string, value: string) {
      headers[key] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

function createRequest(overrides: Record<string, unknown> = {}) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { t: "sometoken" },
    ...overrides,
  };
}

describe("POST /api/cgi-report-access", () => {
  beforeEach(() => {
    tokenMocks.resolveReportAccessToken.mockReset();
    supabaseMocks.getReadyCgiReport.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects non-POST methods with 405", async () => {
    const response = createResponse();
    await handler(createRequest({ method: "GET" }) as never, response as never);
    expect(response.statusCode).toBe(405);
  });

  it("rejects a non-JSON content type", async () => {
    const response = createResponse();
    await handler(
      createRequest({ headers: { "content-type": "text/plain" } }) as never,
      response as never
    );
    expect(response.statusCode).toBe(415);
  });

  it("rejects a request with an oversized content-length before parsing", async () => {
    const response = createResponse();
    await handler(
      createRequest({ headers: { "content-type": "application/json", "content-length": "999999" } }) as never,
      response as never
    );
    expect(response.statusCode).toBe(400);
    expect(tokenMocks.resolveReportAccessToken).not.toHaveBeenCalled();
  });

  it("returns a safe response for a missing/malformed body", async () => {
    const response = createResponse();
    await handler(createRequest({ body: null }) as never, response as never);
    expect(response.statusCode).toBe(400);
  });

  it("ignores a token supplied only via query string", async () => {
    const response = createResponse();
    await handler(
      createRequest({ body: {}, query: { t: "sometoken" } }) as never,
      response as never
    );
    expect(response.body).toEqual({ ok: true, state: "link_unavailable" });
    expect(tokenMocks.resolveReportAccessToken).not.toHaveBeenCalled();
  });

  it("rejects a token longer than the strict length limit before hashing", async () => {
    const response = createResponse();
    await handler(createRequest({ body: { t: "x".repeat(600) } }) as never, response as never);
    expect(response.body).toEqual({ ok: true, state: "link_unavailable" });
    expect(tokenMocks.resolveReportAccessToken).not.toHaveBeenCalled();
  });

  it("sets Cache-Control, Referrer-Policy and X-Robots-Tag on every response", async () => {
    tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "link_unavailable" });
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.headers["Cache-Control"]).toBe("no-store, private");
    expect(response.headers["Referrer-Policy"]).toBe("no-referrer");
    expect(response.headers["X-Robots-Tag"]).toBe("noindex, nofollow");
  });

  it("returns link_unavailable for an invalid token, without revealing why", async () => {
    tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "link_unavailable" });
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.body).toEqual({ ok: true, state: "link_unavailable" });
    expect(supabaseMocks.getReadyCgiReport).not.toHaveBeenCalled();
  });

  it("returns report_unavailable when the token is valid but the report isn't ready", async () => {
    tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
    supabaseMocks.getReadyCgiReport.mockResolvedValue(null);
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.body).toEqual({ ok: true, state: "report_unavailable" });
  });

  it("returns the report data on a valid token with a ready report, never leaking public_assessment_id", async () => {
    tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
    supabaseMocks.getReadyCgiReport.mockResolvedValue({
      publicAssessmentId: "pub_1",
      language: "pt",
      score: { finalScore: 84 },
      lead: { name: "Marines" },
      reportJson: { report_title: "Relatório" },
      aiReportText: "texto",
    });
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.body).toMatchObject({
      ok: true,
      state: "ready",
      data: {
        language: "pt",
        score: { finalScore: 84 },
        lead: { name: "Marines" },
        reportJson: { report_title: "Relatório" },
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("pub_1");
  });

  it("returns a generic error state if token resolution throws", async () => {
    tokenMocks.resolveReportAccessToken.mockRejectedValue(new Error("boom"));
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.body).toEqual({ ok: true, state: "error" });
  });

  it("returns a generic error state if report-state lookup throws", async () => {
    tokenMocks.resolveReportAccessToken.mockResolvedValue({ state: "valid", publicAssessmentId: "pub_1" });
    supabaseMocks.getReadyCgiReport.mockRejectedValue(new Error("boom"));
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.body).toEqual({ ok: true, state: "error" });
  });
});
