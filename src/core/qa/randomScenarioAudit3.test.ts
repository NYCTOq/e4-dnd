import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { AbilityScores } from '../character/character.types';
import type { DndClassData,DndRaceData,DndSubclassData } from '../rulesets/ruleset.types';
import { SUBCLASS_EXPANSION_2014,SUBCLASS_EXPANSION_2024 } from '../rulesets/subclassExpansion';
import { getSpellcastingProfile } from '../rulesets/spellcastingRules';
import { getGeneralFeatSlotCount } from '../rulesets/featRules';
import { certifySubclassRuntime } from '../rulesets/classSubclassRuntimeClosure';

const load=<T,>(p:string)=>JSON.parse(readFileSync(p,'utf8')) as T;
const ability:AbilityScores={str:10,dex:16,con:14,int:16,wis:16,cha:16};
const scenarios=[
['dnd_2014','Human','Barbarian',9,'Path of the Totem Warrior'],['dnd_2024','Dragonborn','Barbarian',20,'Path of the World Tree'],
['dnd_2014','Dwarf','Bard',6,'College of Lore'],['dnd_2024','Aasimar','Bard',3,'College of Dance'],
['dnd_2014','High Elf','Cleric',17,'Arcana Domain'],['dnd_2024','Human','Cleric',7,'Light Domain'],
['dnd_2014','Forest Gnome','Druid',14,'Circle of Dreams'],['dnd_2024','Orc','Druid',5,'Circle of the Sea'],
['dnd_2014','Half-Orc','Fighter',18,'Champion'],['dnd_2024','Halfling','Fighter',11,'Eldritch Knight'],
['dnd_2014','Wood Elf','Monk',11,'Way of the Kensei'],['dnd_2024','Goliath','Monk',17,'Warrior of the Elements'],
['dnd_2014','Tiefling','Paladin',15,'Oath of Vengeance'],['dnd_2024','Dwarf','Paladin',9,'Oath of Glory'],
['dnd_2014','Human','Ranger',7,'Gloom Stalker'],['dnd_2024','Elf','Ranger',20,'Fey Wanderer'],
['dnd_2014','Lightfoot Halfling','Rogue',9,'Swashbuckler'],['dnd_2024','Human','Rogue',3,'Soulknife'],
['dnd_2014','Half-Elf','Sorcerer',14,'Divine Soul'],['dnd_2024','Gnome','Sorcerer',10,'Aberrant Sorcery'],
['dnd_2014','Dragonborn','Warlock',6,'The Celestial'],['dnd_2024','Tiefling','Warlock',14,'Archfey Patron'],
['dnd_2014','Rock Gnome','Wizard',6,'School of Divination'],['dnd_2024','Human','Wizard',17,'Abjurer'],
['dnd_2014','Elf','Rogue',19,'Arcane Trickster'],['dnd_2014','Dwarf','Fighter',13,'Eldritch Knight'],
['dnd_2024','Dragonborn','Sorcerer',6,'Clockwork Sorcery'],['dnd_2014','Tiefling','Warlock',17,'The Genie'],
['dnd_2024','Aasimar','Wizard',19,'Diviner'],['dnd_2014','Half-Orc','Cleric',10,'Grave Domain'],
] as const;

describe('third alternative 30 official audit',()=>{
 it('builds every requested race, class and subclass without catalog blockers',()=>{
  const reports=scenarios.map(([ed,raceName,className,level,subclassName])=>{
   const classes=load<DndClassData[]>(`public/data/${ed}/classes.json`);
   const races=load<DndRaceData[]>(`public/data/${ed}/races.json`);
   const base=load<DndSubclassData[]>(`public/data/${ed}/subclasses.json`);
   const expansion=ed==='dnd_2014'?SUBCLASS_EXPANSION_2014:SUBCLASS_EXPANSION_2024;
   const subclasses=[...base,...expansion.filter(x=>!base.some(y=>y.id===x.id))];
   const normalized=raceName.toLowerCase();
   const race=races.find(x=>x.name.toLowerCase()===normalized)||races.find(x=>x.subraces?.some(s=>s.name.toLowerCase()===normalized||`${s.name} ${x.name}`.toLowerCase()===normalized));
   const klass=classes.find(x=>x.name===className);
   const subclass=subclasses.find(x=>x.className===className&&x.name===subclassName);
   const profile=klass?getSpellcastingProfile(klass,level,ability,ed,subclassName):null;
   const runtime=subclass?certifySubclassRuntime(subclass):null;
   const issues:string[]=[];
   if(!race)issues.push('race/species missing');
   if(!klass)issues.push('class missing');
   if(!subclass)issues.push('subclass missing');
   if(subclass&&level<subclass.selectionLevel)issues.push('subclass selected too early');
   if(runtime?.blocked)issues.push(`${runtime.blocked} blocked runtime features`);
   return {ed,raceName,className,level,subclassName,featSlots:getGeneralFeatSlotCount(level,className,ed),profile,issues};
  });
  expect(reports).toHaveLength(30);
  expect(reports.filter(x=>x.issues.length)).toEqual([]);
  const ek=reports.find(x=>x.ed==='dnd_2024'&&x.subclassName==='Eldritch Knight');
  expect(ek?.profile).toMatchObject({spellListClass:'wizard',knownSpellLimit:null,preparedSpellLimit:8,maxSpellLevel:2});
 });
});
