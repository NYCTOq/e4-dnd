import type { AbilityKey } from "../character/character.types";

export interface SkillChoices {
  choose: number;
  from: string[];
}

export type SpellProgression = "none" | "full" | "half" | "third" | "pact";

export interface ClassLevelData {
  level: number;
  proficiencyBonus: number;
  features: string[];
  spellSlots?: number[];
  pactMagic?: { slotLevel: number; slots: number };
  weaponMasteryCount?: number;
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
  subclassLevel: number;
  spellProgression: SpellProgression;
  levels: ClassLevelData[];
}


export interface SubclassFeatureData {
  level: number;
  name: string;
  summary: string;
}

export interface DndSubclassData {
  id: string;
  name: string;
  className: string;
  ruleset: "dnd_2014" | "dnd_2024";
  selectionLevel: number;
  description: string;
  features: SubclassFeatureData[];
  bonusSpells?: string[];
  extraProficiencies?: string[];
  resourceName?: string;
}

export interface DndSubraceData {
  id: string;
  name: string;
  abilityBonuses?: Partial<Record<AbilityKey, number>>;
  traits: string[];
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
  creatureType?: string;
  languages?: string[];
  darkvision?: number;
  subraces?: DndSubraceData[];
}

export interface DndBackgroundData {
  id: string;
  name: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies?: string[];
  languages?: string[];
  equipment?: string[];
  feature?: string;
  abilityOptions?: AbilityKey[];
  abilityBonusMode?: "2014-none" | "2024-plus2-plus1" | "2024-three-ones";
  originFeat?: string;
}


export type FeatCategory = "origin" | "general" | "epic-boon";

export interface DndFeatPrerequisite {
  minimumLevel?: number;
  abilityMinimums?: Partial<Record<AbilityKey, number>>;
  spellcasting?: boolean;
  classNames?: string[];
}

export interface DndFeatData {
  id: string;
  name: string;
  ruleset: "dnd_2014" | "dnd_2024";
  category: FeatCategory;
  summary: string;
  benefits: string[];
  prerequisite?: DndFeatPrerequisite;
  abilityOptions?: AbilityKey[];
  repeatable?: boolean;
  choiceType?: "ability" | "skills" | "tools" | "spells" | "fighting-style" | "weapon-mastery";
  choiceCount?: number;
}

export type SpellEffectType = "damage" | "healing" | "control" | "utility" | "defense" | "summoning" | "movement";
export type SpellResolutionType = "automatic" | "spell-attack" | "saving-throw" | "ability-check";

export interface SpellScalingData {
  mode: "slot" | "character-level";
  dicePerStep?: string;
  flatPerStep?: number;
  additionalTargetsPerStep?: number;
  notes?: string;
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

  effectType?: SpellEffectType;
  attackType?: SpellResolutionType;
  damageDice?: string;
  damageType?: string;
  healingDice?: string;
  saveAbility?: AbilityKey;
  conditionEffect?: string;
  target?: string;
  area?: string;
  material?: string;
  materialCost?: string;
  materialConsumed?: boolean;
  reactionTrigger?: string;
  tags?: string[];
  scaling?: SpellScalingData;
  source?: string;
}


export type DndItemCategory = "weapon" | "armor" | "shield" | "gear" | "tool" | "pack" | "ammunition";
export type DndArmorType = "light" | "medium" | "heavy";
export type WeaponCategory = "simple" | "martial";
export type WeaponMastery = "Cleave" | "Graze" | "Nick" | "Push" | "Sap" | "Slow" | "Topple" | "Vex";

export interface DndMonsterData {
  id: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  hitPoints: number;
  hitDice: string;
  speed: string;
  abilities: Record<AbilityKey, number>;
  challengeRating: string;
  proficiencyBonus: number;
  senses: string;
  languages: string;
  traits: string[];
  actions: string[];
  description: string;
  source?: string;
}

export interface DndItemData {
  id: string;
  name: string;
  category: DndItemCategory;
  cost: string;
  weight: number;
  description: string;
  magical?: boolean;
  rarity?: "common" | "uncommon" | "rare" | "very-rare" | "legendary" | "artifact";
  requiresAttunement?: boolean;
  charges?: number;
  chargeRecovery?: string;
  attackBonus?: number;
  damageBonus?: number;
  armorBonus?: number;
  grantedSpellName?: string;
  chargeCost?: number;
  effectDurationRounds?: number;
  effectSummary?: string;

  armorClass?: number;
  armorClassBonus?: number;
  armorType?: DndArmorType;
  dexBonusMax?: number;
  strengthRequirement?: number;
  stealthDisadvantage?: boolean;

  damage?: string;
  damageType?: string;
  weaponCategory?: WeaponCategory;
  mastery?: WeaponMastery;
  properties?: string[];
  range?: string;
  tags?: string[];
  quantityInBundle?: number;
  contents?: Array<{ itemId: string; quantity: number }>;
}

export interface RulesetData {
  id: "dnd_2014" | "dnd_2024" | "homebrew";
  name: string;
  classes: DndClassData[];
  subclasses: DndSubclassData[];
  races: DndRaceData[];
  backgrounds: DndBackgroundData[];
  feats: DndFeatData[];
  spells: DndSpellData[];
  items: DndItemData[];
  monsters: DndMonsterData[];
}
