import { describe, expect, it } from "vitest";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "./featExpansion";

describe("feat expansion", () => {
  it("substantially expands both edition pools", () => {
    expect(FEAT_EXPANSION_2014.length).toBeGreaterThanOrEqual(20);
    expect(FEAT_EXPANSION_2024.length).toBeGreaterThanOrEqual(12);
  });
  it("keeps ids unique inside each edition", () => {
    expect(new Set(FEAT_EXPANSION_2014.map((item) => item.id)).size).toBe(FEAT_EXPANSION_2014.length);
    expect(new Set(FEAT_EXPANSION_2024.map((item) => item.id)).size).toBe(FEAT_EXPANSION_2024.length);
  });
  it("marks selectable ability feats with structured choices", () => {
    const resilient = FEAT_EXPANSION_2014.find((item) => item.id === "resilient");
    expect(resilient).toMatchObject({ choiceType: "ability", choiceCount: 1, repeatable: true });
  });
});
