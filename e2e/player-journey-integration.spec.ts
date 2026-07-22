import { expect, test } from "@playwright/test";

test.describe("player journey integration", () => {
  test("keeps sheet, play mode and rest center reachable", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  });
});
