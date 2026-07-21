import { describe, expect, it } from "vitest";
import { SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";

function featureLevels(name: string) {
  const subclass = SUBCLASS_EXPANSION_2024.find((entry) => entry.name === name);
  expect(subclass, `${name} must exist in the 2024 subclass catalog`).toBeDefined();
  return Object.fromEntries((subclass?.features ?? []).map((feature) => [feature.name, feature.level]));
}

describe("official 2024 subclass progression regressions", () => {
  it("keeps College of Dance features at their official levels", () => {
    expect(featureLevels("College of Dance")).toEqual({
      "Dazzling Footwork": 3,
      "Inspiring Movement": 6,
      "Tandem Footwork": 6,
      "Leading Evasion": 14,
    });
  });

  it("keeps Circle of the Sea level 6 and level 10 benefits separated", () => {
    const subclass = SUBCLASS_EXPANSION_2024.find((entry) => entry.name === "Circle of the Sea");
    expect(subclass).toBeDefined();

    const aquatic = subclass?.features.find((feature) => feature.name === "Aquatic Affinity");
    const stormborn = subclass?.features.find((feature) => feature.name === "Stormborn");

    expect(aquatic?.level).toBe(6);
    expect(aquatic?.summary).toContain("yüzme hızı");
    expect(aquatic?.summary).not.toMatch(/direnç|resistance/i);

    expect(stormborn?.level).toBe(10);
    expect(stormborn?.summary).toMatch(/cold.*lightning.*thunder/i);
    expect(stormborn?.summary).toMatch(/direnç/i);
  });
});
