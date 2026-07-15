import type { CharacterValidationIssue } from "./characterValidation";

const VALIDATION_STEP_IDS: Readonly<Record<string, string>> = {
  Basic: "basic",
  Class: "class",
  Abilities: "abilities",
  Skills: "proficiencies",
  Feats: "feats",
  Combat: "combat",
  Spells: "spells",
  Equipment: "equipment",
  Review: "review",
};

export type BuilderStepIssueCounts = { errors: number; warnings: number };

export function getBuilderStepId(validationStep: string) {
  return VALIDATION_STEP_IDS[validationStep] ?? "review";
}

export function getBuilderStepIssueCounts(stepId: string, issues: readonly CharacterValidationIssue[]): BuilderStepIssueCounts {
  return issues.reduce<BuilderStepIssueCounts>((counts, issue) => {
    if (getBuilderStepId(issue.step) !== stepId) return counts;
    if (issue.severity === "error") counts.errors += 1;
    else counts.warnings += 1;
    return counts;
  }, { errors: 0, warnings: 0 });
}

export function getFirstErrorStepIndex(stepIds: readonly string[], issues: readonly CharacterValidationIssue[]) {
  const errorStepIds = new Set(issues.filter((issue) => issue.severity === "error").map((issue) => getBuilderStepId(issue.step)));
  return stepIds.findIndex((stepId) => errorStepIds.has(stepId));
}
