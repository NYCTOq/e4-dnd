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

const routes = [
  { path: "/", landmark: "main" },
  { path: "/characters", landmark: "main" },
  { path: "/builder", landmark: "main" },
  { path: "/combat", landmark: "main" },
  { path: "/backup", landmark: "main" },
  { path: "/settings", landmark: "main" },
];

for (const route of routes) {
  test(`RC1 critical route renders: ${route.path}`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status() ?? 200).toBeLessThan(400);
    await expect(page.locator(route.landmark).first()).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  });
}

test("RC1 shell has no uncaught page errors during navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  for (const route of routes) {
    await page.goto(route.path);
    await page.waitForLoadState("domcontentloaded");
  }

  expect(errors).toEqual([]);
});
