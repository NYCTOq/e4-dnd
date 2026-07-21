import { describe, expect, it } from "vitest";
import type { CharacterSpellEffect } from "../character/character.types";
import type { DndSpellData } from "./ruleset.types";
import { dispelSpellEffects, endConcentration, getGlobalCastableSlotLevels, getSpellRuntimePlan, resolveGlobalSpell, resolveSpellHealing, resolveSpellSave } from "./globalSpellRuntime";

const spell = (patch: Partial<DndSpellData> = {}): DndSpellData => ({ id: "spell", name: "Spell", level: 1, school: "Evocation", castingTime: "1 action", range: "60 ft.", components: [], duration: "Instantaneous", concentration: false, ritual: false, classes: ["Wizard"], description: "", ...patch });

describe("global spell runtime", () => {
  it("builds an automatic upcast save plan", () => {
    const plan = getSpellRuntimePlan(spell({ damageDice: "3d6", attackType: "saving-throw", saveAbility: "dex", area: "15-foot cone", description: "A successful save deals half as much damage.", scaling: { mode: "slot", dicePerStep: "1d6" } }), 7, 3);
    expect(plan).toMatchObject({ formula: "5d6", resolution: "saving-throw", area: "15-foot cone", tier: "automatic", saveDamageRule: "half" });
  });

  it("resolves full half and zero save outcomes", () => {
    expect(resolveSpellSave(17, false, "half")).toBe(17);
    expect(resolveSpellSave(17, true, "half")).toBe(8);
    expect(resolveSpellSave(17, true, "none")).toBe(0);
  });

  it("caps healing and reports overheal", () => expect(resolveSpellHealing(8, 10, 6)).toEqual({ currentHp: 10, applied: 2, overheal: 4 }));

  it("resolves one roll across scaled targets", () => {
    const result = resolveGlobalSpell({ spell: spell({ damageDice: "1d6", scaling: { mode: "slot", additionalTargetsPerStep: 1 } }), characterLevel: 5, slotLevel: 3, random: () => 0 });
    expect(result).toMatchObject({ rolled: 1, resolved: 1, perTarget: [1, 1, 1] });
  });

  it("creates repeat-save concentration guidance and replaces concentration", () => {
    const old: CharacterSpellEffect = { id: "old", spellId: "old", name: "Old", remainingRounds: 10, concentration: true, summary: "Old" };
    const target = spell({ concentration: true, duration: "Up to 1 minute", conditionEffect: "Frightened", description: "The target repeats the saving throw at the end of its turn." });
    const plan = getSpellRuntimePlan(target, 5);
    const result = resolveGlobalSpell({ spell: target, characterLevel: 5, currentEffects: [old] });
    expect(plan.repeatSave).toBe(true);
    expect(plan.guidance.join(" ")).toContain("saving throw");
    expect(result.nextEffects).toHaveLength(1);
    expect(result.nextEffects[0].spellId).toBe("spell");
  });

  it("merges normal and pact slot choices without duplicates", () => expect(getGlobalCastableSlotLevels(spell({ level: 2 }), [{ level: 2, max: 1, used: 0 }, { level: 3, max: 1, used: 0 }], [{ level: 3, max: 2, used: 0 }])).toEqual([2, 3]));

  it("ends concentration and dispels effects by spell or condition", () => {
    const effects: CharacterSpellEffect[] = [
      { id: "a", spellId: "fear", name: "Fear", remainingRounds: 10, concentration: true, summary: "Frightened" },
      { id: "b", spellId: "bless", name: "Bless", remainingRounds: 10, concentration: false, summary: "Blessed" },
    ];
    expect(endConcentration(effects).map((effect) => effect.id)).toEqual(["b"]);
    expect(dispelSpellEffects(effects, { condition: "frightened" }).map((effect) => effect.id)).toEqual(["b"]);
  });
});
