import type { DndClassData, DndRaceData, DndSubclassData } from "./ruleset.types";
import { getArcaneRecoveryBudget, getWizardCantripCount, getWizardMaxSpellLevel, getWizardPreparedSpellLimit, getWizardSpellbookMinimum, getWizardSubclassFeatureLevels, getWizardSubclassLevel, type WizardEdition } from "./wizardRules";

export type WizardCertificationRow = {
  ruleset: WizardEdition; raceId:string; raceName:string; subclassId:string; subclassName:string; level:number; ready:boolean; blockers:string[]; warnings:string[];
  expected:{ cantrips:number; preparedSpells:number; spellbookMinimum:number; arcaneRecoveryBudget:number; maxSpellLevel:number; subclassFeatures:string[] };
};

const expected2014 = new Set(["School of Evocation","School of Abjuration","School of Conjuration","School of Divination","School of Enchantment","School of Illusion","School of Necromancy","School of Transmutation","Bladesinging","War Magic","Order of Scribes","Chronurgy Magic","Graviturgy Magic"]);
const expected2024 = new Set(["Abjurer","Diviner","Evoker","Illusionist"]);
const special2024 = new Set(["Human","Dragonborn","Elf","Gnome","Goliath","Tiefling","Aasimar"]);

export function certifyWizardBuilder(ruleset:WizardEdition,wizard:DndClassData,races:DndRaceData[],subclasses:DndSubclassData[]):WizardCertificationRow[]{
  const manifest=ruleset==="dnd_2024"?expected2024:expected2014;
  const subclassLevel=getWizardSubclassLevel(ruleset); const featureLevels=getWizardSubclassFeatureLevels(ruleset);
  const available=subclasses.filter((x)=>x.className.toLowerCase()==="wizard"&&x.ruleset===ruleset);
  const rows:WizardCertificationRow[]=[];
  for(const race of races) for(const subclass of available) for(let level=1;level<=20;level+=1){
    const blockers:string[]=[]; const warnings:string[]=[]; const levelRow=wizard.levels.find((x)=>x.level===level);
    if(!levelRow) blockers.push(`Level ${level} progression satırı eksik.`);
    if(wizard.hitDie!==6) blockers.push("Wizard Hit Die d6 olmalı.");
    if(!wizard.savingThrows.includes("int")||!wizard.savingThrows.includes("wis")) blockers.push("INT/WIS saving throw proficiency eksik.");
    if(wizard.spellcastingAbility!=="int") blockers.push("Wizard spellcasting ability INT olmalı.");
    if(wizard.skillChoices.choose!==2) blockers.push("Wizard iki skill seçebilmeli.");
    if(wizard.spellProgression!=="full") blockers.push("Wizard full-caster progression kullanmalı.");
    if(wizard.armorProficiencies.length!==0) blockers.push("Wizard temel armor proficiency almamalı.");
    if(wizard.subclassLevel!==subclassLevel||subclass.selectionLevel!==subclassLevel) blockers.push(`Subclass seçimi level ${subclassLevel} olmalı.`);
    if(!manifest.has(subclass.name)) blockers.push(`${subclass.name} edition subclass manifestinde tanımlı değil.`);
    for(const required of featureLevels) if(!subclass.features.some((x)=>x.level===required)) blockers.push(`${subclass.name} level ${required} özelliği eksik.`);
    if(level<subclassLevel&&subclass.features.some((x)=>x.level<=level)) blockers.push("Subclass özelliği seçim seviyesinden önce açılıyor.");
    if(!levelRow?.spellSlots?.length) blockers.push(`Level ${level} spell slot progression eksik.`);
    if(ruleset==="dnd_2024"){
      if(Object.keys(race.abilityBonuses).length) blockers.push(`${race.name} 2024 ability bonusunu species üzerinden vermemeli.`);
      if(special2024.has(race.name)) warnings.push(`${race.name} species alt seçimleri Origin Builder içinde çözülmeli.`);
      if(!wizard.weaponProficiencies.some((x)=>x.toLowerCase()==="simple weapons")) blockers.push("2024 Wizard Simple Weapons proficiency kullanmalı.");
      if(!wizard.skillChoices.from.includes("Nature")) blockers.push("2024 Wizard skill listesinde Nature bulunmalı.");
      if(level===1&&!levelRow?.features.includes("Ritual Adept")) blockers.push("2024 Ritual Adept level 1'de açılmalı.");
      if(level===2&&!levelRow?.features.includes("Scholar")) blockers.push("2024 Scholar level 2'de açılmalı.");
      if(level===3&&!levelRow?.features.includes("Subclass")) blockers.push("2024 subclass level 3'te açılmalı.");
      if(level===5&&!levelRow?.features.includes("Memorize Spell")) blockers.push("2024 Memorize Spell level 5'te açılmalı.");
      if(level===19&&!levelRow?.features.includes("Epic Boon")) blockers.push("2024 Epic Boon level 19'da açılmalı.");
    }else{
      if(race.subraces?.length) warnings.push(`${race.name} için subrace seçimi zorunlu tutulmalı.`);
      const weapons=["daggers","darts","slings","quarterstaffs","light crossbows"];
      for(const weapon of weapons) if(!wizard.weaponProficiencies.some((x)=>x.toLowerCase()===weapon)) blockers.push(`2014 Wizard ${weapon} proficiency eksik.`);
      if(level===1&&!levelRow?.features.includes("Arcane Recovery")) blockers.push("2014 Arcane Recovery level 1'de açılmalı.");
      if(level===2&&!levelRow?.features.includes("Arcane Tradition")) blockers.push("2014 Arcane Tradition level 2'de açılmalı.");
    }
    if(level===18&&!levelRow?.features.includes("Spell Mastery")) blockers.push("Spell Mastery level 18'de açılmalı.");
    if(level===20&&!levelRow?.features.includes("Signature Spells")) blockers.push("Signature Spells level 20'de açılmalı.");
    rows.push({ruleset,raceId:race.id,raceName:race.name,subclassId:subclass.id,subclassName:subclass.name,level,ready:blockers.length===0,blockers,warnings,expected:{cantrips:getWizardCantripCount(level),preparedSpells:getWizardPreparedSpellLimit(level,ruleset,3),spellbookMinimum:getWizardSpellbookMinimum(level),arcaneRecoveryBudget:getArcaneRecoveryBudget(level),maxSpellLevel:getWizardMaxSpellLevel(level),subclassFeatures:subclass.features.filter((x)=>x.level<=level).map((x)=>x.name)}});
  }
  return rows;
}

export function summarizeWizardCertification(rows:WizardCertificationRow[]){const blockerCount=rows.reduce((n,x)=>n+x.blockers.length,0);const warningCount=rows.reduce((n,x)=>n+x.warnings.length,0);return{ready:rows.length>0&&blockerCount===0&&rows.every((x)=>x.ready),scenarioCount:rows.length,blockerCount,warningCount};}
