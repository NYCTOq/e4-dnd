import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const e2e = path.join(root, "e2e");
const audit = [];

function patch(name, transform) {
  const file = path.join(e2e, name);
  if (!fs.existsSync(file)) throw new Error(`${name} not found`);
  const before = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const after = transform(before);
  if (before === after) throw new Error(`${name}: expected pattern was not changed`);
  fs.writeFileSync(file, after, "utf8");
  audit.push({ name, changed: true });
}

patch("full-character-creation.spec.ts", (text) =>
  text.replace(
    /await expect\(page\.getByText\("E2E Journey", \{ exact: true \}\)\)\.toBeVisible\(\);/g,
    'await expect(page.getByRole("heading", { name: "E2E Journey", level: 1, exact: true })).toBeVisible();',
  ),
);

patch("mobile-and-storage.spec.ts", (text) => {
  const oldBlock = /await page\.goto\("\/"\);\s*await page\.waitForLoadState\("networkidle"\);\s*await context\.setOffline\(true\);\s*await page\.reload\(\{ waitUntil: "domcontentloaded" \}\)\.catch\(\(error\) => \{\s*if \(!String\(error\)\.includes\("ERR_INTERNET_DISCONNECTED"\)\) throw error;\s*\}\);\s*await expect\(page\.getByRole\("heading", \{ name: "Masa hazır\." \}\)\)\.toBeVisible\(\);\s*await context\.setOffline\(false\);/m;

  const newBlock = `await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service worker is unavailable");
    }
    await navigator.serviceWorker.ready;
  });

  // The first controlled reload lets the activated worker claim this page.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();
  } finally {
    await context.setOffline(false);
  }`;

  return text.replace(oldBlock, newBlock);
});

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports", "D3_2_PATCH_AUDIT.json"),
  JSON.stringify(audit, null, 2),
  "utf8",
);
console.log(JSON.stringify(audit, null, 2));
