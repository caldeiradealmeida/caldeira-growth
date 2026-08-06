import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));
vi.mock("../lib/supabaseClient", () => ({
  crmSupabase: { auth: { getSession: sessionMocks.getSession } },
}));

import { regenerateCgiReport } from "./regenerateReport";

describe("regenerateCgiReport", () => {
  beforeEach(() => {
    sessionMocks.getSession.mockResolvedValue({ data: { session: { access_token: "token_1" } } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("throws without calling the endpoint when there is no active session", async () => {
    sessionMocks.getSession.mockResolvedValue({ data: { session: null } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(regenerateCgiReport("assessment_1")).rejects.toThrow(/sessão/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the bearer token and only the assessment_id, nothing else", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ ok: true, report: { id: "r1", version: 2 } }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await regenerateCgiReport("assessment_1");

    expect(result).toMatchObject({ id: "r1", version: 2 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/crm/regenerate-cgi-report");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token_1");
    expect(JSON.parse(String(init?.body))).toEqual({ assessment_id: "assessment_1" });
  });

  it("throws a mapped, user-facing error message on failure and never returns a fake report", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: false, error: "score_mismatch" }), { status: 409 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(regenerateCgiReport("assessment_1")).rejects.toThrow(/bloqueada por segurança/i);
  });
});
