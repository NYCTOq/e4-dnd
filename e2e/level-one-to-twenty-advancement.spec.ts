import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
  });
});

const baseCharacter = {
  id: "e2e-level-journey", name: "Level Journey", playerName: "QA", ruleset: "dnd_2024",
  race: "Human", className: "Fighter", classLevels: [{ className: "Fighter", level: 1 }], subclass: "", background: "Soldier",
  featIds: [], skillProficiencies: ["Athletics", "Perception"], expertiseSkills: [], toolProficiencies: [], languages: ["Common"], level: 1,
  abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 }, maxHp: 12, currentHp: 12, tempHp: 0, armorClass: 16, armorClassMode: "manual",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 10,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [{ die: 10, max: 1, used: 0 }], resources: [], exhaustion: 0, conditions: [], conditionDurations: {}, notes: "Advancement E2E",
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

test("level 1 character exposes the level-up assistant", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((character) => localStorage.setItem("e4_dnd_characters_v1", JSON.stringify([character])), baseCharacter);
  await page.goto("/characters/e2e-level-journey");
  await expect(page.getByRole("heading", { name: "Level Journey", level: 1 })).toBeVisible();

  const levelUpSection = page.locator("details.character-sheet-level-up");
  await levelUpSection.locator("summary").click();
  await expect(levelUpSection.locator(".level-up-launch-card")).toBeVisible();
  await expect(levelUpSection.getByRole("button", { name: "Level Up", exact: true })).toBeVisible();
});

test("level 20 character exposes the level cap state", async ({ page }) => {
  const capped = { ...baseCharacter, level: 20, classLevels: [{ className: "Fighter", level: 20 }], subclass: "Champion", hitDice: [{ die: 10, max: 20, used: 0 }] };
  await page.goto("/");
  await page.evaluate((character) => localStorage.setItem("e4_dnd_characters_v1", JSON.stringify([character])), capped);
  await page.goto("/characters/e2e-level-journey");
  const levelUpSection = page.locator("details.character-sheet-level-up");
  await levelUpSection.locator("summary").click();
  await expect(levelUpSection.locator(".level-cap-card")).toBeVisible();
  await expect(levelUpSection.locator(".level-cap-card strong", { hasText: /^Level 20$/ })).toBeVisible();
});
