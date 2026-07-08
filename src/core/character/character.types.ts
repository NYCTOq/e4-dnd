export type RulesetId = "dnd_2014" | "dnd_2024" | "homebrew";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type AbilityScores = Record<AbilityKey, number>;

export type CharacterCondition =
  | "Blessed"
  | "Poisoned"
  | "Prone"
  | "Invisible"
  | "Stunned"
  | "Restrained"
  | "Concentration"
  | "Rage"
  | "Haki"
  | "Cursed";

export interface Character {
  id: string;
  name: string;
  playerName: string;
  ruleset: RulesetId;

  race: string;
  className: string;
  subclass: string;
  background: string;
  level: number;

  abilities: AbilityScores;

  maxHp: number;
  currentHp: number;
  tempHp: number;
  armorClass: number;

  conditions: CharacterCondition[];
  notes: string;

  createdAt: string;
  updatedAt: string;
}

export interface CharacterDraft {
  name: string;
  playerName: string;
  ruleset: RulesetId;

  race: string;
  className: string;
  subclass: string;
  background: string;
  level: number;

  abilities: AbilityScores;

  maxHp: number;
  armorClass: number;
  notes: string;
}