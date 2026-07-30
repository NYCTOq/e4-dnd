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

const CLASSES = [
  "Barbarian","Bard","Cleric","Druid","Fighter","Monk",
  "Paladin","Ranger","Rogue","Sorcerer","Warlock","Wizard",
];

const BACKGROUNDS_2014 = [
  "Acolyte","Criminal","Entertainer","Folk Hero","Guild Artisan","Hermit",
  "Noble","Outlander","Sage","Sailor","Soldier","Urchin",
];

const BACKGROUNDS_2024 = [
  "Acolyte","Artisan","Charlatan","Criminal","Entertainer","Farmer","Guard","Guide",
  "Hermit","Merchant","Noble","Sage","Sailor","Scribe","Soldier","Wayfarer",
];

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

async function neutralizeOverlay(page: Page) {
  await page.addStyleTag({
    content: `.first-run-overlay{display:none!important;pointer-events:none!important;visibility:hidden!important}`,
  });
  await page.locator(".first-run-overlay").evaluateAll((elements) => {
    elements.forEach((element) => element.remove());
  });
}

async function openRaceAndClassStep(
  page: Page,
  ruleset: "dnd_2014" | "dnd_2024",
) {
  await page.goto("/builder");
  await neutralizeOverlay(page);

  await page.getByLabel("Ruleset").selectOption(ruleset);

  await expect.poll(async () => {
    return page.locator('[data-builder-step="class"]').count();
  }, { timeout: 15_000 }).toBeGreaterThan(0);

  const step = page.locator('[data-builder-step="class"]');
  if (await step.isVisible()) {
    await step.click({ force: true });
  } else {
    await step.evaluate((element: HTMLElement) => element.click());
  }

  await neutralizeOverlay(page);
  await expect(page.locator("#builder-step-panel")).toBeVisible({
    timeout: 15_000,
  });

  await expect.poll(async () => {
    return page.locator("#builder-step-panel")
      .locator("select option")
      .count();
  }, { timeout: 15_000 }).toBeGreaterThan(10);
}

async function atomicSelectOption(
  page: Page,
  requestedLabel: string,
  preferLast: boolean,
) {
  const form = page.locator("#builder-step-panel");
  const wanted = normalize(requestedLabel);

  await expect.poll(async () => {
    return form.locator("select").evaluateAll(
      (selects, args) => {
        const normalizeText = (value: string) =>
          value.trim().replace(/\s+/g, " ").toLowerCase();

        const matches = selects
          .map((select, index) => {
            const options = Array.from(select.options);
            const option = options.find((entry) => {
              const text = normalizeText(entry.textContent ?? "");
              return (
                text === args.wanted ||
                text.startsWith(`${args.wanted} `) ||
                text.startsWith(`${args.wanted}—`) ||
                text.startsWith(`${args.wanted} -`) ||
                text.includes(` ${args.wanted} `)
              );
            });
            return option ? { index, value: option.value } : null;
          })
          .filter((entry): entry is { index: number; value: string } => Boolean(entry));

        return matches.length;
      },
      { wanted },
    );
  }, {
    timeout: 15_000,
    message: `Option should become available: ${requestedLabel}`,
  }).toBeGreaterThan(0);

  const selected = await form.locator("select").evaluateAll(
    (selects, args) => {
      const normalizeText = (value: string) =>
        value.trim().replace(/\s+/g, " ").toLowerCase();

      const matches = selects
        .map((select, index) => {
          const options = Array.from(select.options);
          const option = options.find((entry) => {
            const text = normalizeText(entry.textContent ?? "");
            return (
              text === args.wanted ||
              text.startsWith(`${args.wanted} `) ||
              text.startsWith(`${args.wanted}—`) ||
              text.startsWith(`${args.wanted} -`) ||
              text.includes(` ${args.wanted} `)
            );
          });
          return option ? { index, value: option.value, text: option.textContent ?? "" } : null;
        })
        .filter((entry): entry is { index: number; value: string; text: string } => Boolean(entry));

      const target = args.preferLast ? matches.at(-1) : matches[0];
      if (!target) return null;

      const select = selects[target.index];
      select.value = target.value;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));

      return {
        value: target.value,
        text: target.text,
      };
    },
    { wanted, preferLast },
  );

  expect(selected, `Atomic selection failed for ${requestedLabel}`).not.toBeNull();

  await expect.poll(async () => {
    return form.locator("select").evaluateAll(
      (selects, args) => {
        const normalizeText = (value: string) =>
          value.trim().replace(/\s+/g, " ").toLowerCase();

        return selects.some((select) => {
          const selectedOption = select.selectedOptions[0];
          if (!selectedOption || !select.value) return false;
          const text = normalizeText(selectedOption.textContent ?? "");
          return (
            text === args.wanted ||
            text.startsWith(`${args.wanted} `) ||
            text.startsWith(`${args.wanted}—`) ||
            text.startsWith(`${args.wanted} -`)
          );
        });
      },
      { wanted },
    );
  }, {
    timeout: 10_000,
    message: `Selected option should persist: ${requestedLabel}`,
  }).toBe(true);
}

test.describe("all class catalog certification", () => {
  for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
    for (const className of CLASSES) {
      test(`${ruleset} ${className} can be selected`, async ({ page }) => {
        await openRaceAndClassStep(page, ruleset);
        await atomicSelectOption(page, className, false);
      });
    }
  }
});

test.describe("all background catalog certification", () => {
  for (const background of BACKGROUNDS_2014) {
    test(`2014 ${background} can be selected`, async ({ page }) => {
      await openRaceAndClassStep(page, "dnd_2014");
      await atomicSelectOption(page, background, true);
    });
  }

  for (const background of BACKGROUNDS_2024) {
    test(`2024 ${background} can be selected`, async ({ page }) => {
      await openRaceAndClassStep(page, "dnd_2024");
      await atomicSelectOption(page, background, true);
    });
  }
});
