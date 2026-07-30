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
