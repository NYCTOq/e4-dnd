import { test, expect } from "@playwright/test";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

const route = "/characters/level-e2e-character";

const character = {
  id: "level-e2e-character",
  name: "Level E2E Fighter",
  level: 3,
  ruleset: "dnd_2014",
  maxHp: 28,
  currentHp: 24,
  abilities: {
    strength: 18,
    dexterity: 12,
    constitution: 16,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  },
  classes: [
    {
      classId: "fighter",
      classLevel: 3,
      hitDie: 10
    }
  ]
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ character }) => {
    localStorage.setItem(
      "characters",
      JSON.stringify([character]),
    );
  }, { character });
});

test("level-up panel renders current character", async ({ page }) => {
  await page.goto(route);

  await expect(
    page.getByTestId("level-up-runtime-integration"),
  ).toBeAttached();

  await expect(
    page.getByTestId("level-up-current-level"),
  ).toContainText("3");

  await expect(
    page.getByTestId("level-up-milestone-summary"),
  ).toContainText("Yeni seviye: 4");
});

test("ASI level-up persists to character storage", async ({ page }) => {
  await page.goto(route);

  await page
    .getByTestId("level-up-first-ability")
    .selectOption("strength");

  await page
    .getByTestId("level-up-second-ability")
    .selectOption("strength");

  await page
    .getByTestId("level-up-apply")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() => {
      const stored = JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0];

      return {
        level: stored?.level,
        strength: stored?.abilities?.strength,
        classLevel: stored?.classes?.[0]?.classLevel,
        history: stored?.levelUpHistory?.length,
      };
    }),
  ).toEqual({
    level: 4,
    strength: 20,
    classLevel: 4,
    history: 1,
  });
});

test("feat level-up persists selected feat", async ({ page }) => {
  await page.addInitScript(({ character }) => {
    localStorage.setItem(
      "characters",
      JSON.stringify([
        {
          ...character,
          level: 3,
          classes: [
            {
              classId: "fighter",
              classLevel: 3,
              hitDie: 10
            }
          ]
        }
      ]),
    );
  }, { character });

  await page.goto(route);

  const radios = page.locator(
    '[data-testid="level-up-asi-feat-choice"] input[type="radio"]',
  );

  await radios.nth(1).evaluate((element) => {
    (element as HTMLInputElement).click();
  });
  await page
    .getByTestId("level-up-feat-select")
    .selectOption("alert");

  await page
    .getByTestId("level-up-apply")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0]?.feats,
    ),
  ).toContain("alert");
});

test("level 20 cannot advance", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "characters",
      JSON.stringify([
        {
          id: "level-e2e-character",
          name: "Level Cap Fighter",
          level: 20,
          ruleset: "dnd_2014",
          maxHp: 180,
          currentHp: 180,
          abilities: {
            strength: 20,
            constitution: 20
          },
          classes: [
            {
              classId: "fighter",
              classLevel: 20,
              hitDie: 10
            }
          ]
        }
      ]),
    );
  });

  await page.goto(route);

  await expect(
    page.getByTestId("level-up-apply"),
  ).toBeDisabled();
});
