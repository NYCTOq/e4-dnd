import type { SpeciesReference } from "../reference.types";
const source=(section:string)=>({publisher:"Wizards of the Coast" as const,document:"System Reference Document 5.1",section,ruleset:"dnd_2014" as const,verifiedAt:"2026-07-23"});
export const RACES_2014_REFERENCE:SpeciesReference[]=[
{id:"human",name:"Human",speed:30,sizeOptions:["Medium"],languageChoices:1,source:source("Races > Human")},
{id:"dwarf",name:"Dwarf",speed:25,sizeOptions:["Medium"],source:source("Races > Dwarf")},
{id:"elf",name:"Elf",speed:30,sizeOptions:["Medium"],fixedSkills:["Perception"],source:source("Races > Elf")},
{id:"halfling",name:"Halfling",speed:25,sizeOptions:["Small"],source:source("Races > Halfling")},
{id:"dragonborn",name:"Dragonborn",speed:30,sizeOptions:["Medium"],source:source("Races > Dragonborn")},
{id:"gnome",name:"Gnome",speed:25,sizeOptions:["Small"],source:source("Races > Gnome")},
{id:"half-elf",name:"Half-Elf",speed:30,sizeOptions:["Medium"],skillChoices:2,languageChoices:1,source:source("Races > Half-Elf")},
{id:"half-orc",name:"Half-Orc",speed:30,sizeOptions:["Medium"],fixedSkills:["Intimidation"],source:source("Races > Half-Orc")},
{id:"tiefling",name:"Tiefling",speed:30,sizeOptions:["Medium"],source:source("Races > Tiefling")},
];
