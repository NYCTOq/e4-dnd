
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
