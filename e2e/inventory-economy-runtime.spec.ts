import { expect, test } from "@playwright/test";
import { installKnownAppState, seedCharacters } from "./support/appState";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.1.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

const now = new Date().toISOString();
const character = {
  id: "e2e-inventory",
  name: "Pack Mule",
  playerName: "E2E",
  ruleset: "dnd_2024",
  race: "Human",
  className: "Fighter",
  classLevels: [{ className: "Fighter", level: 1 }],
  subclass: "",
  background: "Soldier",
  featIds: [],
  skillProficiencies: [],
  expertiseSkills: [],
  toolProficiencies: [],
  languages: [],
  level: 1,
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  maxHp: 12,
  currentHp: 12,
  tempHp: 0,
  armorClass: 10,
  armorClassMode: "manual",
  knownSpellIds: [],
  preparedSpellIds: [],
  spellSlots: [],
  inventory: [],
  equippedArmorId: null,
  equippedShieldId: null,
  equippedWeaponIds: [],
  gold: 25,
  deathSaves: { successes: 0, failures: 0 },
  hitDice: [],
  resources: [],
  exhaustion: 0,
  conditionDurations: {},
  conditions: [],
  notes: "",
  createdAt: now,
  updatedAt: now,
};

test.beforeEach(async ({ page }) => {
  await installKnownAppState(page);
});

test("character sheet exposes inventory economy runtime", async ({ page }) => {
  await page.goto("/");
  await seedCharacters(page, [character]);
  await page.goto("/characters/e2e-inventory");
  await expect(page.getByTestId("inventory-economy-panel")).toBeVisible();
  await expect(page.getByText("25", { exact: true }).first()).toBeVisible();
});
