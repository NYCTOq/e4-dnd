import type { AbilityScores } from "../../core/character/character.types";

export type CharacterDerivedStatsGoldenReference = {
  id: string;
  ruleset: "dnd_2014" | "dnd_2024";
  className: "Fighter" | "Wizard" | "Bard" | "Cleric";
  classLevels: { className: string; level: number }[];
  level: number;
  abilities: AbilityScores;
  featIds: string[];
  skills: string[];
  expertise: string[];
  armorMode: "manual" | "auto";
  armorId: string | null;
  shieldId: string | null;
  attunedLuck: boolean;
  expected: {
    proficiencyBonus: number;
    armorClass: number;
    initiative: number;
    speed: number;
    passivePerception: number;
    spellSaveDc: number;
    spellAttackBonus: number;
  };
};

export const CHARACTER_DERIVED_STATS_GOLDEN: readonly CharacterDerivedStatsGoldenReference[] = [
  {
    id: "2014-wizard-alert-observant", ruleset: "dnd_2014", className: "Wizard",
    classLevels: [{ className: "Wizard", level: 5 }], level: 5,
    abilities: { str: 8, dex: 16, con: 14, int: 18, wis: 12, cha: 10 },
    featIds: ["alert", "observant"], skills: ["Perception", "Arcana"], expertise: [],
    armorMode: "auto", armorId: "leather", shieldId: "shield", attunedLuck: true,
    expected: { proficiencyBonus: 3, armorClass: 17, initiative: 8, speed: 30, passivePerception: 19, spellSaveDc: 15, spellAttackBonus: 7 },
  },
  {
    id: "2024-bard-mobile-expertise", ruleset: "dnd_2024", className: "Bard",
    classLevels: [{ className: "Bard", level: 9 }], level: 9,
    abilities: { str: 8, dex: 14, con: 14, int: 12, wis: 16, cha: 18 },
    featIds: ["mobile"], skills: ["Perception", "Persuasion"], expertise: ["Perception"],
    armorMode: "auto", armorId: "scale", shieldId: null, attunedLuck: false,
    expected: { proficiencyBonus: 4, armorClass: 16, initiative: 2, speed: 40, passivePerception: 21, spellSaveDc: 16, spellAttackBonus: 8 },
  },
  {
    id: "2014-fighter-wizard-multiclass", ruleset: "dnd_2014", className: "Fighter",
    classLevels: [{ className: "Fighter", level: 5 }, { className: "Wizard", level: 3 }], level: 8,
    abilities: { str: 16, dex: 12, con: 16, int: 16, wis: 10, cha: 8 },
    featIds: [], skills: ["Athletics"], expertise: [],
    armorMode: "auto", armorId: "chain", shieldId: "shield", attunedLuck: false,
    expected: { proficiencyBonus: 3, armorClass: 18, initiative: 1, speed: 30, passivePerception: 10, spellSaveDc: 11, spellAttackBonus: 3 },
  },
  {
    id: "2024-cleric-manual-defense", ruleset: "dnd_2024", className: "Cleric",
    classLevels: [{ className: "Cleric", level: 17 }], level: 17,
    abilities: { str: 14, dex: 10, con: 16, int: 10, wis: 20, cha: 14 },
    featIds: ["observant"], skills: ["Perception", "Insight"], expertise: [],
    armorMode: "manual", armorId: null, shieldId: null, attunedLuck: true,
    expected: { proficiencyBonus: 6, armorClass: 19, initiative: 0, speed: 30, passivePerception: 26, spellSaveDc: 19, spellAttackBonus: 11 },
  },
] as const;
