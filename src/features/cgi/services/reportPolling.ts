import { CGI_ASSESSMENT_ENDPOINT } from "../config";

export type CgiReportPollResult =
  | { status: "ready"; data: Record<string, unknown> }
  | { status: "failed"; data: Record<string, unknown> }
  | { status: "not_found"; data: Record<string, unknown> }
  | { status: "timeout" }
  | { status: "aborted" };

type FetchLike = typeof fetch;

function wait(ms: number, signal?: AbortSignal) {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = globalThis.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        globalThis.clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

const CGI_POLL_REQUEST_TIMEOUT_MS = 12000;

type PollFetchResult = { ok: true; response: Response } | { ok: false; stalled: boolean };

async function fetchPollStatus(
  fetcher: FetchLike,
  url: string,
  signal: AbortSignal | undefined,
  requestTimeoutMs: number
): Promise<PollFetchResult> {
  const controller = new AbortController();
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener("abort", onOuterAbort, { once: true });
  const timeout = globalThis.setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetcher(url, { method: "GET", signal: controller.signal });
    return { ok: true, response };
  } catch {
    // A per-request timeout or a genuinely stalled connection (e.g. right
    // after a laptop sleep/wake cycle) must never block the polling loop
    // indefinitely - treat it as one missed attempt and let the loop's own
    // wall-clock ceiling decide whether to keep polling.
    return { ok: false, stalled: !signal?.aborted };
  } finally {
    globalThis.clearTimeout(timeout);
    signal?.removeEventListener("abort", onOuterAbort);
  }
}

export async function pollCgiReport({
  publicAssessmentId,
  endpoint = CGI_ASSESSMENT_ENDPOINT,
  intervalMs = 2500,
  timeoutMs = 120000,
  requestTimeoutMs = CGI_POLL_REQUEST_TIMEOUT_MS,
  maxAttempts,
  signal,
  fetcher = fetch,
}: {
  publicAssessmentId: string;
  endpoint?: string;
  intervalMs?: number;
  timeoutMs?: number;
  requestTimeoutMs?: number;
  maxAttempts?: number;
  signal?: AbortSignal;
  fetcher?: FetchLike;
}): Promise<CgiReportPollResult> {
  const assessmentId = String(publicAssessmentId || "").trim();
  if (!assessmentId) return { status: "not_found", data: {} };

  const attempts =
    maxAttempts ?? Math.max(1, Math.ceil(timeoutMs / Math.max(1, intervalMs)));
  const startedAt = Date.now();

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (signal?.aborted) return { status: "aborted" };

    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${endpoint}${separator}public_assessment_id=${encodeURIComponent(assessmentId)}`;
    const result = await fetchPollStatus(fetcher, url, signal, requestTimeoutMs);
    if (!result.ok) {
      if (signal?.aborted) return { status: "aborted" };
      if (Date.now() - startedAt >= timeoutMs) break;
      await wait(intervalMs, signal);
      continue;
    }
    const response = result.response;
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (
      response.ok &&
      (data.report_status === "report_ready" ||
        data.report_status === "report_ready_with_warnings")
    ) {
      return { status: "ready", data };
    }
    if (data.report_status === "report_failed" || response.status === 503) {
      return { status: "failed", data };
    }
    if (response.status === 404) {
      return { status: "not_found", data };
    }

    if (Date.now() - startedAt >= timeoutMs) break;
    await wait(intervalMs, signal);
  }

  return signal?.aborted ? { status: "aborted" } : { status: "timeout" };
}
