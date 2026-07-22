# v5.96 Advancement E2E Overlay Hotfix

Bu hotfix Playwright testlerinde ilk kullanım PWA rehberinin tıklamaları engellemesini önler.

Eklenen davranış:

```ts
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
  });
});
```

Böylece her test sayfa açılmadan önce rehberi tamamlanmış kabul eder.

Doğrulama:

```powershell
npm.cmd run test:e2e:advancement
```
