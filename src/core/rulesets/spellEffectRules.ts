import type { CharacterSpellEffect, RulesetId } from "../character/character.types";
import type { DndSpellData } from "./ruleset.types";
import { getControlSpellRuntime } from "./spellControlRules";

export function getSpellDurationRounds(duration:string){const text=duration.trim().toLowerCase();if(text==="1 round")return 1;const match=text.match(/(?:concentration,\s*)?(?:up to )?(\d+)\s*(minute|minutes|hour|hours)/);if(!match)return null;const value=Number(match[1]);return match[2].startsWith("hour")?value*600:value*10}

export function createSpellEffect(spell:DndSpellData,ruleset:RulesetId="dnd_2014",slotLevel=spell.level):CharacterSpellEffect|null{
  const rounds=getSpellDurationRounds(spell.duration);
  const control=getControlSpellRuntime(spell,ruleset,slotLevel);
  if(rounds===null&&!spell.concentration&&!spell.conditionEffect&&!control)return null;
  return{
    id:crypto.randomUUID(),spellId:spell.id,name:spell.name,remainingRounds:rounds,concentration:spell.concentration,
    summary:control?.guidance.join(" ")||spell.conditionEffect||spell.description,
    ...(control?{
      conditions:control.conditions,conditionChoice:control.conditionChoice,repeatSave:control.repeatSave,repeatSaveTiming:control.repeatSaveTiming??undefined,
      endOnDamage:control.endOnDamage,endOnAllyAction:control.endOnAllyAction,attackRollBonusDice:control.attackRollBonusDice,
      savingThrowBonusDice:control.savingThrowBonusDice,attackRollPenaltyDice:control.attackRollPenaltyDice,savingThrowPenaltyDice:control.savingThrowPenaltyDice,
      armorClassBonus:control.armorClassBonus,armorClassPenalty:control.armorClassPenalty,speedMultiplier:control.speedMultiplier,
      speedBecomesZero:control.speedBecomesZero,dexteritySaveAdvantage:control.dexteritySaveAdvantage,extraLimitedAction:control.extraLimitedAction,
      difficultTerrain:control.difficultTerrain,lethargyOnEnd:control.lethargyOnEnd,
    }:{}),
  }
}
export function addSpellEffect(current:CharacterSpellEffect[],next:CharacterSpellEffect){return[...current.filter(effect=>!next.concentration||!effect.concentration),next]}
export function advanceSpellEffects(current:CharacterSpellEffect[]){return current.map(effect=>effect.remainingRounds===null?effect:{...effect,remainingRounds:effect.remainingRounds-1}).filter(effect=>effect.remainingRounds===null||effect.remainingRounds>0)}
export function removeEffectsBrokenByDamage(current:CharacterSpellEffect[]){return current.filter(effect=>!effect.endOnDamage)}
