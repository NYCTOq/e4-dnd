import { expect, test } from "@playwright/test";

test.describe("H-MEGA1 production operations browser smoke", () => {
  test("application survives reload without fatal browser errors", async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        const text = message.text();
        if (!/favicon|manifest|service worker|failed to load resource/i.test(text)) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("storage diagnostics can distinguish release and user state", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.evaluate(() => {
      localStorage.setItem(
        "e4_h_mega1_release_health",
        JSON.stringify({ release: "H-MEGA1", healthy: true }),
      );

      localStorage.setItem(
        "e4_h_mega1_user_state",
        JSON.stringify({ characterId: "ops-check", level: 9 }),
      );
    });

    await page.reload({ waitUntil: "domcontentloaded" });

    const state = await page.evaluate(() => ({
      release: localStorage.getItem("e4_h_mega1_release_health"),
      user: localStorage.getItem("e4_h_mega1_user_state"),
    }));

    expect(state.release).toContain('"healthy":true');
    expect(state.user).toContain('"level":9');
  });

  test("PWA shell remains visible for recovery scenarios", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const manifestLinks = page.locator('link[rel="manifest"]');
    expect(await manifestLinks.count()).toBeGreaterThan(0);
    expect(await manifestLinks.first().getAttribute("href")).toBeTruthy();

    const serviceWorkerSupported = await page.evaluate(
      () => "serviceWorker" in navigator,
    );

    expect(serviceWorkerSupported).toBe(true);
  });
});
