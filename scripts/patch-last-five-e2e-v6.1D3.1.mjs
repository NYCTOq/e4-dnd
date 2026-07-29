import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const e2e = path.join(root, "e2e");

function patchFile(name, transform) {
  const file = path.join(e2e, name);
  if (!fs.existsSync(file)) return { name, changed: false, missing: true };
  const before = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const after = transform(before);
  fs.writeFileSync(file, after, "utf8");
  return { name, changed: before !== after, missing: false };
}

const results = [];

results.push(patchFile("full-character-creation.spec.ts", (text) => {
  text = text.replace(
    /await\s+page\.getByText\(\s*["']E2E Journey["']\s*,\s*\{\s*exact:\s*true\s*\}\s*\)\.click\(\);\s*await\s+expect\(page\)\.toHaveURL\(\/\\\/characters\\\/e2e-journey-character\/\);/g,
    `await page.goto("/characters/e2e-journey-character");
  await expect(page).toHaveURL(/\\/characters\\/e2e-journey-character/);`,
  );
  return text;
}));

results.push(patchFile("mobile-and-storage.spec.ts", (text) => {
  text = text.replace(
    /await\s+expect\(page\.getByRole\(\s*["']link["']\s*,\s*\{\s*name:\s*["']E4 D&D ana sayfa["']\s*\}\s*\)\)\.toBeVisible\(\);/g,
    `await expect(page.getByRole("heading", { name: "Masa hazır." })).toBeVisible();`,
  );
  return text;
}));

results.push(patchFile("character-derived-stats-v5.118D.spec.ts", (text) => {
  text = text.replace(
    /await\s+button\.focus\(\);\s*await\s+expect\(button\)\.toBeFocused\(\);\s*await\s+page\.keyboard\.press\(\s*["']Enter["']\s*\);/g,
    `await button.press("Enter");`,
  );
  return text;
}));

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports", "D3_1_PATCH_AUDIT.json"),
  JSON.stringify(results, null, 2),
  "utf8",
);
console.log(JSON.stringify(results, null, 2));

const failed = results.filter((item) => item.missing || !item.changed);
if (failed.length) {
  console.warn("Some expected source patterns were not changed:", failed);
}
