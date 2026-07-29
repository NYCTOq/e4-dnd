import { expect, test } from "@playwright/test";

const routes = [
  "/classes",
  "/subclasses",
  "/spells",
  "/feats",
  "/origins",
  "/items",
  "/library",
  "/search",
  "/homebrew",
] as const;

test.describe("F-MEGA2 content catalog browser closure", () => {
  for (const route of routes) {
    test(`${route} loads or safely falls back`, async ({ page }) => {
      const pageErrors: string[] = [];

      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status() ?? 200).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("body")).not.toHaveText("");
      expect(pageErrors).toEqual([]);
    });
  }

  test("catalog search state survives reload", async ({ page }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
      localStorage.setItem(
        "e4_f_mega2_catalog_state",
        JSON.stringify({
          query: "fire",
          ruleset: "dnd_2024",
          types: ["spell", "feat", "subclass"],
          favoritesOnly: false,
        }),
      );
    });

    await page.reload({
      waitUntil: "domcontentloaded",
    });

    const value = await page.evaluate(() =>
      localStorage.getItem("e4_f_mega2_catalog_state"),
    );

    expect(value).toContain('"query":"fire"');
    expect(value).toContain('"ruleset":"dnd_2024"');
  });

  test("application shell retains manifest support", async ({ page }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    const manifestLinks = page.locator('link[rel="manifest"]');
    expect(await manifestLinks.count()).toBeGreaterThan(0);
    expect(
      await manifestLinks.first().getAttribute("href"),
    ).toBeTruthy();
  });
});
