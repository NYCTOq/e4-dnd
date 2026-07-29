import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const pkgPath = join(root, 'package.json');
if (!existsSync(pkgPath)) throw new Error('package.json bulunamadi. Script proje kokunde calistirilmali.');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8').replace(/^\uFEFF/, ''));
const version = String(pkg.version || '6.1.0');
const e2eDir = join(root, 'e2e');
if (!existsSync(e2eDir)) throw new Error('e2e klasoru bulunamadi.');

const EXCLUDED = new Set([
  'global-shell-overlay-safety-v5.116.spec.ts',
]);

const bootstrap = `\n// v6.1D1: deterministic shell bootstrap for physical E2E tests.\nconst __E4_E2E_APP_VERSION__ = ${JSON.stringify(version)};\ntest.beforeEach(async ({ page }) => {\n  await page.addInitScript((appVersion) => {\n    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));\n    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);\n  }, __E4_E2E_APP_VERSION__);\n});\n`;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

let injected = 0;
let normalized = 0;
let skipLinkFixed = 0;
for (const file of walk(e2eDir).filter((f) => f.endsWith('.spec.ts'))) {
  const base = file.split(/[\\/]/).pop();
  if (EXCLUDED.has(base)) continue;
  let text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const original = text;

  // Replace stale literal release versions in existing localStorage bootstraps.
  text = text.replace(
    /(localStorage\.setItem\(\s*["']e4_dnd_last_seen_version_v1["']\s*,\s*)["'][^"']+["'](\s*\))/g,
    `$1${JSON.stringify(version)}$2`,
  );

  // Add deterministic state to every physical E2E file except the overlay behavior spec itself.
  if (!text.includes('__E4_E2E_APP_VERSION__')) {
    const importMatches = [...text.matchAll(/^import[^;]+;\s*$/gm)];
    if (importMatches.length) {
      const last = importMatches.at(-1);
      const at = last.index + last[0].length;
      text = text.slice(0, at) + bootstrap + text.slice(at);
      injected += 1;
    }
  }

  // A skip link is a keyboard affordance. Enter is deterministic and validates the intended behavior.
  if (base === 'accessibility-essentials-v5.127.spec.ts') {
    const before = text;
    text = text.replace('await skip.click();', 'await skip.press("Enter");');
    if (text !== before) skipLinkFixed += 1;
  }

  if (text !== original) {
    writeFileSync(file, text, 'utf8');
    normalized += 1;
  }
}

// Make the golden report reader tolerant of PowerShell UTF-8 BOM output.
const auditPath = join(root, 'scripts', 'thirty-golden-character-audit-v6.1.mjs');
if (existsSync(auditPath)) {
  let audit = readFileSync(auditPath, 'utf8').replace(/^\uFEFF/, '');
  const original = audit;
  audit = audit.replace(/JSON\.parse\(readFileSync\(([^\n]+),\s*["']utf8["']\)\)/g, 'JSON.parse(readFileSync($1, "utf8").replace(/^\\uFEFF/, ""))');
  audit = audit.replace(/JSON\.parse\(readFileSync\(([^\n]+)\)\)/g, 'JSON.parse(readFileSync($1, "utf8").replace(/^\\uFEFF/, ""))');
  if (audit !== original) writeFileSync(auditPath, audit, 'utf8');
}

// Add convenient scripts without discarding the project's existing command catalog.
pkg.version = version;
pkg.scripts ||= {};
pkg.scripts['test:e2e:overlay-closure'] = 'playwright test e2e/accessibility-essentials-v5.127.spec.ts e2e/app-shell.spec.ts e2e/advanced-multiclass-level-up-v5.117D.spec.ts e2e/builder-ui-mega.spec.ts --workers=4';
pkg.scripts['certify:e2e:overlay-closure'] = 'npm run build && npm run test:e2e:overlay-closure';
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

console.log(JSON.stringify({ version, injected, normalized, skipLinkFixed, excluded: [...EXCLUDED] }, null, 2));
