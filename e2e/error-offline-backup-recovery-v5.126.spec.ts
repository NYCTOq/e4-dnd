import { expect, test } from "@playwright/test";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

for (const mode of ["online", "offline"] as const) {
  test(`${mode}: backup center reports network state and broken import safely`, async ({ page, context }) => {
    // The app must be loaded before the browser is taken offline. Otherwise
    // Chromium cannot even reach the local preview server to render the PWA.
    await page.goto("/backup");
    await expect(page.getByTestId("backup-recovery-center")).toBeVisible();

    if (mode === "offline") {
      await context.setOffline(true);
      await expect(page.getByTestId("backup-network-status")).toContainText("Çevrimdışı mod");
    } else {
      await expect(page.getByTestId("backup-network-status")).toContainText("Çevrimiçi");
    }

    const input = page.locator('input[type="file"][accept*="json"]').first();
    await input.setInputFiles({
      name: "broken-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from("{ definitely-not-json"),
    });

    const message = page.getByTestId("backup-recovery-message");
    await expect(message).toBeVisible();
    await expect(message).toContainText(/JSON|güvenlik/i);
    await expect(page.getByText("Tüm E4 D&D verisini yedekle")).toBeVisible();
  });
}
