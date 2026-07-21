import { describe, expect, it } from "vitest";
import { clampStepValue } from "./NumberStepper";

describe("number stepper", () => {
  it("increments and decrements inside the allowed range", () => {
    expect(clampStepValue(10, 3, 20, 1)).toBe(11);
    expect(clampStepValue(10, 3, 20, -1)).toBe(9);
  });

  it("never exceeds its minimum or maximum", () => {
    expect(clampStepValue(3, 3, 20, -1)).toBe(3);
    expect(clampStepValue(20, 3, 20, 1)).toBe(20);
  });
});
