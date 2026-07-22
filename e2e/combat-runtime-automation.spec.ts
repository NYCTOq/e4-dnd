import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
  });
});

test("combat tracker exposes automated turn economy", async ({ page }) => {
  await page.goto("/combat");
  await expect(page.getByRole("heading", { name: /Initiative \+ Combat Tracker/i })).toBeVisible();
  await page.getByRole("button", { name: /Yeni savaş|Savaş oluştur/i }).first().click();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});
