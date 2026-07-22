import { expect, test } from "@playwright/test";
import { installKnownAppState } from "./support/appState";

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
