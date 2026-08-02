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

// "assessment" is not a natural word for the pt-BR audience - the whole
// landing must consistently say "diagnóstico" instead. This walks every
// string (including nested arrays/objects) in the pt UI dictionary so any
// future copy addition is caught automatically, not just the strings fixed
// today.
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, out));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, out));
  }
  return out;
}

describe("CGI pt-BR copy has no 'assessment' wording", () => {
  it("does not contain the word assessment anywhere in the pt dictionary", () => {
    const offenders = collectStrings(cgiUi.pt).filter((text) =>
      /assessment/i.test(text)
    );
    expect(offenders).toEqual([]);
  });

  it("uses 'Iniciar diagnóstico' as the primary CTA label", () => {
    expect(cgiUi.pt.start).toBe("Iniciar diagnóstico");
  });

  it("keeps the CTA consistent with the nav label 'Diagnóstico de crescimento'", () => {
    expect(cgiUi.pt.start).toContain("diagnóstico");
  });
});
