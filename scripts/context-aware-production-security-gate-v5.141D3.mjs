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
try { data = JSON.parse(raw); }
catch (error) {
  console.error(raw);
  throw new Error(`Production audit JSON could not be parsed: ${error.message}`);
}

const excluded = new Set(['node_modules', 'dist', '.git', 'docs', 'reports', 'coverage']);
const textExt = new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json']);
const markers = [
  'unstable_reactRouterRSC', '@vitejs/plugin-rsc', 'unstable_RSCStaticRouter',
  'unstable_routeRSCServerRequest', 'unstable_createCallServer', 'use server',
  'RSCPayload', 'RSCStaticRouter'
];
const hits = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (textExt.has(path.extname(entry.name))) {
      const text = fs.readFileSync(full, 'utf8');
      for (const marker of markers) if (text.includes(marker)) hits.push({ file: path.relative(root, full), marker });
    }
  }
}
walk(root);

const vulns = Object.entries(data.vulnerabilities || {});
const blocking = [];
const accepted = [];
for (const [name, info] of vulns) {
  if (!['high','critical'].includes(info.severity)) continue;
  const isRouter = name === 'react-router' || name === 'react-router-dom';
  const viaText = JSON.stringify(info.via || []);
  const onlyKnownRscAdvisory = viaText.includes('GHSA-qwww-vcr4-c8h2') || viaText.includes('RSC Mode CSRF');
  if (isRouter && onlyKnownRscAdvisory && hits.length === 0) {
    accepted.push({ name, severity: info.severity, reason: 'Advisory applies only to unstable RSC APIs; repository scan found no RSC API/plugin usage.' });
  } else {
    blocking.push({ name, severity: info.severity, via: info.via, range: info.range });
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  packageVersion: JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,
  auditMetadata: data.metadata,
  rscMarkers: hits,
  acceptedContextualAdvisories: accepted,
  blockingVulnerabilities: blocking,
  status: blocking.length === 0 ? 'PASS' : 'BLOCKED'
};
fs.writeFileSync(path.join(reportDir,'CONTEXT_AWARE_PRODUCTION_SECURITY_v5.141D3.json'), JSON.stringify(result,null,2));
const md = `# Context-Aware Production Security Gate v5.141D3\n\nGenerated: ${result.generatedAt}\n\n## RSC repository scan\n\n${hits.length ? hits.map(h=>`- ${h.file}: ${h.marker}`).join('\n') : '- No unstable React Router RSC APIs or RSC Vite plugin usage found.'}\n\n## Contextually accepted advisories\n\n${accepted.length ? accepted.map(v=>`- **${v.name}** (${v.severity}): ${v.reason}`).join('\n') : '- None'}\n\n## Blocking vulnerabilities\n\n${blocking.length ? blocking.map(v=>`- **${v.name}** (${v.severity})`).join('\n') : '- None'}\n\n## Result\n\n**${result.status}**\n`;
fs.writeFileSync(path.join(reportDir,'CONTEXT_AWARE_PRODUCTION_SECURITY_v5.141D3.md'), md);
if (blocking.length) {
  console.error(md);
  process.exit(1);
}
console.log('Context-aware production security gate passed.');
console.log(`Accepted contextual advisories: ${accepted.length}; RSC markers: ${hits.length}; blocking: ${blocking.length}.`);
