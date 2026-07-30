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

test("settings exposes the accessibility and performance quality gate", async ({ page }) => {
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Accessibility & Performance" }),
  ).toBeVisible();
  await expect(page.getByText("44 px+", { exact: true })).toBeVisible();
  await expect(page.locator(".accessibility-performance-panel")).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});

test("keyboard focus remains visible on primary navigation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
