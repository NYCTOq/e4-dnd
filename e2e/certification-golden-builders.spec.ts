import { expect, test, type Page } from "@playwright/test";

async function neutralizeFirstRunOverlay(page: Page) {
  await page.addStyleTag({
    content: `
      .first-run-overlay {
        display: none !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }
    `,
  });

  await page.locator(".first-run-overlay").evaluateAll((elements) => {
    for (const element of elements) {
      element.remove();
    }
  });
}

async function selectByContainedOption(
  page: Page,
  optionLabel: string,
) {
  const select = page.locator("select").filter({
    has: page.locator("option", { hasText: optionLabel }),
  }).first();

  await expect(select).toBeAttached();
  await select.selectOption({ label: optionLabel });
  return select;
}

async function openRaceAndClassStep(
  page: Page,
  ruleset: "dnd_2014" | "dnd_2024",
) {
  await page.goto("/builder");
  await neutralizeFirstRunOverlay(page);

  await page.getByLabel("Ruleset").selectOption(ruleset);

  const classStep = page.locator('[data-builder-step="class"]');
  await expect(classStep).toBeAttached();

  if (await classStep.isVisible()) {
    await classStep.click({ force: true });
  } else {
    await classStep.evaluate((element: HTMLElement) => element.click());
  }

  await neutralizeFirstRunOverlay(page);
  await expect(page.getByRole("form", { name: /Race & Class/i })).toBeVisible();
}

test.describe("golden builder certification", () => {
  test("2024 Human exposes ancestry choices", async ({ page }) => {
    await openRaceAndClassStep(page, "dnd_2024");
    await selectByContainedOption(page, "Human");

    const panel = page.getByTestId("ancestry-choice-panel");
    await expect(panel).toBeVisible();
    await expect(page.getByLabel("Size")).toBeVisible();
    await expect(page.getByLabel("Species Origin Feat")).toBeVisible();
    await expect(panel).toContainText("Ancestry Skill");
  });

  test("2014 Half-Elf exposes ancestry skill choices", async ({ page }) => {
    await openRaceAndClassStep(page, "dnd_2014");
    await selectByContainedOption(page, "Half-Elf");

    const panel = page.getByTestId("ancestry-choice-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Ancestry Skill");
    await expect(panel).toContainText("0 / 2");
  });

  test("2024 Dragonborn requires draconic ancestry", async ({ page }) => {
    await openRaceAndClassStep(page, "dnd_2024");
    await selectByContainedOption(page, "Dragonborn");

    const panel = page.getByTestId("ancestry-choice-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Draconic Ancestry");
    await expect(panel.getByRole("button", { name: "Seç" })).toHaveCount(5);
  });
});
