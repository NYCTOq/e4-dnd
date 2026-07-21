import { describe, expect, it } from "vitest";
import type { Character } from "../character/character.types";
import {
  applyClassFeatureUse,
  canUseClassFeature,
  endClassFeatureCondition,
  getClassFeatureRuntimePlan,
  getRemainingClassResource,
} from "./classFeatureRuntime";

const character = (overrides: Partial<Character> = {}): Character => ({
  id: "hero", name: "Hero", playerName: "Player", ruleset: "dnd_2024", race: "Human", className: "Barbarian", subclass: "", background: "", featIds: [], skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [], level: 5,
  abilities: { str: 16, dex: 14, con: 16, int: 8, wis: 10, cha: 10 }, maxHp: 50, currentHp: 20, tempHp: 0, armorClass: 15, armorClassMode: "manual",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 0,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [], resources: [{ id: "rage", name: "Rage", max: 3, used: 1, recovery: "long", shortRecoveryAmount: 1 }], exhaustion: 0, conditionDurations: {}, conditions: [], notes: "", createdAt: "now", updatedAt: "now",
  ...overrides,
});

describe("class feature runtime", () => {
  it("spends Rage and applies the Rage condition", () => {
    const plan = getClassFeatureRuntimePlan("Barbarian", "rage", 5, "dnd_2024")!;
    const next = applyClassFeatureUse(character(), plan);
    expect(next.resources[0].used).toBe(2);
    expect(next.conditions).toContain("Rage");
  });

  it("does not overspend exhausted resources", () => {
    const hero = character({ resources: [{ id: "rage", name: "Rage", max: 2, used: 2, recovery: "long" }] });
    const plan = getClassFeatureRuntimePlan("Barbarian", "rage", 5, "dnd_2024")!;
    expect(canUseClassFeature(hero, plan)).toBe(false);
    expect(applyClassFeatureUse(hero, plan)).toBe(hero);
  });

  it("supports variable Lay on Hands spending and healing", () => {
    const hero = character({ className: "Paladin", resources: [{ id: "lay-on-hands", name: "Lay on Hands", max: 25, used: 5, recovery: "long" }] });
    const plan = getClassFeatureRuntimePlan("Paladin", "lay-on-hands", 5, "dnd_2024")!;
    const next = applyClassFeatureUse(hero, plan, { amount: 10, healing: 10 });
    expect(next.resources[0].used).toBe(15);
    expect(next.currentHp).toBe(30);
  });

  it("tracks Favored Enemy concentration", () => {
    const hero = character({ className: "Ranger", resources: [{ id: "favored-enemy", name: "Favored Enemy", max: 3, used: 0, recovery: "long" }] });
    const plan = getClassFeatureRuntimePlan("Ranger", "favored-enemy", 5, "dnd_2024")!;
    expect(applyClassFeatureUse(hero, plan).conditions).toContain("Concentration");
  });

  it("reports unlimited resources and can end feature conditions", () => {
    const hero = character({ resources: [{ id: "rage", name: "Rage", max: 1, used: 1, recovery: "long", unlimited: true }], conditions: ["Rage"] });
    expect(getRemainingClassResource(hero, "rage")).toBe(Number.POSITIVE_INFINITY);
    expect(endClassFeatureCondition(hero, "Rage").conditions).not.toContain("Rage");
  });

  it("keeps 2014 and 2024 action economy differences", () => {
    expect(getClassFeatureRuntimePlan("Druid", "wild-shape", 2, "dnd_2014")?.actionType).toBe("Action");
    expect(getClassFeatureRuntimePlan("Druid", "wild-shape", 2, "dnd_2024")?.actionType).toBe("Bonus Action");
    expect(getClassFeatureRuntimePlan("Paladin", "lay-on-hands", 2, "dnd_2014")?.actionType).toBe("Action");
    expect(getClassFeatureRuntimePlan("Paladin", "lay-on-hands", 2, "dnd_2024")?.actionType).toBe("Bonus Action");
  });
});
