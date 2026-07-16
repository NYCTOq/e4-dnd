import type { RulesetId } from "../character/character.types";

export type BattleMasterManeuver={id:string;name:string;trigger:string;summary:string};
const maneuvers:BattleMasterManeuver[]=[
  {id:"commanders-strike",name:"Commander's Strike",trigger:"Attack Action",summary:"Bir saldırından vazgeçip müttefiğinin reaction ile saldırmasını sağlarsın."},
  {id:"disarming-attack",name:"Disarming Attack",trigger:"Weapon hit",summary:"Hasarı artırır ve hedefi tuttuğu bir eşyayı düşürmeye zorlar."},
  {id:"distracting-strike",name:"Distracting Strike",trigger:"Weapon hit",summary:"Hasarı artırır ve bir sonraki müttefik saldırısına açıklık yaratır."},
  {id:"evasive-footwork",name:"Evasive Footwork",trigger:"Movement",summary:"Hareket ederken savunmanı Superiority Die ile geçici olarak güçlendirirsin."},
  {id:"feinting-attack",name:"Feinting Attack",trigger:"Bonus Action",summary:"Yakındaki hedefe karşı sonraki saldırına avantaj ve ek hasar hazırlarsın."},
  {id:"goading-attack",name:"Goading Attack",trigger:"Weapon hit",summary:"Hasarı artırır ve hedefin başkalarına saldırmasını zorlaştırırsın."},
  {id:"lunging-attack",name:"Lunging Attack",trigger:"Melee attack",summary:"Yakın saldırının erişimini kısa süreli artırırsın."},
  {id:"maneuvering-attack",name:"Maneuvering Attack",trigger:"Weapon hit",summary:"Hasarı artırıp bir müttefiğin güvenli biçimde yer değiştirmesini sağlarsın."},
  {id:"menacing-attack",name:"Menacing Attack",trigger:"Weapon hit",summary:"Hasarı artırır ve hedefi korkutmaya çalışırsın."},
  {id:"parry",name:"Parry",trigger:"Reaction",summary:"Yakın saldırı hasarını die sonucu ve Dexterity desteğiyle azaltırsın."},
  {id:"precision-attack",name:"Precision Attack",trigger:"Attack roll",summary:"Bir saldırının isabet sonucuna Superiority Die eklersin."},
  {id:"pushing-attack",name:"Pushing Attack",trigger:"Weapon hit",summary:"Hasarı artırır ve hedefi geriye itmeye çalışırsın."},
  {id:"rally",name:"Rally",trigger:"Bonus Action",summary:"Bir müttefiğe Charisma desteğiyle geçici Hit Point verirsin."},
  {id:"riposte",name:"Riposte",trigger:"Reaction",summary:"Seni ıskalayan yakındaki hedefe karşı karşı saldırı yaparsın."},
  {id:"sweeping-attack",name:"Sweeping Attack",trigger:"Melee hit",summary:"İlk hedefin yanındaki ikinci hedefe die kadar hasar taşırsın."},
  {id:"trip-attack",name:"Trip Attack",trigger:"Weapon hit",summary:"Hasarı artırır ve uygun hedefi prone duruma düşürmeye çalışırsın."},
];
export function getBattleMasterManeuvers(){return maneuvers}
export function isBattleMaster(className:string,subclass:string){return className.trim().toLowerCase()==="fighter"&&subclass.trim().toLowerCase().includes("battle master")}
export function getManeuverChoiceCount(className:string,subclass:string,level:number,_ruleset:RulesetId){if(!isBattleMaster(className,subclass)||level<3)return 0;return level>=15?9:level>=10?7:level>=7?5:3}
export function getSuperiorityDiceCount(level:number){return level>=15?6:level>=7?5:4}
export function getSuperiorityDie(level:number){return level>=18?"d12":level>=10?"d10":"d8"}
