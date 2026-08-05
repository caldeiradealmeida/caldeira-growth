import { describe, expect, it } from "vitest";
import { decideAccess } from "./accessDecision";

describe("decideAccess", () => {
  it("shows loading while the session is resolving", () => {
    expect(
      decideAccess({ sessionLoading: true, hasSession: false, adminCheckLoading: false, isAdmin: null })
    ).toBe("loading");
  });

  it("sends unauthenticated users to login", () => {
    expect(
      decideAccess({ sessionLoading: false, hasSession: false, adminCheckLoading: false, isAdmin: null })
    ).toBe("login");
  });

  it("shows loading while the admin check is pending, even with a session", () => {
    expect(
      decideAccess({ sessionLoading: false, hasSession: true, adminCheckLoading: true, isAdmin: null })
    ).toBe("loading");
    expect(
      decideAccess({ sessionLoading: false, hasSession: true, adminCheckLoading: false, isAdmin: null })
    ).toBe("loading");
  });

  it("denies authenticated non-admins", () => {
    expect(
      decideAccess({ sessionLoading: false, hasSession: true, adminCheckLoading: false, isAdmin: false })
    ).toBe("denied");
  });

  it("allows authenticated admins", () => {
    expect(
      decideAccess({ sessionLoading: false, hasSession: true, adminCheckLoading: false, isAdmin: true })
    ).toBe("ok");
  });
});
