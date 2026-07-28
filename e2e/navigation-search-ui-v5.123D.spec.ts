import { expect, test } from "@playwright/test";
import { installKnownAppState } from "./support/appState";

const intents = [
  { query: "büyüler", label: "Spellbook", route: /\/spellbook$/ },
  { query: "inventory", label: "Inventory", route: /\/inventory$/ },
] as const;

for (const intent of intents) {
  test(`global search resolves ${intent.query} and preserves query across reload`, async ({ page }) => {
    await installKnownAppState(page, []);
    await page.goto(`/search?q=${encodeURIComponent(intent.query)}`);
    const input = page.getByRole("searchbox", { name: "Arama" });
    await expect(input).toHaveValue(intent.query);
    await expect(page.getByRole("link", { name: new RegExp(intent.label, "i") }).first()).toBeVisible();
    await page.reload();
    await expect(input).toHaveValue(intent.query);
    await page.getByRole("link", { name: new RegExp(intent.label, "i") }).first().click();
    await expect(page).toHaveURL(intent.route);
  });
}

test("command palette resolves Turkish alias with keyboard and Enter", async ({ page }) => {
  await installKnownAppState(page, []);
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Hızlı komut menüsü" });
  await expect(dialog).toBeVisible();
  const input = page.getByRole("searchbox", { name: "Komut ara" });
  await input.fill("geri yükleme");
  await expect(page.getByRole("option", { name: /Yedek/i }).first()).toBeVisible();
  await input.press("Enter");
  await expect(page).toHaveURL(/\/backup$/);
});

test("command palette opens by physical pointer and closes with Escape", async ({ page }) => {
  await installKnownAppState(page, []);
  await page.goto("/");
  await page.getByRole("button", { name: "Hızlı komut menüsünü aç" }).click();
  const dialog = page.getByRole("dialog", { name: "Hızlı komut menüsü" });
  await expect(dialog).toBeVisible();
  await page.getByRole("searchbox", { name: "Komut ara" }).press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator("html")).not.toHaveCSS("overflow-x", "scroll");
});
