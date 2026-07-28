import { expect, test } from "@playwright/test";
import { installKnownAppState } from "./support/appState";

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
