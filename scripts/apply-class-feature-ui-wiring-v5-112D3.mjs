import {
  access,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function walkCss(dir) {
  const result = [];

  for (const entry of await readdir(dir)) {
    const full = resolve(dir, entry);
    const info = await stat(full);

    if (info.isDirectory()) {
      result.push(...(await walkCss(full)));
    } else if (extname(entry) === ".css") {
      result.push(full);
    }
  }

  return result;
}

async function hoistAllCssImports() {
  const files = await walkCss(resolve(root, "src"));
  let changed = 0;

  for (const path of files) {
    let css = await readFile(path, "utf8");
    const imports = [
      ...css.matchAll(/^\s*@import\s+[^;]+;\s*$/gm),
    ].map((match) => match[0].trim());

    if (imports.length === 0) continue;

    const body = css
      .replace(/^\s*@import\s+[^;]+;\s*$/gm, "")
      .trimStart();

    const unique = [...new Set(imports)];
    const next = `${unique.join("\n")}\n\n${body}`;

    if (next !== css) {
      await writeFile(path, next, "utf8");
      changed += 1;
    }
  }

  const indexPath = resolve(root, "src/index.css");
  if (await exists(indexPath)) {
    let css = await readFile(indexPath, "utf8");
    const required =
      '@import "./styles/48-class-feature-runtime-integration.css";';

    if (!css.includes(required)) {
      css = `${required}\n${css}`;
      await writeFile(indexPath, css, "utf8");
      changed += 1;
    }
  }

  console.log(`CSS import hygiene updated ${changed} file(s).`);
}

async function wireReactMount() {
  const candidates = [
    resolve(root, "src/main.tsx"),
    resolve(root, "src/main.jsx"),
    resolve(root, "src/index.tsx"),
    resolve(root, "src/index.jsx"),
  ];

  const mountImport =
    'import ClassFeatureRuntimeIntegrationMount from "./components/classFeatures/ClassFeatureRuntimeIntegrationMount";';

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

    if (!source.includes("<ClassFeatureRuntimeIntegrationMount")) {
      const existingRestMount = /(<RestRuntimeIntegrationMount\s*\/>)/;

      if (existingRestMount.test(source)) {
        source = source.replace(
          existingRestMount,
          `$1\n      <ClassFeatureRuntimeIntegrationMount />`,
        );
      } else if (/(<App\s*\/>)/.test(source)) {
        source = source.replace(
          /(<App\s*\/>)/,
          `$1\n      <ClassFeatureRuntimeIntegrationMount />`,
        );
      } else if (/(<App><\/App>)/.test(source)) {
        source = source.replace(
          /(<App><\/App>)/,
          `$1\n      <ClassFeatureRuntimeIntegrationMount />`,
        );
      } else {
        throw new Error(`App mount noktası bulunamadı: ${path}`);
      }
    }

    await writeFile(path, source, "utf8");
    console.log(`Class Feature runtime mount wired in ${path}`);
    return;
  }

  throw new Error("React entry dosyası bulunamadı.");
}

function chooseRoute(routes) {
  return (
    routes.find((route) => /character|karakter/i.test(route)) ??
    routes.find((route) => /play|oyna/i.test(route)) ??
    "/characters"
  );
}

async function generateE2E() {
  const reportPath = resolve(
    root,
    "certification-reports/class-subclass-ui-contract-v5.112D1.json",
  );

  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const route = chooseRoute(report?.consolidated?.routes ?? []);

  const test = `import { test, expect } from "@playwright/test";

const route = ${JSON.stringify(route)};

const fighter = {
  id: "class-feature-e2e-fighter",
  name: "Class Feature E2E Fighter",
  ruleset: "dnd_2014",
  classId: "fighter",
  subclassId: "battle-master",
  level: 5,
  classFeatures: [
    {
      id: "action-surge",
      classId: "fighter",
      level: 2,
      activation: "action",
      currentUses: 1,
      maxUses: 1,
      recovery: "short"
    },
    {
      id: "extra-attack",
      classId: "fighter",
      level: 5,
      activation: "passive"
    }
  ]
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((character) => {
    localStorage.setItem("characters", JSON.stringify([character]));
  }, fighter);
});

test("class feature panel renders unlocked features", async ({ page }) => {
  await page.goto(route);
  await expect(
    page.getByTestId("class-feature-runtime-integration"),
  ).toBeAttached();
  await expect(
    page.getByTestId("class-feature-action-surge"),
  ).toBeAttached();
  await expect(
    page.getByTestId("class-feature-extra-attack"),
  ).toBeAttached();
});

test("spend and restore persist class feature uses", async ({ page }) => {
  await page.goto(route);

  await page
    .getByTestId("class-feature-spend-action-surge")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0]?.classFeatures?.[0]?.currentUses,
    ),
  ).toBe(0);

  await page
    .getByTestId("class-feature-restore-action-surge")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0]?.classFeatures?.[0]?.currentUses,
    ),
  ).toBe(1);
});
`;

  await writeFile(
    resolve(root, "e2e/class-feature-ui-v5.112D3.spec.ts"),
    test,
    "utf8",
  );

  console.log(`Class Feature E2E generated for route: ${route}`);
}

await hoistAllCssImports();
await wireReactMount();
await generateE2E();

const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));

pkg.version = "5.112.6";
pkg.scripts ??= {};
pkg.scripts["certify:class-subclass:ui:e2e"] =
  "playwright test e2e/class-feature-ui-v5.112D3.spec.ts";
pkg.scripts["certify:class-subclass:closure:core"] =
  "npm run certify:class-subclass:oracle && npm run certify:class-subclass:differential && npm run certify:class-subclass:matrix && npm run certify:class-subclass:golden && npm run certify:class-subclass:persistence && npm run certify:class-subclass:ui:contract && npm run certify:class-subclass:ui:persistence-bridge && npm run certify:class-subclass:ui:usage-matrix";
pkg.scripts["certify:class-subclass:closure"] =
  "npm run certify:class-subclass:closure:core && npm run build && npm run certify:class-subclass:ui:e2e && node scripts/audit-class-subclass-final-closure-v5-112D3.mjs";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.112D3 Class Feature UI wiring installed.");
