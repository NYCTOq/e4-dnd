import { describe, expect, it } from "vitest";
import type { CharacterSpellEffect } from "../character/character.types";
import type { DndSpellData } from "./ruleset.types";
import { createSpellEffect } from "./spellEffectRules";
import {
  getActiveDefenseMovementModifiers,
  getDefenseMovementSpellRuntime,
  removeEffectsBrokenByAttack,
  removeEffectsBrokenBySpellCast,
} from "./spellDefenseMovementRules";

const spell = (id: string, level: number, duration = "Instantaneous", concentration = false): DndSpellData => ({
  id,
  name: id,
  level,
  school: "Test",
  castingTime: "1 action",
  range: "Self",
  components: ["V"],
  duration,
  concentration,
  ritual: false,
  classes: ["Wizard"],
  description: "",
});

const effect = (patch: Partial<CharacterSpellEffect>): CharacterSpellEffect => ({
  id: crypto.randomUUID(), spellId: "x", name: "x", remainingRounds: 1, concentration: false, summary: "", ...patch,
});

describe("official defense and movement spell runtime", () => {
  it("models Shield and Shield of Faith AC correctly", () => {
    expect(getDefenseMovementSpellRuntime(spell("shield", 1, "1 round"), "dnd_2024")).toMatchObject({ armorClassBonus: 5, immunityToMagicMissile: true });
    expect(getDefenseMovementSpellRuntime(spell("shield-of-faith-2024", 1, "Up to 10 minutes", true), "dnd_2024")).toMatchObject({ armorClassBonus: 2 });
    const modifiers = getActiveDefenseMovementModifiers([effect({ armorClassBonus: 5 }), effect({ armorClassBonus: 2 })]);
    expect(modifiers.armorClassBonus).toBe(7);
  });

  it("distinguishes 2014 and 2024 Mirror Image", () => {
    expect(getDefenseMovementSpellRuntime(spell("mirror-image", 2, "1 minute"), "dnd_2014")?.duplicateInterceptionRule).toMatch(/d20|6\+/i);
    expect(getDefenseMovementSpellRuntime(spell("mirror-image-2024", 2, "1 minute"), "dnd_2024")?.duplicateInterceptionRule).toMatch(/d6|3\+/i);
  });

  it("models teleport rules and Dimension Door edition difference", () => {
    expect(getDefenseMovementSpellRuntime(spell("misty-step-2024", 2), "dnd_2024")).toMatchObject({ teleportDistance: 30, destinationRequiresSight: true, destinationMustBeUnoccupied: true });
    const oldDoor = getDefenseMovementSpellRuntime(spell("dimension-door", 4), "dnd_2014");
    const newDoor = getDefenseMovementSpellRuntime(spell("dimension-door-2024", 4), "dnd_2024");
    expect(oldDoor).toMatchObject({ teleportDistance: 500, canBringWillingCreature: true });
    expect(oldDoor?.guidance.join(" ")).toMatch(/size or smaller/i);
    expect(newDoor?.guidance.join(" ")).not.toMatch(/size or smaller/i);
    expect(newDoor?.guidance.join(" ")).toMatch(/4d6 Force/i);
  });

  it("scales Fly and Invisibility targets by slot level", () => {
    expect(getDefenseMovementSpellRuntime(spell("fly-2024", 3, "Up to 10 minutes", true), "dnd_2024", 5)).toMatchObject({ targetCount: 3, flySpeed: 60, canHover: true });
    expect(getDefenseMovementSpellRuntime(spell("invisibility-2024", 2, "Up to 1 hour", true), "dnd_2024", 4)).toMatchObject({ targetCount: 3, conditions: ["Invisible"] });
  });

  it("tracks Invisibility break conditions by edition", () => {
    expect(getDefenseMovementSpellRuntime(spell("invisibility", 2, "Up to 1 hour", true), "dnd_2014")).toMatchObject({ endOnAttack: true, endOnDealDamage: false, endOnCastSpell: true });
    expect(getDefenseMovementSpellRuntime(spell("invisibility-2024", 2, "Up to 1 hour", true), "dnd_2024")).toMatchObject({ endOnAttack: true, endOnDealDamage: true, endOnCastSpell: true });
    expect(getDefenseMovementSpellRuntime(spell("greater-invisibility-2024", 4, "Up to 1 minute", true), "dnd_2024")).toMatchObject({ endOnAttack: false, endOnDealDamage: false, endOnCastSpell: false });
  });

  it("creates persistent effects with defensive metadata", () => {
    const created = createSpellEffect(spell("shield", 1, "1 round"), "dnd_2024", 1);
    expect(created).toMatchObject({ armorClassBonus: 5, immunityToMagicMissile: true, remainingRounds: 1 });
    const invisible = createSpellEffect(spell("invisibility-2024", 2, "Up to 1 hour", true), "dnd_2024", 2);
    expect(invisible).toMatchObject({ conditions: ["Invisible"], endOnAttack: true, endOnDealDamage: true, endOnCastSpell: true });
  });

  it("removes fragile invisibility while preserving Greater Invisibility", () => {
    const effects = [effect({ spellId: "invisibility-2024", endOnAttack: true, endOnCastSpell: true }), effect({ spellId: "greater-invisibility-2024" })];
    expect(removeEffectsBrokenByAttack(effects).map((item) => item.spellId)).toEqual(["greater-invisibility-2024"]);
    expect(removeEffectsBrokenBySpellCast(effects, false).map((item) => item.spellId)).toEqual(["greater-invisibility-2024"]);
  });
});
