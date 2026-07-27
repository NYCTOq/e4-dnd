import { test, expect } from "@playwright/test";

const route = "/spellbook";

const caster = {
  id: "spell-e2e-caster",
  name: "Spell E2E Wizard",
  classId: "wizard",
  level: 5,
  intelligence: 18,
  spellSlots: [
    { level: 3, max: 2, used: 0 }
  ],
  concentrationSpellId: null,
  concentrating: false
};

const target = {
  id: "spell-e2e-target",
  name: "Training Target",
  currentHp: 20,
  maxHp: 20
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ caster, target }) => {
    localStorage.setItem(
      "characters",
      JSON.stringify([caster]),
    );
    localStorage.setItem(
      "combatTracker",
      JSON.stringify([target]),
    );
  }, { caster, target });
});

test("spell runtime panel renders caster statistics", async ({ page }) => {
  await page.goto(route);

  await expect(
    page.getByTestId("spell-runtime-integration"),
  ).toBeAttached();

  await expect(
    page.getByTestId("spell-runtime-save-dc"),
  ).toContainText("15");

  await expect(
    page.getByTestId("spell-runtime-attack-bonus"),
  ).toContainText("+7");
});

test("slot and concentration changes persist", async ({ page }) => {
  await page.goto(route);

  await page
    .getByTestId("spell-slot-spend-normal-3")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0]?.spellSlots?.[0]?.used,
    ),
  ).toBe(1);

  await page
    .getByTestId("spell-concentration-input")
    .fill("hold-person");

  await page
    .getByTestId("spell-concentration-start")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("characters") ?? "[]",
      )[0]?.concentrationSpellId,
    ),
  ).toBe("hold-person");
});

test("combat target damage and healing persist", async ({ page }) => {
  await page.goto(route);

  await page
    .getByTestId("spell-runtime-target-amount")
    .fill("7");

  await page
    .getByTestId("spell-runtime-apply-damage")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("combatTracker") ?? "[]",
      )[0]?.currentHp,
    ),
  ).toBe(13);

  await page
    .getByTestId("spell-runtime-apply-healing")
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

  await expect.poll(async () =>
    page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("combatTracker") ?? "[]",
      )[0]?.currentHp,
    ),
  ).toBe(20);
});
