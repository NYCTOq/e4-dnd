import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
mkdirSync(reportsDir, { recursive: true });

function runJson(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    shell: process.platform === 'win32',
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  const raw = `${result.stdout || ''}`.trim();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  return { status: result.status ?? 1, stdout: result.stdout || '', stderr: result.stderr || '', data };
}

function auditSummary(audit) {
  const metadata = audit?.metadata ?? {};
  const vulnerabilities = metadata.vulnerabilities ?? {};
  return {
    info: Number(vulnerabilities.info ?? 0),
    low: Number(vulnerabilities.low ?? 0),
    moderate: Number(vulnerabilities.moderate ?? 0),
    high: Number(vulnerabilities.high ?? 0),
    critical: Number(vulnerabilities.critical ?? 0),
    total: Number(vulnerabilities.total ?? 0),
  };
}

function vulnerabilityRows(audit) {
  const rows = [];
  for (const [name, item] of Object.entries(audit?.vulnerabilities ?? {})) {
    rows.push({
      name,
      severity: item?.severity ?? 'unknown',
      direct: Boolean(item?.isDirect),
      via: Array.isArray(item?.via) ? item.via.map((v) => typeof v === 'string' ? v : v?.title || v?.name || 'advisory') : [],
      effects: Array.isArray(item?.effects) ? item.effects : [],
      range: item?.range ?? '',
      fixAvailable: item?.fixAvailable ?? false,
    });
  }
  return rows.sort((a, b) => `${a.severity}:${a.name}`.localeCompare(`${b.severity}:${b.name}`));
}

const before = runJson('npm.cmd', ['audit', '--json']);
const production = runJson('npm.cmd', ['audit', '--omit=dev', '--json']);
const outdated = runJson('npm.cmd', ['outdated', '--json']);

const beforeSummary = auditSummary(before.data);
const productionSummary = auditSummary(production.data);
const rows = vulnerabilityRows(before.data);
const directHighCritical = rows.filter((row) => row.direct && ['high', 'critical'].includes(row.severity));

const report = {
  generatedAt: new Date().toISOString(),
  packageVersion: JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version,
  policy: {
    forceUpgradeUsed: false,
    automaticMajorUpgradeUsed: false,
    productionHighCriticalAllowed: false,
  },
  allDependencies: beforeSummary,
  productionDependencies: productionSummary,
  directHighCritical,
  vulnerabilities: rows,
  outdated: outdated.data ?? {},
};

const jsonPath = path.join(reportsDir, 'DEPENDENCY_SECURITY_HARDENING_v5.141.json');
writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

const md = [];
md.push('# Dependency & Security Hardening v5.141');
md.push('');
md.push(`Generated: ${report.generatedAt}`);
md.push(`Package version: ${report.packageVersion}`);
md.push('');
md.push('## Audit summary');
md.push('');
md.push('| Scope | Low | Moderate | High | Critical | Total |');
md.push('|---|---:|---:|---:|---:|---:|');
md.push(`| All dependencies | ${beforeSummary.low} | ${beforeSummary.moderate} | ${beforeSummary.high} | ${beforeSummary.critical} | ${beforeSummary.total} |`);
md.push(`| Production only | ${productionSummary.low} | ${productionSummary.moderate} | ${productionSummary.high} | ${productionSummary.critical} | ${productionSummary.total} |`);
md.push('');
md.push('## Policy');
md.push('');
md.push('- `npm audit fix --force` was not used.');
md.push('- Automatic major-version upgrades were not used.');
md.push('- Existing semver ranges may be refreshed only by the apply script through `npm update`.');
md.push('- Production high/critical vulnerabilities fail the security gate.');
md.push('');
md.push('## Direct high/critical dependencies');
md.push('');
if (directHighCritical.length === 0) md.push('None.');
else for (const row of directHighCritical) md.push(`- **${row.name}**: ${row.severity}; range \`${row.range}\`; fix: \`${JSON.stringify(row.fixAvailable)}\``);
md.push('');
md.push('## Detailed vulnerability paths');
md.push('');
if (rows.length === 0) md.push('No vulnerabilities reported by npm audit.');
else {
  md.push('| Package | Severity | Direct | Range | Fix available |');
  md.push('|---|---|---:|---|---|');
  for (const row of rows) md.push(`| ${row.name} | ${row.severity} | ${row.direct ? 'yes' : 'no'} | ${row.range || '-'} | ${typeof row.fixAvailable === 'object' ? 'breaking/explicit' : String(row.fixAvailable)} |`);
}
md.push('');
md.push('## Gate result');
md.push('');
const productionBlocked = productionSummary.high > 0 || productionSummary.critical > 0;
md.push(productionBlocked
  ? `**BLOCKED:** production dependency tree contains ${productionSummary.high} high and ${productionSummary.critical} critical vulnerabilities.`
  : '**PASS:** no high or critical vulnerability was reported in the production dependency tree.');
md.push('');
md.push('Detailed machine-readable data is in `reports/DEPENDENCY_SECURITY_HARDENING_v5.141.json`.');
writeFileSync(path.join(reportsDir, 'DEPENDENCY_SECURITY_HARDENING_v5.141.md'), md.join('\n') + '\n', 'utf8');

console.log(`All dependencies: ${beforeSummary.total} total, ${beforeSummary.high} high, ${beforeSummary.critical} critical.`);
console.log(`Production only: ${productionSummary.total} total, ${productionSummary.high} high, ${productionSummary.critical} critical.`);
console.log('Security reports generated.');
if (productionBlocked) process.exit(2);
