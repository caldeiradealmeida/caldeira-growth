import { describe, expect, it } from "vitest";
import { checkpointsToSend, CGI_CHECKPOINT_QUESTION_COUNTS } from "./checkpointSchedule";

describe("checkpointsToSend", () => {
  it("returns empty before the first dimension is complete", () => {
    expect(checkpointsToSend(7, new Set())).toEqual([]);
  });

  it("returns [8] exactly when dimension 1 completes", () => {
    expect(checkpointsToSend(8, new Set())).toEqual([8]);
  });

  it("does not re-return a boundary already marked as sent", () => {
    expect(checkpointsToSend(8, new Set([8]))).toEqual([]);
  });

  it("returns [16] when dimension 2 completes and dimension 1's checkpoint was already sent", () => {
    expect(checkpointsToSend(16, new Set([8]))).toEqual([16]);
  });

  it("returns both boundaries at once if two are crossed without either being sent yet (e.g. resume)", () => {
    expect(checkpointsToSend(20, new Set())).toEqual([8, 16]);
  });

  it("returns [40] for the final dimension", () => {
    expect(checkpointsToSend(40, new Set([8, 16, 24, 32]))).toEqual([40]);
  });

  it("returns empty once every checkpoint has been sent", () => {
    expect(checkpointsToSend(40, new Set(CGI_CHECKPOINT_QUESTION_COUNTS))).toEqual([]);
  });

  it("exposes exactly the 5 dimension boundaries", () => {
    expect(CGI_CHECKPOINT_QUESTION_COUNTS).toEqual([8, 16, 24, 32, 40]);
  });
});
