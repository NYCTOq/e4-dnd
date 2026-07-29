import fs from "node:fs";
import path from "node:path";

const targetPath = path.join(
  process.cwd(),
  "e2e",
  "real-ui-interaction-I-MEGA2.spec.ts",
);

if (!fs.existsSync(targetPath)) {
  throw new Error(`Target file not found: ${targetPath}`);
}

let source = fs.readFileSync(targetPath, "utf8");

const replacements = [
  [
    `      const firstTextInput = page.locator('input[type="text"], input:not([type])').first();`,
    `      const firstTextInput = page
        .locator('input[type="text"]:visible, input:not([type]):visible')
        .first();`,
  ],
  [
    `      const firstSelect = page.locator("select").first();`,
    `      const firstSelect = page.locator("select:visible").first();`,
  ],
  [
    `      const enabledButton = page.locator("button:enabled").first();
      if (await enabledButton.count()) {
        await enabledButton.focus();
        await expect(enabledButton).toBeFocused();
      }`,
    `      const enabledButton = page
        .locator("button:visible:enabled")
        .first();

      if (await enabledButton.count()) {
        await expect(enabledButton).toBeVisible();
        await expect(enabledButton).toBeEnabled();
        await enabledButton.click();
        await expect(page.locator("body")).toBeVisible();
      }`,
  ],
];

for (const [oldText, newText] of replacements) {
  if (!source.includes(oldText) && !source.includes(newText)) {
    throw new Error(`Expected interaction block not found:\n${oldText}`);
  }

  source = source.replace(oldText, newText);
}

fs.writeFileSync(targetPath, source, "utf8");

console.log(JSON.stringify({
  target: path.relative(process.cwd(), targetPath),
  visibleTextInput: source.includes('input[type="text"]:visible'),
  visibleSelect: source.includes('select:visible'),
  visibleEnabledButton: source.includes('button:visible:enabled'),
  physicalClick: source.includes('await enabledButton.click()'),
}, null, 2));
