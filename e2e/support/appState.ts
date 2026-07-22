import type { Page } from "@playwright/test";

const FIRST_RUN_GUIDE_KEY = "e4_dnd_first_run_guide_v1";
const CHARACTERS_KEY = "e4_dnd_characters_v1";

export async function installKnownAppState(page: Page) {
  await page.addInitScript(({ firstRunGuideKey }) => {
    localStorage.setItem(firstRunGuideKey, JSON.stringify(true));
  }, { firstRunGuideKey: FIRST_RUN_GUIDE_KEY });
}

export async function seedCharacters(page: Page, characters: unknown[]) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: CHARACTERS_KEY, value: characters },
  );
}
