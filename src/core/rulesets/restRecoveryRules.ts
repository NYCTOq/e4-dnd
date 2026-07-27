export type RestRulesetId="dnd_2014"|"dnd_2024";
export type RestKind="short"|"long";
export type HitDiePool={die:number;max:number;used:number};
export type SpellSlotPool={level:number;max:number;used:number;pact?:boolean};
export type ResourcePool={id:string;current:number;max:number;recovery:"short"|"long"|"both"|"manual"};
export type ActiveEffect={id:string;durationType:"rounds"|"minutes"|"hours"|"until-rest"|"permanent";expiresOn?:RestKind};
export type RestState={currentHp:number;maxHp:number;tempHp:number;hitDice:HitDiePool[];spellSlots:SpellSlotPool[];resources:ResourcePool[];exhaustion:number;deathSaves:{successes:number;failures:number};concentrating:boolean;activeEffects:ActiveEffect[]};
export type RestRecoveryState = RestState;
const n=(v:number,f=0)=>Number.isFinite(v)?Math.floor(v):f;
const c=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
export function normalizeRestState(s:RestState):RestState{
 const max=Math.max(0,n(s.maxHp));
 return{currentHp:c(n(s.currentHp),0,max),maxHp:max,tempHp:Math.max(0,n(s.tempHp)),
 hitDice:s.hitDice.map(x=>({die:Math.max(1,n(x.die,1)),max:Math.max(0,n(x.max)),used:c(n(x.used),0,Math.max(0,n(x.max)))})),
 spellSlots:s.spellSlots.map(x=>({level:c(n(x.level,1),1,9),max:Math.max(0,n(x.max)),used:c(n(x.used),0,Math.max(0,n(x.max))),pact:Boolean(x.pact)})),
 resources:s.resources.map(x=>({id:String(x.id),max:Math.max(0,n(x.max)),current:c(n(x.current),0,Math.max(0,n(x.max))),recovery:x.recovery})),
 exhaustion:c(n(s.exhaustion),0,10),deathSaves:{successes:c(n(s.deathSaves.successes),0,3),failures:c(n(s.deathSaves.failures),0,3)},
 concentrating:Boolean(s.concentrating),activeEffects:s.activeEffects.map(x=>({...x,id:String(x.id)}))};
}
export const usedHitDice=(p:HitDiePool[])=>p.reduce((a,x)=>a+c(n(x.used),0,Math.max(0,n(x.max))),0);
export const usedSpellSlots=(p:SpellSlotPool[])=>p.reduce((a,x)=>a+c(n(x.used),0,Math.max(0,n(x.max))),0);
export function spendHitDie(input:RestState,die:number,roll:number,con:number){
 const state=normalizeRestState(input),i=state.hitDice.findIndex(x=>x.die===n(die)&&x.used<x.max);
 if(i<0||state.currentHp>=state.maxHp)return{state,spent:false,healing:0};
 const before=state.currentHp,heal=Math.max(0,c(n(roll,1),1,state.hitDice[i].die)+n(con));
 state.hitDice[i].used++;state.currentHp=Math.min(state.maxHp,state.currentHp+heal);
 return{state,spent:true,healing:state.currentHp-before};
}
export function recoverHitDice(p:HitDiePool[],r:RestRulesetId){
 const s=normalizeRestState({currentHp:0,maxHp:0,tempHp:0,hitDice:p,spellSlots:[],resources:[],exhaustion:0,deathSaves:{successes:0,failures:0},concentrating:false,activeEffects:[]}).hitDice;
 const total=s.reduce((a,x)=>a+x.max,0);let left=r==="dnd_2014"?Math.max(1,Math.floor(total/2)):total;
 for(const x of s){const q=Math.min(x.used,left);x.used-=q;left-=q;if(left<=0)break}return s;
}
export function recoverSpellSlots(p:SpellSlotPool[],k:RestKind){return p.map(x=>{const max=Math.max(0,n(x.max)),used=c(n(x.used),0,max);return{level:c(n(x.level,1),1,9),max,used:k==="long"||(k==="short"&&x.pact)?0:used,pact:Boolean(x.pact)}})}
export function recoverResources(p:ResourcePool[],k:RestKind){return p.map(x=>{const max=Math.max(0,n(x.max)),current=c(n(x.current),0,max),ok=x.recovery==="both"||x.recovery===k||(k==="long"&&x.recovery==="short");return{...x,max,current:ok?max:current}})}
export function spendSpellSlot(p:SpellSlotPool[],level:number){const out=p.map(x=>({...x,pact:Boolean(x.pact)})),t=out.find(x=>x.level===level&&x.used<x.max);if(t)t.used++;return out}
export function spendResource(p:ResourcePool[],id:string,amount=1){return p.map(x=>x.id===id?{...x,current:Math.max(0,c(n(x.current),0,Math.max(0,n(x.max)))-Math.max(0,n(amount)))}:{...x})}
export function applyRest(input:RestState,k:RestKind,r:RestRulesetId){
 const before=normalizeRestState(input),state=normalizeRestState(input),removed:string[]=[];
 state.activeEffects=state.activeEffects.filter(e=>{const rm=e.expiresOn===k||(k==="long"&&e.expiresOn==="short")||(k==="long"&&e.durationType!=="permanent");if(rm)removed.push(e.id);return!rm});
 state.spellSlots=recoverSpellSlots(state.spellSlots,k);state.resources=recoverResources(state.resources,k);
 if(k==="long"){state.currentHp=state.maxHp;state.tempHp=0;state.hitDice=recoverHitDice(state.hitDice,r);state.deathSaves={successes:0,failures:0};state.concentrating=false;state.exhaustion=r==="dnd_2014"?Math.max(0,state.exhaustion-1):0}
 return{state,summary:{kind:k,hpRecovered:state.currentHp-before.currentHp,tempHpRemoved:before.tempHp-state.tempHp,hitDiceRecovered:usedHitDice(before.hitDice)-usedHitDice(state.hitDice),spellSlotsRecovered:usedSpellSlots(before.spellSlots)-usedSpellSlots(state.spellSlots),exhaustionRemoved:before.exhaustion-state.exhaustion,effectsRemoved:removed}};
}
export const applyShortRest=(s:RestState,r:RestRulesetId="dnd_2014")=>applyRest(s,"short",r);
export const applyLongRest=(s:RestState,r:RestRulesetId)=>applyRest(s,"long",r);
