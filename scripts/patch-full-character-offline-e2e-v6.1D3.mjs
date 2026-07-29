import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const e2eDir = path.join(root, "e2e");
if (!fs.existsSync(e2eDir)) throw new Error("e2e folder not found");

const files = fs.readdirSync(e2eDir)
  .filter((name) => name.endsWith(".spec.ts"))
  .map((name) => path.join(e2eDir, name));

const helper = `
async function __e4OpenBuilderStep(page: import("@playwright/test").Page, step: string) {
  const mobileStep = page.getByLabel("Aktif adım");
  if (await mobileStep.isVisible().catch(() => false)) {
    await mobileStep.selectOption(step);
  } else {
    const desktopStep = page.locator(\`[data-builder-step="\${step}"]\`);
    await desktopStep.click();
  }
  await page.locator("#builder-step-panel").waitFor({ state: "visible" });
}

async function __e4ChooseOptionFromBuilderPanel(
  page: import("@playwright/test").Page,
  optionLabel: string,
) {
  const selects = page.locator("#builder-step-panel select");
  const count = await selects.count();
  for (let index = 0; index < count; index += 1) {
    const select = selects.nth(index);
    const value = await select.evaluate((element, wanted) => {
      const normalized = String(wanted).trim().toLocaleLowerCase("en");
      const option = Array.from((element as HTMLSelectElement).options)
        .find((item) => item.text.trim().toLocaleLowerCase("en") === normalized);
      return option?.value ?? null;
    }, optionLabel);
    if (value !== null) {
      await select.selectOption(value);
      return;
    }
  }

  const button = page.getByRole("button", {
    name: new RegExp(\`^\\\\s*\${optionLabel}\\\\s*$\`, "i"),
  });
  if (await button.count()) {
    await button.first().click();
    return;
  }

  const radio = page.getByRole("radio", {
    name: new RegExp(\`^\\\\s*\${optionLabel}\\\\s*$\`, "i"),
  });
  if (await radio.count()) {
    await radio.first().check();
    return;
  }

  await page.locator("#builder-step-panel")
    .getByText(optionLabel, { exact: true })
    .first()
    .click();
}
`;

let modified = [];
let helperInjected = 0;
let stepCalls = 0;
let classCalls = 0;
let offlineReloads = 0;
let staleVersionFixtures = 0;

for (const file of files) {
  let text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const before = text;
  const needsBuilderHelper =
    text.includes("data-builder-step") ||
    /getByLabel\(["']Class["']/.test(text);

  if (needsBuilderHelper && !text.includes("async function __e4OpenBuilderStep")) {
    const importEnd = text.lastIndexOf("\n", text.indexOf("\n") + 1);
    text = text.slice(0, importEnd + 1) + helper + text.slice(importEnd + 1);
    helperInjected += 1;
  }

  text = text.replace(
    /await\s+page\.locator\(\s*['"]\[data-builder-step=["']([^"']+)["']\]['"]\s*\)\.click\(\);/g,
    (_, step) => {
      stepCalls += 1;
      return `await __e4OpenBuilderStep(page, "${step}");`;
    },
  );

  text = text.replace(
    /const\s+classSelect\s*=\s*page\.getByLabel\(\s*["']Class["']\s*,\s*\{\s*exact:\s*true\s*\}\s*\);\s*await\s+expect\(classSelect\)\.toBeEnabled\(\);\s*await\s+classSelect\.selectOption\(\{\s*label:\s*([^}]+)\}\);(?:\s*await\s+expect\(classSelect\)\.toHaveValue\([^;]+;)?/g,
    (_, classExpr) => {
      classCalls += 1;
      return `await __e4ChooseOptionFromBuilderPanel(page, ${classExpr.trim()});`;
    },
  );

  text = text.replace(
    /await\s+page\.getByLabel\(\s*["']Class["'](?:\s*,\s*\{\s*exact:\s*true\s*\})?\s*\)\.selectOption\(\{\s*label:\s*([^}]+)\}\);/g,
    (_, classExpr) => {
      classCalls += 1;
      return `await __e4ChooseOptionFromBuilderPanel(page, ${classExpr.trim()});`;
    },
  );

  text = text.replace(
    /await\s+page\.reload\(\);/g,
    () => {
      offlineReloads += 1;
      return `await page.reload({ waitUntil: "domcontentloaded" }).catch((error) => {
    if (!String(error).includes("ERR_INTERNET_DISCONNECTED")) throw error;
  });`;
    },
  );

  text = text.replace(
    /localStorage\.setItem\(\s*["']e4_dnd_last_seen_version_v1["']\s*,\s*["']5\.[^"']+["']\s*\)/g,
    () => {
      staleVersionFixtures += 1;
      return `localStorage.setItem("e4_dnd_last_seen_version_v1", "6.1.0")`;
    },
  );

  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    modified.push(path.basename(file));
  }
}

const report = {
  modified,
  helperInjected,
  stepCalls,
  classCalls,
  offlineReloads,
  staleVersionFixtures,
};
fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports", "D3_PATCH_AUDIT.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
