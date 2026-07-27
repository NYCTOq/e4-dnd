import { expect, test } from "@playwright/test";
import { installKnownAppState, seedCharacters } from "./support/appState";

const now = new Date().toISOString();

const characters = [
  {
    id: "e2e-loadout-fighter",
    name: "Golden Shield Fighter",
    playerName: "E2E",
    ruleset: "dnd_2024",
    race: "Human",
    className: "Fighter",
    classLevels: [{ className: "Fighter", level: 1 }],
    subclass: "",
    background: "Soldier",
    featIds: [],
    fightingStyleIds: ["dueling"],
    masteredWeaponIds: ["longsword"],
    skillProficiencies: [],
    expertiseSkills: [],
    toolProficiencies: [],
    languages: [],
    level: 1,
    abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    armorClass: 10,
    armorClassMode: "auto",
    knownSpellIds: [],
    preparedSpellIds: [],
    spellSlots: [],
    inventory: [
      { itemId: "longsword", quantity: 1 },
      { itemId: "chain-mail", quantity: 1 },
      { itemId: "shield", quantity: 1 },
    ],
    equippedArmorId: "chain-mail",
    equippedShieldId: "shield",
    equippedWeaponIds: ["longsword"],
    gold: 10,
    deathSaves: { successes: 0, failures: 0 },
    hitDice: [],
    resources: [],
    exhaustion: 0,
    conditionDurations: {},
    conditions: [],
    notes: "",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "e2e-loadout-wizard",
    name: "Golden Fire Bolt Wizard",
    playerName: "E2E",
    ruleset: "dnd_2014",
    race: "Human",
    className: "Wizard",
    classLevels: [{ className: "Wizard", level: 1 }],
    subclass: "",
    background: "Sage",
    featIds: [],
    fightingStyleIds: [],
    masteredWeaponIds: [],
    skillProficiencies: [],
    expertiseSkills: [],
    toolProficiencies: [],
    languages: [],
    level: 1,
    abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 },
    maxHp: 8,
    currentHp: 8,
    tempHp: 0,
    armorClass: 12,
    armorClassMode: "manual",
    knownSpellIds: ["fire-bolt"],
    preparedSpellIds: [],
    spellSlots: [],
    inventory: [],
    equippedArmorId: null,
    equippedShieldId: null,
    equippedWeaponIds: [],
    gold: 5,
    deathSaves: { successes: 0, failures: 0 },
    hitDice: [],
    resources: [],
    exhaustion: 0,
    conditionDurations: {},
    conditions: [],
    notes: "",
    createdAt: now,
    updatedAt: now,
  },
];

test.beforeEach(async ({ page }) => {
  await installKnownAppState(page);
  await page.goto("/");
  await seedCharacters(page, characters);
});

test("fighter loadout renders inventory and combat data", async ({ page }) => {
      await page.goto("/characters/e2e-loadout-fighter");

      await expect(page.getByRole("heading", { name: "Golden Shield Fighter", level: 1 })).toBeVisible();
      const inventoryPanel = page.getByTestId("inventory-economy-panel");
      await expect(inventoryPanel).toBeVisible();

      await expect(
        page.getByText(/longsword/i).filter({ visible: true }).first(),
      ).toBeVisible();

      await expect(
        page
          .getByText(/chain mail|chain-mail/i)
          .filter({ visible: true })
          .first(),
      ).toBeVisible();

      await expect(
        page.getByText(/shield/i).filter({ visible: true }).first(),
      ).toBeVisible();

      const visibleMain = page.locator("main").filter({ visible: true });

      await expect(
        visibleMain.getByText(/^18$/).filter({ visible: true }).first(),
      ).toBeVisible();

      await expect(
        visibleMain.getByText(/1d8/i).filter({ visible: true }).first(),
      ).toBeVisible();

      await expect(
        visibleMain.getByText(/sap/i).filter({ visible: true }).first(),
      ).toBeVisible();
    });

test("spellcaster readiness renders offensive option", async ({ page }) => {
      await page.goto("/characters/e2e-loadout-wizard");

      await expect(page.getByRole("heading", { name: "Golden Fire Bolt Wizard", level: 1 })).toBeVisible();
      const visibleMain = page.locator("main").filter({ visible: true });

      await expect(
        visibleMain.getByText(/fire bolt/i).filter({ visible: true }).first(),
      ).toBeVisible();

      await expect(
        visibleMain.getByText(/^12$/).filter({ visible: true }).first(),
      ).toBeVisible();
    });
