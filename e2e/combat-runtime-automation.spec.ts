import { expect, test } from "@playwright/test";
import { installKnownAppState } from "./support/appState";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

test.beforeEach(async ({ page }) => {
  await installKnownAppState(page);
});

test("combat tracker exposes automated turn economy", async ({ page }) => {
  await page.goto("/combat");
  await expect(
    page.getByRole("heading", { name: /Initiative \+ Combat Tracker/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Yeni savaş|Savaş oluştur/i }).first().click();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});
