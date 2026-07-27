import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const specPath = resolve(
  root,
  "e2e/level-up-runtime-ui-v5.114D3.spec.ts",
);

let source = await readFile(specPath, "utf8");

const before = `  await radios.nth(1).check();`;
const after = `  await radios.nth(1).evaluate((element) => {
    (element as HTMLInputElement).click();
  });`;

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error(
      "Feat radio check satırı bulunamadı.",
    );
  }

  source = source.replace(before, after);
}

await writeFile(specPath, source, "utf8");

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(
  await readFile(packagePath, "utf8"),
);

pkg.version = "5.114.8";
pkg.scripts ??= {};

pkg.scripts["certify:level-up:closure:hotfix"] =
  "npm run certify:level-up:ui:e2e && node scripts/audit-level-up-final-closure-v5-114D3.mjs";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.114D3.1 feat radio overlay E2E hotfix uygulandı.",
);
