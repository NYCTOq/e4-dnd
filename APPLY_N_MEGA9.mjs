import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const write=(p,s)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s)};

write('src/core/rulesets/multiclassAdvancementRuntime-N-MEGA9.ts', String.raw`
export type RuntimeAbilityScores = Partial<Record<'strength'|'dexterity'|'constitution'|'intelligence'|'wisdom'|'charisma'|'str'|'dex'|'con'|'int'|'wis'|'cha', number>>;
export type RuntimeClassEntry = { classId:string; classLevel:number; hitDie:number; subclassId?:string|null; [key:string]:unknown };
export type RuntimeSlot = { level:number; max:number; used:number };
export type RuntimeHitDie = { die:number; max:number; used:number };
export type MulticlassRuntimeCharacter = Record<string,unknown> & { level?:number; ruleset?:'dnd_2014'|'dnd_2024'; abilities?:RuntimeAbilityScores; classes?:RuntimeClassEntry[]; maxHp?:number; currentHp?:number; spellSlots?:RuntimeSlot[]; pactMagicSlots?:RuntimeSlot[]; hitDice?:RuntimeHitDie[]; multiclassProficiencies?:string[]; multiclassSkillProficiencies?:string[] };
export type ClassOption={id:string;name:string;hitDie:number;progression:'none'|'full'|'half'|'pact'; prerequisites:Array<{abilities:string[];mode:'all'|'any';minimum:number}>; proficiencies:string[]};
export const MULTICLASS_CLASS_OPTIONS:ClassOption[]=[
{id:'barbarian',name:'Barbarian',hitDie:12,progression:'none',prerequisites:[{abilities:['str'],mode:'all',minimum:13}],proficiencies:['Shields','Simple weapons','Martial weapons']},
{id:'bard',name:'Bard',hitDie:8,progression:'full',prerequisites:[{abilities:['cha'],mode:'all',minimum:13}],proficiencies:['Light armor','One skill','One musical instrument']},
{id:'cleric',name:'Cleric',hitDie:8,progression:'full',prerequisites:[{abilities:['wis'],mode:'all',minimum:13}],proficiencies:['Light armor','Medium armor','Shields']},
{id:'druid',name:'Druid',hitDie:8,progression:'full',prerequisites:[{abilities:['wis'],mode:'all',minimum:13}],proficiencies:['Light armor','Shields']},
{id:'fighter',name:'Fighter',hitDie:10,progression:'none',prerequisites:[{abilities:['str','dex'],mode:'any',minimum:13}],proficiencies:['Light armor','Medium armor','Shields','Simple weapons','Martial weapons']},
{id:'monk',name:'Monk',hitDie:8,progression:'none',prerequisites:[{abilities:['dex','wis'],mode:'all',minimum:13}],proficiencies:['Simple weapons']},
{id:'paladin',name:'Paladin',hitDie:10,progression:'half',prerequisites:[{abilities:['str','cha'],mode:'all',minimum:13}],proficiencies:['Light armor','Medium armor','Shields','Simple weapons','Martial weapons']},
{id:'ranger',name:'Ranger',hitDie:10,progression:'half',prerequisites:[{abilities:['dex','wis'],mode:'all',minimum:13}],proficiencies:['Light armor','Medium armor','Shields','Simple weapons','Martial weapons','One Ranger skill']},
{id:'rogue',name:'Rogue',hitDie:8,progression:'none',prerequisites:[{abilities:['dex'],mode:'all',minimum:13}],proficiencies:['Light armor','One Rogue skill',"Thieves' tools"]},
{id:'sorcerer',name:'Sorcerer',hitDie:6,progression:'full',prerequisites:[{abilities:['cha'],mode:'all',minimum:13}],proficiencies:[]},
{id:'warlock',name:'Warlock',hitDie:8,progression:'pact',prerequisites:[{abilities:['cha'],mode:'all',minimum:13}],proficiencies:['Light armor','Simple weapons']},
{id:'wizard',name:'Wizard',hitDie:6,progression:'full',prerequisites:[{abilities:['int'],mode:'all',minimum:13}],proficiencies:[]}
];
const aliases:Record<string,string[]>={str:['str','strength'],dex:['dex','dexterity'],con:['con','constitution'],int:['int','intelligence'],wis:['wis','wisdom'],cha:['cha','charisma']};
const score=(a:RuntimeAbilityScores|undefined,k:string)=>{for(const key of aliases[k]??[k]){const v=a?.[key as keyof RuntimeAbilityScores];if(typeof v==='number')return v}return 10};
const option=(id:string)=>MULTICLASS_CLASS_OPTIONS.find(x=>x.id===id.toLowerCase());
export function getRuntimeMulticlassEligibility(character:MulticlassRuntimeCharacter,targetClassId:string){
 const classes=Array.isArray(character.classes)?character.classes:[]; const ids=[...new Set([...classes.map(x=>x.classId.toLowerCase()),targetClassId.toLowerCase()])]; const missing:string[]=[];
 for(const id of ids){const c=option(id); if(!c){missing.push('Unknown class: '+id);continue} for(const r of c.prerequisites){const values=r.abilities.map(a=>score(character.abilities,a)); const ok=r.mode==='all'?values.every(v=>v>=r.minimum):values.some(v=>v>=r.minimum); if(!ok)missing.push(c.name+': '+r.abilities.map(a=>a.toUpperCase()).join(r.mode==='all'?' + ':' or ')+' '+r.minimum)}}
 return {eligible:missing.length===0,missing};
}
const slotTable:Record<number,number[]>={1:[2],2:[3],3:[4,2],4:[4,3],5:[4,3,2],6:[4,3,3],7:[4,3,3,1],8:[4,3,3,2],9:[4,3,3,3,1],10:[4,3,3,3,2],11:[4,3,3,3,2,1],12:[4,3,3,3,2,1],13:[4,3,3,3,2,1,1],14:[4,3,3,3,2,1,1],15:[4,3,3,3,2,1,1,1],16:[4,3,3,3,2,1,1,1],17:[4,3,3,3,2,1,1,1,1],18:[4,3,3,3,3,1,1,1,1],19:[4,3,3,3,3,2,1,1,1],20:[4,3,3,3,3,2,2,1,1]};
function combinedCasterLevel(classes:RuntimeClassEntry[],ruleset:string){return Math.min(20,classes.reduce((s,e)=>{const c=option(e.classId);if(!c||c.progression==='none'||c.progression==='pact')return s;if(c.progression==='full')return s+e.classLevel;return s+(ruleset==='dnd_2024'?Math.ceil(e.classLevel/2):Math.floor(e.classLevel/2))},0))}
function slots(classes:RuntimeClassEntry[],ruleset:string,current:RuntimeSlot[]=[]){const map=new Map(current.map(x=>[x.level,x.used]));return (slotTable[combinedCasterLevel(classes,ruleset)]??[]).map((max,i)=>({level:i+1,max,used:Math.min(max,map.get(i+1)??0)}))}
function pact(classes:RuntimeClassEntry[],current:RuntimeSlot[]=[]){const w=classes.find(x=>x.classId==='warlock');if(!w)return[];const l=w.classLevel;const max=l>=17?4:l>=11?3:l>=2?2:1;const level=l>=9?5:l>=7?4:l>=5?3:l>=3?2:1;return[{level,max,used:Math.min(max,current[0]?.used??0)}]}
function hitDice(classes:RuntimeClassEntry[],current:RuntimeHitDie[]=[]){const m=new Map<number,number>();for(const e of classes)m.set(e.hitDie,(m.get(e.hitDie)??0)+e.classLevel);return[...m].sort((a,b)=>b[0]-a[0]).map(([die,max])=>({die,max,used:Math.min(max,current.find(x=>x.die===die)?.used??0)}))}
export function applyRuntimeMulticlassLevel<T extends MulticlassRuntimeCharacter>(character:T,targetClassId:string):{ok:true;character:T}|{ok:false;character:T;errors:string[]}{
 const next=structuredClone(character); const total=Math.max(1,Number(next.level??1)); if(total>=20)return{ok:false,character:next,errors:['Character is already level 20.']}; const eligibility=getRuntimeMulticlassEligibility(next,targetClassId);if(!eligibility.eligible)return{ok:false,character:next,errors:eligibility.missing}; const target=option(targetClassId);if(!target)return{ok:false,character:next,errors:['Unknown class.']};
 const classes=Array.isArray(next.classes)?next.classes.map(x=>({...x,classId:x.classId.toLowerCase()})):[]; const existing=classes.find(x=>x.classId===target.id); if(existing)existing.classLevel+=1; else classes.push({classId:target.id,classLevel:1,hitDie:target.hitDie}); const conMod=Math.floor((score(next.abilities,'con')-10)/2); const hpGain=Math.max(1,Math.floor(target.hitDie/2)+1+conMod); next.level=total+1; next.classes=classes; next.maxHp=Math.max(1,Number(next.maxHp??1))+hpGain; next.currentHp=Math.min(next.maxHp,Math.max(0,Number(next.currentHp??next.maxHp))+hpGain); next.spellSlots=slots(classes,next.ruleset??'dnd_2014',next.spellSlots); next.pactMagicSlots=pact(classes,next.pactMagicSlots); next.hitDice=hitDice(classes,next.hitDice); if(!existing)next.multiclassProficiencies=[...new Set([...(next.multiclassProficiencies??[]),...target.proficiencies])]; return{ok:true,character:next as T};
}
`);

write('src/core/rulesets/multiclassAdvancementRuntime-N-MEGA9.test.ts', String.raw`
import {describe,it,expect} from 'vitest';
import {applyRuntimeMulticlassLevel,getRuntimeMulticlassEligibility} from './multiclassAdvancementRuntime-N-MEGA9';
const base={level:4,ruleset:'dnd_2014' as const,abilities:{str:13,dex:14,con:14,int:13,wis:10,cha:8},classes:[{classId:'fighter',classLevel:4,hitDie:10}],maxHp:36,currentHp:30,spellSlots:[],pactMagicSlots:[],hitDice:[{die:10,max:4,used:1}]};
describe('N-MEGA9 multiclass advancement runtime',()=>{
it('requires both current and target class prerequisites',()=>{expect(getRuntimeMulticlassEligibility(base,'wizard').eligible).toBe(true);expect(getRuntimeMulticlassEligibility({...base,abilities:{...base.abilities,str:12,dex:12}},'wizard').missing.some(x=>x.includes('Fighter'))).toBe(true)});
it('adds a new class atomically and recalculates pools',()=>{const r=applyRuntimeMulticlassLevel(base,'wizard');expect(r.ok).toBe(true);if(!r.ok)return;expect(r.character.level).toBe(5);expect(r.character.classes).toEqual(expect.arrayContaining([expect.objectContaining({classId:'wizard',classLevel:1})]));expect(r.character.spellSlots).toEqual([{level:1,max:2,used:0}]);expect(r.character.hitDice).toEqual([{die:10,max:4,used:1},{die:6,max:1,used:0}])});
it('keeps pact magic separate from combined slots',()=>{const r=applyRuntimeMulticlassLevel({...base,abilities:{...base.abilities,cha:13}},'warlock');expect(r.ok).toBe(true);if(!r.ok)return;expect(r.character.spellSlots).toEqual([]);expect(r.character.pactMagicSlots).toEqual([{level:1,max:1,used:0}])});
it('preserves state on invalid transition',()=>{const r=applyRuntimeMulticlassLevel(base,'paladin');expect(r.ok).toBe(false);expect(r.character).toEqual(base)});
it('prevents level 21',()=>{const r=applyRuntimeMulticlassLevel({...base,level:20},'wizard');expect(r.ok).toBe(false)});
});
`);

write('src/components/levelup/MulticlassRuntimePanel-N-MEGA9.tsx', String.raw`
import {useMemo,useState} from 'react';
import {MULTICLASS_CLASS_OPTIONS,applyRuntimeMulticlassLevel,getRuntimeMulticlassEligibility,type MulticlassRuntimeCharacter} from '../../core/rulesets/multiclassAdvancementRuntime-N-MEGA9';
export default function MulticlassRuntimePanel<T extends MulticlassRuntimeCharacter>({character,onCharacterChange}:{character:T;onCharacterChange:(c:T)=>void}){
 const current=new Set((character.classes??[]).map(x=>x.classId.toLowerCase())); const available=MULTICLASS_CLASS_OPTIONS.filter(x=>!current.has(x.id)); const [target,setTarget]=useState(available[0]?.id??''); const eligibility=useMemo(()=>target?getRuntimeMulticlassEligibility(character,target):{eligible:false,missing:['No class available']},[character,target]); const [message,setMessage]=useState('');
 if(!available.length||Number(character.level??1)>=20)return null;
 const apply=()=>{const result=applyRuntimeMulticlassLevel(character,target);if(!result.ok){setMessage(result.errors.join(' · '));return}onCharacterChange(result.character);setMessage('Multiclass level applied.');};
 return <section className="multiclass-runtime-panel" data-testid="multiclass-runtime-panel"><h3>Yeni Sınıfa Geç</h3><select value={target} onChange={e=>{setTarget(e.target.value);setMessage('')}} data-testid="multiclass-class-select">{available.map(x=><option key={x.id} value={x.id}>{x.name} (d{x.hitDie})</option>)}</select>{!eligibility.eligible&&<p data-testid="multiclass-errors">{eligibility.missing.join(' · ')}</p>}<button type="button" disabled={!eligibility.eligible} onClick={apply} data-testid="multiclass-apply">Multiclass Seviyesi Al</button>{message&&<p>{message}</p>}</section>;
}
`);

const mountPath=path.join(root,'src/components/levelup/LevelUpRuntimeIntegrationMount.tsx');
let mount=fs.readFileSync(mountPath,'utf8');
if(!mount.includes('MulticlassRuntimePanel-N-MEGA9')) mount=mount.replace('import LevelUpRuntimePanel from "./LevelUpRuntimePanel";','import LevelUpRuntimePanel from "./LevelUpRuntimePanel";\nimport MulticlassRuntimePanel from "./MulticlassRuntimePanel-N-MEGA9";');
const needle=`      <LevelUpRuntimePanel\n        character={selectedCharacter}\n        featOptions={defaultFeatOptions}\n        onCharacterChange={(character) => {\n          const next = replaceCharacter(\n            collection,\n            character,\n          );\n\n          window.localStorage.setItem(\n            storageKey,\n            serializeLevelUpCollection(next),\n          );\n\n          setCollection(next);\n        }}\n      />`;
if(!mount.includes('data-testid="multiclass-runtime-panel"')&&!mount.includes('<MulticlassRuntimePanel')){
 const repl=needle+`\n      <MulticlassRuntimePanel\n        character={selectedCharacter}\n        onCharacterChange={(character) => {\n          const next = replaceCharacter(collection, character);\n          window.localStorage.setItem(storageKey, serializeLevelUpCollection(next));\n          setCollection(next);\n        }}\n      />`;
 if(!mount.includes(needle)) throw new Error('LevelUp mount insertion point not found');
 mount=mount.replace(needle,repl);
}
fs.writeFileSync(mountPath,mount);
console.log('N-MEGA9 multiclass advancement runtime applied.');
