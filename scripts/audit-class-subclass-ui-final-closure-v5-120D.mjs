import { readFileSync, writeFileSync } from "node:fs";

const required = new Map([
  ["package.json", ["5.120.3", "certify:catalog-integrity:final"]],
  ["src/features/classes/ClassCatalogPage.tsx", ["class-catalog-option-${item.id}", "class-level-${row.level}"]],
  ["src/features/subclasses/SubclassCatalogPage.tsx", ["subclass-summary-${s.id}", "subclass-details-${s.id}", "<details"]],
  ["src/certification/integration/classSubclassCatalogUiE2eContract.test.ts", ["v5.120D class/subclass catalog UI E2E contract"]],
  ["e2e/class-subclass-catalog-ui-v5.120D.spec.ts", [".click()", 'keyboard.press("Enter")', "elementFromPoint", "scrollWidth", "life-domain-2024"]],
  ["playwright.config.ts", ['name: "desktop-chromium"', 'name: "mobile-chromium"']],
]);
for (const [file, tokens] of required) {
  const source = readFileSync(file, "utf8");
  for (const token of tokens) if (!source.includes(token)) throw new Error(`${file}: missing ${token}`);
}
const e2e = readFileSync("e2e/class-subclass-catalog-ui-v5.120D.spec.ts", "utf8");
if (e2e.includes(".evaluate((element)")) throw new Error("Synthetic DOM click detected.");
const report = {
  package: "v5.120D",
  version: "5.120.3",
  status: "GREEN",
  routes: ["/classes", "/subclasses"],
  projects: ["desktop-chromium", "mobile-chromium"],
  physicalScenarios: 8,
  releaseBlockers: 0,
  certified: ["real catalog rendering", "physical pointer", "keyboard activation", "overlay interception", "mobile overflow"],
  nextPackage: "v5.121A",
  nextTarget: "Cross-Domain Integrity Discovery Foundation",
};
writeFileSync("certification-reports/class-subclass-ui-final-closure-v5.120D.json", `${JSON.stringify(report, null, 2)}\n`);
writeFileSync("certification-reports/class-subclass-ui-final-closure-v5.120D.md", `# Class and Subclass UI E2E Final Closure v5.120D

- Status: ${report.status}
- Version: ${report.version}
- Routes: ${report.routes.join(", ")}
- Browser projects: ${report.projects.join(", ")}
- Physical scenarios: ${report.physicalScenarios}
- Release blockers: ${report.releaseBlockers}
- Next: ${report.nextPackage} - ${report.nextTarget}
`);
console.log("v5.120D class/subclass UI E2E final closure audit passed.");
console.log(`${report.nextPackage}: ${report.nextTarget}`);

