import { expect, test } from "@playwright/test";

const route = "/characters/multiclass-e2e";
const baseCharacter = {
  id: "multiclass-e2e", name: "Multiclass E2E", playerName: "QA", ruleset: "dnd_2024",
  race: "Human", className: "Fighter", classLevels: [{ className: "Fighter", level: 1 }], subclass: "", background: "Soldier",
  featIds: [], skillProficiencies: ["Athletics", "Perception"], expertiseSkills: [], toolProficiencies: [], languages: ["Common"], level: 1,
  abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 }, maxHp: 12, currentHp: 12, tempHp: 0, armorClass: 16, armorClassMode: "manual",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 10,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [{ die: 10, max: 1, used: 0 }], resources: [], exhaustion: 0, conditions: [], conditionDurations: {}, notes: "v5.117D",
  createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z",
};

async function seed(page: import("@playwright/test").Page, character = baseCharacter) {
  await page.addInitScript((payload) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", "5.117.3");
    localStorage.setItem("e4_dnd_characters_v1", JSON.stringify([payload]));
  }, character);
}

async function openAssistant(page: import("@playwright/test").Page) {
  await page.goto(route);
  const section = page.locator("details.character-sheet-level-up");
  await section.locator("summary").click();
  await section.getByTestId("level-up-open").click();
  await expect(section.getByTestId("level-up-panel")).toBeVisible();
  return section;
}

test("physical Rogue multiclass flow persists skill, tools and class levels", async ({ page }) => {
  await seed(page);
  const section = await openAssistant(page);
  await section.getByTestId("level-up-class-choice").selectOption("Rogue");
  await expect(section.getByTestId("level-up-confirm")).toBeDisabled();
  await section.getByTestId("multiclass-skill-choice").selectOption("Stealth");
  await expect(section.getByTestId("level-up-readiness")).toContainText("Level-up hazır");
  await section.getByTestId("level-up-confirm").click();

  await expect.poll(() => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("e4_dnd_characters_v1") ?? "[]")[0];
    return {
      level: stored?.level,
      classes: stored?.classLevels,
      skills: stored?.skillProficiencies,
      multiclassSkills: stored?.multiclassSkillProficiencies,
      tools: stored?.toolProficiencies,
      grants: stored?.multiclassProficiencies,
    };
  })).toEqual({
    level: 2,
    classes: [{ className: "Fighter", level: 1 }, { className: "Rogue", level: 1 }],
    skills: ["Athletics", "Perception", "Stealth"],
    multiclassSkills: ["Stealth"],
    tools: ["Thieves' tools"],
    grants: ["Light armor", "One Rogue skill", "Thieves' tools"],
  });
});

test("physical flow keeps prerequisite failure blocked", async ({ page }) => {
  await seed(page, { ...baseCharacter, abilities: { ...baseCharacter.abilities, str: 12, dex: 12, int: 16 } });
  const section = await openAssistant(page);
  await section.getByTestId("level-up-class-choice").selectOption("Wizard");
  await expect(section.getByTestId("level-up-readiness")).toContainText("Fighter: STR veya DEX 13");
  await expect(section.getByTestId("level-up-confirm")).toBeDisabled();
});
