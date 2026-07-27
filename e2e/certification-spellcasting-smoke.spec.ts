import { expect, test, type Page } from "@playwright/test";

const CASTERS = [
  "Bard",
  "Cleric",
  "Druid",
  "Paladin",
  "Ranger",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

async function setup(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem("e4_dnd_draft_character_builder_v1");
    localStorage.setItem("e4_dnd_first_run_complete", "true");
  });

  await page.goto("/builder");

  await page.addStyleTag({
    content: `
      .first-run-overlay {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `,
  });

  await expect(page.locator("#builder-active-step-title"))
    .toBeVisible({ timeout: 15_000 });
}

function mobileStepSelect(page: Page) {
  return page
    .getByLabel("Mobil Builder kontrolleri")
    .locator("select")
    .first();
}

function desktopStepButton(
  page: Page,
  stepId: "class" | "spells",
) {
  return page.locator(`[data-builder-step="${stepId}"]`);
}

async function openStep(
  page: Page,
  stepId: "class" | "spells",
  expectedTitle: "Race & Class" | "Spells",
) {
  const mobileSelect = mobileStepSelect(page);

  if (await mobileSelect.isVisible()) {
    await mobileSelect.selectOption(stepId);
  } else {
    const desktopButton = desktopStepButton(page, stepId);
    await expect(desktopButton).toBeVisible({ timeout: 15_000 });
    await desktopButton.click();
  }

  await expect(page.locator("#builder-active-step-title"))
    .toHaveText(expectedTitle, { timeout: 15_000 });
}

async function selectClass(page: Page, className: string) {
  await openStep(page, "class", "Race & Class");

  const form = page.getByRole("form", { name: /Race & Class/i });
  await expect(form).toBeVisible({ timeout: 15_000 });

  await expect.poll(
    async () =>
      form.locator("select").evaluateAll(
        (selects, expectedName) =>
          selects.some((select) =>
            Array.from(select.options).some(
              (option) => option.textContent?.trim() === expectedName,
            ),
          ),
        className,
      ),
    {
      timeout: 15_000,
      message: `Class option should load: ${className}`,
    },
  ).toBe(true);

  const selected = await form.locator("select").evaluateAll(
    (selects, expectedName) => {
      for (const select of selects) {
        const option = Array.from(select.options).find(
          (entry) => entry.textContent?.trim() === expectedName,
        );

        if (!option) continue;

        select.value = option.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));

        return {
          value: option.value,
          text: option.textContent?.trim() ?? "",
        };
      }

      return null;
    },
    className,
  );

  expect(selected, `Class selection failed: ${className}`).not.toBeNull();

  await expect.poll(
    async () =>
      page.locator(".builder-choice-card").evaluateAll(
        (cards, expectedName) =>
          cards.some(
            (card) =>
              card.querySelector("h3")?.textContent?.trim() === expectedName,
          ),
        className,
      ),
    {
      timeout: 15_000,
      message: `Selected class card should render: ${className}`,
    },
  ).toBe(true);
}

async function openSpellsStep(page: Page) {
  await openStep(page, "spells", "Spells");
}

async function expectSpellcastingUi(page: Page) {
  await expect(page.locator("#builder-active-step-title"))
    .toHaveText("Spells", { timeout: 15_000 });

  await expect.poll(
    async () => {
      const text = await page.locator("main").textContent().catch(() => "");
      return /Cantrip|Known|Prepared|Spell|Slot|Ritual/i.test(text ?? "");
    },
    {
      timeout: 15_000,
      message: "Spellcasting UI text should become available.",
    },
  ).toBe(true);
}

for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
  test(`${ruleset} spells step opens`, async ({ page }) => {
    await setup(page);
    await page.getByLabel("Ruleset").selectOption(ruleset);
    await openSpellsStep(page);
  });

  for (const caster of CASTERS) {
    test(`${ruleset} ${caster} exposes spellcasting UI`, async ({ page }) => {
      await setup(page);
      await page.getByLabel("Ruleset").selectOption(ruleset);

      await selectClass(page, caster);
      await openSpellsStep(page);
      await expectSpellcastingUi(page);
    });
  }
}
