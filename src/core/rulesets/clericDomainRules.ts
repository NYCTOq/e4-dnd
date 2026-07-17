export type LifeDomainHealing = { healingBonus: number; selfHealing: number; maximizeHealingDice: boolean };

export function getLifeDomainHealing(subclassName:string,clericLevel:number,spellLevel:number):LifeDomainHealing{
  if(!/life domain/i.test(subclassName)||spellLevel<1)return{healingBonus:0,selfHealing:0,maximizeHealingDice:false};
  return{healingBonus:2+spellLevel,selfHealing:clericLevel>=6?2+spellLevel:0,maximizeHealingDice:clericLevel>=17};
}

export function getPreserveLifeHealing(clericLevel:number,currentHp:number,maxHp:number){
  const pool=Math.max(0,clericLevel*5);const missingToHalf=Math.max(0,Math.ceil(maxHp/2)-currentHp);return Math.min(pool,missingToHalf);
}
