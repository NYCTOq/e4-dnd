export type RulesetReferenceId = "dnd_2014" | "dnd_2024";
export type ReferenceSource = { publisher:"Wizards of the Coast"; document:string; section:string; ruleset:RulesetReferenceId; verifiedAt:string; };
export type SpeciesReference = { id:string; name:string; speed:number; sizeOptions:Array<"Small"|"Medium">; fixedSkills?:string[]; skillChoices?:number; originFeatChoices?:number; languageChoices?:number; source:ReferenceSource; };
export type BackgroundReference = { id:string; name:string; abilityOptions?:string[]; abilityModes?:Array<"2-1"|"1-1-1">; grantedSkills:string[]; grantedOriginFeat?:string; source:ReferenceSource; };
export type ClassReference = { id:string; name:string; hitDie:number; savingThrows:string[]; skillChoices:number; subclassLevel:number; source:ReferenceSource; };
