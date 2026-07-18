import { describe, expect, it } from "vitest";
import { cgiUi } from ".";
import { localizedPath } from "@/lib/routing";

describe("CGI privacy policy links", () => {
  it("uses the real localized privacy routes", () => {
    expect(cgiUi.pt.privacyPolicyHref).toBe(localizedPath("privacy", "pt"));
    expect(cgiUi.en.privacyPolicyHref).toBe(localizedPath("privacy", "en"));
    expect(cgiUi.es.privacyPolicyHref).toBe(localizedPath("privacy", "es"));
    expect(cgiUi.pt.privacyPolicyHref).toBe("/politica-de-privacidade");
    expect(cgiUi.en.privacyPolicyHref).toBe("/en/privacy-policy");
    expect(cgiUi.es.privacyPolicyHref).toBe("/es/politica-de-privacidad");
  });
});
