import { describe, expect, it } from "vitest";
import type { DndSpellData } from "./ruleset.types";
import { createSpellEffect, addSpellEffect } from "./spellEffectRules";
import { getSummonPersistentSpellRuntime } from "./spellSummonPersistentRules";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "./spellExpansion";

const spell = (id: string, level: number, concentration = false, duration = "Instantaneous"): DndSpellData => ({
  id, name: id, level, school: "Conjuration", castingTime: "1 action", range: "60 feet", components: ["V", "S"], duration,
  concentration, ritual: false, classes: ["Wizard"], description: "", effectType: "summoning",
});

describe("official summon, companion, and persistent spell runtime", () => {
  it("distinguishes 2014 and 2024 Find Familiar action economy", () => {
    const oldRule = getSummonPersistentSpellRuntime(spell("find-familiar", 1), "dnd_2014");
    const newRule = getSummonPersistentSpellRuntime(spell("find-familiar-2024", 1), "dnd_2024");
    expect(oldRule).toMatchObject({ kind: "companion", replacesExisting: true, canAttack: false, touchSpellDelivery: true, telepathyRange: 100 });
    expect(oldRule?.guidance.join(" ")).toMatch(/uses your Action/i);
    expect(newRule?.guidance.join(" ")).toMatch(/Bonus Action/i);
  });

  it("scales the 2024 Otherworldly Steed from slot level", () => {
    const rule = getSummonPersistentSpellRuntime(spell("find-steed-2024", 2), "dnd_2024", 4);
    expect(rule).toMatchObject({ kind: "steed", replacesExisting: true, armorClassFormula: "10 + spell slot level", hitPointFormula: "5 + 10 × spell slot level", flySpeed: 60 });
    expect(rule?.initiativeRule).toMatch(/shares your initiative/i);
  });

  it("separates 2014 summoned beasts from the 2024 spectral pack", () => {
    const oldRule = getSummonPersistentSpellRuntime(spell("conjure-animals", 3, true, "Up to 1 hour"), "dnd_2014", 5);
    const newRule = getSummonPersistentSpellRuntime(spell("conjure-animals-2024", 3, true, "Up to 10 minutes"), "dnd_2024", 5);
    expect(oldRule).toMatchObject({ kind: "summon", canAttack: true });
    expect(oldRule?.guidance.join(" ")).toMatch(/Beast stat blocks/i);
    expect(newRule).toMatchObject({ kind: "persistent-area", moveDistance: 30, moveAction: "with-caster-movement", oncePerTurn: true, damageFormula: "5d10", saveAbility: "dex", saveDamageRule: "none" });
  });

  it("models Spiritual Weapon concentration and scaling by edition", () => {
    expect(getSummonPersistentSpellRuntime(spell("spiritual-weapon", 2, false, "1 minute"), "dnd_2014", 5)).toMatchObject({ kind: "persistent-weapon", damageFormula: "2d8 + spellcasting ability modifier", concentration: false, moveAction: "bonus-action" });
    expect(getSummonPersistentSpellRuntime(spell("spiritual-weapon-2024", 2, true, "Up to 1 minute"), "dnd_2024", 5)).toMatchObject({ kind: "persistent-weapon", damageFormula: "4d8 + spellcasting ability modifier", concentration: true, moveDistance: 20 });
  });

  it("models Flaming Sphere and Moonbeam movement, triggers, and upcasting", () => {
    expect(getSummonPersistentSpellRuntime(spell("flaming-sphere-2024", 2, true, "Up to 1 minute"), "dnd_2024", 4)).toMatchObject({ damageFormula: "4d6", saveDamageRule: "half", moveAction: "bonus-action", moveDistance: 30, triggers: ["end-turn", "rammed"] });
    expect(getSummonPersistentSpellRuntime(spell("moonbeam", 2, true, "Up to 1 minute"), "dnd_2014", 4)).toMatchObject({ damageFormula: "4d10", moveAction: "action", triggers: ["enter-area", "start-turn"], oncePerTurn: false });
    expect(getSummonPersistentSpellRuntime(spell("moonbeam-2024", 2, true, "Up to 1 minute"), "dnd_2024", 4)).toMatchObject({ damageFormula: "4d10", moveAction: "magic-action", triggers: ["on-cast", "area-moves-into", "enter-area", "end-turn"], oncePerTurn: true });
  });

  it("persists structured summon metadata and replaces a previous familiar", () => {
    const familiarSpell = spell("find-familiar-2024", 1);
    const first = createSpellEffect(familiarSpell, "dnd_2024", 1)!;
    const second = createSpellEffect(familiarSpell, "dnd_2024", 1)!;
    expect(first).toMatchObject({ persistentKind: "companion", replacesExistingSummon: true, summonCanAttack: false, summonTouchSpellDelivery: true });
    const effects = addSpellEffect([first], second);
    expect(effects).toHaveLength(1);
    expect(effects[0].id).toBe(second.id);
  });

  it("adds official spell records needed by the persistent runtime", () => {
    for (const collection of [SPELL_EXPANSION_2014, SPELL_EXPANSION_2024]) {
      const names = new Set(collection.map((item) => item.name));
      for (const name of ["Find Familiar", "Find Steed", "Summon Beast", "Conjure Animals", "Flaming Sphere", "Moonbeam"]) expect(names.has(name)).toBe(true);
    }
    expect(SPELL_EXPANSION_2024.find((item) => item.name === "Conjure Animals")).toMatchObject({ damageDice: "3d10", duration: "Up to 10 minutes", saveAbility: "dex" });
  });
});
