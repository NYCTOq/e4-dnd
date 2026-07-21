import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import type { AbilityScores } from '../character/character.types';
import type { DndClassData,DndRaceData,DndSpellData,DndSubclassData } from '../rulesets/ruleset.types';
import { SUBCLASS_EXPANSION_2014,SUBCLASS_EXPANSION_2024 } from '../rulesets/subclassExpansion';
import { getGeneralFeatSlotCount } from '../rulesets/featRules';
import { getSpellcastingProfile } from '../rulesets/spellcastingRules';
import { getHighestSpellLevel } from '../rulesets/spellRules';
import { getUnlockedSubclassFeatures } from '../rulesets/subclassRules';
import { certifySubclassRuntime } from '../rulesets/classSubclassRuntimeClosure';
import { getBardCantripCount,getBardSpellLimit } from '../rulesets/bardRules';
import { getClericCantripCount,getClericPreparedSpellLimit } from '../rulesets/clericRules';
import { getDruidCantripCount,getDruidPreparedSpellLimit } from '../rulesets/druidRules';
import { getPaladinPreparedSpellLimit } from '../rulesets/paladinRules';
import { getRangerKnownSpellLimit,getRangerPreparedSpellLimit } from '../rulesets/rangerRules';
import { getSorcererCantripCount,getSorcererKnownSpellLimit,getSorcererPreparedSpellLimit } from '../rulesets/sorcererRules';
import { getWarlockCantripCount,getWarlockKnownSpellLimit,getWarlockPreparedSpellLimit } from '../rulesets/warlockRules';
import { getWizardCantripCount,getWizardPreparedSpellLimit,getWizardSpellbookMinimum } from '../rulesets/wizardRules';

const load=<T,>(p:string)=>JSON.parse(readFileSync(p,'utf8')) as T;
const ability:AbilityScores={str:10,dex:16,con:14,int:16,wis:16,cha:16};
const scenarios=[
['dnd_2014','Elf','Wizard',8,'School of Evocation'],['dnd_2024','Dwarf','Barbarian',4,'Path of the Berserker'],['dnd_2014','Half-Elf','Bard',12,'College of Lore'],['dnd_2024','Goliath','Fighter',7,'Battle Master'],['dnd_2014','Tiefling','Sorcerer',16,'Wild Magic'],['dnd_2024','Human','Cleric',3,'Life Domain'],['dnd_2014','Half-Orc','Rogue',10,'Assassin'],['dnd_2024','Aasimar','Paladin',6,'Oath of Devotion'],['dnd_2014','Dwarf','Cleric',18,'Tempest Domain'],['dnd_2024','Elf','Wizard',14,'Diviner'],['dnd_2014','Human','Fighter',5,'Champion'],['dnd_2024','Orc','Ranger',11,'Beast Master'],['dnd_2014','Gnome','Wizard',3,'School of Illusion'],['dnd_2024','Tiefling','Warlock',9,'Fiend Patron'],['dnd_2014','Dragonborn','Paladin',20,'Oath of the Ancients'],['dnd_2024','Halfling','Rogue',5,'Thief'],['dnd_2014','Elf','Druid',9,'Circle of the Moon'],['dnd_2024','Dragonborn','Sorcerer',17,'Draconic Sorcery'],['dnd_2014','Human','Monk',6,'Way of Shadow'],['dnd_2024','Gnome','Bard',10,'College of Valor'],['dnd_2014','Halfling','Ranger',4,'Hunter'],['dnd_2024','Dwarf','Cleric',19,'War Domain'],['dnd_2014','Tiefling','Warlock',14,'The Great Old One'],['dnd_2024','Human','Monk',8,'Warrior of the Open Hand'],['dnd_2014','Half-Elf','Sorcerer',1,'Draconic Bloodline'],['dnd_2024','Elf','Druid',3,'Circle of the Land'],['dnd_2014','Half-Orc','Barbarian',13,'Path of the Totem Warrior'],['dnd_2024','Aasimar','Wizard',20,'Evoker'],['dnd_2014','Gnome','Rogue',17,'Arcane Trickster'],['dnd_2024','Goliath','Fighter',20,'Champion'],
] as const;

function expectedSpell(className:string, level:number, ed:'dnd_2014'|'dnd_2024', subclassName=''){
 const c=className.toLowerCase();
 if(c==='bard') return {cantrips:getBardCantripCount(level),known:ed==='dnd_2014'?getBardSpellLimit(level,ed):null,prepared:ed==='dnd_2024'?getBardSpellLimit(level,ed):null};
 if(c==='cleric') return {cantrips:getClericCantripCount(level),known:null,prepared:getClericPreparedSpellLimit(level,ed,3)};
 if(c==='druid') return {cantrips:getDruidCantripCount(level,ed),known:null,prepared:getDruidPreparedSpellLimit(level,ed,3)};
 if(c==='paladin') return {cantrips:0,known:null,prepared:getPaladinPreparedSpellLimit(level,ed,3)};
 if(c==='ranger') return {cantrips:0,known:ed==='dnd_2014'?getRangerKnownSpellLimit(level,ed):null,prepared:ed==='dnd_2024'?getRangerPreparedSpellLimit(level,ed):null};
 if(c==='sorcerer') return {cantrips:getSorcererCantripCount(level,ed),known:ed==='dnd_2014'?getSorcererKnownSpellLimit(level,ed):null,prepared:ed==='dnd_2024'?getSorcererPreparedSpellLimit(level,ed):null};
 if(c==='warlock') return {cantrips:getWarlockCantripCount(level),known:ed==='dnd_2014'?getWarlockKnownSpellLimit(level,ed):null,prepared:ed==='dnd_2024'?getWarlockPreparedSpellLimit(level,ed):null};
 if(c==='wizard') return {cantrips:getWizardCantripCount(level),known:null,prepared:getWizardPreparedSpellLimit(level,ed,3),spellbook:getWizardSpellbookMinimum(level)};
 if(c==='rogue'&&subclassName==='Arcane Trickster') return {cantrips:level>=10?4:level>=3?3:0,known:level>=3?[0,0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13][level]:0,prepared:null};
 if(c==='fighter'&&subclassName==='Eldritch Knight') return {cantrips:level>=10?3:level>=3?2:0,known:level>=3?[0,0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13][level]:0,prepared:null};
 return {cantrips:0,known:0,prepared:0};
}

describe('30 random scenario audit',()=>{
 it('builds a portable machine audit report',()=>{
  const reports=[];
  for(const [ed,raceName,className,level,subclassName] of scenarios){
   const classes=load<DndClassData[]>(`public/data/${ed}/classes.json`);
   const races=load<DndRaceData[]>(`public/data/${ed}/races.json`);
   const baseSubs=load<DndSubclassData[]>(`public/data/${ed}/subclasses.json`);
   const spells=load<DndSpellData[]>(`public/data/${ed}/spells.json`);
   const expansion=ed==='dnd_2014'?SUBCLASS_EXPANSION_2014:SUBCLASS_EXPANSION_2024;
   const subclasses=[...baseSubs,...expansion.filter(x=>!baseSubs.some(y=>y.id===x.id))];
   const klass=classes.find(x=>x.name===className)!;
   const race=races.find(x=>x.name===raceName);
   const subclass=subclasses.find(x=>x.className===className&&x.name===subclassName);
   const generic=klass?getSpellcastingProfile(klass,level,ability,ed,subclassName):null;
   const expected=expectedSpell(className,level,ed,subclassName);
   const highest=generic?.maxSpellLevel ?? (klass?getHighestSpellLevel(klass,level):0);
   const spellListClass=generic?.spellListClass ?? className.toLowerCase();
   const available=spells.filter(s=>s.classes.some(n=>n.toLowerCase()===spellListClass.toLowerCase())&&s.level<=highest);
   const runtime=subclass?certifySubclassRuntime(subclass):null;
   const issues:string[]=[];
   if(!race)issues.push('Race/species katalogda bulunamadı');
   if(!klass)issues.push('Class katalogda bulunamadı');
   if(!subclass)issues.push('Subclass katalogda bulunamadı');
   if(subclass&&level<subclass.selectionLevel)issues.push(`Subclass level ${subclass.selectionLevel} öncesinde seçilmiş`);
   if(generic){
    if(generic.cantripLimit!==expected.cantrips)issues.push(`Builder cantrip limiti ${generic.cantripLimit}, beklenen ${expected.cantrips}`);
    if(generic.knownSpellLimit!==expected.known)issues.push(`Builder known spell limiti ${String(generic.knownSpellLimit)}, beklenen ${String(expected.known)}`);
    if(generic.preparedSpellLimit!==expected.prepared)issues.push(`Builder prepared spell limiti ${String(generic.preparedSpellLimit)}, beklenen ${String(expected.prepared)}`);
   }
   if(runtime?.blocked)issues.push(`${runtime.blocked} subclass runtime özelliği blocked`);
   reports.push({ed,raceName,className,level,subclassName,exists:{race:!!race,class:!!klass,subclass:!!subclass},subclassSelectionLevel:subclass?.selectionLevel,featSlots:getGeneralFeatSlotCount(level,className,ed),spell:{builder:generic,expected,highestSpellLevel:highest,availableClassSpells:available.length},features:{class:klass?.levels.filter(r=>r.level<=level).flatMap(r=>r.features)??[],subclass:getUnlockedSubclassFeatures(subclass,level).map(x=>x.name)},runtime:runtime?{status:runtime.status,score:runtime.score,automatic:runtime.automatic,guided:runtime.guided,tableRuling:runtime.tableRuling,blocked:runtime.blocked,warnings:runtime.warnings}:null,issues,status:issues.length?'FAIL':'PASS'});
  }
  const serializedReport=JSON.stringify(reports,null,2);
  expect(reports).toHaveLength(30);
  expect(JSON.parse(serializedReport)).toHaveLength(30);
  expect(reports.filter((report) => report.issues.length > 0)).toEqual([]);
 });
});
