import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AbilityScores } from "../character/character.types";
import type { DndClassData } from "./ruleset.types";
import { getSpellcastingProfile } from "./spellcastingRules";
import { SUBCLASS_EXPANSION_2014 } from "./subclassExpansion";

const abilities: AbilityScores = {str:10,dex:16,con:14,int:16,wis:12,cha:16};
const load=(edition:"dnd_2014"|"dnd_2024")=>JSON.parse(readFileSync(`public/data/${edition}/classes.json`,"utf8")) as DndClassData[];
const klass=(edition:"dnd_2014"|"dnd_2024",name:string)=>load(edition).find(item=>item.name===name)!;

describe("builder spell integration closure",()=>{
  it("connects 2024 fixed prepared-spell tables to the shared Builder profile",()=>{
    expect(getSpellcastingProfile(klass("dnd_2024","Sorcerer"),17,abilities,"dnd_2024")).toMatchObject({cantripLimit:6,knownSpellLimit:null,preparedSpellLimit:19});
    expect(getSpellcastingProfile(klass("dnd_2024","Warlock"),9,abilities,"dnd_2024")).toMatchObject({cantripLimit:3,knownSpellLimit:null,preparedSpellLimit:10,pactMagic:true});
    expect(getSpellcastingProfile(klass("dnd_2024","Wizard"),14,abilities,"dnd_2024")).toMatchObject({cantripLimit:5,preparedSpellLimit:18});
    expect(getSpellcastingProfile(klass("dnd_2024","Wizard"),20,abilities,"dnd_2024")).toMatchObject({preparedSpellLimit:25});
  });

  it("supports Arcane Trickster and Eldritch Knight third-caster profiles",()=>{
    const rogue=klass("dnd_2014","Rogue");
    const fighter=klass("dnd_2014","Fighter");
    expect(getSpellcastingProfile(rogue,17,abilities,"dnd_2014","Arcane Trickster")).toMatchObject({cantripLimit:4,knownSpellLimit:11,spellListClass:"wizard",maxSpellLevel:3});
    expect(getSpellcastingProfile(fighter,20,abilities,"dnd_2014","Eldritch Knight")).toMatchObject({cantripLimit:3,knownSpellLimit:13,spellListClass:"wizard",maxSpellLevel:4});
  });

  it("registers both 2014 third-caster subclasses in the merged catalog",()=>{
    expect(SUBCLASS_EXPANSION_2014.some(item=>item.name==="Arcane Trickster"&&item.className==="Rogue")).toBe(true);
    expect(SUBCLASS_EXPANSION_2014.some(item=>item.name==="Eldritch Knight"&&item.className==="Fighter")).toBe(true);
  });
});
