import { describe, expect, it } from "vitest";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";

describe("subclass expansion", () => {
  it("adds the requested 2014 cleric domain package", () => {
    const domains = SUBCLASS_EXPANSION_2014.filter((item) => item.className === "Cleric");
    expect(domains.length).toBeGreaterThanOrEqual(13);
    expect(domains.map((item) => item.name)).toContain("Twilight Domain");
  });
  it("adds alternatives for every class in both editions", () => {
    expect(new Set(SUBCLASS_EXPANSION_2014.map((item) => item.className)).size).toBe(12);
    expect(new Set(SUBCLASS_EXPANSION_2024.map((item) => item.className)).size).toBe(12);
  });
  it("keeps feature progression ordered and described", () => {
    for (const subclass of [...SUBCLASS_EXPANSION_2014, ...SUBCLASS_EXPANSION_2024]) {
      expect(subclass.features.length).toBeGreaterThan(0);
      expect(subclass.features.every((feature) => feature.summary.length > 10)).toBe(true);
    }
  });
  it("gives every expanded cleric domain an always-prepared spell list", () => {
    for (const subclass of [...SUBCLASS_EXPANSION_2014, ...SUBCLASS_EXPANSION_2024].filter((item) => item.className === "Cleric")) {
      expect(subclass.bonusSpells?.length).toBeGreaterThanOrEqual(10);
    }
  });
  it("includes a full oath spell progression for expanded paladins", () => {
    for (const subclass of [...SUBCLASS_EXPANSION_2014, ...SUBCLASS_EXPANSION_2024].filter((item) => item.className === "Paladin")) {
      expect(subclass.bonusSpells?.length).toBe(10);
    }
  });
});
