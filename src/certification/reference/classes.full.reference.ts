export type CertifiedClassReference = {
  id: string;
  name: string;
  hitDie: number;
  savingThrows: [string, string];
  skillChoices: number;
  subclassLevel2014: number;
  subclassLevel2024: number;
};

export const CERTIFIED_CLASSES: CertifiedClassReference[] = [
  { id:"barbarian", name:"Barbarian", hitDie:12, savingThrows:["str","con"], skillChoices:2, subclassLevel2014:3, subclassLevel2024:3 },
  { id:"bard", name:"Bard", hitDie:8, savingThrows:["dex","cha"], skillChoices:3, subclassLevel2014:3, subclassLevel2024:3 },
  { id:"cleric", name:"Cleric", hitDie:8, savingThrows:["wis","cha"], skillChoices:2, subclassLevel2014:1, subclassLevel2024:3 },
  { id:"druid", name:"Druid", hitDie:8, savingThrows:["int","wis"], skillChoices:2, subclassLevel2014:2, subclassLevel2024:3 },
  { id:"fighter", name:"Fighter", hitDie:10, savingThrows:["str","con"], skillChoices:2, subclassLevel2014:3, subclassLevel2024:3 },
  { id:"monk", name:"Monk", hitDie:8, savingThrows:["str","dex"], skillChoices:2, subclassLevel2014:3, subclassLevel2024:3 },
  { id:"paladin", name:"Paladin", hitDie:10, savingThrows:["wis","cha"], skillChoices:2, subclassLevel2014:3, subclassLevel2024:3 },
  { id:"ranger", name:"Ranger", hitDie:10, savingThrows:["str","dex"], skillChoices:3, subclassLevel2014:3, subclassLevel2024:3 },
  { id:"rogue", name:"Rogue", hitDie:8, savingThrows:["dex","int"], skillChoices:4, subclassLevel2014:3, subclassLevel2024:3 },
  { id:"sorcerer", name:"Sorcerer", hitDie:6, savingThrows:["con","cha"], skillChoices:2, subclassLevel2014:1, subclassLevel2024:3 },
  { id:"warlock", name:"Warlock", hitDie:8, savingThrows:["wis","cha"], skillChoices:2, subclassLevel2014:1, subclassLevel2024:3 },
  { id:"wizard", name:"Wizard", hitDie:6, savingThrows:["int","wis"], skillChoices:2, subclassLevel2014:2, subclassLevel2024:3 },
];
