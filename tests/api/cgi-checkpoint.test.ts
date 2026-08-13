import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  getAssessmentByPublicId: vi.fn(),
  upsertAnswers: vi.fn(),
  upsertAssessment: vi.fn(),
}));
vi.mock("../../api/_cgi-supabase.js", () => supabaseMocks);

import handler from "../../api/cgi/checkpoint";

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

function fullAnswers(count: number, overrides: Record<string, number> = {}) {
  const answers: Record<string, number> = {};
  for (let i = 1; i <= count; i += 1) answers[`q${i}`] = 4;
  return { ...answers, ...overrides };
}

function createRequest(overrides: Record<string, unknown> = {}) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      anonymous_session_id: "session_1",
      public_assessment_id: "pub_1",
      answers: fullAnswers(8),
    },
    ...overrides,
  };
}

function inProgressAssessment(overrides: Record<string, unknown> = {}) {
  return {
    id: "assessment_row_1",
    lead_id: "lead_1",
    public_assessment_id: "pub_1",
    status: "in_progress",
    ...overrides,
  };
}

describe("POST /api/cgi/checkpoint", () => {
  beforeEach(() => {
    supabaseMocks.getAssessmentByPublicId.mockReset();
    supabaseMocks.upsertAnswers.mockReset().mockResolvedValue(undefined);
    supabaseMocks.upsertAssessment.mockReset().mockResolvedValue({ id: "assessment_row_1" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects non-POST methods", async () => {
    const response = createResponse();
    await handler(createRequest({ method: "GET" }) as never, response as never);
    expect(response.statusCode).toBe(405);
    expect(supabaseMocks.upsertAnswers).not.toHaveBeenCalled();
  });

  it("1. dimension 1 completed -> answers persisted", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment());
    const response = createResponse();

    await handler(createRequest({ body: { anonymous_session_id: "s1", public_assessment_id: "pub_1", answers: fullAnswers(8) } }) as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(supabaseMocks.upsertAnswers).toHaveBeenCalledWith("assessment_row_1", fullAnswers(8));
    expect(supabaseMocks.upsertAssessment).toHaveBeenCalledWith(
      expect.objectContaining({
        publicAssessmentId: "pub_1",
        status: "in_progress",
        currentQuestion: 8,
        progressPercent: 20,
      })
    );
  });

  it("2. dimension 2 completed -> previous answers still included alongside the new ones", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment());
    const response = createResponse();
    const cumulative = fullAnswers(16);

    await handler(
      createRequest({ body: { anonymous_session_id: "s1", public_assessment_id: "pub_1", answers: cumulative } }) as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    const persisted = supabaseMocks.upsertAnswers.mock.calls[0][1];
    expect(Object.keys(persisted)).toHaveLength(16);
    expect(persisted).toEqual(cumulative);
  });

  it("3. the same checkpoint sent twice does not error and does not duplicate (upsert semantics)", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment());
    const req = createRequest();

    const first = createResponse();
    await handler(req as never, first as never);
    const second = createResponse();
    await handler(req as never, second as never);

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(supabaseMocks.upsertAnswers).toHaveBeenCalledTimes(2);
    // Both calls target the exact same (assessment_id, question_id) keys --
    // upsertAnswers' own on_conflict=assessment_id,question_id (tested in
    // _cgi-supabase.test.ts) is what actually prevents duplication in cgi_answers.
    expect(supabaseMocks.upsertAnswers.mock.calls[0][1]).toEqual(supabaseMocks.upsertAnswers.mock.calls[1][1]);
  });

  it("4. a later independent call (simulating post-refresh) still succeeds without losing anything", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment());
    const response = createResponse();

    await handler(
      createRequest({ body: { anonymous_session_id: "s1", public_assessment_id: "pub_1", answers: fullAnswers(8) } }) as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(supabaseMocks.upsertAnswers).toHaveBeenCalledWith("assessment_row_1", fullAnswers(8));
  });

  it("6. assessment already completed -> checkpoint rejected, no writes", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment({ status: "completed" }));
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.statusCode).toBe(409);
    expect(response.body).toEqual({ ok: false, error: "assessment_already_finalized" });
    expect(supabaseMocks.upsertAnswers).not.toHaveBeenCalled();
    expect(supabaseMocks.upsertAssessment).not.toHaveBeenCalled();
  });

  it("6b. assessment already abandoned -> checkpoint rejected, no writes", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment({ status: "abandoned" }));
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.statusCode).toBe(409);
    expect(supabaseMocks.upsertAnswers).not.toHaveBeenCalled();
  });

  it("7a. invalid payload: missing public_assessment_id is rejected", async () => {
    const response = createResponse();
    await handler(
      createRequest({ body: { anonymous_session_id: "s1", answers: fullAnswers(8) } }) as never,
      response as never
    );
    expect(response.statusCode).toBe(400);
    expect(supabaseMocks.getAssessmentByPublicId).not.toHaveBeenCalled();
  });

  it("7b. invalid payload: missing anonymous_session_id is rejected", async () => {
    const response = createResponse();
    await handler(
      createRequest({ body: { public_assessment_id: "pub_1", answers: fullAnswers(8) } }) as never,
      response as never
    );
    expect(response.statusCode).toBe(400);
  });

  it("7c. invalid payload: answers with only unknown question ids normalizes to empty and is rejected", async () => {
    const response = createResponse();
    await handler(
      createRequest({
        body: { anonymous_session_id: "s1", public_assessment_id: "pub_1", answers: { not_a_question: 4, q99: 3 } },
      }) as never,
      response as never
    );
    expect(response.statusCode).toBe(400);
    expect(supabaseMocks.getAssessmentByPublicId).not.toHaveBeenCalled();
  });

  it("7d. invalid payload: out-of-range answer values are dropped by normalization and rejected if nothing valid remains", async () => {
    const response = createResponse();
    await handler(
      createRequest({
        body: { anonymous_session_id: "s1", public_assessment_id: "pub_1", answers: { q1: 99, q2: -1, q3: "x" } },
      }) as never,
      response as never
    );
    expect(response.statusCode).toBe(400);
  });

  it("7e. invalid payload: malformed JSON body is rejected", async () => {
    const response = createResponse();
    await handler(createRequest({ body: "{not json" }) as never, response as never);
    expect(response.statusCode).toBe(400);
  });

  it("7f. invalid payload: oversized body is rejected before parsing", async () => {
    const response = createResponse();
    await handler(
      createRequest({ headers: { "content-type": "application/json", "content-length": "999999" } }) as never,
      response as never
    );
    expect(response.statusCode).toBe(400);
    expect(supabaseMocks.getAssessmentByPublicId).not.toHaveBeenCalled();
  });

  it("assessment not found -> 404, no writes", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(null);
    const response = createResponse();
    await handler(createRequest() as never, response as never);
    expect(response.statusCode).toBe(404);
    expect(supabaseMocks.upsertAnswers).not.toHaveBeenCalled();
  });

  it("8/9. never touches the network directly -- no OpenAI call, no cgi_reports write (all persistence goes through the mocked, imported cgi_assessments/cgi_answers functions only)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment());
    const response = createResponse();

    await handler(createRequest() as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("partial, valid answers mixed with invalid ones still persist the valid subset", async () => {
    supabaseMocks.getAssessmentByPublicId.mockResolvedValue(inProgressAssessment());
    const response = createResponse();

    await handler(
      createRequest({
        body: {
          anonymous_session_id: "s1",
          public_assessment_id: "pub_1",
          answers: { q1: 4, q2: 99, unknown_question: 3, q3: 2 },
        },
      }) as never,
      response as never
    );

    expect(response.statusCode).toBe(200);
    expect(supabaseMocks.upsertAnswers).toHaveBeenCalledWith("assessment_row_1", { q1: 4, q3: 2 });
  });
});
