import type { DndClassData, DndRaceData, DndSubclassData } from "./ruleset.types";
import { getBrutalCriticalExtraDice, getBrutalStrike, getPrimalChampion, getRageDamageBonus, getRageUses, getWeaponMasteryCount, type BarbarianEdition } from "./barbarianRules";

export type BarbarianCertificationRow = {
  ruleset: BarbarianEdition;
  raceId: string;
  raceName: string;
  subclassId: string;
  subclassName: string;
  level: number;
  ready: boolean;
  blockers: string[];
  warnings: string[];
  expected: {
    rageUses: number | "unlimited";
    rageDamage: number;
    weaponMasteryCount: number;
    brutalCriticalDice: number;
    brutalStrikeDice: number;
    brutalStrikeEffectCount: number;
    primalChampionMaximum: number;
  };
};

const expectedSubclassLevels = (ruleset: BarbarianEdition) => ruleset === "dnd_2024" ? [3, 6, 10, 14] : [3, 6, 10, 14];

export function certifyBarbarianBuilder(
  ruleset: BarbarianEdition,
  barbarian: DndClassData,
  races: DndRaceData[],
  subclasses: DndSubclassData[],
): BarbarianCertificationRow[] {
  const barbarianSubclasses = subclasses.filter((item) => item.className.toLowerCase() === "barbarian" && item.ruleset === ruleset);
  const rows: BarbarianCertificationRow[] = [];

  for (const race of races) {
    for (const subclass of barbarianSubclasses) {
      for (let level = 1; level <= 20; level += 1) {
        const blockers: string[] = [];
        const warnings: string[] = [];
        const progression = barbarian.levels.find((entry) => entry.level === level);
        if (!progression) blockers.push(`Level ${level} progression satırı eksik.`);
        if (barbarian.hitDie !== 12) blockers.push("Barbarian Hit Die d12 olmalı.");
        if (!barbarian.savingThrows.includes("str") || !barbarian.savingThrows.includes("con")) blockers.push("STR/CON saving throw proficiency eksik.");
        if (barbarian.subclassLevel !== 3) blockers.push("Barbarian subclass seçimi level 3 olmalı.");
        if (level >= 3 && !subclass) blockers.push("Level 3+ Barbarian için subclass seçimi eksik.");
        if (subclass.selectionLevel !== 3) blockers.push(`${subclass.name} selection level 3 olmalı.`);
        const subclassLevels = [...new Set(subclass.features.map((feature) => feature.level))].sort((a, b) => a - b);
        for (const required of expectedSubclassLevels(ruleset)) if (!subclassLevels.includes(required)) blockers.push(`${subclass.name} level ${required} özelliği eksik.`);
        if (race.subraces?.length && ruleset === "dnd_2014") warnings.push(`${race.name} için Builder subrace seçimini zorunlu tutmalı.`);
        if (ruleset === "dnd_2024" && Object.keys(race.abilityBonuses).length) blockers.push(`${race.name} 2024 ability bonusunu species üzerinden vermemeli.`);
        if (ruleset === "dnd_2014" && race.name === "Half-Elf") warnings.push("Half-Elf iki farklı non-CHA ability için +1/+1 seçimi istemeli.");
        if (ruleset === "dnd_2024" && ["Human", "Dragonborn", "Elf", "Gnome", "Goliath", "Tiefling", "Aasimar"].includes(race.name)) warnings.push(`${race.name} species alt seçimi Builder choice debt içinde doğrulanmalı.`);
        if (level < 3 && subclass.features.some((feature) => feature.level <= level)) blockers.push("Subclass özelliği seçim seviyesinden önce açılıyor.");

        const brutalStrike = getBrutalStrike(level, ruleset);
        rows.push({
          ruleset, raceId: race.id, raceName: race.name, subclassId: subclass.id, subclassName: subclass.name,
          level, ready: blockers.length === 0, blockers, warnings,
          expected: {
            rageUses: getRageUses(level, ruleset),
            rageDamage: getRageDamageBonus(level),
            weaponMasteryCount: getWeaponMasteryCount(level, ruleset),
            brutalCriticalDice: getBrutalCriticalExtraDice(level, ruleset),
            brutalStrikeDice: brutalStrike.dice,
            brutalStrikeEffectCount: brutalStrike.effectCount,
            primalChampionMaximum: getPrimalChampion(level, ruleset).maximum,
          },
        });
      }
    }
  }
  return rows;
}

export function summarizeBarbarianCertification(rows: BarbarianCertificationRow[]) {
  const blockers = rows.flatMap((row) => row.blockers.map((message) => `${row.ruleset}/${row.raceName}/${row.subclassName}/L${row.level}: ${message}`));
  const warnings = rows.flatMap((row) => row.warnings.map((message) => `${row.ruleset}/${row.raceName}/${row.subclassName}/L${row.level}: ${message}`));
  return {
    ready: blockers.length === 0,
    scenarioCount: rows.length,
    readyCount: rows.filter((row) => row.ready).length,
    blockerCount: blockers.length,
    warningCount: warnings.length,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
  };
}
