import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "e2e", "full-character-creation.spec.ts");

if (!fs.existsSync(file)) {
  throw new Error("e2e/full-character-creation.spec.ts not found");
}

const before = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
const start = before.indexOf("async function __e4OpenBuilderStep");
const markerCandidates = [
  "// v6.1D1:",
  "test.beforeEach(",
  "const classJourneys",
  "for (const journey",
];

if (start < 0) {
  throw new Error("__e4OpenBuilderStep helper start not found");
}

let end = -1;
for (const marker of markerCandidates) {
  const index = before.indexOf(marker, start);
  if (index >= 0 && (end < 0 || index < end)) end = index;
}

if (end < 0) {
  throw new Error("Could not locate the end of Builder helper block");
}

const helpers = `async function __e4OpenBuilderStep(
  page: import("@playwright/test").Page,
  step: string,
) {
  const mobileStep = page.getByLabel("Aktif adım");

  if (await mobileStep.isVisible().catch(() => false)) {
    await mobileStep.selectOption(step);
  } else {
    const desktopStep = page.locator(
      '[data-builder-step="' + step + '"]',
    );
    await desktopStep.click();
  }

  await page.locator("#builder-step-panel").waitFor({ state: "visible" });
}

async function __e4ChooseOptionFromBuilderPanel(
  page: import("@playwright/test").Page,
  optionLabel: string,
) {
  const selects = page.locator("#builder-step-panel select");
  const selectCount = await selects.count();

  for (let index = 0; index < selectCount; index += 1) {
    const select = selects.nth(index);
    const matchingValue = await select.evaluate((element, wanted) => {
      const normalizedWanted = String(wanted)
        .trim()
        .toLocaleLowerCase("en");

      const matchingOption = Array.from(
        (element as HTMLSelectElement).options,
      ).find(
        (option) =>
          option.text.trim().toLocaleLowerCase("en") === normalizedWanted,
      );

      return matchingOption ? matchingOption.value : null;
    }, optionLabel);

    if (matchingValue !== null) {
      await select.selectOption(matchingValue, { force: true });
      return;
    }
  }

  const exactName = new RegExp(
    "^\\\\s*" +
      optionLabel.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, "\\\\$&") +
      "\\\\s*$",
    "i",
  );

  const button = page.getByRole("button", { name: exactName });
  if (await button.first().isVisible().catch(() => false)) {
    await button.first().click();
    return;
  }

  const radio = page.getByRole("radio", { name: exactName });
  if (await radio.first().isVisible().catch(() => false)) {
    await radio.first().check();
    return;
  }

  const candidates = page.locator("#builder-step-panel :not(option)");
  const candidateCount = await candidates.count();

  for (let index = 0; index < candidateCount; index += 1) {
    const candidate = candidates.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;

    const text = (await candidate.textContent())?.trim() ?? "";
    if (text.toLocaleLowerCase("en") !== optionLabel.trim().toLocaleLowerCase("en")) {
      continue;
    }

    await candidate.click();
    return;
  }

  throw new Error(
    'No selectable Builder option found for "' + optionLabel + '"',
  );
}

`;

const after = before.slice(0, start) + helpers + before.slice(end);
fs.writeFileSync(file, after, "utf8");

const report = {
  path: "e2e/full-character-creation.spec.ts",
  changed: true,
  helperBlockRebuilt: true,
  templateLiteralSelectorsRemoved: true,
};

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports", "D3_5A_PATCH_AUDIT.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);

console.log(JSON.stringify(report, null, 2));
