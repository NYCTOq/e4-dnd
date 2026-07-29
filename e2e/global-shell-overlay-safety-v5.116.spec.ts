import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const FIRST_RUN_STORAGE_KEY = "e4_dnd_first_run_guide_v1";
const LAST_SEEN_VERSION_KEY = "e4_dnd_last_seen_version_v1";
const CURRENT_APP_VERSION = String(
  JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ).version,
);

test("first-run guide is deterministic, dismissible and stays completed", async ({ page }) => {
  await page.goto("/");

  const guide = page.getByTestId("first-run-dialog");
  await expect(guide).toBeVisible();
  await expect(page.getByTestId("first-run-close")).toBeFocused();

  await page.getByTestId("first-run-complete").click();
  await expect(guide).toBeHidden();
  await expect.poll(() =>
    page.evaluate((key) => localStorage.getItem(key), FIRST_RUN_STORAGE_KEY),
  ).toBe("true");
  await expect(page.getByTestId("release-notes-dialog")).toBeVisible();
  await page.getByTestId("release-notes-close").click();

  await page.reload({ waitUntil: "domcontentloaded" }).catch((error) => {
    if (!String(error).includes("ERR_INTERNET_DISCONNECTED")) throw error;
  });
  await expect(guide).toBeHidden();
  await expect(page.getByTestId("release-notes-dialog")).toHaveCount(0);
  await page.getByRole("link", { name: /Karakterler/i }).first().click();
  await expect(page).toHaveURL(/\/characters$/);
});

test("completed shell overlays never intercept physical pointer actions", async ({ page }) => {
  await page.addInitScript(([guideKey, releaseKey, version]) => {
    localStorage.setItem(guideKey, "true");
    localStorage.setItem(releaseKey, version);
  }, [FIRST_RUN_STORAGE_KEY, LAST_SEEN_VERSION_KEY, CURRENT_APP_VERSION]);
  await page.goto("/");

  await expect(page.getByTestId("first-run-overlay")).toHaveCount(0);
  await page.getByRole("link", { name: /Karakterler/i }).first().click();
  await expect(page).toHaveURL(/\/characters$/);

  await page.getByTestId("pwa-install-guide-open").click();
  await expect(page.getByTestId("first-run-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("first-run-dialog")).toBeHidden();
});
