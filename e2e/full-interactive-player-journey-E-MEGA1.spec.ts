import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const viewport of viewports) {
  test.describe(`E-MEGA1 ${viewport.name} player journey shell`, () => {
    test.use({
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
    });

    test("loads without fatal browser errors and survives reload", async ({
      page,
    }) => {
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

      await page.goto("/", {
        waitUntil: "domcontentloaded",
      });

      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("body")).not.toHaveText("");

      await page.evaluate(() => {
        localStorage.setItem(
          "e4_e_mega1_browser_sentinel",
          JSON.stringify({
            ready: true,
            storedAt: "E-MEGA1",
          }),
        );
      });

      await page.reload({
        waitUntil: "domcontentloaded",
      });

      const sentinel = await page.evaluate(() =>
        localStorage.getItem("e4_e_mega1_browser_sentinel"),
      );

      expect(sentinel).toContain('"ready":true');
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });

    test("keeps route refresh and application shell usable", async ({
      page,
    }) => {
      await page.goto("/", {
        waitUntil: "domcontentloaded",
      });

      const root = page.locator("#root");
      if ((await root.count()) > 0) {
        await expect(root).toBeVisible();
      } else {
        await expect(page.locator("body")).toBeVisible();
      }

      const initialUrl = page.url();

      await page.reload({
        waitUntil: "domcontentloaded",
      });

      expect(page.url()).toBe(initialUrl);
      await expect(page.locator("body")).toBeVisible();
    });

    test("exposes an installable or offline-capable application shell", async ({
      page,
    }) => {
      await page.goto("/", {
        waitUntil: "domcontentloaded",
      });

      const manifestLinks = page.locator('link[rel="manifest"]');
      expect(await manifestLinks.count()).toBeGreaterThan(0);

      const manifestHref = await manifestLinks
        .first()
        .getAttribute("href");

      expect(manifestHref).toBeTruthy();

      const serviceWorkerSupported = await page.evaluate(
        () => "serviceWorker" in navigator,
      );

      expect(serviceWorkerSupported).toBe(true);
    });
  });
}
