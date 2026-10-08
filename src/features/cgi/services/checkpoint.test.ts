import { afterEach, describe, expect, it, vi } from "vitest";
import { persistCgiCheckpoint } from "./checkpoint";

describe("persistCgiCheckpoint", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts to the checkpoint endpoint with the full answers set", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await persistCgiCheckpoint({
      anonymousSessionId: "session_1",
      publicAssessmentId: "pub_1",
      answers: { q1: 4, q2: 3 },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/cgi/checkpoint");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      anonymous_session_id: "session_1",
      public_assessment_id: "pub_1",
      answers: { q1: 4, q2: 3 },
    });
  });

  it("never throws when the network request fails -- the caller must never be blocked", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("network down");
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      persistCgiCheckpoint({
        anonymousSessionId: "session_1",
        publicAssessmentId: "pub_1",
        answers: { q1: 4 },
      })
    ).resolves.toBeUndefined();
  });

  it("never throws on a non-ok HTTP response either", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: false }), { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      persistCgiCheckpoint({
        anonymousSessionId: "session_1",
        publicAssessmentId: "pub_1",
        answers: { q1: 4 },
      })
    ).resolves.toBeUndefined();
  });
});
