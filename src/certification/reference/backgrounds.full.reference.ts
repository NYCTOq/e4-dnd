export type CertifiedBackgroundReference = {
  id: string;
  name: string;
  ruleset: "dnd_2014" | "dnd_2024";
  skillCount: number;
  grantedSkills?: string[];
  grantsOriginFeat: boolean;
  abilityChoiceCount: number;
};

export const CERTIFIED_BACKGROUNDS_2014: CertifiedBackgroundReference[] = [
  { id:"acolyte", name:"Acolyte", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Insight","Religion"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"criminal", name:"Criminal", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Deception","Stealth"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"entertainer", name:"Entertainer", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Acrobatics","Performance"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"folk-hero", name:"Folk Hero", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Animal Handling","Survival"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"guild-artisan", name:"Guild Artisan", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Insight","Persuasion"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"hermit", name:"Hermit", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Medicine","Religion"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"noble", name:"Noble", ruleset:"dnd_2014", skillCount:2, grantedSkills:["History","Persuasion"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"outlander", name:"Outlander", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Athletics","Survival"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"sage", name:"Sage", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Arcana","History"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"sailor", name:"Sailor", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Athletics","Perception"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"soldier", name:"Soldier", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Athletics","Intimidation"], grantsOriginFeat:false, abilityChoiceCount:0 },
  { id:"urchin", name:"Urchin", ruleset:"dnd_2014", skillCount:2, grantedSkills:["Sleight of Hand","Stealth"], grantsOriginFeat:false, abilityChoiceCount:0 },
];

export const CERTIFIED_BACKGROUNDS_2024: CertifiedBackgroundReference[] = [
  { id:"acolyte", name:"Acolyte", ruleset:"dnd_2024", skillCount:2, grantedSkills:["Insight","Religion"], grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"artisan", name:"Artisan", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"charlatan", name:"Charlatan", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"criminal", name:"Criminal", ruleset:"dnd_2024", skillCount:2, grantedSkills:["Sleight of Hand","Stealth"], grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"entertainer", name:"Entertainer", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"farmer", name:"Farmer", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"guard", name:"Guard", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"guide", name:"Guide", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"hermit", name:"Hermit", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"merchant", name:"Merchant", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"noble", name:"Noble", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"sage", name:"Sage", ruleset:"dnd_2024", skillCount:2, grantedSkills:["Arcana","History"], grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"sailor", name:"Sailor", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"scribe", name:"Scribe", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"soldier", name:"Soldier", ruleset:"dnd_2024", skillCount:2, grantedSkills:["Athletics","Intimidation"], grantsOriginFeat:true, abilityChoiceCount:3 },
  { id:"wayfarer", name:"Wayfarer", ruleset:"dnd_2024", skillCount:2, grantsOriginFeat:true, abilityChoiceCount:3 },
];
