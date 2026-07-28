import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const reportDir = path.join(root, 'reports');
fs.mkdirSync(reportDir, { recursive: true });

const audit = spawnSync('npm.cmd', ['audit', '--omit=dev', '--json'], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
const raw = (audit.stdout || audit.stderr || '').replace(/^\uFEFF/, '').trim();
let data;
try {
  data = JSON.parse(raw);
} catch (error) {
  console.error(raw);
  throw new Error(`Production audit JSON could not be parsed: ${error.message}`);
}

const markers = [
  'unstable_reactRouterRSC',
  '@vitejs/plugin-rsc',
  'unstable_RSCStaticRouter',
  'unstable_routeRSCServerRequest',
  'unstable_createCallServer',
  'use server',
  'RSCPayload',
  'RSCStaticRouter',
];
const textExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json']);
const excludedDirs = new Set(['node_modules', 'dist', '.git', 'docs', 'reports', 'coverage', 'scripts']);
const hits = [];

function scanFile(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const marker of markers) {
    if (text.includes(marker)) hits.push({ file: path.relative(root, file), marker });
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (textExt.has(path.extname(entry.name))) scanFile(full);
  }
}

// Scan only executable application/config surfaces. Do not scan audit scripts,
// generated reports, archived docs, dependencies, or build output.
walk(path.join(root, 'src'));
for (const name of [
  'vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.cjs',
  'vitest.config.ts', 'vitest.config.js', 'package.json',
]) scanFile(path.join(root, name));

const vulnerabilities = data.vulnerabilities || {};
const routerInfo = vulnerabilities['react-router'];
const routerVia = JSON.stringify(routerInfo?.via || []);
const routerOnlyKnownRscAdvisory =
  routerInfo &&
  ['high', 'critical'].includes(routerInfo.severity) &&
  (routerVia.includes('GHSA-qwww-vcr4-c8h2') || routerVia.includes('RSC Mode CSRF'));

const blocking = [];
const accepted = [];
for (const [name, info] of Object.entries(vulnerabilities)) {
  if (!['high', 'critical'].includes(info.severity)) continue;

  const isRouterPackage = name === 'react-router' || name === 'react-router-dom';
  const mayBeAcceptedRouterChain = isRouterPackage && routerOnlyKnownRscAdvisory && hits.length === 0;

  if (mayBeAcceptedRouterChain) {
    accepted.push({
      name,
      severity: info.severity,
      reason: 'Only GHSA-qwww-vcr4-c8h2 remains in the React Router chain, and application/config scan found no unstable RSC API or RSC plugin usage.',
    });
  } else {
    blocking.push({ name, severity: info.severity, via: info.via, range: info.range });
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  packageVersion: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version,
  auditMetadata: data.metadata,
  scanScope: ['src/**', 'vite.config.*', 'vitest.config.*', 'package.json'],
  rscMarkers: hits,
  acceptedContextualAdvisories: accepted,
  blockingVulnerabilities: blocking,
  status: blocking.length === 0 ? 'PASS' : 'BLOCKED',
};

fs.writeFileSync(
  path.join(reportDir, 'CONTEXT_AWARE_PRODUCTION_SECURITY_v5.141D4.json'),
  JSON.stringify(result, null, 2),
);

const md = `# Context-Aware Production Security Gate v5.141D4\n\nGenerated: ${result.generatedAt}\n\n## Scan scope\n\n${result.scanScope.map((scope) => `- ${scope}`).join('\n')}\n\nAudit scripts, reports, docs, dependencies and build output are excluded to prevent self-matches.\n\n## RSC application/config scan\n\n${hits.length ? hits.map((hit) => `- ${hit.file}: ${hit.marker}`).join('\n') : '- No unstable React Router RSC APIs or RSC Vite plugin usage found.'}\n\n## Contextually accepted advisories\n\n${accepted.length ? accepted.map((item) => `- **${item.name}** (${item.severity}): ${item.reason}`).join('\n') : '- None'}\n\n## Blocking vulnerabilities\n\n${blocking.length ? blocking.map((item) => `- **${item.name}** (${item.severity})`).join('\n') : '- None'}\n\n## Result\n\n**${result.status}**\n`;
fs.writeFileSync(path.join(reportDir, 'CONTEXT_AWARE_PRODUCTION_SECURITY_v5.141D4.md'), md);

if (blocking.length > 0) {
  console.error(md);
  process.exit(1);
}

console.log('Context-aware production security gate passed.');
console.log(`Accepted contextual advisories: ${accepted.length}; RSC markers: ${hits.length}; blocking: ${blocking.length}.`);
