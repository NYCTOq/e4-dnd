import { describe, expect, it } from "vitest";
import {
  applyClassFeatureRest,
  buildClassRuntimeSnapshot,
  type ClassCompatibleCharacter,
} from "./classSubclassCharacterAdapter";
import { mutateCharacterFeature } from "./classFeaturePersistenceBridge";

const hero = (): ClassCompatibleCharacter => ({
  id: "runtime-hero",
  ruleset: "dnd_2024",
  classes: [
    { classId: "Fighter", level: 5 },
    { classId: "Bard", level: 3 },
  ],
  classFeatures: [
    {
      id: "second-wind",
      classId: "Fighter",
      level: 1,
      activation: "bonus-action",
      currentUses: 0,
      maxUses: 3,
      recovery: "short",
    },
    {
      id: "bardic-inspiration",
      classId: "Bard",
      level: 1,
      activation: "bonus-action",
      currentUses: 1,
      maxUses: 4,
      recovery: "long",
    },
    {
      id: "locked-feature",
      classId: "Fighter",
      level: 9,
      activation: "reaction",
      currentUses: 0,
      maxUses: 1,
      recovery: "long",
    },
  ],
});

describe("v5.130 class runtime completion", () => {
  it("restores short-rest features without restoring long-rest-only features", () => {
    const next = applyClassFeatureRest(hero(), "short");
    const byId = Object.fromEntries(next.classFeatures!.map((f) => [f.id, f]));
    expect(byId["second-wind"].currentUses).toBe(3);
    expect(byId["bardic-inspiration"].currentUses).toBe(1);
  });

  it("long rest restores both short and long recovery features", () => {
    const next = applyClassFeatureRest(hero(), "long");
    const byId = Object.fromEntries(next.classFeatures!.map((f) => [f.id, f]));
    expect(byId["second-wind"].currentUses).toBe(3);
    expect(byId["bardic-inspiration"].currentUses).toBe(4);
  });

  it("keeps multiclass level and proficiency calculations coherent", () => {
    const snapshot = buildClassRuntimeSnapshot(hero());
    expect(snapshot.characterLevel).toBe(8);
    expect(snapshot.proficiencyBonus).toBe(3);
    expect(snapshot.unlockedFeatures.map((f) => f.id)).not.toContain("locked-feature");
  });

  it("never spends a limited feature below zero", () => {
    const spent = mutateCharacterFeature(hero(), "second-wind", "spend");
    const feature = spent.classFeatures!.find((f) => f.id === "second-wind");
    expect(feature?.currentUses).toBe(0);
  });
});
