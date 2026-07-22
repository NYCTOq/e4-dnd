import type { RulesetData } from "./ruleset.types";

export type ClassRuntimeArea = "builder" | "sheet" | "play" | "rest";
export type ClassRuntimeState = "complete" | "partial" | "missing";

export interface ClassRuntimeExpectation {
  classId: string;
  className: string;
  choices: string[];
  resources: string[];
  runtimeFeatures: string[];
  recovery: string[];
}

export interface ClassRuntimeAreaReport {
  area: ClassRuntimeArea;
  state: ClassRuntimeState;
  matched: string[];
  missing: string[];
}

export interface ClassSpecificRuntimeReport {
  classId: string;
  className: string;
  state: ClassRuntimeState;
  score: number;
  areas: ClassRuntimeAreaReport[];
  blockers: string[];
  notices: string[];
}

export interface ClassSpecificRuntimePolicyReport {
  state: ClassRuntimeState;
  score: number;
  complete: number;
  partial: number;
  missing: number;
  classes: ClassSpecificRuntimeReport[];
  blockers: string[];
  notices: string[];
}

export const CLASS_RUNTIME_EXPECTATIONS: ClassRuntimeExpectation[] = [
  { classId: "barbarian", className: "Barbarian", choices: ["Primal Knowledge", "Weapon Mastery"], resources: ["Rage"], runtimeFeatures: ["Rage", "Reckless Attack"], recovery: ["Long Rest"] },
  { classId: "bard", className: "Bard", choices: ["Expertise", "Magical Secrets"], resources: ["Bardic Inspiration"], runtimeFeatures: ["Bardic Inspiration", "Jack of All Trades"], recovery: ["Short Rest", "Long Rest"] },
  { classId: "cleric", className: "Cleric", choices: ["Divine Order"], resources: ["Channel Divinity"], runtimeFeatures: ["Channel Divinity", "Divine Intervention"], recovery: ["Short Rest", "Long Rest"] },
  { classId: "druid", className: "Druid", choices: ["Primal Order", "Wild Shape Forms"], resources: ["Wild Shape"], runtimeFeatures: ["Wild Shape", "Wild Resurgence"], recovery: ["Short Rest", "Long Rest"] },
  { classId: "fighter", className: "Fighter", choices: ["Fighting Style", "Weapon Mastery", "Maneuvers"], resources: ["Second Wind", "Action Surge", "Indomitable", "Superiority Dice"], runtimeFeatures: ["Second Wind", "Action Surge", "Extra Attack"], recovery: ["Short Rest", "Long Rest"] },
  { classId: "monk", className: "Monk", choices: ["Focus Techniques", "Weapon Mastery"], resources: ["Focus Points", "Ki Points"], runtimeFeatures: ["Martial Arts", "Flurry of Blows", "Stunning Strike"], recovery: ["Short Rest", "Long Rest"] },
  { classId: "paladin", className: "Paladin", choices: ["Fighting Style", "Oath"], resources: ["Lay on Hands", "Channel Divinity"], runtimeFeatures: ["Lay on Hands", "Divine Smite", "Aura of Protection"], recovery: ["Long Rest"] },
  { classId: "ranger", className: "Ranger", choices: ["Fighting Style", "Weapon Mastery"], resources: ["Favored Enemy"], runtimeFeatures: ["Hunter's Mark", "Deft Explorer"], recovery: ["Long Rest"] },
  { classId: "rogue", className: "Rogue", choices: ["Expertise", "Cunning Strike"], resources: ["Cunning Strike Dice"], runtimeFeatures: ["Sneak Attack", "Cunning Action", "Uncanny Dodge"], recovery: ["Turn Start"] },
  { classId: "sorcerer", className: "Sorcerer", choices: ["Metamagic"], resources: ["Sorcery Points"], runtimeFeatures: ["Font of Magic", "Metamagic"], recovery: ["Long Rest"] },
  { classId: "warlock", className: "Warlock", choices: ["Pact Boon", "Eldritch Invocations", "Mystic Arcanum"], resources: ["Pact Magic"], runtimeFeatures: ["Eldritch Invocations", "Pact Magic"], recovery: ["Short Rest", "Long Rest"] },
  { classId: "wizard", className: "Wizard", choices: ["Spellbook", "Prepared Spells"], resources: ["Arcane Recovery"], runtimeFeatures: ["Spellbook", "Arcane Recovery"], recovery: ["Long Rest"] },
];

const normalize = (value: string) => value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim();
const includesAny = (haystack: string[], needle: string) => {
  const normalizedNeedle = normalize(needle);
  return haystack.some((entry) => normalize(entry).includes(normalizedNeedle) || normalizedNeedle.includes(normalize(entry)));
};

function area(area: ClassRuntimeArea, expected: string[], available: string[]): ClassRuntimeAreaReport {
  const matched = expected.filter((entry) => includesAny(available, entry));
  const missing = expected.filter((entry) => !matched.includes(entry));
  const state: ClassRuntimeState = missing.length === 0 ? "complete" : matched.length > 0 ? "partial" : "missing";
  return { area, state, matched, missing };
}

function scoreFor(areas: ClassRuntimeAreaReport[]): number {
  const points = areas.reduce((sum, entry) => sum + (entry.state === "complete" ? 100 : entry.state === "partial" ? 50 : 0), 0);
  return Math.round(points / Math.max(1, areas.length));
}

export function getClassSpecificRuntimePolicyReport(data: RulesetData | null): ClassSpecificRuntimePolicyReport {
  if (!data) {
    return { state: "missing", score: 0, complete: 0, partial: 0, missing: CLASS_RUNTIME_EXPECTATIONS.length, classes: [], blockers: ["Ruleset verisi yüklenemedi."], notices: [] };
  }

  const classes = CLASS_RUNTIME_EXPECTATIONS.map((expectation): ClassSpecificRuntimeReport => {
    const klass = data.classes.find((entry) => normalize(entry.id) === normalize(expectation.classId) || normalize(entry.name) === normalize(expectation.className));
    if (!klass) {
      return {
        classId: expectation.classId,
        className: expectation.className,
        state: "missing",
        score: 0,
        areas: [],
        blockers: [`${expectation.className} class kataloğunda bulunamadı.`],
        notices: [],
      };
    }

    const classFeatures = klass.levels.flatMap((row) => row.features);
    const subclassFeatures = data.subclasses
      .filter((entry) => normalize(entry.className) === normalize(klass.name))
      .flatMap((entry) => entry.features.map((feature) => feature.name));
    const allFeatures = [...classFeatures, ...subclassFeatures];

    const areas = [
      area("builder", expectation.choices, allFeatures),
      area("sheet", [...expectation.choices, ...expectation.resources], allFeatures),
      area("play", expectation.runtimeFeatures, allFeatures),
      area("rest", expectation.recovery, [...allFeatures, ...expectation.recovery]),
    ];
    const score = scoreFor(areas);
    const state: ClassRuntimeState = areas.some((entry) => entry.state === "missing") ? "missing" : areas.some((entry) => entry.state === "partial") ? "partial" : "complete";
    const blockers = areas.flatMap((entry) => entry.state === "missing" ? [`${expectation.className} ${entry.area}: ${entry.missing.join(", ")} bağlantısı bulunamadı.`] : []);
    const notices = areas.flatMap((entry) => entry.state === "partial" ? [`${expectation.className} ${entry.area}: eksik ${entry.missing.join(", ")}.`] : []);
    return { classId: expectation.classId, className: expectation.className, state, score, areas, blockers, notices };
  });

  const complete = classes.filter((entry) => entry.state === "complete").length;
  const partial = classes.filter((entry) => entry.state === "partial").length;
  const missing = classes.filter((entry) => entry.state === "missing").length;
  const score = Math.round(classes.reduce((sum, entry) => sum + entry.score, 0) / Math.max(1, classes.length));
  const blockers = classes.flatMap((entry) => entry.blockers);
  const notices = classes.flatMap((entry) => entry.notices);
  return {
    state: missing > 0 ? "missing" : partial > 0 ? "partial" : "complete",
    score,
    complete,
    partial,
    missing,
    classes,
    blockers,
    notices,
  };
}
