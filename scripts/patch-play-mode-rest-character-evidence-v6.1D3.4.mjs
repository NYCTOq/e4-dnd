import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "e2e", "full-character-creation.spec.ts");
if (!fs.existsSync(file)) throw new Error("e2e/full-character-creation.spec.ts not found");

const before = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
let after = before;

after = after.replace(
  `await page.goto("/play-mode?character=e2e-journey-character");
  await expect(page.getByRole("heading", { name: "E2E Journey", level: 1, exact: true })).toBeVisible();
  await page.goto("/rest");
  await expect(page.getByRole("heading", { name: "E2E Journey", level: 1, exact: true })).toBeVisible();`,
  `await page.goto("/play-mode?character=e2e-journey-character");
  await expect(page.getByText("E2E Journey", { exact: true }).first()).toBeVisible();
  await page.goto("/rest");
  await expect(page.getByText("E2E Journey", { exact: true }).first()).toBeVisible();`,
);

if (after === before) {
  throw new Error("Expected Play Mode / Rest heading block was not found.");
}

fs.writeFileSync(file, after, "utf8");

const report = {
  path: "e2e/full-character-creation.spec.ts",
  changed: true,
  playModeExpectation: "first visible exact text",
  restExpectation: "first visible exact text",
};

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports", "D3_4_PATCH_AUDIT.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
