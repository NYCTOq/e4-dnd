import type { AbilityKey, Character } from "../character/character.types";
import { getAbilityModifier, getProficiencyBonus } from "../character/characterCalculator";
import type { RulesetData } from "./ruleset.types";
import { getMetamagicOptions } from "./metamagicRules";
import { getEldritchInvocations } from "./invocationRules";
import { getWildShapeForms } from "./wildShapeRules";

export const SKILL_ABILITIES:Record<string,AbilityKey> = {
  Acrobatics:"dex", "Animal Handling":"wis", Arcana:"int", Athletics:"str", Deception:"cha", History:"int",
  Insight:"wis", Intimidation:"cha", Investigation:"int", Medicine:"wis", Nature:"int", Perception:"wis",
  Performance:"cha", Persuasion:"cha", Religion:"int", "Sleight of Hand":"dex", Stealth:"dex", Survival:"wis",
};
export function getSkillBonus(character:Character, skill:string) {
  const ability=SKILL_ABILITIES[skill]??"wis"; const pb=getProficiencyBonus(character.level);
  const proficient=character.skillProficiencies?.includes(skill); const expertise=character.expertiseSkills?.includes(skill);
  return getAbilityModifier(character.abilities[ability]) + (expertise ? pb*2 : proficient ? pb : 0);
}
export function getSavingThrowBonus(character:Character, ability:AbilityKey, rulesetData:RulesetData|null) {
  const classData=rulesetData?.classes.find(item=>item.name===character.className);
  return getAbilityModifier(character.abilities[ability]) + (classData?.savingThrows.includes(ability) ? getProficiencyBonus(character.level) : 0);
}
export function getCharacterFeatures(character:Character, rulesetData:RulesetData|null) {
  const classData=rulesetData?.classes.find(item=>item.name===character.className);
  const subclass=rulesetData?.subclasses.find(item=>item.name===character.subclass&&item.className===character.className);
  const feats=(rulesetData?.feats??[]).filter(item=>character.featIds?.includes(item.id));
  const classFeatures=classData?.levels.filter(row=>row.level<=character.level).flatMap(row=>row.features.map(name=>({source:`${character.className} L${row.level}`,name,summary:"Class progression feature"})))??[];
  const subclassFeatures=subclass?.features.filter(item=>item.level<=character.level).map(item=>({source:`${subclass.name} L${item.level}`,name:item.name,summary:item.summary}))??[];
  const featFeatures=feats.map(item=>({source:"Feat",name:item.name,summary:item.summary}));
  const metamagicFeatures=getMetamagicOptions(character.ruleset).filter(item=>character.metamagicIds?.includes(item.id)).map(item=>({source:`Metamagic · ${item.cost} SP`,name:item.name,summary:item.summary}));
  const invocationFeatures=getEldritchInvocations(character.ruleset).filter(item=>character.invocationIds?.includes(item.id)).map(item=>({source:"Eldritch Invocation",name:item.name,summary:item.summary}));
  const wildShapeFeatures=getWildShapeForms().filter(item=>character.wildShapeFormIds?.includes(item.id)).map(item=>({source:`Wild Shape · CR ${item.challengeRating}`,name:item.name,summary:`${item.summary} ${item.movement}`}));
  return [...classFeatures,...subclassFeatures,...featFeatures,...metamagicFeatures,...invocationFeatures,...wildShapeFeatures];
}
export function getPassiveScore(character:Character, skill:string) { return 10+getSkillBonus(character,skill); }
