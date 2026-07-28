import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const FIRST_RUN_STORAGE_KEY = "e4_dnd_first_run_guide_v1";
const LAST_SEEN_VERSION_KEY = "e4_dnd_last_seen_version_v1";
const CURRENT_APP_VERSION = String(
  JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ).version,
);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(([guideKey, releaseKey, version]) => {
    localStorage.setItem(guideKey, "true");
    localStorage.setItem(releaseKey, version);
  }, [FIRST_RUN_STORAGE_KEY, LAST_SEEN_VERSION_KEY, CURRENT_APP_VERSION]);
});

test("keyboard help traps focus, closes with Escape and restores opener", async ({ page }, testInfo) => {
  await page.goto("/");
  const trigger = page.getByTestId("accessibility-help-trigger");
  const isMobile = testInfo.project.name.includes("mobile");

  await expect(page.getByTestId("first-run-overlay")).toHaveCount(0);
  await expect(trigger).toBeVisible();

  if (isMobile) {
    const installTrigger = page.getByTestId("pwa-install-guide-open");
    await expect(installTrigger).toBeVisible();
    const [helpBox, installBox] = await Promise.all([
      trigger.boundingBox(),
      installTrigger.boundingBox(),
    ]);
    expect(helpBox).not.toBeNull();
    expect(installBox).not.toBeNull();
    if (helpBox && installBox) {
      const overlaps = !(
        helpBox.x + helpBox.width <= installBox.x ||
        installBox.x + installBox.width <= helpBox.x ||
        helpBox.y + helpBox.height <= installBox.y ||
        installBox.y + installBox.height <= helpBox.y
      );
      expect(overlaps).toBe(false);
    }
    await trigger.click();
  } else {
    await page.keyboard.press("Shift+?");
  }

  const dialog = page.getByTestId("accessibility-help-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Klavye kısayolları" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  if (isMobile) await expect(trigger).toBeFocused();
});

test("Alt+0 and skip link move focus to main content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("first-run-overlay")).toHaveCount(0);
  await page.keyboard.press("Alt+0");
  await expect(page.locator("#main-content")).toBeFocused();
  const skip = page.getByRole("link", { name: "Ana içeriğe geç" }).first();
  await skip.focus();
  await skip.click();
  await expect(page.locator("#main-content")).toBeFocused();
});
