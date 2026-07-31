import { describe, expect, it, vi } from "vitest";
import { pollCgiReport } from "./reportPolling";

describe("pollCgiReport", () => {
  it("stops when the backend returns report_ready", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          report_status: "report_ready",
          score: { finalScore: 80 },
        }),
        { status: 200 }
      )
    );

    const result = await pollCgiReport({
      publicAssessmentId: "assessment_1",
      endpoint: "/api/cgi-assessment",
      intervalMs: 0,
      maxAttempts: 3,
      fetcher,
    });

    expect(result).toMatchObject({
      status: "ready",
      data: { report_status: "report_ready" },
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("stops when the backend returns report_ready_with_warnings", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          report_status: "report_ready_with_warnings",
          score: { finalScore: 80 },
        }),
        { status: 200 }
      )
    );

    const result = await pollCgiReport({
      publicAssessmentId: "assessment_1",
      endpoint: "/api/cgi-assessment",
      intervalMs: 0,
      maxAttempts: 3,
      fetcher,
    });

    expect(result).toMatchObject({
      status: "ready",
      data: { report_status: "report_ready_with_warnings" },
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("stops when the backend returns report_failed", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: false,
          report_status: "report_failed",
          error: "report_failed",
        }),
        { status: 503 }
      )
    );

    const result = await pollCgiReport({
      publicAssessmentId: "assessment_1",
      endpoint: "/api/cgi-assessment",
      intervalMs: 0,
      maxAttempts: 3,
      fetcher,
    });

    expect(result).toMatchObject({
      status: "failed",
      data: { report_status: "report_failed" },
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("times out without resubmitting POST when the report keeps generating", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          report_status: "report_generating",
        }),
        { status: 202 }
      )
    );

    const result = await pollCgiReport({
      publicAssessmentId: "assessment_1",
      endpoint: "/api/cgi-assessment",
      intervalMs: 0,
      timeoutMs: 100000,
      maxAttempts: 2,
      fetcher,
    });

    expect(result).toEqual({ status: "timeout" });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.every((call) => call[1]?.method === "GET")).toBe(true);
  });

  it("does not hang forever when a single GET stalls, e.g. right after a laptop sleep/wake", async () => {
    // A fetcher that never resolves on its own, exactly like a stalled
    // connection - it only ever settles if its AbortSignal is aborted, the
    // same contract the real global fetch has under AbortController.
    const stalledFetcher = vi.fn(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        })
    );

    const startedAt = Date.now();
    const result = await pollCgiReport({
      publicAssessmentId: "assessment_1",
      endpoint: "/api/cgi-assessment",
      intervalMs: 5,
      timeoutMs: 40,
      requestTimeoutMs: 10,
      fetcher: stalledFetcher as unknown as typeof fetch,
    });
    const elapsedMs = Date.now() - startedAt;

    expect(result).toEqual({ status: "timeout" });
    expect(stalledFetcher.mock.calls.length).toBeGreaterThan(0);
    // Bounded by requestTimeoutMs/timeoutMs, never by the stalled fetch
    // itself - this is the whole point of the per-request AbortController.
    expect(elapsedMs).toBeLessThan(2000);
  });
});
