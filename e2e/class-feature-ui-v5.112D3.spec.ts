import { test, expect } from "@playwright/test";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

const route = "/characters";

const fighter = {
  id: "class-feature-e2e-fighter",
  name: "Class Feature E2E Fighter",
  ruleset: "dnd_2014",
  classId: "fighter",
  subclassId: "battle-master",
  level: 5,
  classFeatures: [
    {
      id: "action-surge",
      classId: "fighter",
      level: 2,
      activation: "action",
      currentUses: 1,
      maxUses: 1,
      recovery: "short"
    },
    {
      id: "extra-attack",
      classId: "fighter",
      level: 5,
      activation: "passive"
    }
  ]
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((character) => {
    localStorage.setItem("characters", JSON.stringify([character]));
  }, fighter);
});

test("class feature panel renders unlocked features", async ({ page }) => {
  await page.goto(route);
  await expect(
    page.getByTestId("class-feature-runtime-integration"),
  ).toBeAttached();
  await expect(
    page.getByTestId("class-feature-action-surge"),
  ).toBeAttached();
  await expect(
    page.getByTestId("class-feature-extra-attack"),
  ).toBeAttached();
});

test("spend and restore persist class feature uses", async ({ page }) => {
  await page.goto(route);

  await page
    .getByTestId("class-feature-spend-action-surge")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0]?.classFeatures?.[0]?.currentUses,
    ),
  ).toBe(0);

  await page
    .getByTestId("class-feature-restore-action-surge")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0]?.classFeatures?.[0]?.currentUses,
    ),
  ).toBe(1);
});
