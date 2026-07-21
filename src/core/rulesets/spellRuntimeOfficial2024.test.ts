import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { DndSpellData } from "./ruleset.types";
import { SPELL_EXPANSION_2024 } from "./spellExpansion";
import { getSpellRuntimePlan, resolveGlobalSpell } from "./globalSpellRuntime";

const base = JSON.parse(readFileSync(new URL("../../../public/data/dnd_2024/spells.json", import.meta.url), "utf8")) as DndSpellData[];
const get = (name: string) => [...base, ...SPELL_EXPANSION_2024].find((spell) => spell.name === name)!;

describe("2024 official spell runtime core", () => {
  it("uses doubled 2024 healing dice and spellcasting modifier", () => {
    const cure = get("Cure Wounds");
    const word = get("Healing Word");
    expect(cure).toMatchObject({ school: "Abjuration", healingDice: "2d8" });
    expect(word).toMatchObject({ school: "Abjuration", healingDice: "2d4" });
    expect(resolveGlobalSpell({ spell: cure, characterLevel: 5, slotLevel: 2, spellcastingAbilityModifier: 3, random: () => 0 }).rolled).toBe(7);
    expect(resolveGlobalSpell({ spell: word, characterLevel: 5, slotLevel: 1, spellcastingAbilityModifier: 3, random: () => 0 }).rolled).toBe(5);
  });

  it("models revised Counterspell as a Constitution save without upcast auto-success", () => {
    const spell = get("Counterspell");
    expect(spell).toMatchObject({ attackType: "saving-throw", saveAbility: "con" });
    const plan = getSpellRuntimePlan(spell, 9, 5);
    expect(plan).toMatchObject({ resolution: "saving-throw", saveAbility: "con", reaction: true, formula: null });
  });

  it("keeps Spiritual Weapon concentration and scales every slot level", () => {
    const spell = get("Spiritual Weapon");
    expect(spell.concentration).toBe(true);
    expect(getSpellRuntimePlan(spell, 7, 4).formula).toBe("3d8");
    expect(resolveGlobalSpell({ spell, characterLevel: 7, slotLevel: 2, spellcastingAbilityModifier: 4, random: () => 0 }).rolled).toBe(5);
  });

  it("includes revised Barkskin and True Strike metadata", () => {
    expect(get("Barkskin")).toMatchObject({ castingTime: "1 bonus action", concentration: false, duration: "1 hour" });
    expect(get("True Strike")).toMatchObject({ range: "Self", concentration: false, attackType: "automatic" });
    expect(getSpellRuntimePlan(get("True Strike"), 17).formula).toBe("3d6");
  });
});
