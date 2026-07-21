import { describe, expect, it } from "vitest";
import type { CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneOriginReadiness } from "./levelOneOriginReadiness";

const draft = (overrides: Partial<CharacterDraft> = {}): CharacterDraft => ({
  name: "A", playerName: "", ruleset: "dnd_2024", race: "Human", className: "Fighter", subclass: "", background: "Soldier", featIds: [],
  skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [], level: 1, originAbilityMode: "2-1", originAbilityPrimary: "str", originAbilitySecondary: "dex",
  abilities: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 }, maxHp: 12, armorClass: 16, armorClassMode: "auto",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 10,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [], resources: [], exhaustion: 0, conditionDurations: {}, notes: "", ...overrides,
});

const data = {
  id: "dnd_2024", name: "2024", classes: [], races: [], subclasses: [], spells: [], items: [], monsters: [],
  backgrounds: [{ id: "soldier", name: "Soldier", description: "", skillProficiencies: ["Athletics", "Intimidation"], abilityOptions: ["str", "dex", "con"], abilityBonusMode: "2024-plus2-plus1", originFeat: "Savage Attacker" }],
  feats: [{ id: "savage-attacker", name: "Savage Attacker", ruleset: "dnd_2024", category: "origin", summary: "", benefits: [] }],
} as RulesetData;

describe("level one origin readiness", () => {
  it("accepts a complete 2024 background origin", () => {
    const result = getLevelOneOriginReadiness(draft(), data);
    expect(result.ready).toBe(true);
    expect(result.summary).toContain("Origin Feat Savage Attacker");
  });

  it("blocks invalid or duplicate ability choices", () => {
    const result = getLevelOneOriginReadiness(draft({ originAbilityPrimary: "str", originAbilitySecondary: "str" }), data);
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toContain("ability dağılımı");
  });

  it("blocks manually selecting the background feat again", () => {
    const result = getLevelOneOriginReadiness(draft({ featIds: ["savage-attacker"] }), data);
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toContain("ayrıca feat olarak seçilemez");
  });

  it("accepts a complete 2014 background feature", () => {
    const legacy = { ...data, id: "dnd_2014", backgrounds: [{ id: "soldier", name: "Soldier", description: "", skillProficiencies: ["Athletics", "Intimidation"], feature: "Military Rank", abilityBonusMode: "2014-none" }], feats: [] } as RulesetData;
    const result = getLevelOneOriginReadiness(draft({ ruleset: "dnd_2014", originAbilityPrimary: undefined, originAbilitySecondary: undefined }), legacy);
    expect(result.ready).toBe(true);
    expect(result.summary).toContain("Background Feature Military Rank");
  });
});
