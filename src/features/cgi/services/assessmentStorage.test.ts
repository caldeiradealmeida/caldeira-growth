import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAttributionForStart,
  getOrCreateAnonymousSessionId,
  patchAssessmentState,
  readAssessmentState,
} from "./assessmentStorage";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
}

describe("CGI assessment storage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: {
        href: "https://www.caldeiragrowth.com/cgi?utm_source=linkedin&utm_campaign=fase1",
        search: "?utm_source=linkedin&utm_campaign=fase1",
      },
      localStorage: createStorage(),
      sessionStorage: createStorage(),
    });
    vi.stubGlobal("document", {
      referrer: "https://www.linkedin.com/",
    });
  });

  it("creates a stable anonymous session id in sessionStorage", () => {
    const first = getOrCreateAnonymousSessionId();
    const second = getOrCreateAnonymousSessionId();

    expect(first).toMatch(/^cgi_session_/);
    expect(second).toBe(first);
  });

  it("captures first and last attribution without requiring PII", () => {
    const attribution = getAttributionForStart();
    const state = patchAssessmentState({
      public_assessment_id: "assessment_1",
      status: "created",
    });

    expect(attribution?.utm_source).toBe("linkedin");
    expect(attribution?.utm_campaign).toBe("fase1");
    expect(state.first_touch?.referrer).toBe("https://www.linkedin.com/");
    expect(readAssessmentState()?.public_assessment_id).toBe("assessment_1");
  });
});
