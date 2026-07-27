import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getLevelUpAdvancementReadiness } from "../../core/rulesets/levelUpAdvancementReadiness";
import type { Character } from "../../core/character/character.types";

const assistantSource = readFileSync(
  new URL("../../features/characters/LevelUpAssistant.tsx", import.meta.url),
  "utf8",
);

const fighter = {
  className: "Fighter",
  classLevels: [{ className: "Fighter", level: 1 }],
  level: 1,
  ruleset: "dnd_2024",
  abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
} as Character;

describe("v5.117D advanced multiclass UI contract", () => {
  it("exposes stable physical interaction hooks for the real assistant", () => {
    for (const testId of [
      "level-up-open",
      "level-up-panel",
      "level-up-class-choice",
      "multiclass-skill-choice",
      "multiclass-tool-choice",
      "level-up-readiness",
      "level-up-confirm",
    ]) {
      expect(assistantSource).toContain(`data-testid="${testId}"`);
    }
    expect(assistantSource).toContain("disabled={!advancementReadiness.ready}");
    expect(assistantSource).toContain("multiclassSkillProficiency:multiclassSkill||undefined");
    expect(assistantSource).toContain("multiclassToolProficiency:multiclassTool.trim()||undefined");
  });

  it("blocks an ineligible transition and an incomplete Rogue skill choice", () => {
    const missingPrerequisite = getLevelUpAdvancementReadiness({
      character: { ...fighter, abilities: { ...fighter.abilities, str: 12, dex: 12, int: 16 } },
      rulesetData: null,
      targetClassName: "Wizard",
      milestoneChoiceComplete: true,
    });
    expect(missingPrerequisite.ready).toBe(false);
    expect(missingPrerequisite.blockers.join(" ")).toContain("Fighter: STR veya DEX 13");

    const missingSkill = getLevelUpAdvancementReadiness({
      character: fighter,
      rulesetData: null,
      targetClassName: "Rogue",
      milestoneChoiceComplete: true,
      multiclassSkillChoiceComplete: false,
    });
    expect(missingSkill.ready).toBe(false);
    expect(missingSkill.blockers.join(" ")).toContain("Rogue multiclass skill");
  });
});
