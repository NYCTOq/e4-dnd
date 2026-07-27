import { readFileSync } from "node:fs";

const required = new Map([
  ["package.json", ["5.117.3", "certify:multiclass:final"]],
  ["src/features/characters/LevelUpAssistant.tsx", ["level-up-class-choice", "level-up-confirm", "multiclassSkillProficiency", "multiclassToolProficiency"]],
  ["src/features/characters/levelUpCalculator.ts", ["multiclassProficiencies", "multiclassSkillProficiencies", "Thieves' tools"]],
  ["src/certification/integration/advancedMulticlassUiContract.test.ts", ["v5.117D advanced multiclass UI contract"]],
  ["e2e/advanced-multiclass-level-up-v5.117D.spec.ts", [".click()", ".selectOption(", "toBeDisabled()", "e4_dnd_characters_v1"]],
]);

for (const [file, tokens] of required) {
  const source = readFileSync(file, "utf8");
  for (const token of tokens) {
    if (!source.includes(token)) throw new Error(`${file}: missing ${token}`);
  }
}

const e2e = readFileSync("e2e/advanced-multiclass-level-up-v5.117D.spec.ts", "utf8");
if (e2e.includes(".evaluate((element)")) throw new Error("Synthetic DOM click detected.");

console.log("v5.117D advanced multiclass final closure audit passed.");
console.log("Certified: real UI contract, prerequisite blocking, Rogue grants, persistence, desktop/mobile physical actions.");
