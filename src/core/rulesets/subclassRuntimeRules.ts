import type { CharacterResource } from "../character/character.types";
import type { DndSubclassData, SubclassFeatureData } from "./ruleset.types";
import { getUnlockedSubclassFeatures } from "./subclassRules";

export type SubclassActionType="action"|"bonus-action"|"reaction";
export type SubclassRuntimeAction={id:string;name:string;type:SubclassActionType;resourceId?:string;summary:string};
export type SubclassRuntime={unlockedFeatures:SubclassFeatureData[];actions:SubclassRuntimeAction[];criticalThreshold:number;attacksPerActionMinimum:number;armorClassFloor:number;damageResistances:string[];initiativeBonus:number;notes:string[]};

const feature=(features:SubclassFeatureData[],pattern:RegExp)=>features.find(item=>pattern.test(item.name));
const action=(id:string,name:string,type:SubclassActionType,summary:string,resourceId?:string):SubclassRuntimeAction=>({id,name,type,summary,...(resourceId?{resourceId}:{})});

export function getSubclassRuntime(subclass:DndSubclassData|null|undefined,level:number,dexModifier=0):SubclassRuntime{
 const unlocked=getUnlockedSubclassFeatures(subclass,level);const names=unlocked.map(item=>item.name).join(" | ");const subclassName=subclass?.name.toLowerCase()??"";const actions:SubclassRuntimeAction[]=[];
 if(/radiance of the dawn/i.test(names))actions.push(action("radiance-of-dawn","Radiance of the Dawn","action","Alan içindeki düşmanlara radiant Channel Divinity hasarı.","channel-divinity"));
 if(/invoke duplicity/i.test(names))actions.push(action("invoke-duplicity","Invoke Duplicity","action","Illusory duplicate oluştur.","channel-divinity"));
 if(/improved warding flare|projected ward|branches of the tree|opportunist|entropic ward/i.test(names))actions.push(action("subclass-reaction",feature(unlocked,/improved warding flare|projected ward|branches of the tree|opportunist|entropic ward/i)!.name,"reaction","Subclass reaction özelliğini kullan."));
 if(/shadow step|moonlight step|transposition/i.test(names))actions.push(action("subclass-teleport",feature(unlocked,/shadow step|moonlight step|transposition/i)!.name,"bonus-action","Subclass hareket/teleport özelliğini kullan."));
 if(/combat wild shape|circle forms/i.test(names))actions.push(action("combat-wild-shape","Combat Wild Shape","bonus-action","Wild Shape kaynağıyla savaş formuna geç.","wild-shape"));
 if(/tides of chaos/i.test(names))actions.push(action("tides-of-chaos","Tides of Chaos","action","Bir D20 Test için advantage kazan."));
 if(/elder champion/i.test(names))actions.push(action("elder-champion","Elder Champion","bonus-action","Oath capstone dönüşümünü başlat."));
 const champion=/champion/i.test(subclassName);const criticalThreshold=champion?(level>=15?18:level>=3?19:20):20;
 const valor=/college of valor/i.test(subclassName);const attacksPerActionMinimum=valor&&level>=6?2:1;
 const draconic=/draconic/i.test(subclassName);const armorClassFloor=draconic?13+dexModifier:0;
 const resistances:string[]=[];if(/spell resistance/i.test(names))resistances.push("spell");if(/avatar of battle/i.test(names))resistances.push("physical");if(/thought shield/i.test(names))resistances.push("psychic");
 const initiativeBonus=/assassin/i.test(subclassName)&&level>=3?2:0;
 const notes=unlocked.filter(item=>!actions.some(candidate=>candidate.name===item.name)).map(item=>`${item.name}: ${item.summary}`);
 return{unlockedFeatures:unlocked,actions,criticalThreshold,attacksPerActionMinimum,armorClassFloor,damageResistances:resistances,initiativeBonus,notes};
}

export function canUseSubclassAction(action:SubclassRuntimeAction,resources:CharacterResource[]){if(!action.resourceId)return true;const resource=resources.find(item=>item.id===action.resourceId);return Boolean(resource&&resource.used<resource.max)}
export function spendSubclassActionResource(action:SubclassRuntimeAction,resources:CharacterResource[]){if(!action.resourceId)return resources;return resources.map(item=>item.id===action.resourceId?{...item,used:Math.min(item.max,item.used+1)}:item)}
