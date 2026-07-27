import { expect, test, type Page } from "@playwright/test";

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
