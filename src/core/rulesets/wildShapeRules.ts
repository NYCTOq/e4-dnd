import type { RulesetId } from "../character/character.types";
import { getWildShapeKnownForms, getWildShapeMaxCr, canWildShapeFly, canWildShapeSwim } from "./druidRules";

export type WildShapeForm = {
  id: string; name: string; challengeRating: number; armorClass: number; hitPoints: number;
  movement: string; hasSwim?: boolean; hasFly?: boolean; summary: string;
};

const forms: WildShapeForm[] = [
  { id:"cat",name:"Cat",challengeRating:0,armorClass:12,hitPoints:2,movement:"40 ft., climb 30 ft.",summary:"Küçük, çevik ve gizlilik odaklı keşif formu." },
  { id:"badger",name:"Badger",challengeRating:0,armorClass:10,hitPoints:3,movement:"20 ft., burrow 5 ft.",summary:"Koku takibi ve kısa kazı işleri için kullanışlı form." },
  { id:"wolf",name:"Wolf",challengeRating:.25,armorClass:13,hitPoints:11,movement:"40 ft.",summary:"Takip, sürü desteği ve hedefi yere düşürme potansiyeli sunar." },
  { id:"panther",name:"Panther",challengeRating:.25,armorClass:12,hitPoints:13,movement:"50 ft., climb 40 ft.",summary:"Hızlı yaklaşma, tırmanış ve pusu için güçlü form." },
  { id:"giant-wolf-spider",name:"Giant Wolf Spider",challengeRating:.25,armorClass:13,hitPoints:11,movement:"40 ft., climb 40 ft.",summary:"Duvar hareketi, karanlık görüş ve zehirli saldırı sağlar." },
  { id:"ape",name:"Ape",challengeRating:.5,armorClass:12,hitPoints:19,movement:"30 ft., climb 30 ft.",summary:"Tırmanış ile yakın veya menzilli fiziksel saldırıyı birleştirir." },
  { id:"crocodile",name:"Crocodile",challengeRating:.5,armorClass:12,hitPoints:19,movement:"20 ft., swim 30 ft.",hasSwim:true,summary:"Suda ilerleme ve hedefi kavrama odaklı form." },
  { id:"reef-shark",name:"Reef Shark",challengeRating:.5,armorClass:12,hitPoints:22,movement:"swim 40 ft.",hasSwim:true,summary:"Sualtı takibi ve yaralı hedeflere karşı saldırı formu." },
  { id:"brown-bear",name:"Brown Bear",challengeRating:1,armorClass:11,hitPoints:34,movement:"40 ft., climb 30 ft.",summary:"Yüksek dayanıklılık ve çoklu yakın saldırı sunar." },
  { id:"dire-wolf",name:"Dire Wolf",challengeRating:1,armorClass:14,hitPoints:37,movement:"50 ft.",summary:"Hızlı, dayanıklı ve sürü savaşına uygun büyük form." },
  { id:"giant-eagle",name:"Giant Eagle",challengeRating:1,armorClass:13,hitPoints:26,movement:"10 ft., fly 80 ft.",hasFly:true,summary:"Yüksek uçuş hızıyla keşif ve taşıma sağlar." },
  { id:"giant-octopus",name:"Giant Octopus",challengeRating:1,armorClass:11,hitPoints:52,movement:"10 ft., swim 60 ft.",hasSwim:true,summary:"Sualtında dayanıklılık, kamuflaj ve kavrama sağlar." },
];

export function getWildShapeForms() { return forms; }
export function getWildShapeKnownCount(className:string,level:number,ruleset:RulesetId) {
  if(className.trim().toLowerCase()!=="druid"||level<2)return 0;
  if(ruleset!=="dnd_2024")return 8;
  return getWildShapeKnownForms(level,"dnd_2024");
}
export function getWildShapeLimits(level:number,ruleset:RulesetId,subclass:string) {
  const edition=ruleset==="dnd_2024"?"dnd_2024":"dnd_2014";
  return {maxCr:getWildShapeMaxCr(level,edition,subclass),swim:canWildShapeSwim(level,edition),fly:canWildShapeFly(level,edition)};
}
export function isWildShapeFormEligible(form:WildShapeForm,level:number,ruleset:RulesetId,subclass:string) {
  if(level<2)return false;
  const limits=getWildShapeLimits(level,ruleset,subclass);
  return form.challengeRating<=limits.maxCr&&(!form.hasSwim||limits.swim)&&(!form.hasFly||limits.fly);
}
