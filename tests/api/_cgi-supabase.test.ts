import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getActiveAssessmentByAnonymousSession,
  getMaxCgiReportVersion,
  insertRegeneratedCgiReport,
  isReusableStartAssessment,
  updateLeadComments,
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

describe("updateLeadComments", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("does not call Supabase when the comment is empty", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateLeadComments("lead_1", "   ");

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call Supabase when there is no leadId", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateLeadComments("", "Um comentário real.");

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("PATCHes the trimmed comment for the given lead when present", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateLeadComments("lead_1", "  Um comentário real.  ");

    expect(result).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("cgi_leads?id=eq.lead_1");
    expect(JSON.parse(String(init.body))).toEqual({ comments: "Um comentário real." });
  });
});

describe("cgi_reports versioning helpers", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("returns 0 when no report row exists yet for the assessment", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const version = await getMaxCgiReportVersion("pub_1");

    expect(version).toBe(0);
    expect(fetchMock.mock.calls[0][0]).toContain("order=version.desc");
  });

  it("returns the highest existing version", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([{ version: 3 }]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const version = await getMaxCgiReportVersion("pub_1");

    expect(version).toBe(3);
  });

  it("inserts a regenerated report as a plain INSERT (no on_conflict/upsert)", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            id: "report_2",
            version: 2,
            ai_report_text: "Texto do novo relatório.",
            report_json: { report_title: "Novo" },
            model: "gpt-5.1",
            language: "pt",
            generation_completed_at: "2026-08-06T12:00:00.000Z",
          },
        ]),
        { status: 201 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const saved = await insertRegeneratedCgiReport({
      publicAssessmentId: "pub_1",
      version: 2,
      aiReport: JSON.stringify({ report_title: "Novo" }),
      aiReportText: "Texto do novo relatório.",
      model: "gpt-5.1",
      lead: { name: "Lead" },
      answers: { q1: 4 },
      score: { finalScore: 84 },
      websiteEnrichment: { status: "not_provided" },
      requestContext: {},
      language: "pt",
    });

    expect(saved.ok).toBe(true);
    if (saved.ok) {
      expect(saved.report.version).toBe(2);
      expect(saved.report.id).toBe("report_2");
    }
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain("on_conflict");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body.version).toBe(2);
    expect(body.public_assessment_id).toBe("pub_1");
  });

  it("refuses to insert version 0", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const saved = await insertRegeneratedCgiReport({
      publicAssessmentId: "pub_1",
      version: 0,
      aiReport: "{}",
      aiReportText: "",
      model: null,
      lead: {},
      answers: {},
      score: {},
      websiteEnrichment: {},
      requestContext: {},
      language: "pt",
    });

    expect(saved).toEqual({ ok: false, reason: "invalid_version" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a clean 'conflict' reason -- not a generic failure -- when the legacy single-row constraint blocks a second version (Phase 3 migration not applied yet)", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          message:
            'duplicate key value violates unique constraint "cgi_reports_public_assessment_id_key"',
        }),
        { status: 409 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const saved = await insertRegeneratedCgiReport({
      publicAssessmentId: "pub_1",
      version: 2,
      aiReport: "{}",
      aiReportText: "",
      model: null,
      lead: {},
      answers: {},
      score: {},
      websiteEnrichment: {},
      requestContext: {},
      language: "pt",
    });

    expect(saved).toEqual({ ok: false, reason: "conflict" });
  });
});
