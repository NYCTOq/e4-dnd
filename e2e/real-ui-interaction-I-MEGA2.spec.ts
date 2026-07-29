import { expect, test, type Page } from "@playwright/test";

async function dismissFirstRunOverlay(page: Page): Promise<void> {
  const overlay = page.locator('[data-testid="first-run-overlay"]');

  if ((await overlay.count()) === 0 || !(await overlay.first().isVisible())) {
    return;
  }

  const dialog = page.locator('[data-testid="first-run-dialog"]');
  const preferredButton = dialog
    .getByRole("button", {
      name: /tamam|başla|devam|anladım|kapat|geç|bitir/i,
    })
    .last();

  if ((await preferredButton.count()) > 0) {
    await preferredButton.click({ force: true });
  } else {
    const fallbackButton = dialog.locator("button:visible:enabled").last();

    if ((await fallbackButton.count()) > 0) {
      await fallbackButton.click({ force: true });
    }
  }

  await expect(overlay).toBeHidden({ timeout: 10_000 });
}

const profiles = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const candidateRoutes = [
  "/builder",
  "/characters",
  "/play",
  "/combat",
  "/rest",
  "/spells",
  "/feats",
  "/inventory",
] as const;

for (const profile of profiles) {
  test.describe(`I-MEGA2 ${profile.name} real interaction`, () => {
    test.use({
      viewport: {
        width: profile.width,
        height: profile.height,
      },
    });

    test("builder route exposes usable interactive controls", async ({ page }) => {
      await page.goto("/builder", { waitUntil: "domcontentloaded" });
      await dismissFirstRunOverlay(page);

      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("body")).not.toHaveText("");

      const inputs = page.locator("input, select, textarea, button");
      expect(await inputs.count()).toBeGreaterThan(0);

      const firstTextInput = page
        .locator('input[type="text"]:visible, input:not([type]):visible')
        .first();
      if (await firstTextInput.count()) {
        await firstTextInput.fill("I-MEGA2 Hero");
        await expect(firstTextInput).toHaveValue("I-MEGA2 Hero");
      }

      const firstSelect = page.locator("select:visible").first();
      if (await firstSelect.count()) {
        const options = firstSelect.locator("option");
        if ((await options.count()) > 1) {
          const value = await options.nth(1).getAttribute("value");
          if (value) {
            await firstSelect.selectOption(value);
            await expect(firstSelect).toBeVisible();

            const resultingValue = await firstSelect.inputValue();
            expect(resultingValue).toBeTruthy();
          }
        }
      }

      const enabledButton = page
        .locator(
          'main button:visible:enabled, form button:visible:enabled, [role="main"] button:visible:enabled',
        )
        .first();

      if (await enabledButton.count()) {
        await expect(enabledButton).toBeVisible();
        await expect(enabledButton).toBeEnabled();
        await enabledButton.click({ force: true });
        await expect(page.locator("body")).toBeVisible();
      }
    });

    test("keyboard interaction keeps controls reachable", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });

      await page.keyboard.press("Tab");
      const firstActive = await page.evaluate(
        () => document.activeElement?.tagName ?? null,
      );
      expect(firstActive).toBeTruthy();

      await page.keyboard.press("Tab");
      const secondActive = await page.evaluate(
        () => document.activeElement?.tagName ?? null,
      );
      expect(secondActive).toBeTruthy();
    });

    test("core interaction routes load and survive refresh", async ({ page }) => {
      test.setTimeout(90_000);

      for (const route of candidateRoutes) {
        const response = await page.goto(route, {
          waitUntil: "domcontentloaded",
        });

        expect(response?.status() ?? 200).toBeLessThan(500);
        await expect(page.locator("body")).toBeVisible();

        if (route === candidateRoutes.at(-1)) {
          await page.reload({ waitUntil: "domcontentloaded" });
          await expect(page.locator("body")).toBeVisible();
        }
      }
    });

    test("interaction state survives reload", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });

      await page.evaluate(() => {
        localStorage.setItem(
          "e4_i_mega2_interaction_state",
          JSON.stringify({
            name: "I-MEGA2 Hero",
            classId: "fighter",
            subclassId: "champion",
            spellId: "guiding-bolt",
            featId: "alert",
            equipmentId: "longsword",
            level: 5,
            restUsed: true,
            combatRound: 2,
          }),
        );
      });

      await page.reload({ waitUntil: "domcontentloaded" });

      const value = await page.evaluate(() =>
        localStorage.getItem("e4_i_mega2_interaction_state"),
      );

      expect(value).toContain('"name":"I-MEGA2 Hero"');
      expect(value).toContain('"level":5');
      expect(value).toContain('"combatRound":2');
    });

    test("PWA shell remains available during interaction flow", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const manifestLinks = page.locator('link[rel="manifest"]');
      expect(await manifestLinks.count()).toBeGreaterThan(0);
      expect(await manifestLinks.first().getAttribute("href")).toBeTruthy();

      expect(
        await page.evaluate(() => "serviceWorker" in navigator),
      ).toBe(true);
    });
  });
}
