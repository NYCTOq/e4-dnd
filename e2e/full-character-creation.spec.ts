import { expect, test } from "@playwright/test";


async function __e4OpenBuilderStep(
  page: import("@playwright/test").Page,
  step: string,
) {
  const mobileStep = page.getByLabel("Aktif adım");

  if (await mobileStep.isVisible().catch(() => false)) {
    await mobileStep.selectOption(step);
  } else {
    const desktopStep = page.locator(
      '[data-builder-step="' + step + '"]',
    );
    await desktopStep.click();
  }

  await page.locator("#builder-step-panel").waitFor({ state: "visible" });
}

async function __e4ChooseOptionFromBuilderPanel(
  page: import("@playwright/test").Page,
  optionLabel: string,
) {
  const selects = page.locator("#builder-step-panel select");
  const selectCount = await selects.count();

  for (let index = 0; index < selectCount; index += 1) {
    const select = selects.nth(index);
    const matchingValue = await select.evaluate((element, wanted) => {
      const normalizedWanted = String(wanted)
        .trim()
        .toLocaleLowerCase("en");

      const matchingOption = Array.from(
        (element as HTMLSelectElement).options,
      ).find(
        (option) =>
          option.text.trim().toLocaleLowerCase("en") === normalizedWanted,
      );

      return matchingOption ? matchingOption.value : null;
    }, optionLabel);

    if (matchingValue !== null) {
      await select.selectOption(matchingValue, { force: true });
      return;
    }
  }

  const exactName = new RegExp(
    "^\\s*" +
      optionLabel.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&") +
      "\\s*$",
    "i",
  );

  const button = page.getByRole("button", { name: exactName });
  if (await button.first().isVisible().catch(() => false)) {
    await button.first().click();
    return;
  }

  const radio = page.getByRole("radio", { name: exactName });
  if (await radio.first().isVisible().catch(() => false)) {
    await radio.first().check();
    return;
  }

  const candidates = page.locator("#builder-step-panel :not(option)");
  const candidateCount = await candidates.count();

  for (let index = 0; index < candidateCount; index += 1) {
    const candidate = candidates.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;

    const text = (await candidate.textContent())?.trim() ?? "";
    if (text.toLocaleLowerCase("en") !== optionLabel.trim().toLocaleLowerCase("en")) {
      continue;
    }

    await candidate.click();
    return;
  }

  throw new Error(
    'No selectable Builder option found for "' + optionLabel + '"',
  );
}

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

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
    await __e4OpenBuilderStep(page, "class");
    await __e4ChooseOptionFromBuilderPanel(page, className);
    await __e4OpenBuilderStep(page, "review");
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
  await page.reload({ waitUntil: "domcontentloaded" }).catch((error) => {
    if (!String(error).includes("ERR_INTERNET_DISCONNECTED")) throw error;
  });
  await page.goto("/characters");
  await expect(
    page.getByRole("heading", { name: "E2E Journey", level: 2, exact: true }).first(),
  ).toBeVisible();
  await page.goto("/characters/e2e-journey-character");
  await expect(page).toHaveURL(/\/characters\/e2e-journey-character/);
  await expect(page.getByRole("heading", { name: "E2E Journey", level: 1, exact: true })).toBeVisible();
  await page.goto("/play-mode?character=e2e-journey-character");
  await expect(page.getByText("E2E Journey", { exact: true }).first()).toBeVisible();
  await page.goto("/rest");
  await expect(page.getByText("E2E Journey", { exact: true }).first()).toBeVisible();
});
