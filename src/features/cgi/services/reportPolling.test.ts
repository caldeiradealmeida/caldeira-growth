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
});
