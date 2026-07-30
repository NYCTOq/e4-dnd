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

test("backup and recovery page exposes the final safety workflow", async ({ page }) => {
  await page.goto("/backup");
  await expect(page.getByRole("heading", { name: "Yedek", exact: true })).toBeVisible();
  await expect(page.getByText("Full Backup V2", { exact: true })).toBeVisible();
  await expect(page.getByText(/Yedeği önce incele/i)).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});
