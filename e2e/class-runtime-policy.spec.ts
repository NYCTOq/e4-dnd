import { expect, test } from "@playwright/test";

test("Ruleset Center exposes the class-specific runtime map", async ({ page }) => {
  await page.goto("/rulesets");
  const panel = page.getByTestId("class-runtime-policy");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Class Choice & Runtime Map");
  await expect(panel).toContainText("Fighter");
  await expect(panel).toContainText("Wizard");
});
