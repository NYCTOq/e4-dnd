export type AdvancementMilestoneKind =
  | "subclass"
  | "asi-feat"
  | "epic-boon"
  | "extra-attack"
  | "spell-progression"
  | "resource-progression"
  | "capstone";

export type AdvancementMilestone = {
  level: number;
  kind: AdvancementMilestoneKind;
  required: boolean;
};

export type AdvancementJourneyScenario = {
  id: string;
  ruleset: "dnd_2014" | "dnd_2024";
  className: string;
  subclassLevel: number;
  asiLevels: number[];
  spellcaster: boolean;
  pactMagic: boolean;
  extraAttackLevels: number[];
  milestones: AdvancementMilestone[];
};

const standardAsi = [4, 8, 12, 16, 19];

function scenario(
  id: string,
  ruleset: AdvancementJourneyScenario["ruleset"],
  className: string,
  subclassLevel: number,
  options: Partial<Pick<AdvancementJourneyScenario, "asiLevels" | "spellcaster" | "pactMagic" | "extraAttackLevels">> = {},
): AdvancementJourneyScenario {
  const asiLevels = options.asiLevels ?? standardAsi;
  const milestones: AdvancementMilestone[] = [
    { level: subclassLevel, kind: "subclass", required: true },
    ...asiLevels.map((level) => ({ level, kind: level === 19 && ruleset === "dnd_2024" ? "epic-boon" as const : "asi-feat" as const, required: true })),
    ...(options.extraAttackLevels ?? []).map((level) => ({ level, kind: "extra-attack" as const, required: false })),
    ...(options.spellcaster ? [{ level: 2, kind: "spell-progression" as const, required: false }] : []),
    { level: 2, kind: "resource-progression", required: false },
    { level: 20, kind: "capstone", required: false },
  ];
  return {
    id,
    ruleset,
    className,
    subclassLevel,
    asiLevels,
    spellcaster: options.spellcaster ?? false,
    pactMagic: options.pactMagic ?? false,
    extraAttackLevels: options.extraAttackLevels ?? [],
    milestones,
  };
}

export const LEVEL_ONE_TO_TWENTY_SCENARIOS: AdvancementJourneyScenario[] = [
  scenario("2024-fighter-1-20", "dnd_2024", "Fighter", 3, { asiLevels: [4, 6, 8, 12, 14, 16, 19], extraAttackLevels: [5, 11, 20] }),
  scenario("2024-wizard-1-20", "dnd_2024", "Wizard", 3, { spellcaster: true }),
  scenario("2024-cleric-1-20", "dnd_2024", "Cleric", 3, { spellcaster: true }),
  scenario("2024-warlock-1-20", "dnd_2024", "Warlock", 3, { spellcaster: true, pactMagic: true }),
  scenario("2014-rogue-1-20", "dnd_2014", "Rogue", 3, { asiLevels: [4, 8, 10, 12, 16, 19] }),
  scenario("2014-monk-1-20", "dnd_2014", "Monk", 3, { extraAttackLevels: [5] }),
];

export type AdvancementJourneyCoverage = {
  ready: boolean;
  scenarioCount: number;
  classCount: number;
  rulesetCount: number;
  levelsCovered: number[];
  coversSubclass: boolean;
  coversAsiFeat: boolean;
  coversEpicBoon: boolean;
  coversExtraAttack: boolean;
  coversSpellProgression: boolean;
  coversPactMagic: boolean;
  coversCapstone: boolean;
  uniqueIds: boolean;
};

export function getLevelOneToTwentyJourneyCoverage(
  scenarios: AdvancementJourneyScenario[] = LEVEL_ONE_TO_TWENTY_SCENARIOS,
): AdvancementJourneyCoverage {
  const milestones = scenarios.flatMap((item) => item.milestones);
  const ids = scenarios.map((item) => item.id);
  const levelsCovered = [...new Set([1, 20, ...milestones.map((item) => item.level)])].sort((a, b) => a - b);
  const report: AdvancementJourneyCoverage = {
    ready: false,
    scenarioCount: scenarios.length,
    classCount: new Set(scenarios.map((item) => item.className)).size,
    rulesetCount: new Set(scenarios.map((item) => item.ruleset)).size,
    levelsCovered,
    coversSubclass: milestones.some((item) => item.kind === "subclass"),
    coversAsiFeat: milestones.some((item) => item.kind === "asi-feat"),
    coversEpicBoon: milestones.some((item) => item.kind === "epic-boon"),
    coversExtraAttack: milestones.some((item) => item.kind === "extra-attack"),
    coversSpellProgression: milestones.some((item) => item.kind === "spell-progression"),
    coversPactMagic: scenarios.some((item) => item.pactMagic),
    coversCapstone: milestones.some((item) => item.kind === "capstone" && item.level === 20),
    uniqueIds: new Set(ids).size === ids.length,
  };
  report.ready = report.scenarioCount >= 6
    && report.classCount >= 6
    && report.rulesetCount === 2
    && report.coversSubclass
    && report.coversAsiFeat
    && report.coversEpicBoon
    && report.coversExtraAttack
    && report.coversSpellProgression
    && report.coversPactMagic
    && report.coversCapstone
    && report.uniqueIds;
  return report;
}

export function getRequiredMilestonesAtLevel(
  scenario: AdvancementJourneyScenario,
  level: number,
): AdvancementMilestone[] {
  if (!Number.isInteger(level) || level < 1 || level > 20) return [];
  return scenario.milestones.filter((item) => item.level === level && item.required);
}
