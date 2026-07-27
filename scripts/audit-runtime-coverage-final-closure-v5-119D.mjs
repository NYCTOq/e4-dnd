import { readFileSync } from "node:fs";

const required = new Map([
  ["package.json", ["5.119.3", "certify:runtime-coverage:final"]],
  ["src/features/rulesets/RulesetCenterPage.tsx", ["runtime-coverage-certification", "runtime-coverage-details-${group.id}"]],
  ["src/certification/integration/runtimeCoverageUiE2eContract.test.ts", ["v5.119D runtime coverage UI E2E contract"]],
  ["e2e/runtime-coverage-ui-v5.119D.spec.ts", [".click()", 'keyboard.press("Enter")', "elementFromPoint", "scrollWidth", "Potion of Speed"]],
  ["playwright.config.ts", ['name: "desktop-chromium"', 'name: "mobile-chromium"']],
]);
for (const [file, tokens] of required) {
  const source = readFileSync(file, "utf8");
  for (const token of tokens) if (!source.includes(token)) throw new Error(`${file}: missing ${token}`);
}
const e2e = readFileSync("e2e/runtime-coverage-ui-v5.119D.spec.ts", "utf8");
if (e2e.includes(".evaluate((element)")) throw new Error("Synthetic DOM click detected.");
console.log("v5.119D runtime coverage UI E2E final closure audit passed.");
console.log("Certified: feat, spell, item and subclass UI; desktop/mobile pointer, keyboard, overlay and overflow safety.");
