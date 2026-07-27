import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", "5.119.3");
  });
  await page.goto("/rulesets");
});

test("runtime coverage categories expose real entities through physical details clicks", async ({ page }) => {
  const panel = page.getByTestId("runtime-coverage-certification");
  await expect(panel).toBeVisible();
  for (const category of ["subclasses", "feats", "spells", "items"]) {
    await expect(page.getByTestId(`runtime-coverage-${category}`)).toContainText("Missing");
    await expect(page.getByTestId(`runtime-coverage-${category}`)).toContainText("0 Missing");
  }

  const expected = new Map([
    ["subclasses", "Champion"],
    ["feats", "Alert"],
    ["spells", "Fire Bolt"],
    ["items", "Potion of Speed"],
  ]);
  for (const [category, entity] of expected) {
    const summary = page.getByTestId(`runtime-coverage-summary-${category}`);
    await summary.scrollIntoViewIfNeeded();
    expect(await summary.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === node;
    })).toBe(true);
    await summary.click();
    await expect(page.getByTestId(`runtime-coverage-details-${category}`)).toContainText(entity);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("runtime coverage details are keyboard reachable and activatable", async ({ page }) => {
  const details = page.getByTestId("runtime-coverage-details-items");
  const summary = page.getByTestId("runtime-coverage-summary-items");
  await summary.scrollIntoViewIfNeeded();
  await summary.focus();
  await expect(summary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await expect(details).toContainText("Potion of Speed");
});
