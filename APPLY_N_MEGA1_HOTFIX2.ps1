$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path (Join-Path $Root 'package.json'))) {
  throw 'Bu script proje kokunde calistirilmali. package.json bulunamadi.'
}

$TargetDir = Join-Path $Root 'src\certification\player-readiness'
$Target = Join-Path $TargetDir 'nMega1Inventory.test.ts'
New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null

$TestContent = @'
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('N-MEGA1 player system inventory contract', () => {
  const root = process.cwd();
  const script = path.join(root, 'scripts', 'n-mega1-player-system-inventory.mjs');
  const reportDir = path.join(root, 'certification-reports', 'n-mega1');

  it('ships the non-mutating inventory generator and generated parity outputs', () => {
    expect(fs.existsSync(script)).toBe(true);
    const source = fs.readFileSync(script, 'utf8');
    expect(source).toContain('D&D Beyond is a UX and capability reference only');
    expect(source).toContain('PLAYER_CHARACTER_PARITY_MATRIX_');

    for (const file of [
      'PLAYER_CHARACTER_SYSTEM_INVENTORY.json',
      'PLAYER_CHARACTER_PARITY_MATRIX_2014.json',
      'PLAYER_CHARACTER_PARITY_MATRIX_2024.json',
      'PLAYER_CHARACTER_SYSTEM_GAPS.json',
      'N_MEGA1_SUMMARY.md',
    ]) {
      expect(fs.existsSync(path.join(reportDir, file)), `${file} was not generated`).toBe(true);
    }
  });

  it('keeps both official ruleset catalogs available', () => {
    for (const ruleset of ['dnd_2014', 'dnd_2024']) {
      const classes = JSON.parse(
        fs.readFileSync(path.join(root, 'public', 'data', ruleset, 'classes.json'), 'utf8'),
      );
      expect(classes).toHaveLength(12);
    }
  });

  it('writes separate, non-empty 2014 and 2024 matrices', () => {
    for (const year of ['2014', '2024']) {
      const matrix = JSON.parse(
        fs.readFileSync(path.join(reportDir, `PLAYER_CHARACTER_PARITY_MATRIX_${year}.json`), 'utf8'),
      );
      expect(Array.isArray(matrix)).toBe(true);
      expect(matrix.length).toBeGreaterThan(0);
      expect(matrix.every((entry: { ruleset?: string }) => entry.ruleset === `dnd_${year}`)).toBe(true);
    }
  });
});
'@

Set-Content -Path $Target -Value $TestContent -Encoding UTF8

foreach ($Stale in @('patch', 'payload')) {
  $StalePath = Join-Path $Root $Stale
  if (Test-Path $StalePath) {
    Remove-Item $StalePath -Recurse -Force
  }
}

Write-Host 'N-MEGA1 Hotfix 2 uygulandi. Audit, test ve build yeniden calistiriliyor...' -ForegroundColor Cyan
npm.cmd run certify:n-mega1
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'N-MEGA1 HOTFIX2 GREEN' -ForegroundColor Green
