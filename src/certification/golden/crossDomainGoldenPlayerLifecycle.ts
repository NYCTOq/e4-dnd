import { applyCharacterLevelUp, type LevelUpCompatibleCharacter } from "../../core/rulesets/levelUpCharacterAdapter";
import { performCharacterLongRest, performCharacterShortRest, type RestCompatibleCharacter } from "../../core/rulesets/restRecoveryCharacterAdapter";

export type GoldenLifecycleKind = "martial" | "prepared-caster" | "known-caster" | "multiclass";
export type GoldenLifecycleCharacter = LevelUpCompatibleCharacter & RestCompatibleCharacter & {
  id: string;
  name: string;
  classId: string;
  subclassId?: string;
  inventoryIds: string[];
  equippedItemIds: string[];
  featIds: string[];
  knownSpellIds: string[];
  preparedSpellIds: string[];
  revision: number;
};
export type LifecycleCheckpoint = "created" | "edited" | "leveled" | "played" | "short-rested" | "long-rested" | "restored";
export type GoldenLifecycleSnapshot = { checkpoint: LifecycleCheckpoint; character: GoldenLifecycleCharacter };

const clone=<T>(value:T):T=>structuredClone(value);

export function createGoldenLifecycleCharacters(): readonly GoldenLifecycleCharacter[] {
  const profiles: GoldenLifecycleCharacter[] = [
    {id:"fighter-2014",name:"Golden 2014 Fighter",classId:"fighter",subclassId:"champion",level:4,ruleset:"dnd_2014",maxHp:40,currentHp:31,abilities:{strength:18,constitution:16,dexterity:14},classes:[{classId:"fighter",classLevel:4,hitDie:10}],inventoryIds:["chain-mail","shield","longsword"],equippedItemIds:["chain-mail","shield","longsword"],featIds:["alert-2014"],knownSpellIds:[],preparedSpellIds:[],revision:1,hitDice:[{die:10,max:4,used:2}],spellSlots:[],resources:[{id:"second-wind",current:0,max:1,recovery:"short"},{id:"action-surge",current:0,max:1,recovery:"short"}],deathSaves:{successes:1,failures:0},activeEffects:[],exhaustion:1},
    {id:"cleric-2024",name:"Golden 2024 Cleric",classId:"cleric",subclassId:"life-domain",level:4,ruleset:"dnd_2024",maxHp:35,currentHp:14,abilities:{wisdom:18,constitution:14,strength:10},classes:[{classId:"cleric",classLevel:4,hitDie:8}],inventoryIds:["scale-mail","shield","mace"],equippedItemIds:["scale-mail","shield","mace"],featIds:["war-caster-2024"],knownSpellIds:["guidance"],preparedSpellIds:["bless","cure-wounds","spiritual-weapon"],revision:1,hitDice:[{die:8,max:4,used:3}],spellSlots:[{level:1,max:4,used:3},{level:2,max:3,used:2}],resources:[{id:"channel-divinity",current:0,max:1,recovery:"short"}],deathSaves:{successes:0,failures:1},activeEffects:[{id:"bless",durationType:"minutes"}],concentrating:true,exhaustion:2},
    {id:"sorcerer-2014",name:"Golden 2014 Sorcerer",classId:"sorcerer",subclassId:"draconic-bloodline",level:5,ruleset:"dnd_2014",maxHp:32,currentHp:17,abilities:{charisma:18,constitution:14,dexterity:14},classes:[{classId:"sorcerer",classLevel:5,hitDie:6}],inventoryIds:["dagger","arcane-focus"],equippedItemIds:["dagger","arcane-focus"],featIds:["metamagic-adept"],knownSpellIds:["fire-bolt","shield","misty-step","fireball"],preparedSpellIds:[],revision:1,hitDice:[{die:6,max:5,used:2}],spellSlots:[{level:1,max:4,used:2},{level:2,max:3,used:1},{level:3,max:2,used:2}],resources:[{id:"sorcery-points",current:1,max:5,recovery:"long"}],deathSaves:{successes:0,failures:0},activeEffects:[],exhaustion:0},
    {id:"fighter-wizard-2024",name:"Golden 2024 Multiclass",classId:"fighter",subclassId:"champion",level:6,ruleset:"dnd_2024",maxHp:47,currentHp:24,abilities:{strength:16,intelligence:16,constitution:14},classes:[{classId:"fighter",classLevel:3,hitDie:10},{classId:"wizard",classLevel:3,hitDie:6}],inventoryIds:["breastplate","longsword","spellbook"],equippedItemIds:["breastplate","longsword"],featIds:["alert-2024"],knownSpellIds:["fire-bolt"],preparedSpellIds:["shield","magic-missile","misty-step"],revision:1,hitDice:[{die:10,max:3,used:2},{die:6,max:3,used:1}],spellSlots:[{level:1,max:4,used:3},{level:2,max:2,used:1}],resources:[{id:"second-wind",current:0,max:1,recovery:"short"},{id:"action-surge",current:0,max:1,recovery:"short"},{id:"arcane-recovery",current:0,max:1,recovery:"long"}],deathSaves:{successes:1,failures:1},activeEffects:[],exhaustion:1},
  ];
  return profiles.map(clone);
}

export function editGoldenCharacter(character:GoldenLifecycleCharacter):GoldenLifecycleCharacter {
  return {...clone(character),name:`${character.name} Edited`,revision:character.revision+1,equippedItemIds:[...character.equippedItemIds].reverse()};
}
export function levelGoldenCharacter(character:GoldenLifecycleCharacter):GoldenLifecycleCharacter {
  const targetClass=character.classes?.at(-1)?.classId??character.classId;
  const leveled=applyCharacterLevelUp(character,{classId:targetClass});
  return {...clone(character),...leveled,revision:character.revision+1} as GoldenLifecycleCharacter;
}
export function playGoldenCharacter(character:GoldenLifecycleCharacter):GoldenLifecycleCharacter {
  const spellSlots=(character.spellSlots??[]).map((slot,index)=>index===0?{...slot,used:Math.min(slot.max,slot.used+1)}:slot);
  const resources=(character.resources??[]).map((resource,index)=>index===0?{...resource,current:Math.max(0,resource.current-1)}:resource);
  const currentHp=character.currentHp??character.maxHp??1;
  return {...clone(character),currentHp:Math.max(1,currentHp-3),spellSlots,resources,revision:character.revision+1};
}
export function shortRestGoldenCharacter(character:GoldenLifecycleCharacter):GoldenLifecycleCharacter {
  return {...clone(character),...performCharacterShortRest(character).character,revision:character.revision+1} as GoldenLifecycleCharacter;
}
export function longRestGoldenCharacter(character:GoldenLifecycleCharacter):GoldenLifecycleCharacter {
  return {...clone(character),...performCharacterLongRest(character).character,revision:character.revision+1} as GoldenLifecycleCharacter;
}
export function backupAndRestoreGoldenCharacter(character:GoldenLifecycleCharacter):GoldenLifecycleCharacter {
  const payload=JSON.stringify(character);
  const restored=JSON.parse(payload) as GoldenLifecycleCharacter;
  return clone(restored);
}
export function runGoldenLifecycle(character:GoldenLifecycleCharacter):readonly GoldenLifecycleSnapshot[]{
  const created=clone(character); const edited=editGoldenCharacter(created); const leveled=levelGoldenCharacter(edited); const played=playGoldenCharacter(leveled); const shortRested=shortRestGoldenCharacter(played); const longRested=longRestGoldenCharacter(shortRested); const restored=backupAndRestoreGoldenCharacter(longRested);
  return [{checkpoint:"created",character:created},{checkpoint:"edited",character:edited},{checkpoint:"leveled",character:leveled},{checkpoint:"played",character:played},{checkpoint:"short-rested",character:shortRested},{checkpoint:"long-rested",character:longRested},{checkpoint:"restored",character:restored}];
}
export function lifecycleIdentitySnapshot(character:GoldenLifecycleCharacter){return {id:character.id,ruleset:character.ruleset,classId:character.classId,subclassId:character.subclassId,classStructure:(character.classes??[]).map(({classId,hitDie})=>({classId,hitDie})),inventoryIds:character.inventoryIds,featIds:character.featIds,knownSpellIds:character.knownSpellIds,preparedSpellIds:character.preparedSpellIds};}
