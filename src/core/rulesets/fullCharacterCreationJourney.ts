import type { RulesetId } from "../character/character.types";

export interface CharacterCreationJourneyScenario {
  id: string;
  ruleset: RulesetId;
  className: string;
  requiresSpellcasting: boolean;
  expectedRoutes: string[];
}

export const FULL_CHARACTER_CREATION_SCENARIOS: CharacterCreationJourneyScenario[] = [
  { id: "2024-fighter", ruleset: "dnd_2024", className: "Fighter", requiresSpellcasting: false, expectedRoutes: ["/builder", "/characters", "/play-mode", "/rest"] },
  { id: "2024-wizard", ruleset: "dnd_2024", className: "Wizard", requiresSpellcasting: true, expectedRoutes: ["/builder", "/characters", "/play-mode", "/rest"] },
  { id: "2024-cleric", ruleset: "dnd_2024", className: "Cleric", requiresSpellcasting: true, expectedRoutes: ["/builder", "/characters", "/play-mode", "/rest"] },
  { id: "2024-warlock", ruleset: "dnd_2024", className: "Warlock", requiresSpellcasting: true, expectedRoutes: ["/builder", "/characters", "/play-mode", "/rest"] },
  { id: "2014-bard", ruleset: "dnd_2014", className: "Bard", requiresSpellcasting: true, expectedRoutes: ["/builder", "/characters", "/play-mode", "/rest"] },
  { id: "2014-monk", ruleset: "dnd_2014", className: "Monk", requiresSpellcasting: false, expectedRoutes: ["/builder", "/characters", "/play-mode", "/rest"] },
  { id: "2014-paladin", ruleset: "dnd_2014", className: "Paladin", requiresSpellcasting: false, expectedRoutes: ["/builder", "/characters", "/play-mode", "/rest"] },
  { id: "2014-rogue", ruleset: "dnd_2014", className: "Rogue", requiresSpellcasting: false, expectedRoutes: ["/builder", "/characters", "/play-mode", "/rest"] },
];

export function getCharacterCreationJourneyCoverage(scenarios = FULL_CHARACTER_CREATION_SCENARIOS) {
  const ids = new Set(scenarios.map((scenario) => scenario.id));
  const classes = new Set(scenarios.map((scenario) => scenario.className));
  const rulesets = new Set(scenarios.map((scenario) => scenario.ruleset));
  const routeCoverage = new Set(scenarios.flatMap((scenario) => scenario.expectedRoutes));
  return {
    scenarioCount: scenarios.length,
    uniqueIds: ids.size === scenarios.length,
    classCount: classes.size,
    rulesetCount: rulesets.size,
    coversBuilder: routeCoverage.has("/builder"),
    coversSheet: routeCoverage.has("/characters"),
    coversPlayMode: routeCoverage.has("/play-mode"),
    coversRest: routeCoverage.has("/rest"),
    ready: ids.size === scenarios.length && classes.size >= 8 && rulesets.size === 2 && ["/builder", "/characters", "/play-mode", "/rest"].every((route) => routeCoverage.has(route)),
  };
}
