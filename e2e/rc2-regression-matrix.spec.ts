import { expect, test } from "@playwright/test";
import { installKnownAppState } from "./support/appState";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.1.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

test.beforeEach(async ({ page }) => {
  await installKnownAppState(page);
});

const flows = [
  { name: "home", route: "/" },
  { name: "characters", route: "/characters" },
  { name: "builder", route: "/builder" },
  { name: "combat", route: "/combat" },
  { name: "backup", route: "/backup" },
  { name: "settings", route: "/settings" },
];

test("RC2 cross-feature navigation remains stable", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  for (const flow of flows) {
    const response = await page.goto(flow.route);
    expect(response?.status() ?? 200, `${flow.name} response status`).toBeLessThan(400);
    await expect(page.locator("main").first(), `${flow.name} main landmark`).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  }

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("RC2 combat flow can open without runtime failure", async ({ page }) => {
  await page.goto("/combat");
  await expect(page.locator("main").first()).toBeVisible();
  const createButton = page
    .getByRole("button", { name: /Yeni savaş|Savaş oluştur/i })
    .first();

  if (await createButton.isVisible()) {
    await createButton.click();
  }

  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});

test("RC2 backup safety shell remains available", async ({ page }) => {
  await page.goto("/backup");
  await expect(page.locator("main").first()).toBeVisible();
  await expect(page.getByText(/backup|yedek/i).first()).toBeVisible();
});

test("RC2 settings quality panel remains available", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.locator(".accessibility-performance-panel")).toBeVisible();
});
