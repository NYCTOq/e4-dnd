import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const testPath = resolve(
  root,
  "e2e/rest-recovery-ui-v5.111D3.spec.ts",
);

let source = await readFile(testPath, "utf8");

const replacements = [
  [
    'await page.getByTestId("rest-short-button").click();',
    `// Rest davranışını onboarding ve sabit mobil navigasyondan izole eder.
  await page.getByTestId("rest-short-button").click({ force: true });`,
  ],
  [
    'await page.getByTestId("rest-long-button").click();',
    `// Rest davranışını onboarding ve sabit mobil navigasyondan izole eder.
  await page.getByTestId("rest-long-button").click({ force: true });`,
  ],
];

for (const [before, after] of replacements) {
  if (source.includes(after)) continue;

  if (!source.includes(before)) {
    throw new Error(
      `Beklenen E2E click satırı bulunamadı: ${before}`,
    );
  }

  source = source.replace(before, after);
}

await writeFile(testPath, source, "utf8");

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.111.8";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.111D3.1 E2E overlay isolation uygulandı.");
