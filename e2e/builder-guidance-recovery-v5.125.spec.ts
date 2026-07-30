import { expect, test } from "@playwright/test";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

const draftKey = "e4_dnd_draft_character_builder_v1";
const stepKey = "e4_dnd_builder_active_step_v1";

async function seedDraft(page: import("@playwright/test").Page, step = 1) {
  await page.addInitScript(({ draftKey, stepKey, step }) => {
    localStorage.setItem(stepKey, String(step));
    localStorage.setItem(draftKey, JSON.stringify({ version: 1, updatedAt: "2026-07-28T09:00:00.000Z", value: {
      name: "Recovered Builder", playerName: "QA", ruleset: "dnd_2024", race: "", subrace: "", className: "", subclass: "", background: "", level: 1,
      abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }, abilityScoreIncreases: {}, featIds: [], featChoices: {}, skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [], knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 0, maxHp: 10, armorClass: 10, armorClassMode: "manual", notes: ""
    }}));
  }, { draftKey, stepKey, step });
}

for (const project of ["desktop", "mobile"]) {
  test(`${project}: restores draft step and exposes guidance`, async ({ page }) => {
    await seedDraft(page, 1);
    await page.goto("/builder");
    await expect(page.getByTestId("builder-draft-restored")).toBeVisible();
    await expect(page.getByTestId("builder-guidance-summary")).toBeVisible();
    await expect(page.locator("#builder-active-step-title")).toHaveText(/Race & Class|Background & Class/);
  });

  test(`${project}: ruleset change protects existing progress`, async ({ page }) => {
    await seedDraft(page, 0);
    await page.goto("/builder");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByLabel("Ruleset").selectOption("dnd_2014");
    await expect(page.getByLabel("Ruleset")).toHaveValue("dnd_2024");
    await expect(page.getByTestId("builder-character-name")).toHaveValue("Recovered Builder");
  });
}
