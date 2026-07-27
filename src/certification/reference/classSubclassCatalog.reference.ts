import type { RulesetData } from "../../core/rulesets/ruleset.types";

export const CANONICAL_CLASS_IDS = [
  "barbarian", "bard", "cleric", "druid", "fighter", "monk",
  "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard",
] as const;

export const CANONICAL_SUBCLASS_LEVELS: Readonly<Record<RulesetData["id"], Readonly<Record<string, number>>>> = {
  dnd_2014: {
    barbarian: 3, bard: 3, cleric: 1, druid: 2, fighter: 3, monk: 3,
    paladin: 3, ranger: 3, rogue: 3, sorcerer: 1, warlock: 1, wizard: 2,
  },
  dnd_2024: {
    barbarian: 3, bard: 3, cleric: 3, druid: 3, fighter: 3, monk: 3,
    paladin: 3, ranger: 3, rogue: 3, sorcerer: 3, warlock: 3, wizard: 3,
  },
  homebrew: {},
};

