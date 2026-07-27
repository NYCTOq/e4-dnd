import type { SpeciesReference } from "../reference.types";
const source=(section:string)=>({publisher:"Wizards of the Coast" as const,document:"D&D Basic Rules 2024",section,ruleset:"dnd_2024" as const,verifiedAt:"2026-07-23"});
export const SPECIES_2024_REFERENCE:SpeciesReference[]=[
{id:"aasimar",name:"Aasimar",speed:30,sizeOptions:["Small","Medium"],source:source("Character Origins > Aasimar")},
{id:"dragonborn",name:"Dragonborn",speed:30,sizeOptions:["Medium"],source:source("Character Origins > Dragonborn")},
{id:"dwarf",name:"Dwarf",speed:30,sizeOptions:["Medium"],source:source("Character Origins > Dwarf")},
{id:"elf",name:"Elf",speed:30,sizeOptions:["Medium"],skillChoices:1,source:source("Character Origins > Elf")},
{id:"gnome",name:"Gnome",speed:30,sizeOptions:["Small"],source:source("Character Origins > Gnome")},
{id:"goliath",name:"Goliath",speed:35,sizeOptions:["Medium"],source:source("Character Origins > Goliath")},
{id:"halfling",name:"Halfling",speed:30,sizeOptions:["Small"],fixedSkills:["Stealth"],source:source("Character Origins > Halfling")},
{id:"human",name:"Human",speed:30,sizeOptions:["Small","Medium"],skillChoices:1,originFeatChoices:1,source:source("Character Origins > Human")},
{id:"orc",name:"Orc",speed:30,sizeOptions:["Medium"],source:source("Character Origins > Orc")},
{id:"tiefling",name:"Tiefling",speed:30,sizeOptions:["Small","Medium"],source:source("Character Origins > Tiefling")},
];
