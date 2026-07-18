import { expect, test } from "@playwright/test";

test("mobile quick navigation and full menu are usable", async ({ page }, info) => {
  test.skip(!info.project.name.includes("mobile"), "Mobile only");
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Mobil navigasyon" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link")).toHaveCount(4);
  await nav.getByRole("button", { name: "Menü" }).click();
  const drawer = page.getByRole("dialog", { name: "Tüm menü" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: /Kampanya/i }).click();
  await expect(drawer.getByRole("link", { name: "Combat Tracker" })).toBeVisible();
});

test("mobile and installed PWA shell can scroll vertically", async ({ page }, info) => {
  test.skip(!info.project.name.includes("mobile"), "Mobile only");
  await page.goto("/homebrew-lab");
  await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.id = "mobile-scroll-probe";
    probe.style.height = "1600px";
    document.querySelector("#main-content")?.appendChild(probe);
  });
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe("hidden");
});

test("local data survives refresh", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("e4_e2e_refresh_probe", "survives"));
  await page.reload();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("e4_e2e_refresh_probe"))).toBe("survives");
});

test("built shell reopens offline", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("link", { name: "E4 D&D ana sayfa" })).toBeVisible();
  await context.setOffline(false);
});
