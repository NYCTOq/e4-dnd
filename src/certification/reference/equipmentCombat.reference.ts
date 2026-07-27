export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type ReferenceAbilities = Record<AbilityKey, number>;
export type ReferenceItem = { id:string; name:string; category:"weapon"|"armor"|"shield"|"gear"|"tool"|"pack"|"ammunition"; weight:number; damage?:string; versatileDamage?:string; damageType?:string; properties?:string[]; range?:string; attackBonus?:number; damageBonus?:number; armorClass?:number; armorClassBonus?:number; armorType?:"light"|"medium"|"heavy"; dexBonusMax?:number; mastery?:string };
export type ReferenceInventoryEntry = { itemId:string; quantity:number };
export type ReferenceCombatant = { level:number; abilities:ReferenceAbilities; fightingStyleIds:string[]; equippedWeaponIds:string[]; armorClass:number; armorClassMode:"manual"|"auto"; equippedArmorId:string|null; equippedShieldId:string|null; inventory:ReferenceInventoryEntry[]; maxHp:number; className:string; gold:number; knownSpellIds:string[]; preparedSpellIds:string[] };
export type ReferenceSpell = { id:string; name:string; effectType?:string; attackType?:string; damageDice?:string };
export const REFERENCE_ITEMS: ReferenceItem[] = [
{id:"dagger",name:"Dagger",category:"weapon",weight:1,damage:"1d4",damageType:"piercing",properties:["finesse","light","thrown"],range:"20/60",mastery:"Nick"},
{id:"longsword",name:"Longsword",category:"weapon",weight:3,damage:"1d8",versatileDamage:"1d10",damageType:"slashing",properties:["versatile"],mastery:"Sap"},
{id:"rapier",name:"Rapier",category:"weapon",weight:2,damage:"1d8",damageType:"piercing",properties:["finesse"],mastery:"Vex"},
{id:"longbow",name:"Longbow",category:"weapon",weight:2,damage:"1d8",damageType:"piercing",properties:["ammunition","heavy","two-handed"],range:"150/600",mastery:"Slow"},
{id:"greatsword",name:"Greatsword",category:"weapon",weight:6,damage:"2d6",damageType:"slashing",properties:["heavy","two-handed"],mastery:"Graze"},
{id:"leather",name:"Leather Armor",category:"armor",weight:10,armorClass:11,armorType:"light"},
{id:"scale-mail",name:"Scale Mail",category:"armor",weight:45,armorClass:14,armorType:"medium",dexBonusMax:2},
{id:"chain-mail",name:"Chain Mail",category:"armor",weight:55,armorClass:16,armorType:"heavy"},
{id:"shield",name:"Shield",category:"shield",weight:6,armorClassBonus:2},
{id:"rope",name:"Hempen Rope",category:"gear",weight:10}
];
export const REFERENCE_SPELLS: ReferenceSpell[] = [
{id:"fire-bolt",name:"Fire Bolt",effectType:"damage",attackType:"spell-attack",damageDice:"1d10"},
{id:"sacred-flame",name:"Sacred Flame",effectType:"damage",damageDice:"1d8"},
{id:"light",name:"Light"}
];
