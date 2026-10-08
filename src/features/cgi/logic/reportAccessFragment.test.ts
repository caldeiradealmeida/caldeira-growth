import { describe, expect, it } from "vitest";
import { extractReportAccessToken } from "./reportAccessFragment";

describe("extractReportAccessToken", () => {
  it("extracts the token from a simple fragment", () => {
    expect(extractReportAccessToken("#t=abc123")).toBe("abc123");
  });

  it("works whether or not the leading # is included", () => {
    expect(extractReportAccessToken("t=abc123")).toBe("abc123");
  });

  it("decodes percent-encoded characters", () => {
    expect(extractReportAccessToken("#t=abc%2F123")).toBe("abc/123");
  });

  it("returns null for an empty hash", () => {
    expect(extractReportAccessToken("")).toBeNull();
    expect(extractReportAccessToken("#")).toBeNull();
  });

  it("returns null when there is no t= parameter", () => {
    expect(extractReportAccessToken("#x=1&y=2")).toBeNull();
  });

  it("returns null for an empty token value", () => {
    expect(extractReportAccessToken("#t=")).toBeNull();
  });

  it("returns null for malformed percent-encoding instead of throwing", () => {
    expect(extractReportAccessToken("#t=%")).toBeNull();
  });

  it("picks t= even when other params are present", () => {
    expect(extractReportAccessToken("#x=1&t=thetoken&y=2")).toBe("thetoken");
  });
});
