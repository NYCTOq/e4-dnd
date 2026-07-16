import type{RulesetId}from"../character/character.types";
export function isPaladin(className:string){return className.trim().toLowerCase()==="paladin"}
export function getDivineSmiteDice(slotLevel:number,ruleset:RulesetId,holyTarget=false){const safe=Math.max(1,Math.min(5,Math.floor(slotLevel)));const base=ruleset==="dnd_2014"?Math.min(5,safe+1):safe+1;return base+(holyTarget?1:0)}
export function getPaladinAuraSummary(level:number){const radius=level>=18?30:10;return{protection:level>=6?{radius,summary:"Yakındaki müttefik saving throw sonuçlarına Charisma modifier desteği alır."}:null,courage:level>=10?{radius,summary:"Yakındaki müttefikler frightened durumuna karşı korunur."}:null,radiantStrikes:level>=11?"Silah isabetleri ilave 1d8 radiant hasar taşır.":null}}
