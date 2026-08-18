import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isFinalizedCgiAssessmentStatus,
  maxCgiAssessmentStatus,
  persistLeadForAssessment,
} from "../../api/_cgi-supabase";

// Regression suite for the late-phone-step corruption: a cgi_phone_submitted
// posted *after* the person had already completed the CGI used to rewrite the
// assessment back to status "lead_captured" at progress_percent 0, on a row
// that already had completed_at, a score and a ready report.

const originalEnv = { ...process.env };

type Recorded = { method: string; path: string; body: Record<string, unknown> | null };

function installFetch(assessmentRow: Record<string, unknown> | null) {
  const calls: Recorded[] = [];
  const fetchMock = vi.fn(async (input: unknown, init: RequestInit = {}) => {
    const url = String(input);
    const path = url.slice(url.indexOf("/rest/v1/") + "/rest/v1/".length);
    const method = String(init.method || "GET");
    let body: Record<string, unknown> | null = null;
    if (typeof init.body === "string") {
      try {
        body = JSON.parse(init.body) as Record<string, unknown>;
      } catch {
        body = null;
      }
    }
    calls.push({ method, path, body });

    if (path.startsWith("cgi_assessments") && method === "GET") {
      return new Response(JSON.stringify(assessmentRow ? [assessmentRow] : []), { status: 200 });
    }
    if (path.startsWith("cgi_assessments")) {
      return new Response(JSON.stringify([assessmentRow ?? { id: "row_1" }]), { status: 200 });
    }
    if (path.startsWith("cgi_leads")) {
      return new Response(JSON.stringify([{ id: "lead_1" }]), { status: 200 });
    }
    return new Response("[]", { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

function assessmentWrites(calls: Recorded[]) {
  return calls.filter((call) => call.path.startsWith("cgi_assessments") && call.method !== "GET");
}

const lead = {
  name: "alex",
  email: "alex@example.com",
  phone: "11999943090",
  company: "sunny",
  company_website: "https://sunny.com",
  role: "gerente",
  sector: "Educacao",
  commercial_relationship_model: "B2B",
  employee_count: "1-10",
  annual_revenue_range: "ate-1m",
  current_challenge: "x",
  growth_goal: "y",
  investment_intent: "Ainda avaliando",
  comments: null,
} as never;

async function runPhoneStep(assessmentRow: Record<string, unknown> | null) {
  const calls = installFetch(assessmentRow);
  await persistLeadForAssessment({
    publicAssessmentId: "KrjNnuPHmv2Rcv8j",
    anonymousSessionId: "cgi_session_1",
    lead,
    consentPrivacy: true,
    consentMarketing: true,
    privacyPolicyVersion: "2026-07-17",
  });
  return calls;
}

describe("assessment lifecycle is monotonic", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it("ranks terminal states above every earlier stage", () => {
    expect(maxCgiAssessmentStatus("completed", "lead_captured")).toBe("completed");
    expect(maxCgiAssessmentStatus("abandoned", "lead_captured")).toBe("abandoned");
    expect(maxCgiAssessmentStatus("in_progress", "lead_captured")).toBe("in_progress");
    expect(maxCgiAssessmentStatus("created", "lead_captured")).toBe("lead_captured");
    expect(maxCgiAssessmentStatus(undefined, "lead_captured")).toBe("lead_captured");
    expect(maxCgiAssessmentStatus("nonsense", "lead_captured")).toBe("lead_captured");
    expect(isFinalizedCgiAssessmentStatus("completed")).toBe(true);
    expect(isFinalizedCgiAssessmentStatus("abandoned")).toBe(true);
    expect(isFinalizedCgiAssessmentStatus("in_progress")).toBe(false);
  });

  // 9. Phone submitted before the questionnaire starts -- today's normal path.
  it("attaches the lead to a fresh assessment as lead_captured", async () => {
    const calls = await runPhoneStep({
      id: "row_1",
      public_assessment_id: "KrjNnuPHmv2Rcv8j",
      status: "lead_captured",
      lead_id: null,
      progress_percent: 0,
    });
    const writes = assessmentWrites(calls);
    expect(writes).toHaveLength(1);
    expect(writes[0].body).toMatchObject({ status: "lead_captured", lead_id: "lead_1" });
    expect(writes[0].body).not.toHaveProperty("progress_percent");
  });

  // 10. Phone submitted mid-assessment: must not rewind to lead_captured.
  it("does not rewind an in_progress assessment when attaching a lead", async () => {
    const calls = await runPhoneStep({
      id: "row_1",
      public_assessment_id: "KrjNnuPHmv2Rcv8j",
      status: "in_progress",
      lead_id: null,
      progress_percent: 50,
    });
    const writes = assessmentWrites(calls);
    expect(writes).toHaveLength(1);
    expect(writes[0].body).toMatchObject({ status: "in_progress", lead_id: "lead_1" });
    expect(writes[0].body).not.toHaveProperty("progress_percent");
  });

  it("writes nothing to the assessment when the lead is already attached", async () => {
    const calls = await runPhoneStep({
      id: "row_1",
      public_assessment_id: "KrjNnuPHmv2Rcv8j",
      status: "in_progress",
      lead_id: "lead_1",
      progress_percent: 50,
    });
    expect(assessmentWrites(calls)).toHaveLength(0);
  });

  // 11 + 12. The actual production bug: phone submitted after completion, on
  // an assessment whose report is already generated.
  it("leaves a completed assessment completed when the phone step arrives late", async () => {
    const calls = await runPhoneStep({
      id: "row_1",
      public_assessment_id: "KrjNnuPHmv2Rcv8j",
      status: "completed",
      lead_id: "lead_1",
      progress_percent: 100,
    });
    expect(assessmentWrites(calls)).toHaveLength(0);
    // The lead itself is still updated -- the phone number is the whole point.
    expect(calls.some((call) => call.path.startsWith("cgi_leads") && call.method === "PATCH")).toBe(true);
  });

  it("never regresses a completed assessment even if the lead is only linked now", async () => {
    const calls = await runPhoneStep({
      id: "row_1",
      public_assessment_id: "KrjNnuPHmv2Rcv8j",
      status: "completed",
      lead_id: null,
      progress_percent: 100,
    });
    const writes = assessmentWrites(calls);
    expect(writes).toHaveLength(1);
    expect(writes[0].body).toMatchObject({ status: "completed", lead_id: "lead_1" });
    expect(writes[0].body).not.toHaveProperty("progress_percent");
    expect(writes[0].body).not.toHaveProperty("cgi_score");
    expect(writes[0].body).not.toHaveProperty("completed_at");
  });
});
