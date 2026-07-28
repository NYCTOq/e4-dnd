import { describe, expect, it } from "vitest";

const plan = [
  "Class Runtime Completion",
  "Subclass Runtime Completion",
  "Spell Runtime Completion",
  "Feat & Item Runtime",
  "Session Play Loop",
];

describe("v5.129 playable-content delivery policy", () => {
  it("moves implementation before additional certification bureaucracy", () => {
    expect(plan[0]).toBe("Class Runtime Completion");
    expect(plan).toHaveLength(5);
  });

  it("keeps the next packages user-facing", () => {
    expect(plan.every((name) => /Runtime|Play Loop/.test(name))).toBe(true);
  });
});
