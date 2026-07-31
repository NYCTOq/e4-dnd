import { describe, expect, it } from "vitest";
import type { DndRaceData } from "./ruleset.types";
import { getAncestryRuntime, reduceAncestryDamage } from "./ancestryRuntimeRules";

function race(name: string, traits: string[] = [], darkvision = 0): DndRaceData {
  return {
    id: name.toLowerCase(),
    name,
    speed: 30,
    size: "Medium",
    abilityBonuses: {},
    traits,
    description: "",
    darkvision,
  };
}

describe("N-MEGA14 ancestry runtime bridge", () => {
  it("applies 2014 Dragonborn selected resistance", () => {
    const runtime = getAncestryRuntime(race("Dragonborn"), undefined, 11, {
      ruleset: "dnd_2014",
      choiceId: "brass-gold-red",
    });
    expect(runtime.damageResistances).toContain("fire");
    expect(reduceAncestryDamage(11, "fire", runtime)).toBe(6);
  });

  it("applies 2024 Tiefling lineage resistance and level spells", () => {
    const runtime = getAncestryRuntime(race("Tiefling"), undefined, 5, {
      ruleset: "dnd_2024",
      choiceId: "infernal",
    });
    expect(runtime.damageResistances).toContain("fire");
    expect(runtime.grantedSpells).toEqual(
      expect.arrayContaining(["Fire Bolt", "Hellish Rebuke", "Darkness"]),
    );
  });

  it("exposes 2014 Dwarf weapon and tool proficiencies", () => {
    const runtime = getAncestryRuntime(race("Dwarf"), undefined, 1, {
      ruleset: "dnd_2014",
    });
    expect(runtime.weaponProficiencies).toEqual(
      expect.arrayContaining(["Battleaxe", "Warhammer"]),
    );
    expect(runtime.toolChoiceOptions).toHaveLength(3);
  });

  it("keeps existing trait-based defenses", () => {
    const runtime = getAncestryRuntime(
      race("Dwarf", ["Dwarven Resilience"], 60),
      undefined,
      4,
      { ruleset: "dnd_2014" },
    );
    expect(runtime.damageResistances).toContain("poison");
    expect(runtime.saveAdvantages).toContain("con");
    expect(runtime.darkvision).toBe(60);
  });
});
