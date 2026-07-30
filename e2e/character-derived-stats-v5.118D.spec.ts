import { expect, test } from "@playwright/test";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

const route = "/characters/derived-stats-e2e";
const character = {
  id: "derived-stats-e2e", name: "Derived Stats E2E", playerName: "QA",
  ruleset: "dnd_2024", race: "Human", className: "Cleric",
  classLevels: [{ className: "Cleric", level: 17 }], subclass: "", background: "Acolyte",
  featIds: ["observant"], skillProficiencies: ["Perception", "Insight"], expertiseSkills: [],
  toolProficiencies: [], languages: ["Common"], level: 17,
  abilities: { str: 14, dex: 10, con: 16, int: 10, wis: 20, cha: 14 },
  maxHp: 139, currentHp: 139, tempHp: 0, armorClass: 19, armorClassMode: "manual",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [],
  equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 10,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [{ die: 8, max: 17, used: 0 }],
  resources: [], exhaustion: 0, conditions: [], conditionDurations: {}, notes: "v5.118D",
  createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((payload) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", "6.2.0");
    localStorage.setItem("e4_dnd_characters_v1", JSON.stringify([payload]));
  }, character);
  await page.goto(route);
});

test("canonical derived stats render without pointer interception or overflow", async ({ page }) => {
  await expect(page.getByTestId("derived-stats-defense-summary")).toContainText("AC 19");
  await expect(page.getByTestId("derived-stats-defense-summary")).toContainText("Initiative +0");
  await expect(page.getByTestId("derived-stat-armor-class")).toContainText("19");
  await expect(page.getByTestId("derived-stat-proficiency")).toContainText("+6");
  await expect(page.getByTestId("derived-stat-initiative")).toContainText("+0");
  await expect(page.getByTestId("derived-stat-passive-perception")).toContainText("26");

  const button = page.getByTestId("derived-stats-initiative-roll");
  await expect(button).toBeVisible();
  await button.scrollIntoViewIfNeeded();
  expect(await button.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === node;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await button.click();
  await expect(page.getByText("Initiative", { exact: true }).last()).toBeVisible();
});

test("initiative quick roll is keyboard reachable and activatable", async ({ page }) => {
  const button = page.getByTestId("derived-stats-initiative-roll");
  await button.press("Enter");
  await expect(page.getByText("Initiative", { exact: true }).last()).toBeVisible();
});
