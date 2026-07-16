import type { RulesetData } from "./ruleset.types";
import { auditClassProgression } from "./classProgressionAudit";
export type CoverageStatus="complete"|"partial"|"missing";
export type CoverageRow={id:string;label:string;count:number;status:CoverageStatus;detail:string};
export function getRulesetCoverage(data:RulesetData|null){
 if(!data)return{score:0,rows:[] as CoverageRow[],blockers:["Ruleset verisi yüklenemedi."]};
 const classesReady=data.classes.filter(item=>auditClassProgression(item,data.id).ready).length;
 const rows:CoverageRow[]=[
  {id:"classes",label:"Class 1–20 progression",count:data.classes.length,status:data.classes.length===12&&classesReady===12?"complete":data.classes.length?"partial":"missing",detail:`${classesReady}/${data.classes.length} class tam level tablosu`},
  {id:"subclasses",label:"Subclass packages",count:data.subclasses.length,status:data.subclasses.length>=12?"partial":"missing",detail:"Seçimler mevcut; benzersiz feature runtime denetimi sürüyor."},
  {id:"origins",label:data.id==="dnd_2024"?"Species & backgrounds":"Races & backgrounds",count:data.races.length+data.backgrounds.length,status:data.races.length&&data.backgrounds.length?"partial":"missing",detail:"Temel hız, görüş, direnç ve köken seçimleri kapsanıyor."},
  {id:"feats",label:"Feats",count:data.feats.length,status:data.feats.length?"partial":"missing",detail:"Katalog geniş; tüm özel davranışlar henüz tamamlanmadı."},
  {id:"spells",label:"Spells & cantrips",count:data.spells.length,status:data.spells.length>=300?"partial":"missing",detail:"Tüm leveller mevcut; özel effect aileleri ayrıca sertifikalanacak."},
  {id:"items",label:"Equipment & magic items",count:data.items.length,status:data.items.length>=60?"partial":"missing",detail:"Silah, zırh, consumable, attunement ve charge runtime mevcut."},
 ];
 const weights:Record<CoverageStatus,number>={complete:1,partial:.55,missing:0};
 const score=Math.round(rows.reduce((sum,row)=>sum+weights[row.status],0)/rows.length*100);
 return{score,rows,blockers:rows.filter(row=>row.status!=="complete").map(row=>`${row.label}: ${row.detail}`)};
}
