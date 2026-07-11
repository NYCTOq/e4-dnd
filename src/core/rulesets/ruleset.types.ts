import type { AbilityKey } from "../character/character.types";

export interface SkillChoices {
  choose: number;
  from: string[];
}

export interface DndClassData {
  id: string;
  name: string;
  hitDie: number;
  primaryAbilities: AbilityKey[];
  savingThrows: AbilityKey[];
  spellcastingAbility: AbilityKey | null;
  armorProficiencies: string[];
  weaponProficiencies: string[];
  skillChoices: SkillChoices;
  description: string;
}

export interface DndRaceData {
  id: string;
  name: string;
  speed: number;
  size: "Small" | "Medium" | "Large" | string;
  abilityBonuses: Partial<Record<AbilityKey, number>>;
  traits: string[];
  description: string;
}

export interface DndSpellData {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  concentration: boolean;
  ritual: boolean;
  classes: string[];
  description: string;
  higherLevels?: string;
}

export type DndItemCategory = "weapon" | "armor" | "shield" | "gear";
export type DndArmorType = "light" | "medium" | "heavy";

export interface DndItemData {
  id: string;
  name: string;
  category: DndItemCategory;
  cost: string;
  weight: number;
  description: string;

  armorClass?: number;
  armorClassBonus?: number;
  armorType?: DndArmorType;
  dexBonusMax?: number;
  strengthRequirement?: number;
  stealthDisadvantage?: boolean;

  damage?: string;
  damageType?: string;
  properties?: string[];
  range?: string;
  tags?: string[];
}

export interface RulesetData {
  id: "dnd_2014" | "dnd_2024" | "homebrew";
  name: string;
  classes: DndClassData[];
  races: DndRaceData[];
  spells: DndSpellData[];
  items: DndItemData[];
}
