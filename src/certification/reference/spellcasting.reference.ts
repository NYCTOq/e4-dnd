export type Progression = "full"|"half"|"pact"|"third"|"none";

export const CERTIFIED_CASTERS = [
  {name:"Bard",progression:"full",ability:"cha"},
  {name:"Cleric",progression:"full",ability:"wis"},
  {name:"Druid",progression:"full",ability:"wis"},
  {name:"Paladin",progression:"half",ability:"cha"},
  {name:"Ranger",progression:"half",ability:"wis"},
  {name:"Sorcerer",progression:"full",ability:"cha"},
  {name:"Warlock",progression:"pact",ability:"cha"},
  {name:"Wizard",progression:"full",ability:"int"},
] as const;

export const FULL_CASTER_SLOTS: Record<number, number[]> = {
1:[2,0,0,0,0,0,0,0,0],2:[3,0,0,0,0,0,0,0,0],3:[4,2,0,0,0,0,0,0,0],4:[4,3,0,0,0,0,0,0,0],
5:[4,3,2,0,0,0,0,0,0],6:[4,3,3,0,0,0,0,0,0],7:[4,3,3,1,0,0,0,0,0],8:[4,3,3,2,0,0,0,0,0],
9:[4,3,3,3,1,0,0,0,0],10:[4,3,3,3,2,0,0,0,0],11:[4,3,3,3,2,1,0,0,0],12:[4,3,3,3,2,1,0,0,0],
13:[4,3,3,3,2,1,1,0,0],14:[4,3,3,3,2,1,1,0,0],15:[4,3,3,3,2,1,1,1,0],16:[4,3,3,3,2,1,1,1,0],
17:[4,3,3,3,2,1,1,1,1],18:[4,3,3,3,3,1,1,1,1],19:[4,3,3,3,3,2,1,1,1],20:[4,3,3,3,3,2,2,1,1]
};

export const HALF_CASTER_SLOTS: Record<number, number[]> = {
1:[0,0,0,0,0],2:[2,0,0,0,0],3:[3,0,0,0,0],4:[3,0,0,0,0],5:[4,2,0,0,0],6:[4,2,0,0,0],
7:[4,3,0,0,0],8:[4,3,0,0,0],9:[4,3,2,0,0],10:[4,3,2,0,0],11:[4,3,3,0,0],12:[4,3,3,0,0],
13:[4,3,3,1,0],14:[4,3,3,1,0],15:[4,3,3,2,0],16:[4,3,3,2,0],17:[4,3,3,3,1],18:[4,3,3,3,1],
19:[4,3,3,3,2],20:[4,3,3,3,2]
};

export const WARLOCK_PACT: Record<number,{slots:number;slotLevel:number}> = {
1:{slots:1,slotLevel:1},2:{slots:2,slotLevel:1},3:{slots:2,slotLevel:2},4:{slots:2,slotLevel:2},
5:{slots:2,slotLevel:3},6:{slots:2,slotLevel:3},7:{slots:2,slotLevel:4},8:{slots:2,slotLevel:4},
9:{slots:2,slotLevel:5},10:{slots:2,slotLevel:5},11:{slots:3,slotLevel:5},12:{slots:3,slotLevel:5},
13:{slots:3,slotLevel:5},14:{slots:3,slotLevel:5},15:{slots:3,slotLevel:5},16:{slots:3,slotLevel:5},
17:{slots:4,slotLevel:5},18:{slots:4,slotLevel:5},19:{slots:4,slotLevel:5},20:{slots:4,slotLevel:5}
};

export const THIRD_CASTER_MAX: Record<number,number> = {
1:0,2:0,3:1,4:1,5:1,6:1,7:2,8:2,9:2,10:2,11:2,12:2,13:3,14:3,15:3,16:3,17:3,18:3,19:4,20:4
};
