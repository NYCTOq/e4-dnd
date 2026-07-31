import type { AbilityKey } from "../character/character.types";
import type { DndRaceData } from "./ruleset.types";
import type { RollMode } from "./attackResolution";

export type AncestryRuntimeContext = {
  ruleset?: "dnd_2014" | "dnd_2024" | "homebrew";
  choiceId?: string;
  ancestrySpellIds?: string[];
};

export type AncestryRuntime = {
  speedBonus: number;
  darkvision: number;
  damageResistances: string[];
  saveAdvantages: AbilityKey[];
  criticalExtraDice: number;
  maxHpBonus: number;
  fixedSkills: string[];
  weaponProficiencies: string[];
  toolChoiceOptions: string[];
  grantedSpells: string[];
  features: string[];
};

const has = (traits: string[], pattern: RegExp) =>
  traits.some((trait) => pattern.test(trait));

const unique = <T>(items: T[]) => [...new Set(items)];

const resistanceByChoice: Record<string, string> = {
  acid: "acid",
  "black-copper": "acid",
  cold: "cold",
  "silver-white": "cold",
  fire: "fire",
  "brass-gold-red": "fire",
  lightning: "lightning",
  "blue-bronze": "lightning",
  poison: "poison",
  green: "poison",
  abyssal: "poison",
  chthonic: "necrotic",
  infernal: "fire",
};

const lineageSpells: Record<string, string[]> = {
  abyssal: ["Poison Spray", "Ray of Sickness", "Hold Person"],
  chthonic: ["Chill Touch", "False Life", "Ray of Enfeeblement"],
  infernal: ["Fire Bolt", "Hellish Rebuke", "Darkness"],
  drow: ["Dancing Lights", "Faerie Fire", "Darkness"],
  "high-elf": ["Prestidigitation", "Detect Magic", "Misty Step"],
  "wood-elf": ["Druidcraft", "Longstrider", "Pass without Trace"],
  "forest-gnome": ["Minor Illusion"],
  "rock-gnome": ["Mending", "Prestidigitation"],
};

function spellsAvailableAtLevel(spells: string[], level: number) {
  return spells.filter((_spell, index) => index === 0 || level >= index * 2 + 1);
}

export function getAncestryRuntime(
  race: DndRaceData | undefined,
  subraceName: string | undefined,
  level: number,
  context: AncestryRuntimeContext = {},
): AncestryRuntime {
  if (!race) {
    return {
      speedBonus: 0,
      darkvision: 0,
      damageResistances: [],
      saveAdvantages: [],
      criticalExtraDice: 0,
      maxHpBonus: 0,
      fixedSkills: [],
      weaponProficiencies: [],
      toolChoiceOptions: [],
      grantedSpells: [],
      features: [],
    };
  }

  const safeLevel = Math.max(1, Math.min(20, Math.floor(level)));
  const raceName = race.name.toLowerCase();
  const subrace = race.subraces?.find((item) => item.name === subraceName);
  const subraceKey = (subraceName ?? "").toLowerCase();
  const traits = [...race.traits, ...(subrace?.traits ?? [])];
  const choiceId = context.choiceId?.toLowerCase() ?? "";

  const resistances: string[] = [];
  if (has(traits, /hellish resistance/i)) resistances.push("fire");
  if (has(traits, /celestial resistance/i)) resistances.push("radiant", "necrotic");
  if (has(traits, /dwarven resilience|stout resilience/i)) resistances.push("poison");
  if (resistanceByChoice[choiceId]) resistances.push(resistanceByChoice[choiceId]);

  const saves: AbilityKey[] =
    has(traits, /gnome cunning|gnomish cunning/i) ? ["int", "wis", "cha"] : [];
  if (has(traits, /dwarven resilience|stout resilience/i)) saves.push("con");

  const fixedSkills: string[] = [];
  if (raceName === "half-orc") fixedSkills.push("Intimidation");
  if (raceName === "half-elf") fixedSkills.push();
  if (raceName === "elf" && context.ruleset === "dnd_2014") fixedSkills.push("Perception");
  if (raceName === "halfling" && context.ruleset === "dnd_2024") fixedSkills.push("Stealth");

  const weapons: string[] = [];
  const toolChoices: string[] = [];
  if (raceName === "dwarf" && context.ruleset === "dnd_2014") {
    weapons.push("Battleaxe", "Handaxe", "Light Hammer", "Warhammer");
    toolChoices.push("Smith's Tools", "Brewer's Supplies", "Mason's Tools");
  }
  if (raceName === "elf" && context.ruleset === "dnd_2014") {
    if (subraceKey === "high elf") weapons.push("Longsword", "Shortsword", "Shortbow", "Longbow");
    if (subraceKey === "wood elf") weapons.push("Longsword", "Shortsword", "Shortbow", "Longbow");
    if (subraceKey === "drow") weapons.push("Rapier", "Shortsword", "Hand Crossbow");
  }

  const spells = [...(context.ancestrySpellIds ?? [])];
  if (context.ruleset === "dnd_2024" && raceName === "aasimar") spells.push("Light");
  if (context.ruleset === "dnd_2014" && raceName === "tiefling") {
    spells.push("Thaumaturgy");
    if (safeLevel >= 3) spells.push("Hellish Rebuke");
    if (safeLevel >= 5) spells.push("Darkness");
  }
  if (
    context.ruleset === "dnd_2014" &&
    raceName === "gnome" &&
    subraceKey === "forest gnome"
  ) {
    spells.push("Minor Illusion");
  }
  if (lineageSpells[choiceId]) {
    spells.push(...spellsAvailableAtLevel(lineageSpells[choiceId], safeLevel));
  }

  const features = traits.filter((trait) =>
    /relentless endurance|luck|brave|fey ancestry|breath weapon|healing hands|adrenaline rush|large form|draconic flight|trance|stonecunning|nimbleness|powerful build/i.test(
      trait,
    ),
  );

  if (raceName === "aasimar" && safeLevel >= 3 && choiceId) {
    features.push(`Celestial Revelation: ${choiceId}`);
  }
  if (raceName === "goliath" && choiceId) {
    features.push(`Giant Ancestry: ${choiceId}`);
  }

  return {
    speedBonus:
      has(traits, /fleet of foot/i) || choiceId === "wood-elf" ? 5 : 0,
    darkvision: has(traits, /superior darkvision/i)
      ? Math.max(120, race.darkvision ?? 0)
      : race.darkvision ?? 0,
    damageResistances: unique(resistances),
    saveAdvantages: unique(saves),
    criticalExtraDice: has(traits, /savage attacks/i) ? 1 : 0,
    maxHpBonus: has(traits, /dwarven toughness/i) ? safeLevel : 0,
    fixedSkills: unique(fixedSkills),
    weaponProficiencies: unique(weapons),
    toolChoiceOptions: unique(toolChoices),
    grantedSpells: unique(spells),
    features: unique(features),
  };
}

export function getAncestrySaveMode(
  runtime: AncestryRuntime,
  ability: AbilityKey,
  current: RollMode,
): RollMode {
  if (!runtime.saveAdvantages.includes(ability)) return current;
  return current === "disadvantage" ? "normal" : "advantage";
}

export function reduceAncestryDamage(
  amount: number,
  damageType: string,
  runtime: AncestryRuntime,
) {
  const safe = Math.max(0, Math.floor(amount));
  return runtime.damageResistances.includes(damageType.toLowerCase())
    ? Math.ceil(safe / 2)
    : safe;
}
