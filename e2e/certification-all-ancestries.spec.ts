import { expect, test, type Page } from "@playwright/test";


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
// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.1.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

const RACES_2014 = ["Human","Dwarf","Elf","Halfling","Dragonborn","Gnome","Half-Elf","Half-Orc","Tiefling"];
const SPECIES_2024 = ["Aasimar","Dragonborn","Dwarf","Elf","Gnome","Goliath","Halfling","Human","Orc","Tiefling"];

async function neutralizeOverlay(page: Page) {
  await page.addStyleTag({ content: `.first-run-overlay{display:none!important;pointer-events:none!important;visibility:hidden!important}` });
  await page.locator(".first-run-overlay").evaluateAll((elements) => elements.forEach((element) => element.remove()));
}

async function openAncestryStep(page: Page, ruleset: "dnd_2014"|"dnd_2024") {
  await page.goto("/builder");
  await neutralizeOverlay(page);
  await page.getByLabel("Ruleset").selectOption(ruleset);

  const step = page.locator('[data-builder-step="class"]');
  await expect(step).toBeAttached();
  if (await step.isVisible()) await step.click({ force:true });
  else await step.evaluate((element: HTMLElement) => element.click());

  await neutralizeOverlay(page);
  await expect(page.getByRole("form", { name:/Race & Class/i })).toBeVisible();
}

async function ancestrySelect(page: Page, optionLabel: string) {
  const select = page.locator("select").filter({
    has: page.locator("option", { hasText: optionLabel }),
  }).first();
  await expect(select).toBeAttached();
  await select.selectOption({ label: optionLabel });
  await expect(select).toHaveValue(/.+/);
}

test.describe("all ancestry catalog smoke certification", () => {
  for (const race of RACES_2014) {
    test(`2014 ${race} can be selected`, async ({ page }) => {
      await openAncestryStep(page, "dnd_2014");
      await ancestrySelect(page, race);
    });
  }

  for (const species of SPECIES_2024) {
    test(`2024 ${species} can be selected`, async ({ page }) => {
      await openAncestryStep(page, "dnd_2024");
      await ancestrySelect(page, species);
    });
  }
});
