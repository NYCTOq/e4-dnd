const SLOT_COSTS:Record<number,number>={1:2,2:3,3:5,4:6,5:7};
export function getSorcerySlotCost(level:number){return SLOT_COSTS[level]??null}
export function canCreateSorcerySlot(level:number,pointsRemaining:number,hasSpentSlot:boolean){const cost=getSorcerySlotCost(level);return cost!==null&&pointsRemaining>=cost&&hasSpentSlot}
export function getPointsFromSlot(level:number){return Math.max(1,Math.min(9,Math.floor(level)))}
export function getSorcererCombatFeatures(level:number){return{fontOfMagic:level>=2,metamagic:level>=3,sorcerousRestoration:level>=20}}
