import { describe, expect, it } from "vitest";
import { decidePhoneStepAction } from "./form";

describe("decidePhoneStepAction", () => {
  it("allows advancing with an empty phone field - it's optional now that there's a single action", () => {
    expect(decidePhoneStepAction("")).toEqual({ kind: "advance" });
    expect(decidePhoneStepAction("   ")).toEqual({ kind: "advance" });
  });

  it("saves and advances for a valid, non-empty phone", () => {
    expect(decidePhoneStepAction("(11) 99999-8888")).toEqual({
      kind: "save_and_advance",
      phone: "(11) 99999-8888",
    });
  });

  it("blocks advancing for a non-empty but invalid phone, same as the old dedicated CTA did", () => {
    expect(decidePhoneStepAction("123")).toEqual({ kind: "block_invalid_phone" });
  });
});
