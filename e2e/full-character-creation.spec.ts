import { expect, test } from "@playwright/test";

const journeys = [
  ["D&D 2024", "Fighter"], ["D&D 2024", "Wizard"], ["D&D 2024", "Cleric"], ["D&D 2024", "Warlock"],
  ["D&D 2014", "Bard"], ["D&D 2014", "Monk"], ["D&D 2014", "Paladin"], ["D&D 2014", "Rogue"],
] as const;

for (const [ruleset, className] of journeys) {
  test(`${ruleset} ${className} builder route and review journey`, async ({ page }) => {
    await page.goto("/builder");
    await page.getByTestId("builder-character-name").fill(`E2E ${className}`);
    const rulesetSelect = page.getByLabel("Ruleset");
    await rulesetSelect.selectOption({ label: ruleset });
    await page.locator('[data-builder-step="class"]').click();
    await page.getByLabel("Class", { exact: true }).selectOption({ label: className });
    await page.locator('[data-builder-step="review"]').click();
    await expect(page.getByTestId("builder-review")).toContainText(`E2E ${className}`);
    await expect(page.getByTestId("builder-review")).toContainText(className);
  });
}

test("stored character survives list, sheet, play mode and rest routes", async ({ page }) => {
  const character = {
    id: "e2e-journey-character", name: "E2E Journey", playerName: "QA", ruleset: "dnd_2024",
    race: "Human", className: "Fighter", classLevels: [{ className: "Fighter", level: 1 }], subclass: "", background: "Soldier",
    featIds: [], skillProficiencies: ["Athletics", "Perception"], expertiseSkills: [], toolProficiencies: [], languages: ["Common"], level: 1,
    abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 }, maxHp: 12, currentHp: 12, tempHp: 0, armorClass: 16, armorClassMode: "manual",
    knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 10,
    deathSaves: { successes: 0, failures: 0 }, hitDice: [{ die: 10, max: 1, used: 0 }], resources: [], exhaustion: 0, conditions: [], conditionDurations: {}, notes: "E2E fixture",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await page.goto("/");
  await page.evaluate((payload) => localStorage.setItem("e4_dnd_characters_v1", JSON.stringify([payload])), character);
  await page.reload();
  await page.goto("/characters");
  await expect(page.getByText("E2E Journey", { exact: true })).toBeVisible();
  await page.getByText("E2E Journey", { exact: true }).click();
  await expect(page).toHaveURL(/\/characters\/e2e-journey-character/);
  await expect(page.getByText("E2E Journey", { exact: true })).toBeVisible();
  await page.goto("/play-mode?character=e2e-journey-character");
  await expect(page.getByText("E2E Journey", { exact: true })).toBeVisible();
  await page.goto("/rest");
  await expect(page.getByText("E2E Journey", { exact: true })).toBeVisible();
});
