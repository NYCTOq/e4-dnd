import{describe,it,expect}from"vitest";
import{applyLongRest,applyShortRest,normalizeRestState,spendHitDie,spendResource,spendSpellSlot,type RestState}from"../../core/rulesets/restRecoveryRules";
const f=(o:Partial<RestState>={}):RestState=>({currentHp:5,maxHp:30,tempHp:7,hitDice:[{die:10,max:5,used:3}],spellSlots:[{level:1,max:4,used:2},{level:2,max:3,used:1},{level:2,max:2,used:2,pact:true}],resources:[{id:"short",current:0,max:2,recovery:"short"},{id:"long",current:1,max:4,recovery:"long"},{id:"both",current:0,max:3,recovery:"both"},{id:"manual",current:1,max:5,recovery:"manual"}],exhaustion:3,deathSaves:{successes:2,failures:2},concentrating:true,activeEffects:[{id:"short",durationType:"until-rest",expiresOn:"short"},{id:"long",durationType:"until-rest",expiresOn:"long"},{id:"perm",durationType:"permanent"}],...o});
describe("v5.111B scenario matrix",()=>{
 for(const r of["dnd_2014","dnd_2024"]as const)for(const hp of[0,1,5,15,29,30])for(const ex of[0,1,3,6,10])it(`${r} hp${hp} ex${ex}`,()=>{
  const x=applyLongRest(f({currentHp:hp,exhaustion:ex}),r);expect(x.state.currentHp).toBe(30);expect(x.state.tempHp).toBe(0);expect(x.state.concentrating).toBe(false);expect(x.state.exhaustion).toBe(r==="dnd_2014"?Math.max(0,ex-1):0);
 });
 for(const hp of[0,1,10,20,29,30])for(const roll of[1,5,10])for(const con of[-2,0,3,5])it(`die hp${hp} r${roll} c${con}`,()=>{
  const x=spendHitDie(f({currentHp:hp,hitDice:[{die:10,max:5,used:0}]}),10,roll,con);expect(x.state.currentHp).toBeLessThanOrEqual(30);expect(x.spent).toBe(hp<30);
 });
 for(const level of[1,2,3,4,5,6,7,8,9])for(const used of[0,1,2,3])it(`slot ${level}/${used}`,()=>expect(spendSpellSlot([{level,max:3,used}],level)[0].used).toBe(Math.min(3,used+(used<3?1:0))));
 for(const current of[0,1,2,3,4,5])for(const amount of[0,1,2,3,5,10])it(`resource ${current}/${amount}`,()=>expect(spendResource([{id:"x",current,max:5,recovery:"both"}],"x",amount)[0].current).toBe(Math.max(0,current-amount)));
 it("short rest",()=>{const x=applyShortRest(f());expect(x.state.spellSlots[2].used).toBe(0);expect(x.state.resources[0].current).toBe(2)});
 it("normalizes corrupt state",()=>{const x=normalizeRestState(f({currentHp:999,tempHp:-1,exhaustion:99,deathSaves:{successes:9,failures:-1}}));expect(x.currentHp).toBe(30);expect(x.tempHp).toBe(0);expect(x.exhaustion).toBe(10);expect(x.deathSaves).toEqual({successes:3,failures:0})});
});
