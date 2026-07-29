import { expect, test } from "@playwright/test";
import { installKnownAppState } from "./support/appState";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.1.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

test.beforeEach(async ({ page }) => {
  await installKnownAppState(page);
});

test("critical shell routes render without page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of ["/", "/builder", "/backup"]) {
    const response = await page.goto(route);
    expect(response?.status() ?? 200).toBeLessThan(400);
    await expect(page.locator("#main-content")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("release shell remains horizontally stable", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  expect(overflow).toBe(true);
});
