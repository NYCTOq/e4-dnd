import type { DndItemData, WeaponMastery } from "./ruleset.types";

type WeaponSeed = [string, string, string, number, string, string, "simple" | "martial", string[], string?, WeaponMastery?];
const weaponSeeds: WeaponSeed[] = [
  ["greatclub","Greatclub","2 sp",10,"1d8","bludgeoning","simple",["Two-Handed"],undefined,"Push"],
  ["javelin","Javelin","5 sp",2,"1d6","piercing","simple",["Thrown"],"30/120","Slow"],
  ["light-hammer","Light Hammer","2 gp",2,"1d4","bludgeoning","simple",["Light","Thrown"],"20/60","Nick"],
  ["sickle","Sickle","1 gp",2,"1d4","slashing","simple",["Light"],undefined,"Nick"],
  ["spear","Spear","1 gp",3,"1d6","piercing","simple",["Thrown","Versatile 1d8"],"20/60","Sap"],
  ["dart","Dart","5 cp",0.25,"1d4","piercing","simple",["Finesse","Thrown"],"20/60","Vex"],
  ["battleaxe","Battleaxe","10 gp",4,"1d8","slashing","martial",["Versatile 1d10"],undefined,"Topple"],
  ["flail","Flail","10 gp",2,"1d8","bludgeoning","martial",[],undefined,"Sap"],
  ["glaive","Glaive","20 gp",6,"1d10","slashing","martial",["Heavy","Reach","Two-Handed"],undefined,"Graze"],
  ["greataxe","Greataxe","30 gp",7,"1d12","slashing","martial",["Heavy","Two-Handed"],undefined,"Cleave"],
  ["halberd","Halberd","20 gp",6,"1d10","slashing","martial",["Heavy","Reach","Two-Handed"],undefined,"Cleave"],
  ["lance","Lance","10 gp",6,"1d12","piercing","martial",["Reach","Special"],undefined,"Topple"],
  ["maul","Maul","10 gp",10,"2d6","bludgeoning","martial",["Heavy","Two-Handed"],undefined,"Topple"],
  ["morningstar","Morningstar","15 gp",4,"1d8","piercing","martial",[],undefined,"Sap"],
  ["pike","Pike","5 gp",18,"1d10","piercing","martial",["Heavy","Reach","Two-Handed"],undefined,"Push"],
  ["scimitar","Scimitar","25 gp",3,"1d6","slashing","martial",["Finesse","Light"],undefined,"Nick"],
  ["trident","Trident","5 gp",4,"1d6","piercing","martial",["Thrown","Versatile 1d8"],"20/60","Topple"],
  ["war-pick","War Pick","5 gp",2,"1d8","piercing","martial",[],undefined,"Sap"],
  ["warhammer","Warhammer","15 gp",2,"1d8","bludgeoning","martial",["Versatile 1d10"],undefined,"Push"],
  ["whip","Whip","2 gp",3,"1d4","slashing","martial",["Finesse","Reach"],undefined,"Slow"],
  ["blowgun","Blowgun","10 gp",1,"1","piercing","martial",["Ammunition","Loading"],"25/100","Vex"],
  ["crossbow-hand","Hand Crossbow","75 gp",3,"1d6","piercing","martial",["Ammunition","Light","Loading"],"30/120","Vex"],
  ["crossbow-heavy","Heavy Crossbow","50 gp",18,"1d10","piercing","martial",["Ammunition","Heavy","Loading","Two-Handed"],"100/400","Push"],
  ["net","Net","1 gp",3,"0","special","martial",["Special","Thrown"],"5/15","Slow"],
];

const weapons: DndItemData[] = weaponSeeds.map(([id,name,cost,weight,damage,damageType,weaponCategory,properties,range,mastery]) => ({
  id,name,cost,weight,damage,damageType,weaponCategory,properties,range,mastery,category:"weapon",
  description:`${weaponCategory === "simple" ? "Simple" : "Martial"} weapon; ${damage} ${damageType} damage.`,
}));

const common: DndItemData[] = [
  {id:"arrows-20",name:"Arrows (20)",category:"ammunition",cost:"1 gp",weight:1,quantityInBundle:20,tags:["consumable","arrow"],description:"Shortbow ve longbow için 20 ok."},
  {id:"crossbow-bolts-20",name:"Crossbow Bolts (20)",category:"ammunition",cost:"1 gp",weight:1.5,quantityInBundle:20,tags:["consumable","bolt"],description:"Crossbow türleri için 20 bolt."},
  {id:"blowgun-needles-50",name:"Blowgun Needles (50)",category:"ammunition",cost:"1 gp",weight:1,quantityInBundle:50,tags:["consumable","needle"],description:"Blowgun için 50 needle."},
  {id:"thieves-tools",name:"Thieves' Tools",category:"tool",cost:"25 gp",weight:1,tags:["tool"],description:"Kilit, tuzak ve benzeri hassas mekanizmalar üzerinde çalışmak için araç seti."},
  {id:"herbalism-kit",name:"Herbalism Kit",category:"tool",cost:"5 gp",weight:3,tags:["kit"],description:"Bitkileri tanımlama ve bitkisel ürün hazırlama araçları."},
  {id:"disguise-kit",name:"Disguise Kit",category:"tool",cost:"25 gp",weight:3,tags:["kit"],description:"Görünüşü geçici olarak değiştiren makyaj ve aksesuar seti."},
  {id:"poisoners-kit",name:"Poisoner's Kit",category:"tool",cost:"50 gp",weight:2,tags:["kit"],description:"Zehirleri inceleme ve güvenli biçimde işleme araçları."},
  {id:"navigators-tools",name:"Navigator's Tools",category:"tool",cost:"25 gp",weight:2,tags:["tool"],description:"Harita, yön ve rota belirleme için kullanılan araçlar."},
  {id:"backpack",name:"Backpack",category:"gear",cost:"2 gp",weight:5,tags:["container"],description:"Ekipman ve erzak taşımaya uygun sırt çantası."},
  {id:"bedroll",name:"Bedroll",category:"gear",cost:"1 gp",weight:7,tags:["camping"],description:"Yolculuk sırasında dinlenmek için taşınabilir yatak takımı."},
  {id:"crowbar",name:"Crowbar",category:"gear",cost:"2 gp",weight:5,tags:["adventuring"],description:"Kaldırma ve zorlama işlerinde mekanik avantaj sağlayan sağlam çubuk."},
  {id:"tinderbox",name:"Tinderbox",category:"gear",cost:"5 sp",weight:1,tags:["camping"],description:"Meşale, kamp ateşi ve benzeri ateşleri yakma seti."},
  {id:"waterskin",name:"Waterskin",category:"gear",cost:"2 sp",weight:5,tags:["container"],description:"Yolculukta içme suyu taşımak için deri kap."},
];

export const ITEM_EXPANSION_2014: DndItemData[] = [...weapons, ...common];
export const ITEM_EXPANSION_2024: DndItemData[] = ITEM_EXPANSION_2014.map((item) => ({ ...item }));
