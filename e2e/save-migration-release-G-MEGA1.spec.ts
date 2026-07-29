import { expect, test } from "@playwright/test";

test.describe("G-MEGA1 save migration and release browser shell", () => {
  test("legacy save sentinel survives reload and can be versioned", async ({
    page,
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
      localStorage.setItem(
        "e4_g_mega1_legacy_save",
        JSON.stringify({
          schemaVersion: 1,
          character: {
            id: "legacy-character",
            name: "Legacy Hero",
            level: 5,
          },
          migrationBackupCreated: false,
        }),
      );
    });

    await page.reload({
      waitUntil: "domcontentloaded",
    });

    const legacySave = await page.evaluate(() =>
      localStorage.getItem("e4_g_mega1_legacy_save"),
    );

    expect(legacySave).toContain('"schemaVersion":1');
    expect(legacySave).toContain('"Legacy Hero"');
  });

  test("pre-migration backup and migrated save can coexist", async ({
    page,
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
      const legacy = {
        schemaVersion: 1,
        character: {
          id: "migration-test",
          name: "Migration Test",
          level: 3,
        },
      };

      localStorage.setItem(
        "e4_g_mega1_pre_migration_backup",
        JSON.stringify(legacy),
      );

      localStorage.setItem(
        "e4_g_mega1_migrated_save",
        JSON.stringify({
          ...legacy,
          schemaVersion: 2,
          migratedAt: "G-MEGA1",
        }),
      );
    });

    await page.reload({
      waitUntil: "domcontentloaded",
    });

    const values = await page.evaluate(() => ({
      backup: localStorage.getItem("e4_g_mega1_pre_migration_backup"),
      migrated: localStorage.getItem("e4_g_mega1_migrated_save"),
    }));

    expect(values.backup).toContain('"schemaVersion":1');
    expect(values.migrated).toContain('"schemaVersion":2');
    expect(values.migrated).toContain('"migratedAt":"G-MEGA1"');
  });

  test("release shell exposes manifest and service worker support", async ({
    page,
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    const manifestLinks = page.locator('link[rel="manifest"]');
    expect(await manifestLinks.count()).toBeGreaterThan(0);
    expect(
      await manifestLinks.first().getAttribute("href"),
    ).toBeTruthy();

    const serviceWorkerSupported = await page.evaluate(
      () => "serviceWorker" in navigator,
    );

    expect(serviceWorkerSupported).toBe(true);
  });
});
