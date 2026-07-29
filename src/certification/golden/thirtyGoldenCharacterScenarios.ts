export type Ruleset = "dnd_2014" | "dnd_2024";
export type SpellcastingKind = "none" | "full" | "half" | "third" | "pact";

export type GoldenCharacterScenario = {
  id: string;
  ruleset: Ruleset;
  ancestry: string;
  className: string;
  subclass: string;
  level: number;
  expected: {
    proficiencyBonus: number;
    subclassUnlocked: boolean;
    subclassStartLevel: number;
    asiOrFeatChoices: number;
    spellcasting: SpellcastingKind;
  };
};

const ASI_LEVELS: Record<string, number[]> = {
  Barbarian: [4, 8, 12, 16, 19], Bard: [4, 8, 12, 16, 19], Cleric: [4, 8, 12, 16, 19],
  Druid: [4, 8, 12, 16, 19], Fighter: [4, 6, 8, 12, 14, 16, 19], Monk: [4, 8, 12, 16, 19],
  Paladin: [4, 8, 12, 16, 19], Ranger: [4, 8, 12, 16, 19], Rogue: [4, 8, 10, 12, 16, 19],
  Sorcerer: [4, 8, 12, 16, 19], Warlock: [4, 8, 12, 16, 19], Wizard: [4, 8, 12, 16, 19],
};

export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((Math.max(1, Math.min(20, level)) - 1) / 4);
}

export function subclassStartLevel(ruleset: Ruleset, className: string): number {
  if (ruleset === "dnd_2024") return 3;
  if (["Cleric", "Sorcerer", "Warlock"].includes(className)) return 1;
  if (["Druid", "Wizard"].includes(className)) return 2;
  return 3;
}

export function asiOrFeatChoices(className: string, level: number): number {
  return (ASI_LEVELS[className] ?? []).filter((entry) => entry <= level).length;
}

export function spellcastingKind(className: string, subclass: string): SpellcastingKind {
  if (["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"].includes(className)) return "full";
  if (["Paladin", "Ranger"].includes(className)) return "half";
  if (className === "Warlock") return "pact";
  if ((className === "Fighter" && /eldritch knight/i.test(subclass)) || (className === "Rogue" && /arcane trickster/i.test(subclass))) return "third";
  return "none";
}

const raw = [
  ["2014-human-barbarian-berserker-l10","dnd_2014","Human","Barbarian","Path of the Berserker",10],
  ["2024-dwarf-fighter-battle-master-l18","dnd_2024","Dwarf","Fighter","Battle Master",18],
  ["2014-high-elf-wizard-evocation-l7","dnd_2014","High Elf","Wizard","School of Evocation",7],
  ["2024-halfling-rogue-thief-l5","dnd_2024","Halfling","Rogue","Thief",5],
  ["2014-tiefling-warlock-fiend-l12","dnd_2014","Tiefling","Warlock","The Fiend",12],
  ["2024-dragonborn-paladin-devotion-l9","dnd_2024","Dragonborn","Paladin","Oath of Devotion",9],
  ["2014-wood-elf-ranger-hunter-l6","dnd_2014","Wood Elf","Ranger","Hunter",6],
  ["2024-human-cleric-life-l15","dnd_2024","Human","Cleric","Life Domain",15],
  ["2014-half-orc-barbarian-totem-l3","dnd_2014","Half-Orc","Barbarian","Path of the Totem Warrior",3],
  ["2024-gnome-wizard-diviner-l20","dnd_2024","Gnome","Wizard","Diviner",20],
  ["2014-hill-dwarf-cleric-tempest-l8","dnd_2014","Hill Dwarf","Cleric","Tempest Domain",8],
  ["2024-elf-monk-shadow-l11","dnd_2024","Elf","Monk","Warrior of Shadow",11],
  ["2014-human-fighter-champion-l4","dnd_2014","Human","Fighter","Champion",4],
  ["2024-orc-barbarian-world-tree-l16","dnd_2024","Orc","Barbarian","Path of the World Tree",16],
  ["2014-lightfoot-halfling-bard-lore-l13","dnd_2014","Lightfoot Halfling","Bard","College of Lore",13],
  ["2024-tiefling-sorcerer-draconic-l6","dnd_2024","Tiefling","Sorcerer","Draconic Sorcery",6],
  ["2014-half-elf-paladin-vengeance-l17","dnd_2014","Half-Elf","Paladin","Oath of Vengeance",17],
  ["2024-dwarf-ranger-beastmaster-l10","dnd_2024","Dwarf","Ranger","Beastmaster",10],
  ["2014-forest-gnome-druid-moon-l5","dnd_2014","Forest Gnome","Druid","Circle of the Moon",5],
  ["2024-human-rogue-assassin-l14","dnd_2024","Human","Rogue","Assassin",14],
  ["2014-dragonborn-sorcerer-draconic-l9","dnd_2014","Dragonborn","Sorcerer","Draconic Bloodline",9],
  ["2024-halfling-bard-dance-l7","dnd_2024","Halfling","Bard","College of Dance",7],
  ["2014-mountain-dwarf-fighter-ek-l12","dnd_2014","Mountain Dwarf","Fighter","Eldritch Knight",12],
  ["2024-goliath-barbarian-zealot-l8","dnd_2024","Goliath","Barbarian","Path of the Zealot",8],
  ["2014-drow-rogue-arcane-trickster-l11","dnd_2014","Drow","Rogue","Arcane Trickster",11],
  ["2024-aasimar-cleric-light-l19","dnd_2024","Aasimar","Cleric","Light Domain",19],
  ["2014-human-monk-open-hand-l6","dnd_2014","Human","Monk","Way of the Open Hand",6],
  ["2024-elf-druid-sea-l13","dnd_2024","Elf","Druid","Circle of the Sea",13],
  ["2014-tiefling-bard-valor-l3","dnd_2014","Tiefling","Bard","College of Valor",3],
  ["2024-dragonborn-warlock-archfey-l17","dnd_2024","Dragonborn","Warlock","Archfey Patron",17],
] as const;

export const THIRTY_GOLDEN_CHARACTERS: GoldenCharacterScenario[] = raw.map(([id,ruleset,ancestry,className,subclass,level]) => {
  const start = subclassStartLevel(ruleset, className);
  return {
    id, ruleset, ancestry, className, subclass, level,
    expected: {
      proficiencyBonus: proficiencyBonus(level),
      subclassUnlocked: level >= start,
      subclassStartLevel: start,
      asiOrFeatChoices: asiOrFeatChoices(className, level),
      spellcasting: spellcastingKind(className, subclass),
    },
  };
});
