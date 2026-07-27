import { expect, test } from "@playwright/test";

const character = {
  id: "death-dying-e2e",
  name: "Death Dying E2E",
  playerName: "QA",
  ruleset: "dnd_2014",
  race: "Human",
  className: "Fighter",
  classLevels: [{ className: "Fighter", level: 5 }],
  subclass: "Champion",
  background: "Soldier",
  featIds: [],
  skillProficiencies: [],
  expertiseSkills: [],
  toolProficiencies: [],
  languages: ["Common"],
  level: 5,
  abilities: { str: 16, dex: 12, con: 16, int: 10, wis: 10, cha: 8 },
  maxHp: 40,
  currentHp: 0,
  tempHp: 0,
  armorClass: 16,
  armorClassMode: "manual",
  knownSpellIds: [],
  preparedSpellIds: [],
  spellSlots: [],
  inventory: [],
  equippedArmorId: null,
  equippedShieldId: null,
  equippedWeaponIds: [],
  gold: 0,
  deathSaves: { successes: 0, failures: 0 },
  hitDice: [{ die: 10, max: 5, used: 0 }],
  resources: [],
  exhaustion: 0,
  conditions: [],
  conditionDurations: {},
  notes: "",
  createdAt: "2026-07-27T00:00:00.000Z",
  updatedAt: "2026-07-27T00:00:00.000Z",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((payload) => {
    localStorage.setItem("e4_dnd_characters_v1", JSON.stringify([payload]));
  }, character);
  await page.goto("/play-mode?character=death-dying-e2e");
  await expect(page.getByTestId("death-dying-console")).toBeVisible();
});

test("renders canonical dying state", async ({ page }) => {
  await expect(page.getByTestId("death-dying-status"))
    .toContainText("Ölüm save'i gerekli");
  await expect(page.getByTestId("death-dying-roll")).toBeEnabled();
});

test("critical damage at zero persists two failures", async ({ page }) => {
  await page.getByTestId("death-dying-critical-damage").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect.poll(async () => page.evaluate(() => {
    const saved = JSON.parse(
      localStorage.getItem("e4_dnd_characters_v1") ?? "[]",
    )[0];
    return saved?.deathSaves?.failures;
  })).toBe(2);
});

test("stabilize persists explicit stable state", async ({ page }) => {
  await page.getByTestId("death-dying-stabilize").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect(page.getByTestId("death-dying-status")).toContainText("Stabil");
  await expect.poll(async () => page.evaluate(() => {
    const saved = JSON.parse(
      localStorage.getItem("e4_dnd_characters_v1") ?? "[]",
    )[0];
    return {
      stable: saved?.deathSaveStable,
      saves: saved?.deathSaves,
    };
  })).toEqual({
    stable: true,
    saves: { successes: 0, failures: 0 },
  });
});

test("healing from zero clears death state", async ({ page }) => {
  await page.getByTestId("death-dying-heal").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect.poll(async () => page.evaluate(() => {
    const saved = JSON.parse(
      localStorage.getItem("e4_dnd_characters_v1") ?? "[]",
    )[0];
    return {
      hp: saved?.currentHp,
      stable: saved?.deathSaveStable,
      dead: saved?.dead,
    };
  })).toEqual({ hp: 1, stable: false, dead: false });
});
