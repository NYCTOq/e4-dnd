import { CERTIFIED_CASTERS } from "../reference/spellcasting.reference";
import { highestSpellLevel, preparedLimit, spellAttack, spellSaveDc, spellSlots } from "../oracle/spellcastingOracle";

const LEVELS=[1,2,3,4,5,7,9,11,13,15,17,19,20];
const SCORES=[14,16,18,20];

export function generateSpellcastingScenarios(){
  const out=[];
  for(const ruleset of ["dnd_2014","dnd_2024"] as const){
    for(const caster of CERTIFIED_CASTERS){
      for(let i=0;i<LEVELS.length;i++){
        const level=LEVELS[i];
        const score=SCORES[(i+caster.name.length)%SCORES.length];
        out.push({
          id:`${ruleset}-${caster.name.toLowerCase()}-${level}`,
          ruleset,className:caster.name,level,score,
          saveDc:spellSaveDc(level,score),
          attackBonus:spellAttack(level,score),
          maxSpellLevel:highestSpellLevel(caster.progression,level),
          slots:spellSlots(caster.progression,level),
          preparedLimit:preparedLimit(caster.name,ruleset,level,Math.floor((score-10)/2)),
        });
      }
    }
  }
  return out;
}
