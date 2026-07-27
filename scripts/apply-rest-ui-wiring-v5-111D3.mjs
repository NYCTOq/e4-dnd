import {
  readFile,
  writeFile,
  access,
} from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function hoistCssImports() {
  const cssCandidates = [
    resolve(root, "src/index.css"),
    resolve(root, "src/App.css"),
    resolve(root, "src/styles.css"),
  ];

  for (const path of cssCandidates) {
    if (!(await exists(path))) continue;

    let css = await readFile(path, "utf8");
    const imports = [
      ...css.matchAll(/^\s*@import\s+[^;]+;\s*$/gm),
    ].map((match) => match[0].trim());

    css = css.replace(/^\s*@import\s+[^;]+;\s*$/gm, "").trimStart();

    const required = [
      '@import "./styles/44-mobile-accessibility-performance.css";',
      '@import "./styles/45-rest-actions-panel.css";',
      '@import "./styles/46-rest-runtime-integration.css";',
    ];

    const unique = [...new Set([...imports, ...required])];
    await writeFile(path, `${unique.join("\n")}\n\n${css}`, "utf8");
    console.log(`All CSS imports hoisted in ${path}`);
    return;
  }

  throw new Error("Ana CSS dosyası bulunamadı.");
}

async function wireReactMount() {
  const candidates = [
    resolve(root, "src/main.tsx"),
    resolve(root, "src/main.jsx"),
    resolve(root, "src/index.tsx"),
    resolve(root, "src/index.jsx"),
  ];

  const mountImport =
    'import RestRuntimeIntegrationMount from "./components/rest/RestRuntimeIntegrationMount";';

  for (const path of candidates) {
    if (!(await exists(path))) continue;

    let source = await readFile(path, "utf8");

    if (!source.includes(mountImport)) {
      const imports = [...source.matchAll(/^import .*;$/gm)];
      if (imports.length === 0) {
        throw new Error(`Import bölümü bulunamadı: ${path}`);
      }

      const last = imports.at(-1);
      source =
        source.slice(0, last.index + last[0].length) +
        `\n${mountImport}` +
        source.slice(last.index + last[0].length);
    }

    if (!source.includes("<RestRuntimeIntegrationMount")) {
      const appPatterns = [
        /(<App\s*\/>)/,
        /(<App><\/App>)/,
      ];

      let inserted = false;

      for (const pattern of appPatterns) {
        if (pattern.test(source)) {
          source = source.replace(
            pattern,
            `$1\n      <RestRuntimeIntegrationMount />`,
          );
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        throw new Error(
          `App mount noktası bulunamadı: ${path}`,
        );
      }
    }

    await writeFile(path, source, "utf8");
    console.log(`Rest runtime mount wired in ${path}`);
    return;
  }

  throw new Error("React entry dosyası bulunamadı.");
}

async function createE2EFromContract() {
  const contractPath = resolve(
    root,
    "certification-reports/rest-ui-integration-contract-v5.111D1.json",
  );

  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  const routes = contract?.consolidated?.routes ?? [];
  const restRoute =
    routes.find((route) => /rest|dinlen/i.test(route)) ??
    routes.find((route) => /character|karakter/i.test(route)) ??
    "/";

  const test = `import { test, expect } from "@playwright/test";

const route = ${JSON.stringify(restRoute)};

const fighter = {
  id: "rest-e2e-fighter",
  name: "Rest E2E Fighter",
  ruleset: "dnd_2014",
  currentHp: 5,
  maxHp: 30,
  tempHp: 4,
  hitDice: [{ die: 10, max: 5, used: 3 }],
  spellSlots: [{ level: 1, max: 2, used: 2, pact: true }],
  resources: [
    { id: "action-surge", current: 0, max: 1, recovery: "short" }
  ],
  exhaustion: 2,
  deathSaves: { successes: 2, failures: 1 },
  concentrating: true,
  activeEffects: [{ id: "bless", durationType: "minutes" }]
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((character) => {
    localStorage.setItem("characters", JSON.stringify([character]));
  }, fighter);
});

test("short rest persists resources and pact slots", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByTestId("rest-runtime-integration")).toBeVisible();
  await page.getByTestId("rest-short-button").click();
  await expect(page.getByTestId("rest-result")).toContainText("Kısa dinlenme");

  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("characters") ?? "[]")[0]
  );

  expect(saved.resources[0].current).toBe(1);
  expect(saved.spellSlots[0].used).toBe(0);
  expect(saved.currentHp).toBe(5);
});

test("long rest persists full recovery", async ({ page }) => {
  await page.goto(route);
  await page.getByTestId("rest-long-button").click();
  await expect(page.getByTestId("rest-result")).toContainText("Uzun dinlenme");

  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("characters") ?? "[]")[0]
  );

  expect(saved.currentHp).toBe(30);
  expect(saved.tempHp).toBe(0);
  expect(saved.deathSaves).toEqual({ successes: 0, failures: 0 });
  expect(saved.concentrating).toBe(false);
  expect(saved.exhaustion).toBe(1);
});
`;

  await writeFile(
    resolve(root, "e2e/rest-recovery-ui-v5.111D3.spec.ts"),
    test,
    "utf8",
  );

  console.log(`Rest E2E generated for route: ${restRoute}`);
}

await hoistCssImports();
await wireReactMount();
await createE2EFromContract();

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));

pkg.version = "5.111.7";
pkg.scripts ??= {};
pkg.scripts["certify:rest-ui:e2e"] =
  "playwright test e2e/rest-recovery-ui-v5.111D3.spec.ts";
pkg.scripts["certify:rest-ui:closure:core"] =
  "npm run certify:rest-recovery:oracle && npm run certify:rest-recovery:differential && npm run certify:rest-recovery:matrix && npm run certify:rest-recovery:golden && npm run certify:rest-recovery:persistence && npm run certify:rest-ui:contract && npm run certify:rest-ui:persistence-bridge && npm run certify:rest-ui:storage-matrix";
pkg.scripts["certify:rest-ui:closure"] =
  "npm run certify:rest-ui:closure:core && npm run build && npm run certify:rest-ui:e2e && node scripts/audit-rest-recovery-final-closure-v5-111D3.mjs";

await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.111D3 contract-driven UI wiring installed.");
