import type { DndClassData, DndRaceData, DndSubclassData } from "./ruleset.types";
import { getInvocationChoiceCount } from "./invocationRules";
import {
  getMagicalCunningRecovery,
  getMysticArcanumSpellLevels,
  getWarlockCantripCount,
  getWarlockKnownSpellLimit,
  getWarlockPactMagicProgression,
  getWarlockPreparedSpellLimit,
  getWarlockSubclassFeatureLevels,
  getWarlockSubclassLevel,
  type WarlockEdition,
} from "./warlockRules";

export type WarlockCertificationRow = {
  ruleset: WarlockEdition; raceId: string; raceName: string; subclassId: string; subclassName: string; level: number;
  ready: boolean; blockers: string[]; warnings: string[];
  expected: { pactSlotLevel: number; pactSlots: number; cantrips: number; knownSpells: number; preparedSpells: number; invocationChoices: number; mysticArcanumLevels: number[]; magicalCunningRecovery: number; subclassFeatures: string[] };
};

const expected2014 = new Set(["The Fiend","The Archfey","The Celestial","The Fathomless","The Genie","The Great Old One","The Hexblade","The Undead","The Undying"]);
const expected2024 = new Set(["Archfey Patron","Celestial Patron","Fiend Patron","Great Old One Patron"]);
const special2024 = new Set(["Human","Dragonborn","Elf","Gnome","Goliath","Tiefling","Aasimar"]);

export function certifyWarlockBuilder(ruleset: WarlockEdition, warlock: DndClassData, races: DndRaceData[], subclasses: DndSubclassData[]): WarlockCertificationRow[] {
  const manifest = ruleset === "dnd_2024" ? expected2024 : expected2014;
  const subclassLevel = getWarlockSubclassLevel(ruleset);
  const featureLevels = getWarlockSubclassFeatureLevels(ruleset);
  const available = subclasses.filter((x) => x.className.toLowerCase() === "warlock" && x.ruleset === ruleset);
  const rows: WarlockCertificationRow[] = [];
  for (const race of races) for (const subclass of available) for (let level=1; level<=20; level+=1) {
    const blockers:string[]=[]; const warnings:string[]=[];
    const levelRow=warlock.levels.find((x)=>x.level===level);
    const pact=getWarlockPactMagicProgression(level);
    if (!levelRow) blockers.push(`Level ${level} progression satırı eksik.`);
    if (warlock.hitDie!==8) blockers.push("Warlock Hit Die d8 olmalı.");
    if (!warlock.savingThrows.includes("wis") || !warlock.savingThrows.includes("cha")) blockers.push("WIS/CHA saving throw proficiency eksik.");
    if (warlock.spellcastingAbility!=="cha") blockers.push("Warlock spellcasting ability CHA olmalı.");
    if (warlock.skillChoices.choose!==2) blockers.push("Warlock iki skill seçebilmeli.");
    if (warlock.spellProgression!=="pact") blockers.push("Warlock Pact Magic progression kullanmalı.");
    if (!warlock.armorProficiencies.some((x)=>x.toLowerCase()==="light armor")) blockers.push("Light Armor proficiency eksik.");
    if (!warlock.weaponProficiencies.some((x)=>x.toLowerCase()==="simple weapons")) blockers.push("Simple Weapons proficiency eksik.");
    if (warlock.subclassLevel!==subclassLevel || subclass.selectionLevel!==subclassLevel) blockers.push(`Subclass seçimi level ${subclassLevel} olmalı.`);
    if (!manifest.has(subclass.name)) blockers.push(`${subclass.name} edition subclass manifestinde tanımlı değil.`);
    for (const required of featureLevels) if (!subclass.features.some((x)=>x.level===required)) blockers.push(`${subclass.name} level ${required} özelliği eksik.`);
    if (level<subclassLevel && subclass.features.some((x)=>x.level<=level)) blockers.push("Subclass özelliği seçim seviyesinden önce açılıyor.");
    if (!levelRow?.pactMagic || levelRow.pactMagic.slotLevel!==pact.slotLevel || levelRow.pactMagic.slots!==pact.slots) blockers.push(`Level ${level} Pact Magic progression hatalı.`);
    if (ruleset==="dnd_2024") {
      if (Object.keys(race.abilityBonuses).length) blockers.push(`${race.name} 2024 ability bonusunu species üzerinden vermemeli.`);
      if (special2024.has(race.name)) warnings.push(`${race.name} species alt seçimleri Origin Builder içinde çözülmeli.`);
      if (level===1 && !levelRow?.features.includes("Eldritch Invocations")) blockers.push("2024 Eldritch Invocations level 1'de açılmalı.");
      if (level===2 && !levelRow?.features.includes("Magical Cunning")) blockers.push("2024 Magical Cunning level 2'de açılmalı.");
      if (level===3 && !levelRow?.features.includes("Subclass")) blockers.push("2024 subclass level 3'te açılmalı.");
      if (level===9 && !levelRow?.features.includes("Contact Patron")) blockers.push("2024 Contact Patron level 9'da açılmalı.");
      if (level===19 && !levelRow?.features.includes("Epic Boon")) blockers.push("2024 Epic Boon level 19'da açılmalı.");
    } else {
      if (race.subraces?.length) warnings.push(`${race.name} için subrace seçimi zorunlu tutulmalı.`);
      if (level===1 && !levelRow?.features.includes("Otherworldly Patron")) blockers.push("2014 patron level 1'de açılmalı.");
      if (level===2 && !levelRow?.features.includes("Eldritch Invocations")) blockers.push("2014 invocations level 2'de açılmalı.");
      if (level===3 && !levelRow?.features.includes("Pact Boon")) blockers.push("2014 Pact Boon level 3'te açılmalı.");
    }
    rows.push({ ruleset, raceId:race.id, raceName:race.name, subclassId:subclass.id, subclassName:subclass.name, level, ready:blockers.length===0, blockers, warnings, expected:{ pactSlotLevel:pact.slotLevel, pactSlots:pact.slots, cantrips:getWarlockCantripCount(level), knownSpells:getWarlockKnownSpellLimit(level,ruleset), preparedSpells:getWarlockPreparedSpellLimit(level,ruleset), invocationChoices:getInvocationChoiceCount("Warlock",level,ruleset), mysticArcanumLevels:getMysticArcanumSpellLevels(level), magicalCunningRecovery:getMagicalCunningRecovery(level,ruleset), subclassFeatures:subclass.features.filter((x)=>x.level<=level).map((x)=>x.name) } });
  }
  return rows;
}

export function summarizeWarlockCertification(rows: WarlockCertificationRow[]) {
  const blockerCount=rows.reduce((n,x)=>n+x.blockers.length,0); const warningCount=rows.reduce((n,x)=>n+x.warnings.length,0);
  return { ready: rows.length>0 && blockerCount===0 && rows.every((x)=>x.ready), scenarioCount:rows.length, blockerCount, warningCount };
}
