import { expect, test } from "@playwright/test";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.1.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

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
  await page.reload({ waitUntil: "domcontentloaded" }).catch((error) => {
    if (!String(error).includes("ERR_INTERNET_DISCONNECTED")) throw error;
  });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("e4_e2e_refresh_probe"))).toBe("survives");
});

test("built shell reopens offline", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service worker is unavailable");
    }
    await navigator.serviceWorker.ready;
  });

  // The first controlled reload lets the activated worker claim this page.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
