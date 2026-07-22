import { expect, test } from "@playwright/test";

test("ruleset center exposes the content integrity dashboard", async ({ page }) => {
  await page.goto("/rulesets");
  const audit = page.getByTestId("content-integrity-audit");
  await expect(audit).toBeVisible();
  await expect(audit).toContainText(/Content Integrity/i);
  await expect(audit).toContainText(/Classes/);
  await expect(audit).toContainText(/Spells/);
});
