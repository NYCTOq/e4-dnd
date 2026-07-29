import { expect, test } from "@playwright/test";

const routes = ["/", "/combat", "/play", "/rest"] as const;

test.describe("E-MEGA2 combat and spell browser shell", () => {
  for (const route of routes) {
    test(`route ${route} loads or falls back without fatal errors`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      expect(response?.status() ?? 200).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("body")).not.toHaveText("");
      expect(pageErrors).toEqual([]);
    });
  }

  test("combat state survives reload through browser storage", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.evaluate(() => {
      localStorage.setItem(
        "e4_e_mega2_combat_state",
        JSON.stringify({
          round: 3,
          turn: 2,
          concentration: true,
          conditions: ["prone", "blessed"],
          summonCount: 1,
        }),
      );
    });

    await page.reload({ waitUntil: "domcontentloaded" });

    const state = await page.evaluate(() =>
      localStorage.getItem("e4_e_mega2_combat_state"),
    );

    expect(state).toContain('"round":3');
    expect(state).toContain('"concentration":true');
    expect(state).toContain('"summonCount":1');
  });

  test("PWA shell exposes manifest and service-worker support", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const manifestLinks = page.locator('link[rel="manifest"]');
    expect(await manifestLinks.count()).toBeGreaterThan(0);

    const manifestHref = await manifestLinks.first().getAttribute("href");
    expect(manifestHref).toBeTruthy();

    const serviceWorkerSupported = await page.evaluate(
      () => "serviceWorker" in navigator,
    );

    expect(serviceWorkerSupported).toBe(true);
  });
});
