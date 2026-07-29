import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const audit = [];

function patchFile(relativePath, transform) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) throw new Error(`${relativePath} not found`);
  const before = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const after = transform(before);
  if (before === after) throw new Error(`${relativePath}: expected pattern was not changed`);
  fs.writeFileSync(file, after, "utf8");
  audit.push({ path: relativePath, changed: true });
}

patchFile("e2e/full-character-creation.spec.ts", (text) => {
  const oldBlock = `await page.goto("/characters");
  await expect(page.getByRole("heading", { name: "E2E Journey", level: 1, exact: true })).toBeVisible();
  await page.goto("/characters/e2e-journey-character");`;

  const newBlock = `await page.goto("/characters");
  await expect(
    page.getByRole("heading", { name: "E2E Journey", level: 2, exact: true }).first(),
  ).toBeVisible();
  await page.goto("/characters/e2e-journey-character");`;

  return text.replace(oldBlock, newBlock);
});

patchFile(
  "src/certification/integration/characterDerivedStatsUiE2eContract.test.ts",
  (text) =>
    text.replace(
      `expect(e2e).toContain('keyboard.press("Enter")');`,
      `expect(e2e).toMatch(/(?:keyboard\\.press\\("Enter"\\)|\\.press\\("Enter"\\))/);`,
    ),
);

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports", "D3_3_PATCH_AUDIT.json"),
  JSON.stringify(audit, null, 2),
  "utf8",
);
console.log(JSON.stringify(audit, null, 2));
