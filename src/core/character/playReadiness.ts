import type { Character } from "./character.types";
import type { RulesetData } from "../rulesets/ruleset.types";
import { auditCharacterIntegrity } from "./characterIntegrity";

export type PlayReadinessIssue = { id: string; severity: "error" | "warning"; message: string; section?: string };
export type PlayReadiness = { status: "ready" | "needs-attention"; score: number; issues: PlayReadinessIssue[] };

export function getPlayReadiness(character: Character, rulesetData: RulesetData | null): PlayReadiness {
  const report = auditCharacterIntegrity(character, rulesetData);
  return { status: report.status, score: report.score, issues: report.issues };
}
