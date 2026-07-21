import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AbilityScores, RulesetId } from "../character/character.types";
import type { DndClassData, DndSpellData } from "./ruleset.types";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "./spellExpansion";
import { canPrepareSpell, canRitualCast, getSpellcastingProfile } from "./spellcastingRules";

const abilities: AbilityScores = { str: 10, dex: 10, con: 10, int: 16, wis: 16, cha: 16 };
const loadClasses = (edition: "2014" | "2024") => JSON.parse(readFileSync(`public/data/dnd_${edition}/classes.json`, "utf8")) as DndClassData[];
const loadSpells = (edition: "2014" | "2024") => JSON.parse(readFileSync(`public/data/dnd_${edition}/spells.json`, "utf8")) as DndSpellData[];
const cls = (edition: "2014" | "2024", name: string) => loadClasses(edition).find((item) => item.name === name) ?? null;
const profile = (edition: "2014" | "2024", name: string, level = 5, subclass = "") =>
  getSpellcastingProfile(cls(edition, name), level, abilities, `dnd_${edition}` as RulesetId, subclass);
const ritual: DndSpellData = {
  id: "ritual-probe", name: "Ritual Probe", level: 1, school: "Divination", castingTime: "1 action", range: "Self",
  components: ["V"], duration: "Instantaneous", concentration: false, ritual: true, classes: ["Wizard"], description: "Probe.", source: "test",
};

describe("official spell builder certification", () => {
  it("uses official 2014 class-specific ritual access", () => {
    expect(profile("2014", "Bard").ritualMode).toBe("known");
    expect(profile("2014", "Wizard").ritualMode).toBe("known");
    expect(profile("2014", "Cleric").ritualMode).toBe("prepared");
    expect(profile("2014", "Druid").ritualMode).toBe("prepared");
    for (const name of ["Paladin", "Ranger", "Sorcerer", "Warlock"]) expect(profile("2014", name).ritualMode).toBe("none");
  });

  it("requires preparation for every 2024 ritual caster", () => {
    for (const name of ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"]) {
      expect(profile("2024", name).ritualMode).toBe("prepared");
    }
    expect(profile("2024", "Fighter", 7, "Eldritch Knight").ritualMode).toBe("prepared");
    expect(profile("2024", "Rogue", 7, "Arcane Trickster").ritualMode).toBe("prepared");
  });

  it("does not let a 2024 wizard ritual-cast an unprepared spellbook spell", () => {
    const wizard = profile("2024", "Wizard");
    expect(canRitualCast(ritual, wizard, [ritual.id], [])).toBe(false);
    expect(canRitualCast(ritual, wizard, [ritual.id], [ritual.id])).toBe(true);
  });

  it("keeps the 2014 wizard spellbook ritual exception", () => {
    const wizard = profile("2014", "Wizard");
    expect(canRitualCast(ritual, wizard, [ritual.id], [])).toBe(true);
  });

  it("requires a 2014 cleric ritual to be prepared", () => {
    const cleric = profile("2014", "Cleric");
    expect(canRitualCast(ritual, cleric, [ritual.id], [])).toBe(false);
    expect(canRitualCast(ritual, cleric, [ritual.id], [ritual.id])).toBe(true);
  });

  it("keeps always-prepared spells outside the normal prepared quota", () => {
    const cleric = profile("2024", "Cleric", 3);
    const normalPrepared = Array.from({ length: cleric.preparedSpellLimit ?? 0 }, (_, index) => `normal-${index}`);
    const candidate = { ...ritual, id: "candidate" };
    expect(canPrepareSpell(candidate, normalPrepared, cleric)).toBe(false);
    expect(canPrepareSpell(candidate, normalPrepared.slice(1), cleric)).toBe(true);
  });

  it("keeps merged spell ids unique and metadata complete", () => {
    for (const [edition, base, expansion] of [
      ["2014", loadSpells("2014"), SPELL_EXPANSION_2014],
      ["2024", loadSpells("2024"), SPELL_EXPANSION_2024],
    ] as const) {
      const merged = [...base, ...expansion.filter((candidate) => !base.some((existing) => existing.id === candidate.id))];
      expect(new Set(merged.map((spell) => spell.id)).size, edition).toBe(merged.length);
      expect(merged.length, edition).toBeGreaterThanOrEqual(330);
      for (const spell of merged) {
        expect(spell.level, spell.name).toBeGreaterThanOrEqual(0);
        expect(spell.level, spell.name).toBeLessThanOrEqual(9);
        expect(spell.name.trim(), spell.id).not.toBe("");
        expect(spell.castingTime.trim(), spell.name).not.toBe("");
        expect(spell.range.trim(), spell.name).not.toBe("");
        expect(Array.isArray(spell.components) ? spell.components.length : String(spell.components).trim().length, spell.name).toBeGreaterThan(0);
        expect(spell.duration.trim(), spell.name).not.toBe("");
        expect(spell.classes.length, spell.name).toBeGreaterThan(0);
      }
    }
  });
});
