import { describe, expect, it } from "vitest";
import { getArcaneClassRuntime } from "./arcaneClassRuntime";
import { getSubclassRuntime } from "./subclassRuntimeRules";
import type { DndSubclassData } from "./ruleset.types";

const makeSubclass = (className: string, name: string, features: Array<[number, string]>): DndSubclassData => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  className,
  ruleset: "dnd_2024",
  selectionLevel: 3,
  description: "Arcane runtime certification fixture.",
  features: features.map(([level, featureName]) => ({ level, name: featureName, summary: "Runtime behavior." })),
});

describe("arcane classes mega runtime", () => {
  it("certifies Bard inspiration progression and recovery", () => {
    expect(getArcaneClassRuntime("Bard", 4, "dnd_2014", 4)).toMatchObject({
      bardicInspirationDie: 6,
      bardicInspirationUses: 4,
      bardicInspirationRecovery: "long",
    });
    expect(getArcaneClassRuntime("Bard", 15, "dnd_2024", 5)).toMatchObject({
      bardicInspirationDie: 12,
      bardicInspirationUses: 5,
      bardicInspirationRecovery: "short",
    });
  });

  it("certifies Sorcerer points and edition metamagic progression", () => {
    expect(getArcaneClassRuntime("Sorcerer", 2, "dnd_2014")).toMatchObject({ sorceryPointsMax: 2, metamagicChoices: 0 });
    expect(getArcaneClassRuntime("Sorcerer", 2, "dnd_2024")).toMatchObject({ sorceryPointsMax: 2, metamagicChoices: 2 });
    expect(getArcaneClassRuntime("Sorcerer", 17, "dnd_2024")).toMatchObject({ sorceryPointsMax: 17, metamagicChoices: 4 });
  });

  it("certifies Warlock Pact Magic, invocations and Mystic Arcanum", () => {
    expect(getArcaneClassRuntime("Warlock", 11, "dnd_2014")).toMatchObject({
      pactSlotLevel: 5,
      pactSlotMax: 3,
      invocationChoices: 5,
      mysticArcanumLevels: [6],
    });
    expect(getArcaneClassRuntime("Warlock", 18, "dnd_2024")).toMatchObject({
      pactSlotLevel: 5,
      pactSlotMax: 4,
      invocationChoices: 10,
      mysticArcanumLevels: [6, 7, 8, 9],
    });
  });

  it("certifies Wizard recovery and high-level spell features", () => {
    expect(getArcaneClassRuntime("Wizard", 5, "dnd_2014")).toMatchObject({ arcaneRecoveryBudget: 3, spellMastery: false });
    expect(getArcaneClassRuntime("Wizard", 20, "dnd_2024")).toMatchObject({
      arcaneRecoveryBudget: 10,
      spellMastery: true,
      signatureSpells: true,
    });
  });

  it("connects Valor, Wild Magic and Abjurer subclass runtime", () => {
    expect(getSubclassRuntime(makeSubclass("Bard", "College of Valor", [[3, "Combat Inspiration"], [14, "Battle Magic"]]), 14).actions.map((x) => x.id)).toEqual(expect.arrayContaining(["combat-inspiration", "battle-magic"]));
    expect(getSubclassRuntime(makeSubclass("Sorcerer", "Wild Magic Sorcery", [[3, "Wild Magic Surge"], [6, "Bend Luck"]]), 6).actions.map((x) => x.id)).toEqual(expect.arrayContaining(["wild-magic-surge", "bend-luck"]));
    expect(getSubclassRuntime(makeSubclass("Wizard", "Abjurer", [[3, "Arcane Ward"], [6, "Projected Ward"]]), 6).actions.map((x) => x.id)).toEqual(expect.arrayContaining(["arcane-ward", "subclass-reaction"]));
  });

  it("connects Great Old One Clairvoyant Combatant", () => {
    const runtime = getSubclassRuntime(makeSubclass("Warlock", "Great Old One Patron", [[6, "Clairvoyant Combatant"]]), 6);
    expect(runtime.actions[0]).toMatchObject({ id: "clairvoyant-combatant", type: "bonus-action" });
  });
});
