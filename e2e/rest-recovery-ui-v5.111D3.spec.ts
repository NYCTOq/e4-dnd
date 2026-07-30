import { test, expect } from "@playwright/test";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

const route = "/rest";

const fighter = {
  id: "rest-e2e-fighter",
  name: "Rest E2E Fighter",
  ruleset: "dnd_2014",
  currentHp: 5,
  maxHp: 30,
  tempHp: 4,
  hitDice: [{ die: 10, max: 5, used: 3 }],
  spellSlots: [{ level: 1, max: 2, used: 2, pact: true }],
  resources: [
    { id: "action-surge", current: 0, max: 1, recovery: "short" }
  ],
  exhaustion: 2,
  deathSaves: { successes: 2, failures: 1 },
  concentrating: true,
  activeEffects: [{ id: "bless", durationType: "minutes" }]
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((character) => {
    localStorage.setItem("characters", JSON.stringify([character]));
  }, fighter);
});

test("short rest persists resources and pact slots", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByTestId("rest-runtime-integration")).toBeVisible();
  await expect(page.getByTestId("rest-short-button")).toBeVisible();
  await page.getByTestId("rest-short-button").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });

  await expect.poll(async () =>
    page.evaluate(() => {
      const saved = JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0];

      return {
        resource: saved?.resources?.[0]?.current,
        pactUsed: saved?.spellSlots?.[0]?.used,
        hp: saved?.currentHp,
      };
    }),
  ).toEqual({
    resource: 1,
    pactUsed: 0,
    hp: 5,
  });

  await expect(page.getByTestId("rest-result")).toBeAttached();

  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("characters") ?? "[]")[0]
  );

  expect(saved.resources[0].current).toBe(1);
  expect(saved.spellSlots[0].used).toBe(0);
  expect(saved.currentHp).toBe(5);
});

test("long rest persists full recovery", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByTestId("rest-long-button")).toBeVisible();
  await page.getByTestId("rest-long-button").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });

  await expect.poll(async () =>
    page.evaluate(() => {
      const saved = JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0];

      return {
        currentHp: saved?.currentHp,
        tempHp: saved?.tempHp,
        deathSaves: saved?.deathSaves,
        concentrating: saved?.concentrating,
        exhaustion: saved?.exhaustion,
      };
    }),
  ).toEqual({
    currentHp: 30,
    tempHp: 0,
    deathSaves: { successes: 0, failures: 0 },
    concentrating: false,
    exhaustion: 1,
  });

  await expect(page.getByTestId("rest-result")).toBeAttached();

  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("characters") ?? "[]")[0]
  );

  expect(saved.currentHp).toBe(30);
  expect(saved.tempHp).toBe(0);
  expect(saved.deathSaves).toEqual({ successes: 0, failures: 0 });
  expect(saved.concentrating).toBe(false);
  expect(saved.exhaustion).toBe(1);
});
