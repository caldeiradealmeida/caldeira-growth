import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createEventId: vi.fn(() => "event_1"),
  getAssessmentByPublicId: vi.fn(),
  insertFunnelEvent: vi.fn(),
  isFinalizedCgiAssessmentStatus: vi.fn(),
  upsertAssessment: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import handler from "../../api/cgi/progress";

function createResponse() {
  return {
    statusCode: 0,
    body: undefined as unknown,
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
    body: {
      anonymous_session_id: "cgi_session_1",
      public_assessment_id: "KrjNnuPHmv2Rcv8j",
      progress_percent: 50,
      current_question: 20,
    },
    ...overrides,
  };
}

describe("POST /api/cgi/progress", () => {
  beforeEach(() => {
    supabaseMocks.getAssessmentByPublicId.mockReset().mockResolvedValue(null);
    supabaseMocks.insertFunnelEvent.mockReset().mockResolvedValue("event_1");
    supabaseMocks.upsertAssessment.mockReset().mockResolvedValue({ id: "row_1" });
    supabaseMocks.isFinalizedCgiAssessmentStatus
      .mockReset()
      .mockImplementation((value: unknown) => value === "completed" || value === "abandoned");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records a milestone for an in-flight assessment", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue({ id: "row_1", status: "in_progress" });
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.statusCode).toBe(200);
    expect(supabaseMocks.upsertAssessment).toHaveBeenCalledTimes(1);
  });

  // A late beacon must not reopen a finished assessment -- doing so also made
  // it eligible for the abandonment sweep.
  it("refuses to reopen a completed assessment", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue({ id: "row_1", status: "completed" });
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.statusCode).toBe(409);
    expect(supabaseMocks.upsertAssessment).not.toHaveBeenCalled();
    expect(supabaseMocks.insertFunnelEvent).not.toHaveBeenCalled();
  });

  it("refuses to reopen an abandoned assessment", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue({ id: "row_1", status: "abandoned" });
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.statusCode).toBe(409);
    expect(supabaseMocks.upsertAssessment).not.toHaveBeenCalled();
  });

  it("still creates the row when the assessment does not exist yet", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(null);
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.statusCode).toBe(200);
    expect(supabaseMocks.upsertAssessment).toHaveBeenCalledTimes(1);
  });
});
