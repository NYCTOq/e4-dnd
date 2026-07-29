import { expect, test } from "@playwright/test";

const deviceProfiles = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const routes = [
  "/",
  "/characters",
  "/builder",
  "/play",
  "/combat",
  "/spells",
  "/library",
  "/search",
  "/settings",
  "/help",
] as const;

for (const profile of deviceProfiles) {
  test.describe(`I-MEGA1 ${profile.name} acceptance`, () => {
    test.use({
      viewport: {
        width: profile.width,
        height: profile.height,
      },
    });

    test("core routes render without fatal errors", async ({ page }) => {
      test.setTimeout(90_000);

      for (const route of routes) {
        const pageErrors: string[] = [];

        const listener = (error: Error) => {
          pageErrors.push(error.message);
        };

        page.on("pageerror", listener);

        const response = await page.goto(route, {
          waitUntil: "domcontentloaded",
        });

        expect(response?.status() ?? 200).toBeLessThan(500);
        await expect(page.locator("body")).toBeVisible();
        await expect(page.locator("body")).not.toHaveText("");
        expect(pageErrors).toEqual([]);

        page.off("pageerror", listener);
      }
    });

    test("keyboard navigation keeps the application usable", async ({ page }) => {
      await page.goto("/", {
        waitUntil: "domcontentloaded",
      });

      await page.keyboard.press("Tab");

      const activeTag = await page.evaluate(
        () => document.activeElement?.tagName ?? null,
      );

      expect(activeTag).toBeTruthy();

      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");

      await expect(page.locator("body")).toBeVisible();
    });

    test("user state survives reload", async ({ page }) => {
      await page.goto("/", {
        waitUntil: "domcontentloaded",
      });

      await page.evaluate(() => {
        localStorage.setItem(
          "e4_i_mega1_acceptance_state",
          JSON.stringify({
            device: window.innerWidth,
            characterId: "acceptance-character",
            playReady: true,
          }),
        );
      });

      await page.reload({
        waitUntil: "domcontentloaded",
      });

      const value = await page.evaluate(() =>
        localStorage.getItem("e4_i_mega1_acceptance_state"),
      );

      expect(value).toContain('"playReady":true');
      expect(value).toContain('"acceptance-character"');
    });

    test("PWA shell remains available", async ({ page }) => {
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
}
