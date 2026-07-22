import { expect, test } from "@playwright/test";

const classJourneys = [
  { ruleset: "D&D 2024", className: "Fighter" },
  { ruleset: "D&D 2024", className: "Wizard" },
  { ruleset: "D&D 2014", className: "Bard" },
  { ruleset: "D&D 2014", className: "Monk" },
] as const;

for (const journey of classJourneys) {
  test(`${journey.ruleset} ${journey.className} class selection journey`, async ({ page }) => {
    await page.goto("/builder");
    await page.getByLabel("Ruleset").selectOption({ label: journey.ruleset });
    await page.locator('[data-builder-step="class"]').click();
    const classSelect = page.getByLabel("Class", { exact: true });
    await expect(classSelect).toBeEnabled();
    await classSelect.selectOption({ label: journey.className });
    await expect(classSelect).toHaveValue(journey.className);
  });
}

test("builder exposes accessible step navigation", async ({ page }) => {
  await page.goto("/builder");
  const stepper = page.getByRole("complementary", { name: "Karakter oluşturma adımları" });
  await expect(stepper).toBeVisible();
  await stepper.locator('[data-builder-step="abilities"]').click();
  await expect(page.getByRole("heading", { name: "Abilities", exact: true })).toBeFocused();
});

test("mobile builder has no horizontal document overflow and uses compact step control", async ({ page }, info) => {
  test.skip(!info.project.name.includes("mobile"), "Mobile only");
  await page.goto("/builder");
  await expect(page.getByLabel("Mobil Builder kontrolleri")).toBeVisible();
  await page.getByLabel("Aktif adım").selectOption("equipment");
  await expect(page.getByRole("heading", { name: "Equipment", exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
