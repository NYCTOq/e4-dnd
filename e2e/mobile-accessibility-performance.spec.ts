import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
  });
});

test("settings exposes the accessibility and performance quality gate", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Accessibility & Performance" })).toBeVisible();
  await expect(page.getByText("44 px+", { exact: true })).toBeVisible();
  await expect(page.locator(".accessibility-performance-panel")).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});

test("keyboard focus remains visible on primary navigation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();
});
