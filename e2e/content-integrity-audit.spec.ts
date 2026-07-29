import { expect, test } from "@playwright/test";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.1.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

test("ruleset center exposes the content integrity dashboard", async ({ page }) => {
  await page.goto("/rulesets");
  const audit = page.getByTestId("content-integrity-audit");
  await expect(audit).toBeVisible();
  await expect(audit).toContainText(/Content Integrity/i);
  await expect(audit).toContainText(/Classes/);
  await expect(audit).toContainText(/Spells/);
});
