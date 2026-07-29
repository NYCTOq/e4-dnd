import { expect, test } from "@playwright/test";

async function __e4OpenBuilderStep(page: import("@playwright/test").Page, step: string) {
  const mobileStep = page.getByLabel("Aktif adım");
  if (await mobileStep.isVisible().catch(() => false)) {
    await mobileStep.selectOption(step);
  } else {
    const desktopStep = page.locator(`[data-builder-step="${step}"]`);
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
    name: new RegExp(`^\\s*${optionLabel}\\s*$`, "i"),
  });
  if (await button.count()) {
    await button.first().click();
    return;
  }

  const radio = page.getByRole("radio", {
    name: new RegExp(`^\\s*${optionLabel}\\s*$`, "i"),
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
import { readFileSync } from "node:fs";

const CURRENT_APP_VERSION = String(
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version,
);
const FIRST_RUN_STORAGE_KEY = "e4_dnd_first_run_guide_v1";
const LAST_SEEN_VERSION_KEY = "e4_dnd_last_seen_version_v1";

const classJourneys = [
  { ruleset: "D&D 2024", className: "Fighter" },
  { ruleset: "D&D 2024", className: "Wizard" },
  { ruleset: "D&D 2014", className: "Bard" },
  { ruleset: "D&D 2014", className: "Monk" },
] as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([guideKey, releaseKey, version]) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(guideKey, "true");
      localStorage.setItem(releaseKey, version);
    },
    [FIRST_RUN_STORAGE_KEY, LAST_SEEN_VERSION_KEY, CURRENT_APP_VERSION],
  );
});

async function openBuilderStep(
  page: import("@playwright/test").Page,
  step: string,
  isMobile: boolean,
) {
  if (isMobile) {
    const compact = page.getByLabel("Aktif adım");
    await expect(compact).toBeVisible();
    await compact.selectOption(step);
  } else {
    const button = page.locator(`[data-builder-step="${step}"]`);
    await expect(button).toBeVisible();
    await button.click();
  }
  await expect(page.locator("#builder-step-panel")).toBeVisible();
}

async function chooseOptionFromAnySelect(
  page: import("@playwright/test").Page,
  optionLabel: string,
): Promise<boolean> {
  const selects = page.locator("#builder-step-panel select");
  const count = await selects.count();

  for (let index = 0; index < count; index += 1) {
    const select = selects.nth(index);
    const matchingValue = await select.evaluate((element, wanted) => {
      const wantedText = String(wanted).trim().toLocaleLowerCase("en");
      const option = Array.from((element as HTMLSelectElement).options).find(
        (item) => item.text.trim().toLocaleLowerCase("en") === wantedText,
      );
      return option?.value ?? null;
    }, optionLabel);

    if (matchingValue !== null) {
      await expect(select).toBeVisible();
      await select.selectOption(matchingValue);
      await expect(select).toHaveValue(matchingValue);
      return true;
    }
  }

  return false;
}

async function chooseClass(
  page: import("@playwright/test").Page,
  className: string,
) {
  if (await chooseOptionFromAnySelect(page, className)) return;

  const exactButton = page.getByRole("button", {
    name: new RegExp(`^\\s*${className}\\s*$`, "i"),
  });
  if (await exactButton.count()) {
    await expect(exactButton.first()).toBeVisible();
    await exactButton.first().click();
    return;
  }

  const exactRadio = page.getByRole("radio", {
    name: new RegExp(`^\\s*${className}\\s*$`, "i"),
  });
  if (await exactRadio.count()) {
    await exactRadio.first().check();
    return;
  }

  const textChoice = page
    .locator("#builder-step-panel")
    .getByText(className, { exact: true })
    .first();
  await expect(textChoice).toBeVisible();
  await textChoice.click();
}

for (const journey of classJourneys) {
  test(`${journey.ruleset} ${journey.className} class selection journey`, async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.includes("mobile");
    await page.goto("/builder");
    await page.getByLabel("Ruleset").selectOption({ label: journey.ruleset });
    await openBuilderStep(page, "class", isMobile);
    await chooseClass(page, journey.className);

    const selectedEvidence = page
      .locator("#builder-step-panel")
      .getByText(journey.className, { exact: true })
      .or(page.locator("#builder-step-panel select").filter({
        has: page.locator(`option:checked`, { hasText: journey.className }),
      }));

    await expect(selectedEvidence.first()).toBeVisible();
  });
}

test("builder exposes accessible step navigation", async ({ page }, testInfo) => {
  const isMobile = testInfo.project.name.includes("mobile");
  await page.goto("/builder");
  await openBuilderStep(page, "abilities", isMobile);
  const heading = page.getByRole("heading", { name: "Abilities", exact: true });
  await expect(heading).toBeVisible();
  if (!isMobile) await expect(heading).toBeFocused();
});

test("mobile builder has no horizontal document overflow and uses compact step control", async ({ page }, info) => {
  test.skip(!info.project.name.includes("mobile"), "Mobile only");
  await page.goto("/builder");
  await expect(page.getByLabel("Mobil Builder kontrolleri")).toBeVisible();
  await page.getByLabel("Aktif adım").selectOption("equipment");
  await expect(page.getByRole("heading", { name: "Equipment", exact: true })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
