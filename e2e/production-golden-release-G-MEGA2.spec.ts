import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/characters",
  "/builder",
  "/play",
  "/combat",
  "/spells",
  "/library",
  "/settings",
] as const;

test.describe("G-MEGA2 production golden release smoke", () => {
  for (const route of routes) {
    test(`${route} loads without fatal production errors`, async ({ page }) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];

      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      page.on("console", (message) => {
        if (message.type() === "error") {
          const text = message.text();

          if (
            !/favicon|manifest|service worker|failed to load resource/i.test(text)
          ) {
            consoleErrors.push(text);
          }
        }
      });

      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status() ?? 200).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("body")).not.toHaveText("");
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }

  test("release state and user data remain separate", async ({ page }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
      localStorage.setItem(
        "e4_g_mega2_release_state",
        JSON.stringify({
          release: "G-MEGA2",
          deployed: true,
        }),
      );

      localStorage.setItem(
        "e4_g_mega2_user_save",
        JSON.stringify({
          characterId: "golden-release-character",
          level: 12,
        }),
      );
    });

    await page.reload({
      waitUntil: "domcontentloaded",
    });

    const values = await page.evaluate(() => ({
      release: localStorage.getItem("e4_g_mega2_release_state"),
      userSave: localStorage.getItem("e4_g_mega2_user_save"),
    }));

    expect(values.release).toContain('"release":"G-MEGA2"');
    expect(values.userSave).toContain('"level":12');
  });

  test("production shell exposes PWA assets", async ({ page }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    const manifestLinks = page.locator('link[rel="manifest"]');
    expect(await manifestLinks.count()).toBeGreaterThan(0);
    expect(
      await manifestLinks.first().getAttribute("href"),
    ).toBeTruthy();

    const serviceWorkerSupported = await page.evaluate(
      () => "serviceWorker" in navigator,
    );

    expect(serviceWorkerSupported).toBe(true);
  });
});
