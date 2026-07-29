import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/help",
  "/settings",
  "/release-history",
  "/characters",
  "/player-test-center",
] as const;

test.describe("H-MEGA2 support and recovery browser smoke", () => {
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

  test("recovery drill preserves original, backup and restored states", async ({
    page,
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
      const original = {
        schemaVersion: 1,
        character: {
          id: "recovery-drill",
          name: "Recovery Hero",
          level: 7,
        },
      };

      localStorage.setItem(
        "e4_h_mega2_original_save",
        JSON.stringify(original),
      );

      localStorage.setItem(
        "e4_h_mega2_backup_save",
        JSON.stringify(original),
      );

      localStorage.setItem(
        "e4_h_mega2_restored_save",
        JSON.stringify({
          ...original,
          schemaVersion: 2,
          restored: true,
        }),
      );
    });

    await page.reload({
      waitUntil: "domcontentloaded",
    });

    const values = await page.evaluate(() => ({
      original: localStorage.getItem("e4_h_mega2_original_save"),
      backup: localStorage.getItem("e4_h_mega2_backup_save"),
      restored: localStorage.getItem("e4_h_mega2_restored_save"),
    }));

    expect(values.original).toContain('"schemaVersion":1');
    expect(values.backup).toContain('"Recovery Hero"');
    expect(values.restored).toContain('"schemaVersion":2');
    expect(values.restored).toContain('"restored":true');
  });

  test("release state and user save remain isolated", async ({ page }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
      localStorage.setItem(
        "e4_h_mega2_release_state",
        JSON.stringify({
          release: "H-MEGA2",
          cacheVersion: 2,
        }),
      );

      localStorage.setItem(
        "e4_h_mega2_user_save",
        JSON.stringify({
          characterId: "isolated-save",
          hitPoints: 44,
        }),
      );
    });

    await page.reload({
      waitUntil: "domcontentloaded",
    });

    const values = await page.evaluate(() => ({
      release: localStorage.getItem("e4_h_mega2_release_state"),
      user: localStorage.getItem("e4_h_mega2_user_save"),
    }));

    expect(values.release).toContain('"cacheVersion":2');
    expect(values.user).toContain('"hitPoints":44');
  });

  test("PWA recovery shell remains available", async ({ page }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    const manifestLinks = page.locator('link[rel="manifest"]');
    expect(await manifestLinks.count()).toBeGreaterThan(0);
    expect(await manifestLinks.first().getAttribute("href")).toBeTruthy();

    expect(
      await page.evaluate(() => "serviceWorker" in navigator),
    ).toBe(true);
  });
});
