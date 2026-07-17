import type { Character } from "../character/character.types";
import { auditCharacterLifecycle, type LifecycleSnapshot } from "../character/characterLifecycleAudit";
import { auditCharacterIntegrity } from "../character/characterIntegrity";
import { getLevel20Certification } from "./level20Certification";
import { getRuntimeCoverageCertification } from "./runtimeCoverageCertification";
import type { DndClassData, RulesetData } from "./ruleset.types";

export type MatrixStatus = "pass" | "warning" | "fail";
export type CharacterCertificationCheck = {
  id: string;
  label: string;
  status: MatrixStatus;
  detail: string;
};
export type ClassEditionCertification = {
  ruleset: RulesetData["id"];
  className: string;
  criticalLevels: number[];
  subclassLevel: number;
  spellProgression: DndClassData["spellProgression"];
  status: MatrixStatus;
  issues: string[];
};
export type FullCharacterCertification = {
  status: "certified" | "needs-work";
  score: number;
  combinations: number;
  classMatrix: ClassEditionCertification[];
  checks: CharacterCertificationCheck[];
  blockers: string[];
};

const RUNTIME_ENGINES = new Set([
  "barbarian", "bard", "cleric", "druid", "fighter", "monk",
  "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard",
]);
const RESOURCE_LEVELS: Record<string, number[]> = {
  barbarian: [1, 2, 5, 9, 11, 17, 20], bard: [1, 2, 5, 10, 18, 20],
  cleric: [1, 2, 5, 10, 17, 20], druid: [1, 2, 4, 8, 18, 20],
  fighter: [1, 2, 3, 5, 11, 17, 20], monk: [1, 2, 3, 5, 11, 17, 20],
  paladin: [1, 2, 3, 5, 6, 11, 18, 20], ranger: [1, 2, 3, 5, 11, 17, 20],
  rogue: [1, 2, 3, 5, 11, 17, 20], sorcerer: [1, 2, 3, 5, 10, 17, 20],
  warlock: [1, 2, 3, 5, 11, 17, 20], wizard: [1, 2, 3, 5, 11, 18, 20],
};
const uniqueSorted = (values: number[]) => [...new Set(values.filter((value) => value >= 1 && value <= 20))].sort((a, b) => a - b);
const progressionHasLevel = (classData: DndClassData, level: number) => classData.levels.some((entry) => entry.level === level);

export function certifyClassEdition(data: RulesetData, classData: DndClassData): ClassEditionCertification {
  const key = classData.name.toLowerCase();
  const criticalLevels = uniqueSorted([...(RESOURCE_LEVELS[key] ?? [1, 5, 11, 17, 20]), classData.subclassLevel]);
  const issues: string[] = [];
  if (!RUNTIME_ENGINES.has(key)) issues.push("Dedicated class runtime bulunamadı.");
  if (classData.levels.length !== 20 || !criticalLevels.every((level) => progressionHasLevel(classData, level))) issues.push("Kritik level progression kaydı eksik.");
  if (!data.subclasses.some((subclass) => subclass.className === classData.name && subclass.selectionLevel === classData.subclassLevel)) issues.push("Subclass seçim seviyesi class progression ile eşleşmiyor.");
  const level20 = classData.levels.find((entry) => entry.level === 20);
  if (!level20?.features.length) issues.push("Level 20 capstone/progression özelliği bulunamadı.");
  if (classData.spellProgression === "pact" && !classData.levels.some((entry) => entry.pactMagic)) issues.push("Pact Magic progression bulunamadı.");
  if (["full", "half", "third"].includes(classData.spellProgression) && !classData.levels.some((entry) => entry.spellSlots?.some((slot) => slot > 0))) issues.push("Spell slot progression bulunamadı.");
  return { ruleset: data.id, className: classData.name, criticalLevels, subclassLevel: classData.subclassLevel, spellProgression: classData.spellProgression, status: issues.length ? "fail" : "pass", issues };
}

export function certifyCharacterRecord(character: Character, data: RulesetData | null): CharacterCertificationCheck {
  const integrity = auditCharacterIntegrity(character, data);
  return {
    id: `character-${character.id}`,
    label: `${character.name || "Adsız karakter"} integrity`,
    status: integrity.errors ? "fail" : integrity.warnings ? "warning" : "pass",
    detail: `${integrity.score}/100 · ${integrity.errors} hata · ${integrity.warnings} uyarı`,
  };
}

export function certifyCharacterLifecycle(snapshots: LifecycleSnapshot[]): CharacterCertificationCheck {
  const result = auditCharacterLifecycle(snapshots);
  return {
    id: "character-lifecycle",
    label: "Create → level up → rest → backup restore",
    status: result.passed ? "pass" : "fail",
    detail: `${result.score}/100 · ${result.checks.filter((check) => check.passed).length}/${result.checks.length} checkpoint`,
  };
}

export function getFullCharacterCertification(rulesets: RulesetData[]): FullCharacterCertification {
  const classMatrix = rulesets.flatMap((data) => data.classes.map((classData) => certifyClassEdition(data, classData)));
  const levelCertifications = rulesets.map((data) => getLevel20Certification(data));
  const runtimeCertifications = rulesets.map((data) => getRuntimeCoverageCertification(data));
  const checks: CharacterCertificationCheck[] = [
    {
      id: "class-edition-matrix", label: "12 class × 2 edition certification matrix",
      status: classMatrix.length === 24 && classMatrix.every((entry) => entry.status === "pass") ? "pass" : "fail",
      detail: `${classMatrix.filter((entry) => entry.status === "pass").length}/${classMatrix.length} kombinasyon`,
    },
    {
      id: "level-1-20", label: "Level 1–20 progression and references",
      status: levelCertifications.every((entry) => entry.certified) ? "pass" : "fail",
      detail: levelCertifications.map((entry, index) => `${rulesets[index]?.id}: ${entry.score}`).join(" · "),
    },
    {
      id: "runtime-coverage", label: "Class/subclass/feat/spell/item runtime coverage",
      status: runtimeCertifications.every((entry) => entry.status === "certified") ? "pass" : "warning",
      detail: runtimeCertifications.map((entry, index) => `${rulesets[index]?.id}: ${entry.score}`).join(" · "),
    },
    {
      id: "content-families", label: "Playable origin, spell and equipment families",
      status: rulesets.every((data) => data.races.length > 0 && data.backgrounds.length > 0 && data.spells.length > 0 && data.items.some((item) => item.category === "weapon") && data.items.some((item) => item.category === "armor")) ? "pass" : "fail",
      detail: rulesets.map((data) => `${data.id}: ${data.races.length} origin · ${data.backgrounds.length} background · ${data.spells.length} spell · ${data.items.length} item`).join(" | "),
    },
  ];
  const blockers = [
    ...classMatrix.flatMap((entry) => entry.issues.map((issue) => `${entry.ruleset} · ${entry.className}: ${issue}`)),
    ...levelCertifications.flatMap((entry, index) => entry.blockers.map((blocker) => `${rulesets[index]?.id}: ${blocker}`)),
  ];
  const score = Math.round(checks.reduce((sum, check) => sum + (check.status === "pass" ? 100 : check.status === "warning" ? 65 : 0), 0) / checks.length);
  return { status: blockers.length === 0 && checks.every((check) => check.status !== "fail") ? "certified" : "needs-work", score, combinations: classMatrix.length, classMatrix, checks, blockers };
}
