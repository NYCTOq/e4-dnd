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
    '@import "./styles/52-level-up-runtime-integration.css";';

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
    'import LevelUpRuntimeIntegrationMount from "./components/levelup/LevelUpRuntimeIntegrationMount";';

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
        "<LevelUpRuntimeIntegrationMount",
      )
    ) {
      const preferredAnchors = [
        /(<SpellRuntimeIntegrationMount\s*\/>)/,
        /(<ClassFeatureRuntimeIntegrationMount\s*\/>)/,
        /(<RestRuntimeIntegrationMount\s*\/>)/,
      ];

      let replaced = false;

      for (const pattern of preferredAnchors) {
        if (pattern.test(source)) {
          source = source.replace(
            pattern,
            `$1\n      <LevelUpRuntimeIntegrationMount />`,
          );
          replaced = true;
          break;
        }
      }

      if (!replaced && /(<App\s*\/>)/.test(source)) {
        source = source.replace(
          /(<App\s*\/>)/,
          `$1\n      <LevelUpRuntimeIntegrationMount />`,
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
      `Level-up runtime mount wired in ${path}`,
    );
    return;
  }

  throw new Error("React entry dosyası bulunamadı.");
}

function chooseRoute(report) {
  const routes = report?.consolidated?.routes ?? [];

  return (
    routes.find((route) =>
      /character.*detail|characters\/:/i.test(route),
    ) ??
    routes.find((route) =>
      /character|karakter/i.test(route),
    ) ??
    routes.find((route) =>
      /play|oyna/i.test(route),
    ) ??
    routes.find((route) =>
      /builder/i.test(route),
    ) ??
    "/characters/level-e2e-character"
  );
}

async function generateE2E() {
  const reportPath = resolve(
    root,
    "certification-reports/level-up-ui-contract-v5.114D1.json",
  );

  const report = JSON.parse(
    await readFile(reportPath, "utf8"),
  );

  let route = chooseRoute(report);

  route = route
    .replace(":id", "level-e2e-character")
    .replace(":characterId", "level-e2e-character");

  const source = `import { test, expect } from "@playwright/test";

const route = ${JSON.stringify(route)};

const character = {
  id: "level-e2e-character",
  name: "Level E2E Fighter",
  level: 3,
  ruleset: "dnd_2014",
  maxHp: 28,
  currentHp: 24,
  abilities: {
    strength: 18,
    dexterity: 12,
    constitution: 16,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  },
  classes: [
    {
      classId: "fighter",
      classLevel: 3,
      hitDie: 10
    }
  ]
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ character }) => {
    localStorage.setItem(
      "characters",
      JSON.stringify([character]),
    );
  }, { character });
});

test("level-up panel renders current character", async ({ page }) => {
  await page.goto(route);

  await expect(
    page.getByTestId("level-up-runtime-integration"),
  ).toBeAttached();

  await expect(
    page.getByTestId("level-up-current-level"),
  ).toContainText("3");

  await expect(
    page.getByTestId("level-up-milestone-summary"),
  ).toContainText("Yeni seviye: 4");
});

test("ASI level-up persists to character storage", async ({ page }) => {
  await page.goto(route);

  await page
    .getByTestId("level-up-first-ability")
    .selectOption("strength");

  await page
    .getByTestId("level-up-second-ability")
    .selectOption("strength");

  await page
    .getByTestId("level-up-apply")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() => {
      const stored = JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0];

      return {
        level: stored?.level,
        strength: stored?.abilities?.strength,
        classLevel: stored?.classes?.[0]?.classLevel,
        history: stored?.levelUpHistory?.length,
      };
    }),
  ).toEqual({
    level: 4,
    strength: 20,
    classLevel: 4,
    history: 1,
  });
});

test("feat level-up persists selected feat", async ({ page }) => {
  await page.addInitScript(({ character }) => {
    localStorage.setItem(
      "characters",
      JSON.stringify([
        {
          ...character,
          level: 3,
          classes: [
            {
              classId: "fighter",
              classLevel: 3,
              hitDie: 10
            }
          ]
        }
      ]),
    );
  }, { character });

  await page.goto(route);

  const radios = page.locator(
    '[data-testid="level-up-asi-feat-choice"] input[type="radio"]',
  );

  await radios.nth(1).check();
  await page
    .getByTestId("level-up-feat-select")
    .selectOption("alert");

  await page
    .getByTestId("level-up-apply")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0]?.feats,
    ),
  ).toContain("alert");
});

test("level 20 cannot advance", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "characters",
      JSON.stringify([
        {
          id: "level-e2e-character",
          name: "Level Cap Fighter",
          level: 20,
          ruleset: "dnd_2014",
          maxHp: 180,
          currentHp: 180,
          abilities: {
            strength: 20,
            constitution: 20
          },
          classes: [
            {
              classId: "fighter",
              classLevel: 20,
              hitDie: 10
            }
          ]
        }
      ]),
    );
  });

  await page.goto(route);

  await expect(
    page.getByTestId("level-up-apply"),
  ).toBeDisabled();
});
`;

  await writeFile(
    resolve(
      root,
      "e2e/level-up-runtime-ui-v5.114D3.spec.ts",
    ),
    source,
    "utf8",
  );

  console.log(`Level-up E2E route: ${route}`);
}

await addCssImport();
await wireReactMount();
await generateE2E();

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(
  await readFile(packagePath, "utf8"),
);

pkg.version = "5.114.7";
pkg.scripts ??= {};

pkg.scripts["certify:level-up:ui:e2e"] =
  "playwright test e2e/level-up-runtime-ui-v5.114D3.spec.ts";

pkg.scripts["certify:level-up:closure:core"] =
  "npm run certify:level-up:oracle && npm run certify:level-up:differential && npm run certify:level-up:matrix && npm run certify:level-up:golden && npm run certify:level-up:persistence && npm run certify:level-up:ui:contract && npm run certify:level-up:ui:persistence-bridge && npm run certify:level-up:ui:matrix";

pkg.scripts["certify:level-up:closure"] =
  "npm run certify:level-up:ui:discover && npm run certify:level-up:closure:core && npm run build && npm run certify:level-up:ui:e2e && node scripts/audit-level-up-final-closure-v5-114D3.mjs";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.114D3 Level-Up UI wiring installed.",
);
