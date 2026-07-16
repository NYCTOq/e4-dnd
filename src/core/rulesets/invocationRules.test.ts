import { describe, expect, it } from "vitest";
import { getEldritchInvocations, getInvocationChoiceCount, isInvocationEligible } from "./invocationRules";

describe("eldritch invocation rules", () => {
  it("tracks 2014 Warlock progression", () => {
    expect([1, 2, 5, 9, 18].map((level) => getInvocationChoiceCount("Warlock", level, "dnd_2014"))).toEqual([0, 2, 3, 5, 8]);
  });
  it("tracks 2024 Warlock progression", () => {
    expect([1, 2, 5, 12, 18].map((level) => getInvocationChoiceCount("Warlock", level, "dnd_2024"))).toEqual([1, 3, 5, 8, 10]);
  });
  it("checks level and spell prerequisites", () => {
    const options = getEldritchInvocations("dnd_2014");
    expect(isInvocationEligible(options.find((item) => item.id === "one-with-shadows")!, { level: 4, knownSpellIds: [] })).toBe(false);
    expect(isInvocationEligible(options.find((item) => item.id === "agonizing-blast")!, { level: 5, knownSpellIds: ["eldritch-blast"] })).toBe(true);
    expect(isInvocationEligible(options.find((item) => item.id === "agonizing-blast")!, { level: 5, ruleset: "dnd_2024", knownSpellIds: ["eldritch-blast-2024"] })).toBe(true);
  });
});
