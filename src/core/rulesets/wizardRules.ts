export function getArcaneRecoveryBudget(level:number){return Math.ceil(Math.max(1,Math.min(20,level))/2)}
export function canRecoverWizardSlot(slotLevel:number,spent:number,budgetRemaining:number){return slotLevel>=1&&slotLevel<=5&&spent>0&&budgetRemaining>=slotLevel}
export function getWizardCombatFeatures(level:number){return{arcaneRecovery:level>=1,scholar:level>=2,memorizeSpell:level>=5,spellMastery:level>=18,signatureSpells:level>=20}}
