import { beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../../../api/cgi/start";

const supabaseMocks = vi.hoisted(() => ({
  createPublicAssessmentId: vi.fn(() => "new_assessment_1"),
  getActiveAssessmentByAnonymousSession: vi.fn(),
  logSupabaseFailure: vi.fn(),
  upsertAssessment: vi.fn(),
  upsertAttribution: vi.fn(),
}));

vi.mock("../../../api/_cgi-supabase.js", () => supabaseMocks);

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

function createRequest(anonymousSessionId = "session_1") {
  return {
    method: "POST",
    body: {
      anonymous_session_id: anonymousSessionId,
      page_path: "/cgi",
      language: "pt",
      attribution: { utm_source: "test" },
    },
  };
}

describe("POST /api/cgi/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.upsertAssessment.mockResolvedValue({
      id: "row_new",
      public_assessment_id: "new_assessment_1",
      status: "created",
    });
  });

  it("reuses an active assessment for sequential calls with the same anonymous_session_id", async () => {
    supabaseMocks.getActiveAssessmentByAnonymousSession
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "row_existing",
        public_assessment_id: "new_assessment_1",
        status: "created",
      });

    const first = createResponse();
    await handler(createRequest(), first as never);
    const second = createResponse();
    await handler(createRequest(), second as never);

    expect(first.body).toMatchObject({
      ok: true,
      public_assessment_id: "new_assessment_1",
    });
    expect(first.body).not.toHaveProperty("reused");
    expect(second.body).toMatchObject({
      ok: true,
      public_assessment_id: "new_assessment_1",
      reused: true,
    });
    expect(supabaseMocks.createPublicAssessmentId).toHaveBeenCalledTimes(1);
  });

  it("does not reuse a completed assessment returned by storage lookup", async () => {
    supabaseMocks.getActiveAssessmentByAnonymousSession.mockResolvedValue(null);

    const response = createResponse();
    await handler(createRequest(), response as never);

    expect(response.body).toMatchObject({
      ok: true,
      public_assessment_id: "new_assessment_1",
      status: "created",
    });
  });

  it("fails open and returns a generated id when Supabase is unavailable", async () => {
    supabaseMocks.getActiveAssessmentByAnonymousSession.mockRejectedValue(new Error("offline"));
    supabaseMocks.upsertAssessment.mockResolvedValue(null);

    const response = createResponse();
    await handler(createRequest(), response as never);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      public_assessment_id: "new_assessment_1",
      status: "created",
    });
    expect(supabaseMocks.logSupabaseFailure).toHaveBeenCalledWith(
      "get_active_assessment_by_anonymous_session",
      expect.objectContaining({ error: expect.any(Error) })
    );
  });
});
