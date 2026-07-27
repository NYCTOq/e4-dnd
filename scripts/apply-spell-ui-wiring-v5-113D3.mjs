import {
  access,
  readFile,
  writeFile,
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

async function addCssImport() {
  const candidates = [
    resolve(root, "src/index.css"),
    resolve(root, "src/App.css"),
    resolve(root, "src/styles.css"),
  ];

  const importLine =
    '@import "./styles/50-spell-runtime-integration.css";';

  for (const path of candidates) {
    if (!(await exists(path))) continue;

    let source = await readFile(path, "utf8");

    if (!source.includes(importLine)) {
      source = `${importLine}\n${source}`;
      await writeFile(path, source, "utf8");
    }

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
    'import SpellRuntimeIntegrationMount from "./components/spells/SpellRuntimeIntegrationMount";';

  for (const path of candidates) {
    if (!(await exists(path))) continue;

    let source = await readFile(path, "utf8");

    if (!source.includes(mountImport)) {
      const imports = [
        ...source.matchAll(/^import .*;$/gm),
      ];

      if (imports.length === 0) {
        throw new Error(
          `Import bölümü bulunamadı: ${path}`,
        );
      }

      const last = imports.at(-1);
      source =
        source.slice(
          0,
          last.index + last[0].length,
        ) +
        `\n${mountImport}` +
        source.slice(
          last.index + last[0].length,
        );
    }

    if (
      !source.includes(
        "<SpellRuntimeIntegrationMount",
      )
    ) {
      const preferredAnchors = [
        /(<ClassFeatureRuntimeIntegrationMount\s*\/>)/,
        /(<RestRuntimeIntegrationMount\s*\/>)/,
      ];

      let replaced = false;

      for (const pattern of preferredAnchors) {
        if (pattern.test(source)) {
          source = source.replace(
            pattern,
            `$1\n      <SpellRuntimeIntegrationMount />`,
          );
          replaced = true;
          break;
        }
      }

      if (!replaced && /(<App\s*\/>)/.test(source)) {
        source = source.replace(
          /(<App\s*\/>)/,
          `$1\n      <SpellRuntimeIntegrationMount />`,
        );
        replaced = true;
      }

      if (!replaced) {
        throw new Error(
          `React mount noktası bulunamadı: ${path}`,
        );
      }
    }

    await writeFile(path, source, "utf8");
    console.log(
      `Spell runtime mount wired in ${path}`,
    );
    return;
  }

  throw new Error("React entry dosyası bulunamadı.");
}

function chooseRoute(report) {
  const routes = report?.consolidated?.routes ?? [];

  return (
    routes.find((route) =>
      /spell|buyu|büyü/i.test(route),
    ) ??
    routes.find((route) =>
      /play|oyna/i.test(route),
    ) ??
    routes.find((route) =>
      /combat|savas|savaş/i.test(route),
    ) ??
    "/spellbook"
  );
}

async function generateE2E() {
  const reportPath = resolve(
    root,
    "certification-reports/spell-ui-contract-v5.113D1.json",
  );
  const report = JSON.parse(
    await readFile(reportPath, "utf8"),
  );
  const route = chooseRoute(report);

  const source = `import { test, expect } from "@playwright/test";

const route = ${JSON.stringify(route)};

const caster = {
  id: "spell-e2e-caster",
  name: "Spell E2E Wizard",
  classId: "wizard",
  level: 5,
  intelligence: 18,
  spellSlots: [
    { level: 3, max: 2, used: 0 }
  ],
  concentrationSpellId: null,
  concentrating: false
};

const target = {
  id: "spell-e2e-target",
  name: "Training Target",
  currentHp: 20,
  maxHp: 20
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ caster, target }) => {
    localStorage.setItem(
      "characters",
      JSON.stringify([caster]),
    );
    localStorage.setItem(
      "combatTracker",
      JSON.stringify([target]),
    );
  }, { caster, target });
});

test("spell runtime panel renders caster statistics", async ({ page }) => {
  await page.goto(route);

  await expect(
    page.getByTestId("spell-runtime-integration"),
  ).toBeAttached();

  await expect(
    page.getByTestId("spell-runtime-save-dc"),
  ).toContainText("15");

  await expect(
    page.getByTestId("spell-runtime-attack-bonus"),
  ).toContainText("+7");
});

test("slot and concentration changes persist", async ({ page }) => {
  await page.goto(route);

  await page
    .getByTestId("spell-slot-spend-normal-3")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0]?.spellSlots?.[0]?.used,
    ),
  ).toBe(1);

  await page
    .getByTestId("spell-concentration-input")
    .fill("hold-person");

  await page
    .getByTestId("spell-concentration-start")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0]?.concentrationSpellId,
    ),
  ).toBe("hold-person");
});

test("combat target damage and healing persist", async ({ page }) => {
  await page.goto(route);

  await page
    .getByTestId("spell-runtime-target-amount")
    .fill("7");

  await page
    .getByTestId("spell-runtime-apply-damage")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("combatTracker") ?? "[]",
      )[0]?.currentHp,
    ),
  ).toBe(13);

  await page
    .getByTestId("spell-runtime-apply-healing")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("combatTracker") ?? "[]",
      )[0]?.currentHp,
    ),
  ).toBe(20);
});
`;

  await writeFile(
    resolve(
      root,
      "e2e/spell-runtime-ui-v5.113D3.spec.ts",
    ),
    source,
    "utf8",
  );

  console.log(
    `Spell runtime E2E route: ${route}`,
  );
}

await addCssImport();
await wireReactMount();
await generateE2E();

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(
  await readFile(packagePath, "utf8"),
);

pkg.version = "5.113.8";
pkg.scripts ??= {};

pkg.scripts["certify:spell-runtime:ui:e2e"] =
  "playwright test e2e/spell-runtime-ui-v5.113D3.spec.ts";
pkg.scripts["certify:spell-runtime:closure:core"] =
  "npm run certify:spell-runtime:oracle && npm run certify:spell-runtime:differential && npm run certify:spell-runtime:matrix && npm run certify:spell-runtime:golden && npm run certify:spell-runtime:persistence && npm run certify:spell-runtime:ui:contract && npm run certify:spell-runtime:ui:persistence-bridge && npm run certify:spell-runtime:ui:casting-matrix";
pkg.scripts["certify:spell-runtime:closure"] =
  "npm run certify:spell-runtime:ui:discover && npm run certify:spell-runtime:closure:core && npm run build && npm run certify:spell-runtime:ui:e2e && node scripts/audit-spell-runtime-final-closure-v5-113D3.mjs";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.113D3 Spell runtime UI wiring installed.",
);
