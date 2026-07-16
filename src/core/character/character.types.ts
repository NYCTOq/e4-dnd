export type RulesetId = "dnd_2014" | "dnd_2024" | "homebrew";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type AbilityScores = Record<AbilityKey, number>;

export type ArmorClassMode = "manual" | "auto";

export interface CharacterSpellSlot {
  level: number;
  max: number;
  used: number;
}

export interface CharacterInventoryItem {
  itemId: string;
  quantity: number;
  notes?: string;
}

export interface CharacterDeathSaves {
  successes: number;
  failures: number;
}

export interface CharacterHitDiePool {
  die: number;
  max: number;
  used: number;
}

export type ResourceRecovery = "short" | "long" | "manual";

export interface CharacterResource {
  id: string;
  name: string;
  max: number;
  used: number;
  recovery: ResourceRecovery;
}

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

export type CharacterConditionDurations = Partial<Record<CharacterCondition, number>>;

export interface Character {
  id: string;
  name: string;
  playerName: string;
  ruleset: RulesetId;

  race: string;
  subrace?: string;
  className: string;
  subclass: string;
  background: string;
  originAbilityPrimary?: AbilityKey;
  originAbilitySecondary?: AbilityKey;
  featIds: string[];
  fightingStyleIds?: string[];
  masteredWeaponIds?: string[];
  metamagicIds?: string[];
  invocationIds?: string[];
  wildShapeFormIds?: string[];
  maneuverIds?: string[];
  skillProficiencies: string[];
  expertiseSkills: string[];
  toolProficiencies: string[];
  languages: string[];
  level: number;

  abilities: AbilityScores;

  maxHp: number;
  currentHp: number;
  tempHp: number;
  armorClass: number;
  armorClassMode: ArmorClassMode;

  knownSpellIds: string[];
  preparedSpellIds: string[];
  spellSlots: CharacterSpellSlot[];

  inventory: CharacterInventoryItem[];
  equippedArmorId: string | null;
  equippedShieldId: string | null;
  equippedWeaponIds: string[];
  gold: number;

  deathSaves: CharacterDeathSaves;
  hitDice: CharacterHitDiePool[];
  resources: CharacterResource[];
  exhaustion: number;
  conditionDurations: CharacterConditionDurations;

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
  subrace?: string;
  className: string;
  subclass: string;
  background: string;
  originAbilityPrimary?: AbilityKey;
  originAbilitySecondary?: AbilityKey;
  featIds: string[];
  fightingStyleIds?: string[];
  masteredWeaponIds?: string[];
  metamagicIds?: string[];
  invocationIds?: string[];
  wildShapeFormIds?: string[];
  maneuverIds?: string[];
  skillProficiencies: string[];
  expertiseSkills: string[];
  toolProficiencies: string[];
  languages: string[];
  level: number;

  abilities: AbilityScores;

  maxHp: number;
  armorClass: number;
  armorClassMode: ArmorClassMode;

  knownSpellIds: string[];
  preparedSpellIds: string[];
  spellSlots: CharacterSpellSlot[];

  inventory: CharacterInventoryItem[];
  equippedArmorId: string | null;
  equippedShieldId: string | null;
  equippedWeaponIds: string[];
  gold: number;

  deathSaves: CharacterDeathSaves;
  hitDice: CharacterHitDiePool[];
  resources?: CharacterResource[];
  exhaustion: number;
  conditionDurations: CharacterConditionDurations;

  notes: string;
}
