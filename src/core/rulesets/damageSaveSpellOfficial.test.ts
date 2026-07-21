import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { DndSpellData } from "./ruleset.types";
import { getSpellRuntimePlan, resolveGlobalSpell } from "./globalSpellRuntime";
import { getSpellRollFormula } from "./spellResolution";
import { getDefaultSaveDamageRule } from "./spellTargetRules";

function load(edition: "dnd_2014" | "dnd_2024") {
  return JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/spells.json`, import.meta.url), "utf8")) as DndSpellData[];
}
const spell = (edition: "dnd_2014" | "dnd_2024", id: string) => load(edition).find((item) => item.id === id)!;

describe("official damage and save spell runtime", () => {
  it.each(["dnd_2014", "dnd_2024"] as const)("scales Sacred Flame by character level in %s", (edition) => {
    const sacred = spell(edition, "sacred-flame");
    expect(getSpellRollFormula(sacred, 1)).toBe("1d8");
    expect(getSpellRollFormula(sacred, 5)).toBe("2d8");
    expect(getSpellRollFormula(sacred, 11)).toBe("3d8");
    expect(getSpellRollFormula(sacred, 17)).toBe("4d8");
    expect(getDefaultSaveDamageRule(sacred)).toBe("none");
    expect(getSpellRuntimePlan(sacred, 17).saveDamageRule).toBe("none");
  });

  it.each(["dnd_2014", "dnd_2024"] as const)("scales Guiding Bolt and tracks its advantage rider in %s", (edition) => {
    const guiding = spell(edition, "guiding-bolt");
    expect(getSpellRollFormula(guiding, 5, 1)).toBe("4d6");
    expect(getSpellRollFormula(guiding, 5, 4)).toBe("7d6");
    expect(getSpellRuntimePlan(guiding, 5).guidance.join(" ")).toContain("Advantage");
  });

  it.each(["dnd_2014", "dnd_2024"] as const)("resolves Magic Missile as independently rolled darts in %s", (edition) => {
    const missile = spell(edition, "magic-missile");
    expect(getSpellRollFormula(missile, 5, 1)).toBe("3d4+3");
    expect(getSpellRollFormula(missile, 5, 4)).toBe("6d4+6");
    const outcome = resolveGlobalSpell({ spell: missile, characterLevel: 5, slotLevel: 2, random: () => 0 });
    expect(outcome.perTarget).toEqual([2, 2, 2, 2]);
    expect(outcome.rolled).toBe(8);
  });

  it.each(["dnd_2014", "dnd_2024"] as const)("uses half damage only where the spell explicitly says so in %s", (edition) => {
    for (const id of ["fireball", "lightning-bolt", "spirit-guardians"]) {
      const current = spell(edition, id);
      expect(getDefaultSaveDamageRule(current)).toBe("half");
      expect(getSpellRuntimePlan(current, 10).saveDamageRule).toBe("half");
    }
    const noHalf: DndSpellData = {
      id: "disintegrating-test", name: "No Half", level: 6, school: "Transmutation", castingTime: "1 action", range: "60 feet",
      components: ["V", "S"], duration: "Instantaneous", concentration: false, ritual: false, classes: ["Wizard"],
      description: "The target makes a Dexterity saving throw, taking 10d6 force damage on a failed save.", attackType: "saving-throw",
      saveAbility: "dex", effectType: "damage", damageDice: "10d6",
    };
    expect(getDefaultSaveDamageRule(noHalf)).toBe("none");
  });

  it("distinguishes the 2014 and 2024 Spirit Guardians trigger timing", () => {
    const oldPlan = getSpellRuntimePlan(spell("dnd_2014", "spirit-guardians"), 5);
    const newPlan = getSpellRuntimePlan(spell("dnd_2024", "spirit-guardians"), 5);
    expect(oldPlan.guidance.join(" ")).toContain("turuna alanda başladığında");
    expect(newPlan.guidance.join(" ")).toContain("turunu orada bitirdiğinde");
  });
});
