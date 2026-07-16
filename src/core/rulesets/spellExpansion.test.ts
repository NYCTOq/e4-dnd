import { describe, expect, it } from "vitest";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "./spellExpansion";

describe("spell database v2 expansion", () => {
  it("fills cleric spell levels four through nine", () => {
    for (const level of [4,5,6,7,8,9]) expect(SPELL_EXPANSION_2014.some((spell) => spell.level === level && spell.classes.includes("Cleric"))).toBe(true);
  });
  it("keeps edition ids separate and unique", () => {
    expect(new Set(SPELL_EXPANSION_2014.map((spell) => spell.id)).size).toBe(SPELL_EXPANSION_2014.length);
    expect(SPELL_EXPANSION_2024.every((spell) => spell.id.endsWith("-2024"))).toBe(true);
  });
  it("includes costly and consumed material metadata", () => {
    expect(SPELL_EXPANSION_2014.find((spell) => spell.name === "True Resurrection")).toMatchObject({ materialCost: "25,000 gp", materialConsumed: true });
  });
  it("contains every spell needed by the current domain and oath packages", () => {
    const required = ["Arcane Eye", "Crusader's Mantle", "Moonbeam", "Protection from Evil and Good", "Scrying", "Zone of Truth"];
    expect(required.every((name) => SPELL_EXPANSION_2014.some((spell) => spell.name === name))).toBe(true);
  });
  it("expands cantrip coverage for every primary caster", () => {
    const cantrips = SPELL_EXPANSION_2014.filter((spell) => spell.level === 0);
    for (const className of ["Bard", "Sorcerer", "Warlock", "Wizard"]) expect(cantrips.some((spell) => spell.classes.includes(className))).toBe(true);
    expect(cantrips.find((spell) => spell.name === "Eldritch Blast")?.damageType).toBe("force");
  });
  it("contains the formerly unresolved domain and oath spell references", () => {
    const required = [
      "Animal Friendship", "Animate Dead", "Animate Objects", "Antilife Shell", "Augury", "Aura of Life", "Aura of Purity", "Aura of Vitality",
      "Bane", "Barkskin", "Blight", "Blindness/Deafness", "Blink", "Call Lightning", "Circle of Power", "Cloudkill", "Compulsion", "Control Water",
      "Creation", "Destructive Wave", "Dominate Beast", "Elemental Weapon", "Fabricate", "False Life", "Flaming Sphere", "Fog Cloud", "Gentle Repose",
      "Grasping Vine", "Greater Invisibility", "Gust of Wind", "Heat Metal", "Heroism", "Identify", "Insect Plague", "Legend Lore", "Leomund's Secret Chest",
      "Leomund's Tiny Hut", "Locate Creature", "Magic Circle", "Mass Healing Word", "Mislead", "Nystul's Magic Aura", "Otiluke's Resilient Sphere",
      "Planar Binding", "Rary's Telepathic Bond", "Ray of Enfeeblement", "Ray of Sickness", "Searing Smite", "Sending", "Shatter", "Sleet Storm", "Slow",
      "Speak with Dead", "Spike Growth", "Suggestion", "Teleportation Circle", "Vampiric Touch", "Warding Bond", "Wind Wall",
    ];
    const names = new Set(SPELL_EXPANSION_2014.map((spell) => spell.name));
    expect(required).toHaveLength(59);
    expect(required.filter((name) => !names.has(name))).toEqual([]);
    expect(new Set(SPELL_EXPANSION_2014.map((spell) => spell.id)).size).toBe(SPELL_EXPANSION_2014.length);
  });
  it("provides broad level six through nine coverage", () => {
    const highLevel = SPELL_EXPANSION_2014.filter((spell) => spell.level >= 6);
    for (const level of [6, 7, 8, 9]) expect(highLevel.filter((spell) => spell.level === level).length).toBeGreaterThanOrEqual(10);
    for (const className of ["Bard", "Cleric", "Druid", "Sorcerer", "Warlock", "Wizard"]) {
      expect(highLevel.some((spell) => spell.classes.includes(className))).toBe(true);
    }
    expect(SPELL_EXPANSION_2014.find((spell) => spell.name === "Meteor Swarm")).toMatchObject({ level: 9, damageDice: "40d6", saveAbility: "dex" });
    expect(SPELL_EXPANSION_2014.length).toBeGreaterThanOrEqual(169);
  });
  it("adds the core adventuring and half-caster spell package", () => {
    const required = ["Alarm", "Armor of Agathys", "Find Familiar", "Goodberry", "Hellish Rebuke", "Hex", "Hunter's Mark", "Find Steed", "Silence", "Water Breathing"];
    const names = new Set(SPELL_EXPANSION_2014.map((spell) => spell.name));
    expect(required.filter((name) => !names.has(name))).toEqual([]);
    const rangerSpells = SPELL_EXPANSION_2014.filter((spell) => spell.classes.includes("Ranger") && spell.level <= 3);
    const paladinSpells = SPELL_EXPANSION_2014.filter((spell) => spell.classes.includes("Paladin") && spell.level <= 3);
    expect(rangerSpells.length).toBeGreaterThanOrEqual(15);
    expect(paladinSpells.length).toBeGreaterThanOrEqual(10);
    expect(SPELL_EXPANSION_2014.find((spell) => spell.name === "Hellish Rebuke")?.reactionTrigger).toBeTruthy();
    expect(SPELL_EXPANSION_2014.length).toBeGreaterThanOrEqual(209);
  });
  it("adds the advanced level three through five package", () => {
    const required = ["Bestow Curse", "Fear", "Glyph of Warding", "Remove Curse", "Black Tentacles", "Faithful Hound", "Banishing Smite", "Cone of Cold", "Swift Quiver", "Wall of Force"];
    const names = new Set(SPELL_EXPANSION_2014.map((spell) => spell.name));
    expect(required.filter((name) => !names.has(name))).toEqual([]);
    for (const level of [3, 4, 5]) expect(SPELL_EXPANSION_2014.filter((spell) => spell.level === level).length).toBeGreaterThanOrEqual(25);
    expect(SPELL_EXPANSION_2014.find((spell) => spell.name === "Glyph of Warding")).toMatchObject({ materialConsumed: true, damageDice: "5d8" });
    expect(SPELL_EXPANSION_2014.length).toBeGreaterThanOrEqual(249);
  });
});
