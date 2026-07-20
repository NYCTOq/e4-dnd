import type { DndClassData, DndRaceData, DndSubclassData } from "./ruleset.types";
import {
  getMetamagicChoiceCountForSorcerer,
  getSorcererCantripCount,
  getSorcererCombatFeatures,
  getSorcererKnownSpellLimit,
  getSorcererPreparedSpellLimit,
  getSorcererSubclassFeatureLevels,
  getSorcererSubclassLevel,
  getSorceryPointMaximum,
  type SorcererEdition,
} from "./sorcererRules";

export type SorcererCertificationRow = {
  ruleset: SorcererEdition;
  raceId: string;
  raceName: string;
  subclassId: string;
  subclassName: string;
  level: number;
  ready: boolean;
  blockers: string[];
  warnings: string[];
  expected: {
    sorceryPoints: number;
    cantrips: number;
    knownSpells: number;
    preparedSpells: number;
    metamagicChoices: number;
    innateSorcery: boolean;
    sorcerousRestoration: boolean;
    sorceryIncarnate: boolean;
    arcaneApotheosis: boolean;
    subclassFeatures: string[];
  };
};

const expected2014SubclassNames = new Set([
  "Draconic Bloodline", "Wild Magic", "Storm Sorcery", "Divine Soul", "Shadow Magic", "Aberrant Mind", "Clockwork Soul", "Lunar Sorcery",
]);
const expected2024SubclassNames = new Set(["Draconic Sorcery", "Wild Magic Sorcery", "Aberrant Sorcery", "Clockwork Sorcery"]);
const special2024 = new Set(["Human", "Dragonborn", "Elf", "Gnome", "Goliath", "Tiefling", "Aasimar"]);

export function certifySorcererBuilder(
  ruleset: SorcererEdition,
  sorcerer: DndClassData,
  races: DndRaceData[],
  subclasses: DndSubclassData[],
): SorcererCertificationRow[] {
  const sorcererSubclasses = subclasses.filter((subclass) => subclass.className.toLowerCase() === "sorcerer" && subclass.ruleset === ruleset);
  const expectedNames = ruleset === "dnd_2024" ? expected2024SubclassNames : expected2014SubclassNames;
  const rows: SorcererCertificationRow[] = [];

  for (const race of races) for (const subclass of sorcererSubclasses) for (let level = 1; level <= 20; level += 1) {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const levelRow = sorcerer.levels.find((entry) => entry.level === level);
    const subclassLevel = getSorcererSubclassLevel(ruleset);
    const requiredFeatureLevels = getSorcererSubclassFeatureLevels(ruleset);

    if (!levelRow) blockers.push(`Level ${level} progression satırı eksik.`);
    if (sorcerer.hitDie !== 6) blockers.push("Sorcerer Hit Die d6 olmalı.");
    if (!sorcerer.savingThrows.includes("con") || !sorcerer.savingThrows.includes("cha")) blockers.push("CON/CHA saving throw proficiency eksik.");
    if (sorcerer.spellcastingAbility !== "cha") blockers.push("Sorcerer spellcasting ability CHA olmalı.");
    if (sorcerer.skillChoices.choose !== 2) blockers.push("Sorcerer iki skill seçebilmeli.");
    if (sorcerer.subclassLevel !== subclassLevel || subclass.selectionLevel !== subclassLevel) blockers.push(`Subclass seçimi level ${subclassLevel} olmalı.`);
    if (!expectedNames.has(subclass.name)) blockers.push(`${subclass.name} edition subclass manifestinde tanımlı değil.`);

    for (const requiredLevel of requiredFeatureLevels) {
      if (!subclass.features.some((feature) => feature.level === requiredLevel)) blockers.push(`${subclass.name} level ${requiredLevel} özelliği eksik.`);
    }
    if (level < subclassLevel && subclass.features.some((feature) => feature.level <= level)) blockers.push("Subclass özelliği seçim seviyesinden önce açılıyor.");

    const core = getSorcererCombatFeatures(level, ruleset);
    if (ruleset === "dnd_2024") {
      if (Object.keys(race.abilityBonuses).length) blockers.push(`${race.name} 2024 ability bonusunu species üzerinden vermemeli.`);
      if (special2024.has(race.name)) warnings.push(`${race.name} species alt seçimleri Origin Builder içinde çözülmeli.`);
      if (!sorcerer.weaponProficiencies.some((entry) => entry.toLowerCase() === "simple weapons")) blockers.push("2024 Sorcerer simple weapon proficiency kullanmalı.");
      if (level === 1 && !levelRow?.features.includes("Innate Sorcery")) blockers.push("2024 level 1 Innate Sorcery eksik.");
      if (level === 2 && !levelRow?.features.includes("Metamagic")) blockers.push("2024 Metamagic level 2'de açılmalı.");
      if (level === 19 && !levelRow?.features.includes("Epic Boon")) blockers.push("2024 level 19 Epic Boon eksik.");
    } else {
      if (race.subraces?.length) warnings.push(`${race.name} için subrace seçimi zorunlu tutulmalı.`);
      if (level === 1 && !levelRow?.features.includes("Sorcerous Origin")) blockers.push("2014 Sorcerous Origin level 1'de açılmalı.");
      if (level === 3 && !levelRow?.features.includes("Metamagic")) blockers.push("2014 Metamagic level 3'te açılmalı.");
    }

    rows.push({
      ruleset,
      raceId: race.id,
      raceName: race.name,
      subclassId: subclass.id,
      subclassName: subclass.name,
      level,
      ready: blockers.length === 0,
      blockers,
      warnings,
      expected: {
        sorceryPoints: getSorceryPointMaximum(level),
        cantrips: getSorcererCantripCount(level, ruleset),
        knownSpells: getSorcererKnownSpellLimit(level, ruleset),
        preparedSpells: getSorcererPreparedSpellLimit(level, ruleset),
        metamagicChoices: getMetamagicChoiceCountForSorcerer(level, ruleset),
        innateSorcery: core.innateSorcery,
        sorcerousRestoration: core.sorcerousRestoration,
        sorceryIncarnate: core.sorceryIncarnate,
        arcaneApotheosis: core.arcaneApotheosis,
        subclassFeatures: subclass.features.filter((feature) => feature.level <= level).map((feature) => feature.name),
      },
    });
  }
  return rows;
}

export function summarizeSorcererCertification(rows: SorcererCertificationRow[]) {
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
