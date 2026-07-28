import { expect, test, type Page } from "@playwright/test";
import { installKnownAppState } from "./support/appState";

const character = {
  id: "cross-domain-e2e", name: "Cross Domain E2E", playerName: "QA", ruleset: "dnd_2024",
  race: "Human", className: "Fighter", classLevels: [{ className: "Fighter", level: 5 }], subclass: "Champion", background: "Soldier",
  featIds: ["alert-2024"], skillProficiencies: ["Athletics", "Perception"], expertiseSkills: [], toolProficiencies: [], languages: ["Common"], level: 5,
  abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 }, maxHp: 42, currentHp: 24, tempHp: 3, armorClass: 17, armorClassMode: "manual",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [{ itemId: "longsword", quantity: 1, notes: "", attuned: false, chargesUsed: 0 }],
  equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: ["longsword"], gold: 10,
  deathSaves: { successes: 1, failures: 1 }, hitDice: [{ die: 10, max: 5, used: 3 }],
  resources: [{ id: "action-surge", name: "Action Surge", max: 1, used: 1, recovery: "short" }],
  exhaustion: 1, conditions: [], conditionDurations: {}, concentrating: false, activeEffects: [], notes: "v5.121D fixture",
  createdAt: "2026-07-28T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z",
};

async function readStoredCharacter(page: Page) {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem("e4_dnd_characters_v1") ?? "[]";
      return JSON.parse(raw)[0] ?? null;
    } catch {
      return null;
    }
  });
}

test("builder review is reachable by physical pointer and keyboard", async ({ page }) => {
  await installKnownAppState(page);
  await page.goto("/builder");
  await page.getByTestId("builder-character-name").fill("Cross Domain Builder");
  await page.getByLabel("Ruleset").selectOption({ label: "D&D 2024" });
  const isMobile = (page.viewportSize()?.width ?? 1280) <= 760;
  if (isMobile) {
    await page.locator(".builder-mobile-toolbar select").selectOption("class");
  } else {
    await page.locator('[data-builder-step="class"]').click();
  }
  await expect(page.getByRole("heading", { name: /Background & Class/ })).toBeVisible();
  const classSelect = page.locator("select").filter({
    has: page.locator("option", { hasText: /^Class seç$/ }),
  });
  await expect(classSelect).toHaveCount(1);
  await expect(classSelect).toBeVisible();
  await expect(classSelect).toBeEnabled();
  await classSelect.selectOption({ label: "Fighter" });
  if (isMobile) {
    await page.locator(".builder-mobile-toolbar select").selectOption("review");
  } else {
    const review = page.locator('[data-builder-step="review"]');
    await review.focus();
    await review.press("Enter");
  }
  await expect(page.getByTestId("builder-review")).toContainText("Cross Domain Builder");
  await expect(page.getByTestId("builder-review")).toContainText("Fighter");
});

test("sheet to play mode persists HP mutation across reload", async ({ page }) => {
  await installKnownAppState(page, [character]);
  await page.goto("/");
  await page.goto("/characters/cross-domain-e2e");
  await expect(page.getByTestId("derived-stats-command-center")).toBeVisible();
  await page.goto("/play-mode?character=cross-domain-e2e");
  await page.getByTestId("death-dying-amount").fill("4");
  await page.getByTestId("death-dying-damage").click();
  await expect.poll(async () => (await readStoredCharacter(page))?.currentHp ?? null).toBe(23);
  await page.reload();
  await expect.poll(async () => (await readStoredCharacter(page))?.currentHp ?? null).toBe(23);
});

test("long rest persists recovery across route reload", async ({ page }) => {
  await installKnownAppState(page, [character]);
  await page.goto("/");
  await page.goto("/rest");
  await expect(page.getByTestId("rest-runtime-integration")).toBeVisible();
  await page.getByTestId("rest-long-button").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect.poll(async () => {
    const stored = await readStoredCharacter(page);
    return stored ? { hp: stored.currentHp, temp: stored.tempHp, s: stored.deathSaves } : null;
  }).toEqual({ hp: 42, temp: 0, s: { successes: 0, failures: 0 } });
  await page.reload();
  await expect.poll(async () => (await readStoredCharacter(page))?.currentHp ?? null).toBe(42);
});

test("mobile and desktop shell keep pointer safety and horizontal containment", async ({ page }) => {
  await installKnownAppState(page, [character]);
  await page.goto("/");
  await page.goto("/characters/cross-domain-e2e");
  await expect(page.getByTestId("derived-stats-initiative-roll")).toBeVisible();
  await page.getByTestId("derived-stats-initiative-roll").click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const blocker = await page.evaluate(() => {
    const element = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    return element?.closest('[aria-hidden="true"], .modal-backdrop, .overlay, .release-notes-backdrop')?.getAttribute("class") ?? null;
  });
  expect(blocker).toBeNull();
});
