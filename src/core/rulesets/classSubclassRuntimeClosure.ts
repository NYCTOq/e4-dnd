import type { DndClassData, DndSubclassData, RulesetData } from "./ruleset.types";
import { getSubclassRuntime } from "./subclassRuntimeRules";

export type FeatureClosureStatus = "automatic" | "guided" | "table-ruling" | "blocked";
export type FeatureMechanic = "action" | "bonus-action" | "reaction" | "resource" | "recovery" | "passive" | "progression";
export interface FeatureClosureEntry { id:string; name:string; source:string; level:number; status:FeatureClosureStatus; mechanics:FeatureMechanic[]; reason:string }
export interface EntityClosureReport { id:string; name:string; kind:"class"|"subclass"; edition:string; score:number; status:"closed"|"needs-work"|"blocked"; automatic:number; guided:number; tableRuling:number; blocked:number; entries:FeatureClosureEntry[]; blockers:string[]; warnings:string[] }
export interface ClassSubclassRuntimeClosureReport { score:number; status:"closed"|"needs-work"|"blocked"; classes:EntityClosureReport[]; subclasses:EntityClosureReport[]; blockers:string[]; warnings:string[]; summary:string }

const CLASS_ENGINES = new Set(["barbarian","bard","cleric","druid","fighter","monk","paladin","ranger","rogue","sorcerer","warlock","wizard"]);
const ACTION=/\baction\b|channel divinity|wild shape|lay on hands|action surge|second wind|rage|sneak attack|arcane recovery|divine intervention/i;
const BONUS=/bonus action|bardic inspiration|martial arts|flurry|cunning action|hunters? mark|sorcery point|font of magic/i;
const REACTION=/reaction|uncanny dodge|deflect|counter|warding flare|projected ward|bend luck|opportunist|entropic ward/i;
const RESOURCE=/uses?|points?|dice|slots?|charge|channel divinity|wild shape|rage|inspiration|ki|focus|superiority|arcane ward/i;
const RECOVERY=/short rest|long rest|recover|regain|recharge|restoration/i;
const PASSIVE=/armor class|critical|resistance|immunity|aura|extra attack|expertise|proficiency|speed|initiative|damage bonus|spell save|spell attack/i;
const TABLE=/illusion|divination|social|narrative|dm determines|game master|interpretation/i;

const mechanicsFor=(name:string,summary=""):FeatureMechanic[]=>{const text=`${name} ${summary}`;const result:FeatureMechanic[]=[];if(ACTION.test(text))result.push("action");if(BONUS.test(text))result.push("bonus-action");if(REACTION.test(text))result.push("reaction");if(RESOURCE.test(text))result.push("resource");if(RECOVERY.test(text))result.push("recovery");if(PASSIVE.test(text))result.push("passive");if(!result.length)result.push("progression");return result};
const counts=(entries:FeatureClosureEntry[])=>({automatic:entries.filter(x=>x.status==="automatic").length,guided:entries.filter(x=>x.status==="guided").length,tableRuling:entries.filter(x=>x.status==="table-ruling").length,blocked:entries.filter(x=>x.status==="blocked").length});
const scoreFor=(entries:FeatureClosureEntry[])=>entries.length?Math.round(entries.reduce((sum,x)=>sum+(x.status==="automatic"?100:x.status==="guided"?70:x.status==="table-ruling"?40:0),0)/entries.length):0;
const statusFor=(entries:FeatureClosureEntry[])=>entries.some(x=>x.status==="blocked")?"blocked" as const:entries.some(x=>x.status!=="automatic")?"needs-work" as const:"closed" as const;

export function certifyClassRuntime(klass:DndClassData,edition:string):EntityClosureReport{
 const engine=CLASS_ENGINES.has(klass.name.trim().toLowerCase());
 const entries:FeatureClosureEntry[]=[];
 for(const row of klass.levels){for(const [index,name] of row.features.entries()){const trimmed=name.trim();const mechanics=mechanicsFor(trimmed);let status:FeatureClosureStatus="guided",reason="Progression otomatik açılıyor; özgün masa sonucu rehberli uygulanır.";if(!trimmed){status="blocked";reason="Boş class feature kaydı."}else if(!engine){status="blocked";reason="Dedicated class runtime motoru bulunamadı."}else if(mechanics.some(x=>x!=="progression")){status="automatic";reason="Dedicated class runtime/progression ve ortak action-resource motoruna bağlı."}else if(TABLE.test(trimmed)){status="table-ruling";reason="Özellik doğası gereği masa kararı gerektiriyor."}entries.push({id:`${klass.id}-${row.level}-${index}`,name:trimmed||"Unnamed feature",source:klass.name,level:row.level,status,mechanics,reason})}}
 if(!klass.levels.length)entries.push({id:`${klass.id}-progression`,name:"Class progression",source:klass.name,level:1,status:"blocked",mechanics:["progression"],reason:"Level progression bulunamadı."});
 if(!klass.levels.some(x=>x.level===20&&x.features.length))entries.push({id:`${klass.id}-capstone`,name:"Level 20 capstone",source:klass.name,level:20,status:"blocked",mechanics:["progression"],reason:"Level 20 capstone kaydı bulunamadı."});
 const c=counts(entries),blockers=entries.filter(x=>x.status==="blocked").map(x=>`${klass.name} L${x.level} · ${x.name}: ${x.reason}`),warnings=entries.filter(x=>x.status==="guided"||x.status==="table-ruling").map(x=>`${klass.name} L${x.level} · ${x.name}: ${x.reason}`);
 return{id:klass.id,name:klass.name,kind:"class",edition,score:scoreFor(entries),status:statusFor(entries),...c,entries,blockers,warnings};
}

export function certifySubclassRuntime(subclass:DndSubclassData):EntityClosureReport{
 const entries:FeatureClosureEntry[]=[];
 for(const [index,feature] of (subclass.features??[]).entries()){const mechanics=mechanicsFor(feature.name,feature.summary);const runtime=getSubclassRuntime(subclass,feature.level);const action=runtime.actions.find(x=>x.name===feature.name)||runtime.actions.find(x=>x.id.includes(feature.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")));let status:FeatureClosureStatus="guided",reason="Feature level ile açılıyor; sonucu Play Mode rehberiyle uygulanır.";if(!feature.name.trim()||!feature.summary?.trim()){status="blocked";reason="Feature adı veya mekanik özeti eksik."}else if(action||runtime.criticalThreshold<20||runtime.attacksPerActionMinimum>1||runtime.armorClassFloor>0||runtime.damageResistances.length||runtime.initiativeBonus){status="automatic";reason=action?`Play Mode ${action.type} runtime'ına bağlı${action.resourceId?` ve ${action.resourceId} tüketiyor`:""}.`:"Pasif modifier ortak karakter hesaplarına bağlı."}else if(TABLE.test(`${feature.name} ${feature.summary}`)){status="table-ruling";reason="Özellik yoruma veya masa kararına bağlı; progression ve not görünürlüğü otomatik."}entries.push({id:`${subclass.id}-${feature.level}-${index}`,name:feature.name||"Unnamed feature",source:subclass.name,level:feature.level,status,mechanics,reason})}
 if(!(subclass.features??[]).length)entries.push({id:`${subclass.id}-features`,name:"Subclass progression",source:subclass.name,level:subclass.selectionLevel,status:"blocked",mechanics:["progression"],reason:"Subclass feature progression bulunamadı."});
 if(subclass.selectionLevel<1||subclass.selectionLevel>20)entries.push({id:`${subclass.id}-selection`,name:"Subclass selection level",source:subclass.name,level:subclass.selectionLevel,status:"blocked",mechanics:["progression"],reason:"Subclass seçim seviyesi 1-20 aralığında değil."});
 const c=counts(entries),blockers=entries.filter(x=>x.status==="blocked").map(x=>`${subclass.name} L${x.level} · ${x.name}: ${x.reason}`),warnings=entries.filter(x=>x.status==="guided"||x.status==="table-ruling").map(x=>`${subclass.name} L${x.level} · ${x.name}: ${x.reason}`);
 return{id:subclass.id,name:subclass.name,kind:"subclass",edition:subclass.ruleset,score:scoreFor(entries),status:statusFor(entries),...c,entries,blockers,warnings};
}

export function buildClassSubclassRuntimeClosureReport(data:RulesetData|null):ClassSubclassRuntimeClosureReport{
 if(!data)return{score:0,status:"blocked",classes:[],subclasses:[],blockers:["Ruleset verisi yüklenemedi."],warnings:[],summary:"Class/subclass runtime closure blocked"};
 const classes=data.classes.map(x=>certifyClassRuntime(x,data.id));const subclasses=data.subclasses.map(certifySubclassRuntime);const reports=[...classes,...subclasses];const blockers=reports.flatMap(x=>x.blockers);const warnings=reports.flatMap(x=>x.warnings);const total=reports.reduce((sum,x)=>sum+x.entries.length,0);const score=total?Math.round(reports.reduce((sum,x)=>sum+x.score*x.entries.length,0)/total):0;const status=blockers.length?"blocked":warnings.length?"needs-work":"closed";return{score,status,classes,subclasses,blockers,warnings,summary:`${data.name}: ${classes.length} class, ${subclasses.length} subclass, score ${score}, ${blockers.length} blocker, ${warnings.length} guided/table ruling.`};
}

export function formatClassSubclassRuntimeClosureSummary(report:ClassSubclassRuntimeClosureReport){return `${report.status.toUpperCase()} · ${report.score}/100 · ${report.classes.length} class · ${report.subclasses.length} subclass · ${report.blockers.length} blocker · ${report.warnings.length} review`;}
