import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndSpellData } from "./ruleset.types";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "./spellExpansion";
import { combineActiveControlEffects, getControlSpellRuntime } from "./spellControlRules";
import { addSpellEffect, createSpellEffect, removeEffectsBrokenByDamage } from "./spellEffectRules";
import { getSpellRuntimePlan } from "./globalSpellRuntime";

function load(edition:"dnd_2014"|"dnd_2024") {
  const base=JSON.parse(readFileSync(`public/data/${edition}/spells.json`,"utf8")) as DndSpellData[];
  const expansion=edition==="dnd_2024"?SPELL_EXPANSION_2024:SPELL_EXPANSION_2014;
  return [...base,...expansion.filter(candidate=>!base.some(existing=>existing.id===candidate.id))];
}
const find=(spells:DndSpellData[],name:string)=>{const spell=spells.find(item=>item.name===name);if(!spell)throw new Error(`${name} missing`);return spell};

describe("official control and concentration spell runtime",()=>{
  it("models Bless and Bane targets and d4 modifiers",()=>{
    const spells=load("dnd_2024");
    const bless=getControlSpellRuntime(find(spells,"Bless"),"dnd_2024",3)!;
    const bane=getControlSpellRuntime(find(spells,"Bane"),"dnd_2024",2)!;
    expect(bless).toMatchObject({targetCount:5,conditions:["Blessed"],attackRollBonusDice:"1d4",savingThrowBonusDice:"1d4"});
    expect(bane).toMatchObject({targetCount:4,saveAbility:"cha",attackRollPenaltyDice:"1d4",savingThrowPenaltyDice:"1d4"});
    expect(find(spells,"Bane").classes).toEqual(["Bard","Cleric","Warlock"]);
  });

  it("models hold spells with end-of-turn repeat saves and upcast targets",()=>{
    for(const edition of ["dnd_2014","dnd_2024"] as const){
      const spells=load(edition);
      const hold=getControlSpellRuntime(find(spells,"Hold Person"),edition,4)!;
      expect(hold).toMatchObject({targetCount:3,saveAbility:"wis",conditions:["Paralyzed"],repeatSave:true,repeatSaveTiming:"end-of-turn"});
      const plan=getSpellRuntimePlan(find(spells,"Hold Person"),8,4,edition);
      expect(plan).toMatchObject({resolution:"saving-throw",saveAbility:"wis",concentration:true,repeatSave:true});
    }
  });

  it("models Blindness/Deafness as non-concentration with choice and repeat save",()=>{
    const spells=load("dnd_2024");
    const spell=find(spells,"Blindness/Deafness");
    const runtime=getControlSpellRuntime(spell,"dnd_2024",5)!;
    expect(spell).toMatchObject({school:"Transmutation",range:"120 feet",concentration:false});
    expect(runtime).toMatchObject({targetCount:4,saveAbility:"con",conditionChoice:["Blinded","Deafened"],repeatSave:true,repeatSaveTiming:"end-of-turn"});
  });

  it("models Web, Haste, Slow and Hypnotic Pattern persistent mechanics",()=>{
    const spells=load("dnd_2024");
    expect(getControlSpellRuntime(find(spells,"Web"),"dnd_2024",2)).toMatchObject({conditions:["Restrained"],difficultTerrain:true,repeatSaveTiming:"enter-or-start"});
    expect(getControlSpellRuntime(find(spells,"Haste"),"dnd_2024",3)).toMatchObject({armorClassBonus:2,speedMultiplier:2,dexteritySaveAdvantage:true,extraLimitedAction:true,lethargyOnEnd:true});
    expect(getControlSpellRuntime(find(spells,"Slow"),"dnd_2024",3)).toMatchObject({targetCount:6,saveAbility:"wis",armorClassPenalty:2,speedMultiplier:.5,repeatSaveTiming:"end-of-turn"});
    expect(find(spells,"Slow").classes).toEqual(["Bard","Sorcerer","Wizard"]);
    expect(getControlSpellRuntime(find(spells,"Hypnotic Pattern"),"dnd_2024",3)).toMatchObject({conditions:["Charmed","Incapacitated"],speedBecomesZero:true,endOnDamage:true,endOnAllyAction:true});
  });

  it("creates structured effects and replaces prior concentration",()=>{
    const spells=load("dnd_2024");
    const bless=createSpellEffect(find(spells,"Bless"),"dnd_2024",1)!;
    const haste=createSpellEffect(find(spells,"Haste"),"dnd_2024",3)!;
    const blindness=createSpellEffect(find(spells,"Blindness/Deafness"),"dnd_2024",2)!;
    expect(bless).toMatchObject({remainingRounds:10,concentration:true,conditions:["Blessed"],attackRollBonusDice:"1d4"});
    expect(haste).toMatchObject({armorClassBonus:2,extraLimitedAction:true,lethargyOnEnd:true});
    expect(blindness).toMatchObject({remainingRounds:10,concentration:false,conditionChoice:["Blinded","Deafened"]});
    expect(addSpellEffect([bless],haste).map(effect=>effect.spellId)).toEqual(["haste"]);
    expect(addSpellEffect([haste],blindness).map(effect=>effect.spellId)).toEqual(["haste","blindness-deafness-2024"]);
  });

  it("ends Hypnotic Pattern on damage without removing unrelated effects",()=>{
    const spells=load("dnd_2024");
    const pattern=createSpellEffect(find(spells,"Hypnotic Pattern"),"dnd_2024",3)!;
    const blindness=createSpellEffect(find(spells,"Blindness/Deafness"),"dnd_2024",2)!;
    expect(removeEffectsBrokenByDamage([pattern,blindness]).map(effect=>effect.name)).toEqual(["Blindness/Deafness"]);
  });

  it("combines persistent numeric modifiers deterministically",()=>{
    const combined=combineActiveControlEffects([
      {attackRollBonusDice:"1d4",savingThrowBonusDice:"1d4"},
      {armorClassBonus:2,speedMultiplier:2,dexteritySaveAdvantage:true,extraLimitedAction:true},
      {armorClassPenalty:2,speedMultiplier:.5,attackRollPenaltyDice:"1d4"},
    ]);
    expect(combined).toEqual({
      attackRollBonusDice:["1d4"],savingThrowBonusDice:["1d4"],attackRollPenaltyDice:["1d4"],savingThrowPenaltyDice:[],
      armorClassBonus:2,armorClassPenalty:2,speedMultiplier:1,dexteritySaveAdvantage:true,extraLimitedAction:true,difficultTerrain:false,
    });
  });
});
