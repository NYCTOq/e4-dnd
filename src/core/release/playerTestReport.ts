import type { Character } from "../character/character.types";
import { auditCharacterIntegrity } from "../character/characterIntegrity";
import type { RulesetData } from "../rulesets/ruleset.types";
import { getReleaseReadiness } from "./releaseReadiness";

export type PlayerFeedback = { category: string; severity: string; steps: string; expected: string; actual: string; device: string };

export function createPlayerTestReport(input: { appVersion: string; characters: Character[]; rulesetData: RulesetData | null; feedback?: PlayerFeedback }) {
  return {
    schema: "e4-dnd-player-test-report-v1",
    createdAt: new Date().toISOString(),
    appVersion: input.appVersion,
    environment: typeof navigator === "undefined" ? "unavailable" : { userAgent: navigator.userAgent, language: navigator.language },
    ruleset: input.rulesetData ? { id: input.rulesetData.id, name: input.rulesetData.name } : null,
    readiness: getReleaseReadiness(input.characters, input.rulesetData),
    characters: input.characters.map((character, index) => {
      const integrity = auditCharacterIntegrity(character, input.rulesetData);
      return { reference: `character-${index + 1}`, ruleset: character.ruleset, level: character.level, className: character.className, subclass: character.subclass, integrity: { status: integrity.status, score: integrity.score, issueIds: integrity.issues.map((issue) => issue.id) } };
    }),
    feedback: input.feedback,
    privacy: "Character/player names, free-form character notes and inventory notes are excluded.",
  };
}

export function downloadPlayerTestReport(report: ReturnType<typeof createPlayerTestReport>) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `e4-dnd-player-test-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
