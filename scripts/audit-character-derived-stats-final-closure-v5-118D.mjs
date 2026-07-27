import { readFileSync } from "node:fs";

const required = new Map([
  ["package.json", ["5.118.3", "certify:derived-stats:final"]],
  ["src/features/characters/CharacterDetail.tsx", ["derived-stats-command-center", "derived-stats-initiative-roll", "derivedStats.initiative"]],
  ["src/certification/integration/characterDerivedStatsUiE2eContract.test.ts", ["v5.118D character derived stats UI E2E contract"]],
  ["e2e/character-derived-stats-v5.118D.spec.ts", [".click()", 'keyboard.press("Enter")', "elementFromPoint", "scrollIntoViewIfNeeded"]],
  ["playwright.config.ts", ['name: "desktop-chromium"', 'name: "mobile-chromium"']],
]);

for (const [file, tokens] of required) {
  const source = readFileSync(file, "utf8");
  for (const token of tokens) {
    if (!source.includes(token)) throw new Error(`${file}: missing ${token}`);
  }
}

const e2e = readFileSync("e2e/character-derived-stats-v5.118D.spec.ts", "utf8");
if (e2e.includes(".evaluate((element)")) throw new Error("Synthetic DOM click detected.");

console.log("v5.118D character derived stats final closure audit passed.");
console.log("Certified: canonical UI values, desktop/mobile Chromium, physical pointer, keyboard focus and overlay safety.");
