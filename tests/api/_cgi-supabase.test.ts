import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getActiveAssessmentByAnonymousSession,
  isReusableStartAssessment,
} from "../../api/_cgi-supabase";

const originalEnv = { ...process.env };

describe("CGI Supabase start idempotency helpers", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it("reuses active non-expired assessments", () => {
    expect(
      isReusableStartAssessment({
        id: "row_1",
        public_assessment_id: "assessment_1",
        status: "in_progress",
        last_activity_at: new Date().toISOString(),
      })
    ).toBe(true);
  });

  it("does not reuse completed assessments", () => {
    expect(
      isReusableStartAssessment({
        id: "row_1",
        public_assessment_id: "assessment_1",
        status: "completed",
        last_activity_at: new Date().toISOString(),
      })
    ).toBe(false);
  });

  it("returns null when Supabase is unavailable", async () => {
    process.env.SUPABASE_URL = "";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";

    await expect(getActiveAssessmentByAnonymousSession("session_1")).resolves.toBeNull();
  });

  it("finds an active assessment by anonymous session", async () => {
    const now = new Date("2026-07-18T12:00:00.000Z");
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            id: "row_1",
            lead_id: null,
            public_assessment_id: "assessment_1",
            status: "created",
            last_activity_at: now.toISOString(),
          },
        ]),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const row = await getActiveAssessmentByAnonymousSession("session_1", now);

    expect(row?.public_assessment_id).toBe("assessment_1");
    expect(fetchMock.mock.calls[0][0]).toContain("anonymous_session_id=eq.session_1");
    expect(fetchMock.mock.calls[0][0]).toContain("status=in.(created,lead_captured,in_progress)");
  });
});
