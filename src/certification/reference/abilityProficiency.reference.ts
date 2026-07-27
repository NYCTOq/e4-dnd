export const CERTIFIED_ABILITY_KEYS = ["str","dex","con","int","wis","cha"] as const;
export type CertifiedAbilityKey = typeof CERTIFIED_ABILITY_KEYS[number];

export const CERTIFIED_STANDARD_ARRAY = [15,14,13,12,10,8] as const;

export const CERTIFIED_POINT_BUY_COSTS: Record<number, number> = {
  8:0,
  9:1,
  10:2,
  11:3,
  12:4,
  13:5,
  14:7,
  15:9,
};

export const CERTIFIED_SKILLS: Record<string, CertifiedAbilityKey> = {
  Acrobatics:"dex",
  "Animal Handling":"wis",
  Arcana:"int",
  Athletics:"str",
  Deception:"cha",
  History:"int",
  Insight:"wis",
  Intimidation:"cha",
  Investigation:"int",
  Medicine:"wis",
  Nature:"int",
  Perception:"wis",
  Performance:"cha",
  Persuasion:"cha",
  Religion:"int",
  "Sleight of Hand":"dex",
  Stealth:"dex",
  Survival:"wis",
};

export const CERTIFIED_SPELLCASTING_ABILITIES: Record<string, CertifiedAbilityKey | null> = {
  Barbarian:null,
  Bard:"cha",
  Cleric:"wis",
  Druid:"wis",
  Fighter:null,
  Monk:"wis",
  Paladin:"cha",
  Ranger:"wis",
  Rogue:null,
  Sorcerer:"cha",
  Warlock:"cha",
  Wizard:"int",
};
