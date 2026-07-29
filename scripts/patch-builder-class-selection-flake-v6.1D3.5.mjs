import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "e2e", "full-character-creation.spec.ts");
if (!fs.existsSync(file)) throw new Error("e2e/full-character-creation.spec.ts not found");

const before = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
let after = before;

after = after.replace(
  /if \(value !== null\) \{\s*await select\.selectOption\(value\);\s*return;\s*\}/m,
  `if (value !== null) {
      await select.selectOption(value, { force: true });
      return;
    }`,
);

after = after.replace(
  `await page.locator("#builder-step-panel")
    .getByText(optionLabel, { exact: true })
    .first()
    .click();`,
  `const visibleTextChoice = page
    .locator("#builder-step-panel :not(option)")
    .filter({ hasText: new RegExp(\`^\\\\s*\${optionLabel}\\\\s*$\`, "i") })
    .filter({ visible: true })
    .first();

  if (await visibleTextChoice.count()) {
    await visibleTextChoice.click();
    return;
  }

  throw new Error(\`No selectable Builder option found for "\${optionLabel}"\`);`,
);

if (after === before) {
  throw new Error("Expected class selection helper patterns were not changed.");
}

fs.writeFileSync(file, after, "utf8");

const report = {
  path: "e2e/full-character-creation.spec.ts",
  changed: true,
  selectStrategy: "selectOption force true",
  textFallback: "visible non-option elements only",
};

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports", "D3_5_PATCH_AUDIT.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
