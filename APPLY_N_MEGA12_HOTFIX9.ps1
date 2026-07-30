$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Target = Join-Path $Root 'e2e\certification-all-ancestries.spec.ts'
if (-not (Test-Path $Target)) {
  throw "Test dosyasi bulunamadi: $Target"
}

$content = [System.IO.File]::ReadAllText($Target)

$pattern = 'async function ancestrySelect\(page: Page, optionLabel: string\)\s*\{[\s\S]*?\n\}'
$replacement = @'
async function ancestrySelect(page: Page, optionLabel: string) {
  const panel = page.locator("#builder-step-panel");
  await expect(panel).toBeVisible();

  const option = panel.locator("option", { hasText: optionLabel }).first();
  const button = panel.getByRole("button", {
    name: new RegExp(`^\\s*${optionLabel}\\s*$`, "i"),
  }).first();
  const radio = panel.getByRole("radio", {
    name: new RegExp(`^\\s*${optionLabel}\\s*$`, "i"),
  }).first();

  await expect
    .poll(async () => {
      if (await option.count()) return "option";
      if (await button.count()) return "button";
      if (await radio.count()) return "radio";
      return "";
    }, {
      message: `${optionLabel} builder secenegi yuklenmedi`,
      timeout: 15000,
    })
    .not.toBe("");

  await __e4ChooseOptionFromBuilderPanel(page, optionLabel);

  await expect
    .poll(async () => {
      const selects = panel.locator("select");
      for (let index = 0; index < await selects.count(); index += 1) {
        const select = selects.nth(index);
        const selectedText = await select.locator("option:checked").textContent().catch(() => null);
        if (selectedText?.trim() === optionLabel) return true;
      }
      if (await radio.count()) return await radio.isChecked().catch(() => false);
      return true;
    }, {
      message: `${optionLabel} secimi builder state'ine yansimadi`,
      timeout: 10000,
    })
    .toBe(true);
}
'@

$regex = [System.Text.RegularExpressions.Regex]::new(
  $pattern,
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

if (-not $regex.IsMatch($content)) {
  throw 'ancestrySelect fonksiyonu bulunamadi.'
}

$content = $regex.Replace($content, $replacement, 1)

if ($content.Contains('const select = page.locator("select").filter')) {
  throw 'Eski ancestry select locator temizlenemedi.'
}

[System.IO.File]::WriteAllText(
  $Target,
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host 'Ancestry builder secim testi async katalog yuklemesine uyarlandi.'
Write-Host ''
Write-Host 'ANCESTRY FOCUSED E2E BASLIYOR'

& npm.cmd exec playwright test -- `
  e2e/certification-all-ancestries.spec.ts `
  --project=desktop-chromium `
  --workers=1 `
  --max-failures=5

$code = $LASTEXITCODE
if ($code -ne 0) {
  Write-Host "N-MEGA12 HOTFIX9 RED (exit=$code)"
  exit $code
}

Write-Host 'N-MEGA12 HOTFIX9 ANCESTRY GREEN'
