import { getBarbarianCombatFeatures, getBrutalCriticalExtraDice, getBrutalStrike, getRageDamageBonus, getRageUses } from "./barbarianRules";
import { getActionSurgeUses, getFighterCombatFeatures } from "./fighterRules";
import { getMartialArtsDie, getMonkCombatFeatures } from "./monkRules";
import { getRogueCombatFeatures, getSneakAttackDice } from "./rogueRules";
export type MartialClassRuntime={className:string;attacksPerAction:number;primaryResourceMax:number;resourceUnlimited?:boolean;damageBonus:string|null;reactionDefense:boolean;notes:string[]};
export function getMartialClassRuntime(className:string,level:number,ruleset:string):MartialClassRuntime{
 const key=className.trim().toLowerCase(),safe=Math.max(1,Math.min(20,Math.floor(level)));let attacksPerAction=1,primaryResourceMax=0,resourceUnlimited=false,damageBonus:string|null=null,reactionDefense=false;const notes:string[]=[];
 if(key==="fighter"){const x=getFighterCombatFeatures(safe,ruleset==="dnd_2024"?"dnd_2024":"dnd_2014");attacksPerAction=x.extraAttack;primaryResourceMax=getActionSurgeUses(safe);if(x.indomitable)notes.push(`Indomitable ${x.indomitable}`)}
 if(key==="barbarian"){
  const edition=ruleset==="dnd_2024"?"dnd_2024":"dnd_2014";const x=getBarbarianCombatFeatures(safe,edition);attacksPerAction=x.extraAttack?2:1;
  const rageUses=getRageUses(safe,edition);resourceUnlimited=rageUses==="unlimited";primaryResourceMax=typeof rageUses === "number" ? rageUses : 6;
  if(edition==="dnd_2024"){const brutal=getBrutalStrike(safe,edition);damageBonus=`Rage +${getRageDamageBonus(safe)}${brutal.dice?` · Brutal Strike ${brutal.dice}d10`:""}`;if(brutal.options.length)notes.push(`${brutal.effectCount} Brutal Strike effect: ${brutal.options.join(", ")}`);notes.push("Short Rest bir Rage kullanımı yeniler.")}
  else damageBonus=`Rage +${getRageDamageBonus(safe)} · Brutal +${getBrutalCriticalExtraDice(safe,edition)} die`;
  if(resourceUnlimited)notes.push("Primal Champion: Rage kullanımı sınırsız.");reactionDefense=x.relentlessRage;
 }
 if(key==="rogue"){const x=getRogueCombatFeatures(safe,ruleset==="dnd_2024"?"dnd_2024":"dnd_2014");damageBonus=`Sneak Attack ${getSneakAttackDice(safe)}d6`;reactionDefense=x.uncannyDodge;if(x.reliableTalent)notes.push("Reliable Talent")}
 if(key==="monk"){const x=getMonkCombatFeatures(safe,ruleset==="dnd_2024"?"dnd_2024":"dnd_2014");attacksPerAction=safe>=5?2:1;primaryResourceMax=safe>=2?safe:0;damageBonus=`Martial Arts d${getMartialArtsDie(safe,ruleset)}`;reactionDefense=x.deflectAttacks;if(x.stunningStrike)notes.push("Stunning Strike")}
 return{className,attacksPerAction,primaryResourceMax,...(resourceUnlimited?{resourceUnlimited:true}:{}),damageBonus,reactionDefense,notes};
}
