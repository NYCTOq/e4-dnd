import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const CURRENT_APP_VERSION = String(
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version,
);
const FIRST_RUN_STORAGE_KEY = "e4_dnd_first_run_guide_v1";
const LAST_SEEN_VERSION_KEY = "e4_dnd_last_seen_version_v1";

const routes = [
  ["/", "Masa hazır."],
  ["/characters", "Karakterler"],
  ["/builder", "Yeni Karakter"],
  ["/play-mode", "Play Mode"],
  ["/backup", "Yedek"],
] as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([guideKey, releaseKey, version]) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(guideKey, "true");
      localStorage.setItem(releaseKey, version);
    },
    [FIRST_RUN_STORAGE_KEY, LAST_SEEN_VERSION_KEY, CURRENT_APP_VERSION],
  );
});

test("dashboard shell opens", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Masa hazır." })).toBeVisible();

  if (testInfo.project.name.includes("mobile")) {
    await expect(page.getByRole("navigation", { name: "Mobil navigasyon" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ana", exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole("link", { name: "E4 D&D ana sayfa" })).toBeVisible();
  }
});

test("core routes support direct navigation", async ({ page }) => {
  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: new RegExp(heading, "i") }).first()).toBeVisible();
  }
});

test("keyboard shortcut reaches main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Alt+0");
  await expect(page.locator("#main-content")).toBeFocused();
});
