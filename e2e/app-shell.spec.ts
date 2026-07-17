import { expect, test } from "@playwright/test";
const routes = [["/", "Masa hazır."], ["/characters", "Karakterler"], ["/builder", "Yeni Karakter"], ["/play-mode", "Play Mode"], ["/backup", "Yedek"]] as const;
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear(); }); });
test("dashboard shell opens", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("link", { name: "E4 D&D ana sayfa" })).toBeVisible(); await expect(page.getByRole("heading", { name: "Masa hazır." })).toBeVisible(); });
test("core routes support direct navigation", async ({ page }) => { for (const [route, heading] of routes) { await page.goto(route); await expect(page.getByRole("heading", { name: new RegExp(heading, "i") }).first()).toBeVisible(); } });
test("keyboard skip link reaches main", async ({ page }) => { await page.goto("/"); await page.keyboard.press("Tab"); await expect(page.getByRole("link", { name: "Ana içeriğe geç" })).toBeFocused(); await page.keyboard.press("Enter"); await expect(page.locator("#main-content")).toBeFocused(); });
