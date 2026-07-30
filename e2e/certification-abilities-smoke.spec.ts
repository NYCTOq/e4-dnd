import { expect, test, type Page } from "@playwright/test";


async function __e4OpenBuilderStep(page: import("@playwright/test").Page, step: string) {
  const mobileStep = page.getByLabel("Aktif adım");
  if (await mobileStep.isVisible().catch(() => false)) {
    await mobileStep.selectOption(step);
  } else {
    const desktopStep = page.locator(`[data-builder-step="${step}"]`);
    await desktopStep.click();
  }
  await page.locator("#builder-step-panel").waitFor({ state: "visible" });
}

async function __e4ChooseOptionFromBuilderPanel(
  page: import("@playwright/test").Page,
  optionLabel: string,
) {
  const selects = page.locator("#builder-step-panel select");
  const count = await selects.count();
  for (let index = 0; index < count; index += 1) {
    const select = selects.nth(index);
    const value = await select.evaluate((element, wanted) => {
      const normalized = String(wanted).trim().toLocaleLowerCase("en");
      const option = Array.from((element as HTMLSelectElement).options)
        .find((item) => item.text.trim().toLocaleLowerCase("en") === normalized);
      return option?.value ?? null;
    }, optionLabel);
    if (value !== null) {
      await select.selectOption(value);
      return;
    }
  }

  const button = page.getByRole("button", {
    name: new RegExp(`^\\s*${optionLabel}\\s*$`, "i"),
  });
  if (await button.count()) {
    await button.first().click();
    return;
  }

  const radio = page.getByRole("radio", {
    name: new RegExp(`^\\s*${optionLabel}\\s*$`, "i"),
  });
  if (await radio.count()) {
    await radio.first().check();
    return;
  }

  await page.locator("#builder-step-panel")
    .getByText(optionLabel, { exact: true })
    .first()
    .click();
}
// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

test.describe.configure({ mode: "serial" });

async function prepareCleanBuilder(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem("e4_dnd_draft_character_builder_v1");
    localStorage.setItem("e4_dnd_first_run_complete", "true");
  });
}

async function neutralizeOverlay(page: Page) {
  await page.addStyleTag({
    content:
      ".first-run-overlay{display:none!important;pointer-events:none!important;visibility:hidden!important}",
  });

  await page.locator(".first-run-overlay").evaluateAll((elements) => {
    elements.forEach((element) => element.remove());
  });
}

async function openAbilities(
  page: Page,
  ruleset: "dnd_2014" | "dnd_2024",
) {
  await prepareCleanBuilder(page);
  await page.goto("/builder");
  await neutralizeOverlay(page);

  await page.getByLabel("Ruleset").selectOption(ruleset);

  const step = page.locator('[data-builder-step="abilities"]');
  await expect(step).toBeAttached({ timeout: 15_000 });

  await step.evaluate((element: HTMLElement) => element.click());
  await neutralizeOverlay(page);

  await expect(page.locator(".ability-editor-v2")).toBeVisible({
    timeout: 15_000,
  });

  await expect.poll(
    async () =>
      page.locator(".ability-editor-v2 .ability-layer-card").count(),
    { timeout: 15_000 },
  ).toBe(6);
}

async function atomicChooseMethod(
  page: Page,
  exactName: "Standard Array" | "Point Buy" | "Rolled / Manual",
) {
  const changed = await page.locator(".ability-method-picker").evaluate(
    (group, requestedName) => {
      const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>("button"));
      const target = buttons.find(
        (button) => button.textContent?.trim() === requestedName,
      );

      if (!target) return false;
      target.click();
      return true;
    },
    exactName,
  );

  expect(changed, `Ability method button not found: ${exactName}`).toBe(true);
}

async function readAbilityLabels(page: Page) {
  return page.locator(".ability-editor-v2 .ability-layer-card").evaluateAll(
    (cards) =>
      cards.map((card) => {
        const firstLabel = card.querySelector("span");
        return firstLabel?.textContent?.trim() ?? "";
      }),
  );
}

for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
  test(`${ruleset} abilities step exposes six score cards`, async ({ page }) => {
    await openAbilities(page, ruleset);

    await expect.poll(
      () => readAbilityLabels(page),
      { timeout: 15_000 },
    ).toEqual(["STR", "DEX", "CON", "INT", "WIS", "CHA"]);

    await expect.poll(
      async () => page.locator(".ability-editor-v2 .ability-final-score").count(),
      { timeout: 15_000 },
    ).toBe(6);
  });

  test(`${ruleset} standard array exposes six selects`, async ({ page }) => {
    await openAbilities(page, ruleset);
    await atomicChooseMethod(page, "Standard Array");

    await expect.poll(
      async () =>
        page.locator(".ability-editor-v2 .ability-layer-card > select").count(),
      { timeout: 15_000 },
    ).toBe(6);
  });

  test(`${ruleset} point buy exposes six steppers`, async ({ page }) => {
    await openAbilities(page, ruleset);
    await atomicChooseMethod(page, "Point Buy");

    await expect.poll(
      async () => page.locator(".ability-editor-v2 .ability-stepper").count(),
      { timeout: 15_000 },
    ).toBe(6);
  });

  test(`${ruleset} rolled manual exposes six NumberSteppers`, async ({ page }) => {
    await openAbilities(page, ruleset);
    await atomicChooseMethod(page, "Rolled / Manual");

    await expect.poll(
      async () =>
        page.locator('.ability-editor-v2 [role="group"].number-stepper').count(),
      { timeout: 15_000 },
    ).toBe(6);

    await expect.poll(
      async () =>
        page.locator(".ability-editor-v2 .number-stepper-value").count(),
      { timeout: 15_000 },
    ).toBe(6);
  });
}
