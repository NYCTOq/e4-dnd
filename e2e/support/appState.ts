import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const FIRST_RUN_GUIDE_KEY = "e4_dnd_first_run_guide_v1";
const LAST_SEEN_VERSION_KEY = "e4_dnd_last_seen_version_v1";
const CHARACTERS_KEY = "e4_dnd_characters_v1";
const CURRENT_APP_VERSION = String(
  JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version,
);

export async function installKnownAppState(page: Page, characters: unknown[] = []) {
  await page.addInitScript(
    ({ firstRunGuideKey, lastSeenVersionKey, version, charactersKey, characters }) => {
      localStorage.setItem(firstRunGuideKey, JSON.stringify(true));
      localStorage.setItem(lastSeenVersionKey, version);
      if (localStorage.getItem(charactersKey) === null) {
        localStorage.setItem(charactersKey, JSON.stringify(characters));
      }
    },
    {
      firstRunGuideKey: FIRST_RUN_GUIDE_KEY,
      lastSeenVersionKey: LAST_SEEN_VERSION_KEY,
      version: CURRENT_APP_VERSION,
      charactersKey: CHARACTERS_KEY,
      characters,
    },
  );
}

export async function seedCharacters(page: Page, characters: unknown[]) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: CHARACTERS_KEY, value: characters },
  );
}
