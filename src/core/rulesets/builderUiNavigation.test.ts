import { describe, expect, it } from "vitest";
import { clampBuilderStepIndex, getBuilderMobileOverflowStatus, getBuilderStepAnnouncement } from "./builderUiNavigation";

describe("builder UI navigation", () => {
  const steps = [{ id: "basic", title: "Basic" }, { id: "class", title: "Race & Class" }, { id: "review", title: "Review" }] as const;

  it("clamps invalid step indexes", () => {
    expect(clampBuilderStepIndex(-4, steps.length)).toBe(0);
    expect(clampBuilderStepIndex(99, steps.length)).toBe(2);
  });

  it("builds an accessible step announcement", () => {
    expect(getBuilderStepAnnouncement(steps, 1)).toBe("Adım 2/3: Race & Class");
  });

  it("reports horizontal overflow deterministically", () => {
    expect(getBuilderMobileOverflowStatus(412, 412)).toEqual({ fitsViewport: true, overflowPixels: 0 });
    expect(getBuilderMobileOverflowStatus(412, 455)).toEqual({ fitsViewport: false, overflowPixels: 43 });
  });
});
