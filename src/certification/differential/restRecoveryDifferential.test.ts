import{describe,it,expect}from"vitest";
import{applyLongRest,applyShortRest,recoverHitDice,recoverResources,recoverSpellSlots,spendHitDie,spendResource,spendSpellSlot,type RestState}from"../../core/rulesets/restRecoveryRules";
import{applyLongRest as refLong,applyShortRest as refShort,recoverHitDice as refDice,recoverResources as refRes,recoverSpellSlots as refSlots,spendHitDie as refSpendDie,spendResource as refSpendRes,spendSpellSlot as refSpendSlot,type RestState as RefState}from"../reference/restRecovery.reference";
const base=():RestState=>({currentHp:7,maxHp:20,tempHp:5,hitDice:[{die:8,max:3,used:2},{die:10,max:2,used:1}],spellSlots:[{level:1,max:4,used:3},{level:2,max:2,used:2},{level:1,max:2,used:2,pact:true}],resources:[{id:"action-surge",current:0,max:1,recovery:"short"},{id:"rage",current:1,max:3,recovery:"long"},{id:"focus",current:0,max:4,recovery:"both"},{id:"custom",current:1,max:2,recovery:"manual"}],exhaustion:4,deathSaves:{successes:2,failures:1},concentrating:true,activeEffects:[{id:"bless",durationType:"minutes"},{id:"short-buff",durationType:"until-rest",expiresOn:"short"},{id:"long-buff",durationType:"until-rest",expiresOn:"long"},{id:"curse",durationType:"permanent"}]});
const clean = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(clean);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(record)) {
      if (key === "pact" && entry === false) {
        continue;
      }

      normalized[key] = clean(entry);
    }

    return normalized;
  }

  return value;
};
describe("v5.111B runtime differential",()=>{
 for(const r of["dnd_2014","dnd_2024"]as const){
  it(`${r} long rest`,()=>expect(clean(applyLongRest(base(),r).state)).toEqual(clean(refLong(base()as RefState,r))));
  it(`${r} hit dice`,()=>expect(recoverHitDice(base().hitDice,r)).toEqual(refDice(base().hitDice,r)));
 }
 it("short rest",()=>expect(clean(applyShortRest(base()).state)).toEqual(clean(refShort(base()as RefState))));
 for(const k of["short","long"]as const){
  it(`${k} slots`,()=>expect(clean(recoverSpellSlots(base().spellSlots,k))).toEqual(clean(refSlots(base().spellSlots,k))));
  it(`${k} resources`,()=>expect(recoverResources(base().resources,k)).toEqual(refRes(base().resources,k)));
 }
 for(const die of[6,8,10,12])for(const roll of[1,2,4,6,8,10,12])for(const con of[-2,0,2,4])it(`d${die} r${roll} c${con}`,()=>{
  const s=base();s.hitDice=[{die,max:3,used:1}];
  expect(clean(spendHitDie(s,die,roll,con).state)).toEqual(clean(refSpendDie(s as RefState,die,roll,con)));
 });
 for(const level of[1,2,3,4,5,6,7,8,9])for(const used of[0,1,2,3])it(`slot ${level}/${used}`,()=>{
  const p=[{level,max:3,used}];expect(clean(spendSpellSlot(p,level))).toEqual(clean(refSpendSlot(p,level)));
 });
 for(const current of[0,1,2,3,5])for(const amount of[0,1,2,3,5])it(`resource ${current}-${amount}`,()=>{
  const p=[{id:"focus",current,max:5,recovery:"both"as const}];
  expect(spendResource(p,"focus",amount)).toEqual(refSpendRes(p,"focus",amount));
 });
 it("source immutability",()=>{const s=base(),snap=clean(s);applyShortRest(s);applyLongRest(s,"dnd_2014");spendHitDie(s,8,5,2);expect(s).toEqual(snap)});
});
