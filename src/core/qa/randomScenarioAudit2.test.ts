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

const load=<T,>(p:string)=>JSON.parse(readFileSync(p,'utf8')) as T;
const ability:AbilityScores={str:10,dex:16,con:14,int:16,wis:16,cha:16};
const scenarios=[
['dnd_2014','Dwarf','Barbarian',3,'Path of the Berserker'],
['dnd_2024','Elf','Barbarian',15,'Path of the Berserker'],
['dnd_2014','Tiefling','Bard',3,'College of Valor'],
['dnd_2024','Human','Bard',18,'College of Lore'],
['dnd_2014','Halfling','Cleric',8,'Life Domain'],
['dnd_2024','Dragonborn','Cleric',14,'War Domain'],
['dnd_2014','Half-Elf','Druid',6,'Circle of the Land'],
['dnd_2024','Gnome','Druid',12,'Circle of the Moon'],
['dnd_2014','Dragonborn','Fighter',11,'Battle Master'],
['dnd_2024','Dwarf','Fighter',3,'Champion'],
['dnd_2014','Human','Monk',14,'Way of the Open Hand'],
['dnd_2024','Orc','Monk',5,'Warrior of Shadow'],
['dnd_2014','Half-Orc','Paladin',7,'Oath of Devotion'],
['dnd_2024','Aasimar','Paladin',20,'Oath of the Ancients'],
['dnd_2014','Wood Elf','Ranger',5,'Beast Master'],
['dnd_2024','Goliath','Ranger',13,'Hunter'],
['dnd_2014','Lightfoot Halfling','Rogue',3,'Thief'],
['dnd_2024','Tiefling','Rogue',18,'Assassin'],
['dnd_2014','Dragonborn','Sorcerer',6,'Draconic Bloodline'],
['dnd_2024','Human','Sorcerer',3,'Wild Magic Sorcery'],
['dnd_2014','Gnome','Warlock',11,'The Fiend'],
['dnd_2024','Elf','Warlock',17,'Great Old One Patron'],
['dnd_2014','High Elf','Wizard',2,'School of Abjuration'],
['dnd_2024','Dwarf','Wizard',10,'Illusionist'],
['dnd_2014','Tiefling','Rogue',13,'Arcane Trickster'],
['dnd_2014','Human','Fighter',7,'Eldritch Knight'],
['dnd_2024','Halfling','Sorcerer',20,'Clockwork Sorcery'],
['dnd_2014','Half-Elf','Warlock',14,'The Hexblade'],
['dnd_2024','Dragonborn','Wizard',3,'Evoker'],
['dnd_2014','Dwarf','Cleric',20,'Tempest Domain'],
] as const;

describe('alternative 30 official audit',()=>{
 it('prints report',()=>{
  const reports=[];
  for(const [ed,raceName,className,level,subclassName] of scenarios){
   const classes=load<DndClassData[]>(`public/data/${ed}/classes.json`);
   const races=load<DndRaceData[]>(`public/data/${ed}/races.json`);
   const baseSubs=load<DndSubclassData[]>(`public/data/${ed}/subclasses.json`);
   const spells=load<DndSpellData[]>(`public/data/${ed}/spells.json`);
   const expansion=ed==='dnd_2014'?SUBCLASS_EXPANSION_2014:SUBCLASS_EXPANSION_2024;
   const subclasses=[...baseSubs,...expansion.filter(x=>!baseSubs.some(y=>y.id===x.id))];
   const klass=classes.find(x=>x.name===className);
   const normalizedRaceName=raceName.toLowerCase();
   const race=races.find(x=>x.name.toLowerCase()===normalizedRaceName)||races.find(x=>x.subraces?.some(subrace=>subrace.name.toLowerCase()===normalizedRaceName||`${subrace.name} ${x.name}`.toLowerCase()===normalizedRaceName));
   const subclass=subclasses.find(x=>x.className===className&&x.name===subclassName);
   const generic=klass?getSpellcastingProfile(klass,level,ability,ed,subclassName):null;
   const highest=generic?.maxSpellLevel??(klass?getHighestSpellLevel(klass,level):0);
   const spellListClass=generic?.spellListClass??className.toLowerCase();
   const available=spells.filter(s=>s.classes.some(n=>n.toLowerCase()===spellListClass.toLowerCase())&&s.level<=highest);
   const runtime=subclass?certifySubclassRuntime(subclass):null;
   const issues:string[]=[];
   if(!race)issues.push('Race/species exact catalog name missing');
   if(!klass)issues.push('Class missing');
   if(!subclass)issues.push('Subclass missing');
   if(subclass&&level<subclass.selectionLevel)issues.push(`Subclass before selection level ${subclass.selectionLevel}`);
   if(runtime?.blocked)issues.push(`${runtime.blocked} runtime blocked`);
   reports.push({ed,raceName,className,level,subclassName,exists:{race:!!race,class:!!klass,subclass:!!subclass},selectionLevel:subclass?.selectionLevel,featSlots:getGeneralFeatSlotCount(level,className,ed),spell:generic,highestSpellLevel:highest,availableClassSpells:available.length,features:{class:klass?.levels.filter(r=>r.level<=level).flatMap(r=>r.features)??[],subclass:getUnlockedSubclassFeatures(subclass,level).map(x=>x.name)},runtime:runtime?{status:runtime.status,score:runtime.score,automatic:runtime.automatic,guided:runtime.guided,tableRuling:runtime.tableRuling,blocked:runtime.blocked,warnings:runtime.warnings}:null,issues,status:issues.length?'FAIL':'PASS'});
  }
  console.log('AUDIT2_JSON='+JSON.stringify(reports));
  expect(reports).toHaveLength(30);
  expect(reports.filter(report=>report.issues.length>0)).toEqual([]);
 });
});
