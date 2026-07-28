import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packagePath = path.join(root, 'package.json');
if (!fs.existsSync(packagePath)) throw new Error('package.json not found');

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8').replace(/^\uFEFF/, ''));
pkg.version = '5.141.2';
pkg.dependencies ??= {};
pkg.devDependencies ??= {};

// npm audit identifies 7.18.1 as the non-vulnerable v7 remediation.
pkg.dependencies['react-router-dom'] = '7.18.1';
if (pkg.dependencies['react-router']) pkg.dependencies['react-router'] = '7.18.1';
if (pkg.devDependencies['react-router']) pkg.devDependencies['react-router'] = '7.18.1';

// vite-plugin-pwa is a build-time tool and remains outside production deps.
const pwaVersion = pkg.dependencies['vite-plugin-pwa'] ?? pkg.devDependencies['vite-plugin-pwa'] ?? '^1.3.0';
delete pkg.dependencies['vite-plugin-pwa'];
pkg.devDependencies['vite-plugin-pwa'] = pwaVersion;

pkg.scripts ??= {};
pkg.scripts['audit:production'] = 'npm audit --omit=dev --audit-level=high';
pkg.scripts['certify:security-hardening-d2'] = 'npm run audit:production && npm run test:critical && npm run build';

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('package.json updated: react-router-dom/react-router pinned to 7.18.1; vite-plugin-pwa kept in devDependencies.');
