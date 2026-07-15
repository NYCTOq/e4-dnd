import type { RulesetId } from "../character/character.types";

export type RulesetReadiness = "ready" | "foundation" | "custom";

export type RulesetDefinition = {
  id: RulesetId;
  name: string;
  shortName: string;
  editionLabel: string;
  readiness: RulesetReadiness;
  raceTerm: string;
  racePluralTerm: string;
  backgroundAbilitySource: boolean;
  subclassLevelMode: "class-defined" | "level-3" | "custom";
  supportsWeaponMastery: boolean;
  notes: string[];
};

export const RULESET_DEFINITIONS: readonly RulesetDefinition[] = [
  {
    id: "dnd_2014",
    name: "D&D 5e 2014",
    shortName: "2014",
    editionLabel: "2014 Core Rules",
    readiness: "ready",
    raceTerm: "Race",
    racePluralTerm: "Races",
    backgroundAbilitySource: false,
    subclassLevelMode: "class-defined",
    supportsWeaponMastery: false,
    notes: ["Race ability bonuses", "Class-defined subclass levels", "2014 feat and spell rules"],
  },
  {
    id: "dnd_2024",
    name: "D&D 5e 2024",
    shortName: "2024",
    editionLabel: "2024 Core Rules",
    readiness: "foundation",
    raceTerm: "Species",
    racePluralTerm: "Species",
    backgroundAbilitySource: true,
    subclassLevelMode: "level-3",
    supportsWeaponMastery: true,
    notes: ["Background ability increases", "Subclass at level 3", "Origin feats and Weapon Mastery"],
  },
  {
    id: "homebrew",
    name: "Homebrew / Custom",
    shortName: "Custom",
    editionLabel: "Custom Rules",
    readiness: "custom",
    raceTerm: "Race / Species",
    racePluralTerm: "Races / Species",
    backgroundAbilitySource: false,
    subclassLevelMode: "custom",
    supportsWeaponMastery: false,
    notes: ["Manual values", "Custom classes and ancestry", "Campaign-specific rules"],
  },
] as const;

export function getRulesetDefinition(id: RulesetId): RulesetDefinition {
  return RULESET_DEFINITIONS.find((item) => item.id === id) ?? RULESET_DEFINITIONS[0];
}

export function isRulesetId(value: unknown): value is RulesetId {
  return value === "dnd_2014" || value === "dnd_2024" || value === "homebrew";
}
