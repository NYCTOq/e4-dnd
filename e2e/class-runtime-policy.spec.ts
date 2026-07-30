import { expect, test } from "@playwright/test";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

test("Ruleset Center exposes the class-specific runtime map", async ({ page }) => {
  await page.goto("/rulesets");
  const panel = page.getByTestId("class-runtime-policy");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Class Choice & Runtime Map");
  await expect(panel).toContainText("Fighter");
  await expect(panel).toContainText("Wizard");
});
