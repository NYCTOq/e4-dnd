import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const testPath = resolve(
  root,
  "e2e/rest-recovery-ui-v5.111D3.spec.ts",
);

let source = await readFile(testPath, "utf8");

source = source.replace(
  `// Rest davranışını onboarding ve sabit mobil navigasyondan izole eder.
  await page.getByTestId("rest-short-button").click({ force: true });
  await expect(page.getByTestId("rest-result")).toContainText("Kısa dinlenme");`,
  `await expect(page.getByTestId("rest-short-button")).toBeVisible();
  await page.getByTestId("rest-short-button").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });

  await expect.poll(async () =>
    page.evaluate(() => {
      const saved = JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0];

      return {
        resource: saved?.resources?.[0]?.current,
        pactUsed: saved?.spellSlots?.[0]?.used,
        hp: saved?.currentHp,
      };
    }),
  ).toEqual({
    resource: 1,
    pactUsed: 0,
    hp: 5,
  });

  await expect(page.getByTestId("rest-result")).toBeAttached();`,
);

source = source.replace(
  `// Rest davranışını onboarding ve sabit mobil navigasyondan izole eder.
  await page.getByTestId("rest-long-button").click({ force: true });
  await expect(page.getByTestId("rest-result")).toContainText("Uzun dinlenme");`,
  `await expect(page.getByTestId("rest-long-button")).toBeVisible();
  await page.getByTestId("rest-long-button").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });

  await expect.poll(async () =>
    page.evaluate(() => {
      const saved = JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0];

      return {
        currentHp: saved?.currentHp,
        tempHp: saved?.tempHp,
        deathSaves: saved?.deathSaves,
        concentrating: saved?.concentrating,
        exhaustion: saved?.exhaustion,
      };
    }),
  ).toEqual({
    currentHp: 30,
    tempHp: 0,
    deathSaves: { successes: 0, failures: 0 },
    concentrating: false,
    exhaustion: 1,
  });

  await expect(page.getByTestId("rest-result")).toBeAttached();`,
);

if (
  source.includes('click({ force: true })') ||
  source.includes('toContainText("Kısa dinlenme")') ||
  source.includes('toContainText("Uzun dinlenme")')
) {
  throw new Error(
    "E2E dosyası beklenen biçimde dönüştürülemedi.",
  );
}

await writeFile(testPath, source, "utf8");

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.111.9";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.111D3.2 DOM action + persistence assertions uygulandı.");
