import { describe, expect, it } from "vitest";
import { getFightingStyleChoiceCount, getFightingStyles } from "./fightingStyleRules";

describe("fighting styles", () => {
  it("gives fighter a style from level one", () => expect(getFightingStyleChoiceCount("Fighter", 1)).toBe(1));
  it("unlocks the champion's additional style", () => expect(getFightingStyleChoiceCount("Fighter", 10, "Champion")).toBe(2));
  it("keeps expanded styles edition-aware", () => expect(getFightingStyles("dnd_2024").length).toBeGreaterThan(getFightingStyles("dnd_2014").length));
});
