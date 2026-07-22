import { expect, test } from "@playwright/test";
import { installKnownAppState } from "./support/appState";

test.beforeEach(async ({ page }) => {
  await installKnownAppState(page);
});

test("backup and recovery page exposes the final safety workflow", async ({ page }) => {
  await page.goto("/backup");
  await expect(page.getByRole("heading", { name: "Yedek", exact: true })).toBeVisible();
  await expect(page.getByText("Full Backup V2", { exact: true })).toBeVisible();
  await expect(page.getByText(/Yedeği önce incele/i)).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});
