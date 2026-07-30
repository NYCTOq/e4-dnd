import { expect, test } from "@playwright/test";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", "6.2.0");
    localStorage.setItem("e4_dnd_app_settings_v1", JSON.stringify({ defaultRuleset: "dnd_2024" }));
  });
});

test("desktop-chromium and mobile-chromium expose the 2024 class progression through physical clicks", async ({ page }) => {
  await page.goto("/classes");
  await expect(page.getByTestId("class-catalog")).toBeVisible();
  const cleric = page.getByTestId("class-catalog-option-cleric");
  await cleric.scrollIntoViewIfNeeded();
  expect(await cleric.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === node || node.contains(hit);
  })).toBe(true);
  await cleric.click();
  await expect(page.getByTestId("class-catalog-detail")).toContainText("Cleric");
  await expect(page.getByTestId("class-catalog-detail")).toContainText("Subclass L3");
  await expect(page.getByTestId("class-level-20")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("class choices are keyboard reachable and activatable", async ({ page }) => {
  await page.goto("/classes");
  const wizard = page.getByTestId("class-catalog-option-wizard");
  await wizard.scrollIntoViewIfNeeded();
  await wizard.focus();
  await expect(wizard).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("class-catalog-detail")).toContainText("Wizard");
});

test("desktop-chromium and mobile-chromium open real subclass details without interception or overflow", async ({ page }) => {
  await page.goto("/subclasses");
  await page.getByTestId("subclass-class-filter").selectOption("Cleric");
  const summary = page.getByTestId("subclass-summary-life-domain-2024");
  await summary.scrollIntoViewIfNeeded();
  expect(await summary.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === node || node.contains(hit);
  })).toBe(true);
  await summary.click();
  await expect(page.getByTestId("subclass-card-life-domain-2024")).toHaveAttribute("open", "");
  await expect(page.getByTestId("subclass-details-life-domain-2024")).toContainText("Preserve Life");
  await expect(page.getByTestId("subclass-details-life-domain-2024")).toContainText("Blessed Healer");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("subclass details are keyboard reachable and activatable", async ({ page }) => {
  await page.goto("/subclasses");
  await page.getByTestId("subclass-class-filter").selectOption("Cleric");
  const summary = page.getByTestId("subclass-summary-life-domain-2024");
  await summary.focus();
  await expect(summary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("subclass-card-life-domain-2024")).toHaveAttribute("open", "");
});

