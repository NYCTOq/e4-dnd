import { expect, test } from "@playwright/test";
import { installKnownAppState } from "./support/appState";

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
