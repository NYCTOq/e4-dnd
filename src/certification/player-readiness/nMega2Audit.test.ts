import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const out = path.join(root, 'certification-reports', 'n-mega2');

describe('N-MEGA2 2014 builder and progression audit', () => {
  it('ships the audit generator and expected regression contracts', () => {
    expect(fs.existsSync(path.join(root, 'scripts', 'n-mega2-2014-builder-progression-audit.mjs'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'src/core/rulesets/characterValidation.ts'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'src/core/rulesets/levelOneToTwentyJourney.test.ts'))).toBe(true);
  });

  it('produces a complete 12-class, 20-level matrix without critical structural gaps', () => {
    const report = JSON.parse(fs.readFileSync(path.join(out, 'N_MEGA2_2014_BUILDER_PROGRESSION_AUDIT.json'), 'utf8'));
    expect(report.phase).toBe('N-MEGA2');
    expect(report.classMatrix).toHaveLength(12);
    for (const row of report.classMatrix) {
      expect(row.present, row.className).toBe(true);
      expect(row.levels, row.className).toHaveLength(20);
      expect(row.levels.every((level: { present: boolean }) => level.present), row.className).toBe(true);
      expect(row.subclasses.length, row.className).toBeGreaterThan(0);
    }
    expect(report.severityCounts.critical).toBe(0);
  });
});
